import { CONFIG } from './config.js';

class ObjectPergerakan {
  constructor(map, waypoints, initialSpeed = CONFIG.initialSpeed) {
    this.map = map;
    this.waypoints = waypoints;
    this.currentSegmentIndex = 0;

    this.currentPosition = {
      lat: waypoints[0][0],
      lng: waypoints[0][1],
      bearing: 0,
      altitude: 0
    };

    this.speed = initialSpeed;
    this.currentSpeed = initialSpeed;
    this.targetSpeed = CONFIG.maxSpeed;
    this.acceleration = CONFIG.acceleration;
    this.lastUpdateTime = Date.now();

    this.objectPergerakan = false;
    this.motionPolylines = [];
    this.isPlaying = false;
    this.lastPosition = null;
    this.icon = this.createCustomIcon();
  }

  createCustomIcon() {
    const iconPath = CONFIG.markerTypes[Math.floor(Math.random() * CONFIG.markerTypes.length)];
    return L.divIcon({
        html: `<div motion-base="270">
                  <img src="./assets/${iconPath}" style="width: 32px; height: 32px;">
               </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
        className: 'custom-div-icon'
    });
  }

  setObjectPergerakan() {
    const motionPolyline = L.motion.polyline(this.waypoints, {
      color: "transparent",
    }, {
      auto: false,
      speed: this.speed
    }, {
      showMarker: true,
      opacity: 1,
      removeOnEnd: false,
      length: 0,
      width: 0,
      icon: this.createCustomIcon(0)
    });

    motionPolyline.addTo(this.map);

    this.motionPolylines.push(motionPolyline);
    this.setupEventListeners(motionPolyline);
    this.objectPergerakan = motionPolyline;
  }

  removeObjectPergerakan() {
    this.motionPolylines.forEach((polyline) => {
      polyline.remove();
    });
    this.motionPolylines = [];
    this.objectPergerakan = false;
  }

  setupEventListeners(motionPolyline) {
    motionPolyline.on(L.Motion.Event.Started, this.onStart.bind(this));
    motionPolyline.on(L.Motion.Event.Paused, this.onPause.bind(this));
    motionPolyline.on(L.Motion.Event.Resumed, this.onResume.bind(this));
    motionPolyline.on(L.Motion.Event.Ended, this.onEnd.bind(this));
    motionPolyline.on(L.Motion.Event.Move, this.onMove.bind(this));
  }

  // onStart() {
  //   this.isPlaying = true;
    
  //   const currentTime = Date.now();
  //   const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
    
  //   // Hitung kecepatan berdasarkan percepatan
  //   this.currentSpeed += this.acceleration * deltaTime;
    
  //   // Batasi kecepatan pada targetSpeed
  //   this.speed = Math.min(this.currentSpeed, this.targetSpeed);
    
  // }

  onStart() {
    this.isPlaying = true;
    
    // Jika ini adalah pertama kali, set waktu terakhir
    if (!this.lastUpdateTime) {
      this.lastUpdateTime = Date.now();
    }
    
    const updateMotion = () => {
      if (this.isPlaying) {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;  // deltaTime dalam detik
  
        // Hitung kecepatan berdasarkan percepatan
        this.currentSpeed += this.acceleration * deltaTime;
  
        // Batasi kecepatan pada targetSpeed
        this.speed = Math.min(this.currentSpeed, this.targetSpeed);
  
        // console.log("Update speed:", this.speed);
  
        // Update waktu terakhir untuk perhitungan selanjutnya
        this.lastUpdateTime = currentTime;
  
        // Panggil lagi updateMotion secara berkelanjutan
        requestAnimationFrame(updateMotion);
      }
    };
  
    // Mulai pembaruan berkelanjutan
    requestAnimationFrame(updateMotion);
  }
  
  onPause() {
    if (this.objectPergerakan) {
      this.objectPergerakan.motionPause();
      this.isPlaying = false;
      console.log("Motion paused");
    }
  }
  
  onResume() {
    if (this.objectPergerakan && !this.isPlaying) {
      this.objectPergerakan.motionResume();
      this.isPlaying = true;
      console.log("Motion resumed");
    }
  }
  
  onEnd() {
    this.isPlaying = false;
    console.log("Motion ended");
    if (this.objectPergerakan) {
      this.objectPergerakan.motionStop();
    }
  }
  
  onMove(evt) {
    if (!evt || !evt.latlng) return;
    
    const currentPos = [evt.latlng.lat, evt.latlng.lng];
    this.lastPosition = currentPos;
  
    if (evt.distance !== undefined && evt.heading !== undefined) {
      console.log(`Distance: ${evt.distance}km, Heading: ${evt.heading}°`);
    }
  }
  

  getLatLng(status) {
    if (this.lastPosition) {
      return {
        lat: this.lastPosition[0],
        lng: this.lastPosition[1]
      };
    }
    return this.objectPergerakan ? this.objectPergerakan.getMarker().getLatLng() : false;
  }

  getSpeed() {
    return this.speed;
  }

  setSpeed(speed, type) {
    const prevSpeed = this.speed;
    this.speed = speed;
    
    if (this.objectPergerakan && prevSpeed !== speed) {
      const currentTime = Date.now();
      const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
      
      // Hitung percepatan
      const acceleration = (speed - prevSpeed) / deltaTime;
      
      // Hitung jarak yang ditempuh selama percepatan
      const distance = (prevSpeed * deltaTime) + (0.5 * acceleration * Math.pow(deltaTime, 2));
      
      // Update kecepatan pada object
      this.objectPergerakan.motionSpeed(this.speed);
      
      this.lastUpdateTime = currentTime;
    }
  }

  mediaSetSpeed(speed) {
    if (this.objectPergerakan) {
      const currentTime = Date.now();
      const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
      
      // Hitung target speed dengan multiplier
      const targetSpeed = Math.min(speed * CONFIG.maxSpeedMultiplier, CONFIG.maxSpeed);
      
      // Hitung percepatan yang dibutuhkan
      const acceleration = (targetSpeed - this.currentSpeed) / deltaTime;
      
      // Hitung kecepatan baru dengan percepatan
      const newSpeed = this.currentSpeed + (acceleration * deltaTime);
      
      // Terapkan batas kecepatan
      this.speed = Math.max(0, Math.min(newSpeed, CONFIG.maxSpeed));
      this.currentSpeed = this.speed;
      
      // Update kecepatan object
      this.objectPergerakan.motionSpeed(this.speed);
      this.lastUpdateTime = currentTime;
    }
  }

  mediaStart() {
    if (this.objectPergerakan) {
      if (this.media === "pause") {
        this.mediaResume();
      } else {
        this.objectPergerakan.motionStart();
        this.media = "play";
      }
      return true;
    }
    return false;
  }

  mediaStop() {
    if (this.objectPergerakan) {
      const finalPosition = this.objectPergerakan.getMarker().getLatLng();
      this.lastPosition = [finalPosition.lat, finalPosition.lng];

      this.objectPergerakan.motionStop(true);
      this.media = "stop";
    }
  }

  mediaPause() {
    if (this.objectPergerakan) {
      const pausePosition = this.objectPergerakan.getMarker().getLatLng();
      this.lastPosition = [pausePosition.lat, pausePosition.lng];

      this.objectPergerakan.motionPause();
      this.media = "pause";
    }
  }

  mediaResume() {
    if (this.objectPergerakan) {
      this.objectPergerakan.motionResume();
      this.media = "resume";
    }
    return true;
  }

}

export { ObjectPergerakan };