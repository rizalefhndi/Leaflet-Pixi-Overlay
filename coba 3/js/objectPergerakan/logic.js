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
    this.smoothingFactor = 0.15;
    this.lastFrameTime = 0;

    this.objectPergerakan = null;
    this.motionPolylines = [];
    this.isPlaying = false;
    this.lastPosition = null;
    this.currentMarker = null;
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
    this.removeObjectPergerakan();
    const motionPolyline = L.motion.polyline(this.waypoints, {
      color: "transparent",
    }, {
      auto: false,
      speed: this.speed,
      easing: L.Motion.Ease.linear
    }, {
      showMarker: true,
      opacity: 1,
      removeOnEnd: false,
      length: 0,
      width: 0,
      icon: this.createCustomIcon(0)
    });

    motionPolyline.addTo(this.map);

    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
    }

    this.currentMarker = motionPolyline.getMarker(); 
    this.motionPolylines.push(motionPolyline);
    this.setupEventListeners(motionPolyline);
    this.objectPergerakan = motionPolyline;
  }

  removeObjectPergerakan() {
    if (this.currentMarker) {
      this.map.removeLayer(this.currentMarker);
      this.currentMarker = null;
    }

    this.motionPolylines.forEach((polyline) => {
      if (polyline && polyline.remove) {
        polyline.remove();
      }
    });
    
    this.motionPolylines = [];
    this.objectPergerakan = null;
    this.isPlaying = false;
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

  //   const updateMotion = () => {
  //     if (!this.isPlaying) return;

  //     const currentTime = Date.now();
  //     const deltaTime = (currentTime - this.lastUpdateTime) / 1000;

  //     // Menghitung percepatan dengan smoothing
  //     if (this.currentSpeed < this.targetSpeed) {
  //       const accelerationDelta = this.acceleration * deltaTime;
  //       this.currentSpeed += accelerationDelta;
  //       this.currentSpeed = Math.min(this.currentSpeed, this.targetSpeed);
        
  //       // Aplikasikan smoothing pada perubahan kecepatan
  //       const smoothedSpeed = this.speed + (this.currentSpeed - this.speed) * this.smoothingFactor;
  //       this.speed = smoothedSpeed;
        
  //       if (this.objectPergerakan) {
  //         this.objectPergerakan.motionSpeed(this.speed);
  //       }
  //     }
  //     this.lastFrameTime = currentTime;
  //     requestAnimationFrame(updateMotion);
  //   };

  //   requestAnimationFrame(updateMotion);
  // }

  onStart() {
    this.isPlaying = true;
    this.lastFrameTime = performance.now();
    this.lastUpdateTime = performance.now();
    
    const updateMotion = () => {
      if (!this.isPlaying) return;

      const currentTime = performance.now();
      const deltaTime = (currentTime - this.lastFrameTime) / 1000;
      
      // Menghitung percepatan
      if (this.currentSpeed < this.targetSpeed) {
        const accelerationDelta = this.acceleration * deltaTime;
        this.currentSpeed += accelerationDelta;
        this.currentSpeed = Math.min(this.currentSpeed, this.targetSpeed);
        
        // smoothing pada perubahan kecepatan
        const smoothedSpeed = this.speed + (this.currentSpeed - this.speed) * this.smoothingFactor;
        this.speed = smoothedSpeed;

        // tanpa smoothing
        // this.speed = this.currentSpeed

        console.log("Update speed:", this.speed);
        
        if (this.objectPergerakan) {
          this.objectPergerakan.motionSpeed(this.speed);
        }
      }

      this.lastFrameTime = currentTime;
      requestAnimationFrame(updateMotion);
    };

    requestAnimationFrame(updateMotion);
  }
  
  onPause() {
    if (this.objectPergerakan) {
      this.objectPergerakan.motionPause();
      this.isPlaying = false;
      // console.log("Motion paused");
    }
  }
  
  onResume() {
    if (this.objectPergerakan && !this.isPlaying) {
      this.objectPergerakan.motionResume();
      this.isPlaying = true;
      // console.log("Motion resumed");
    }
  }
  
  onEnd() {
    this.isPlaying = false;
    // console.log("Motion ended");
    if (this.objectPergerakan) {
      this.objectPergerakan.motionStop();
    }
  }
  
  onMove(evt) {
    if (!evt || !evt.latlng) return;
    
    const currentPos = [evt.latlng.lat, evt.latlng.lng];
    this.lastPosition = currentPos;

    if (this.currentMarker) {
      this.currentMarker.setLatLng(evt.latlng);
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

  // setSpeed(speed, type) {
  //   const prevSpeed = this.speed;
  //   const targetSpeed = Math.min(speed, CONFIG.maxSpeed);
    
  //   const interpolateSpeed = () => {
  //     if (!this.isPlaying) return;
      
  //     const currentTime = performance.now();
  //     const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
      
  //     const speedDiff = targetSpeed - this.speed;
  //     const smoothedSpeed = this.speed + (speedDiff * this.smoothingFactor);
      
  //     this.speed = smoothedSpeed;
      
  //     if (this.objectPergerakan) {
  //       this.objectPergerakan.motionSpeed(this.speed);
  //     }
      
  //     if (Math.abs(speedDiff) > 0.1) {
  //       this.lastUpdateTime = currentTime;
  //       requestAnimationFrame(interpolateSpeed);
  //     }
  //   };
    
  //   requestAnimationFrame(interpolateSpeed);
  // }
  setSpeed(speed) {
    this.targetSpeed = Math.min(speed, CONFIG.maxSpeed);
    console.log("Target speed set to:", this.targetSpeed);
  }

  mediaSetSpeed(speed) {
    const targetSpeed = Math.min(speed * CONFIG.maxSpeedMultiplier, CONFIG.maxSpeed);
    this.targetSpeed = targetSpeed;
    this.setSpeed(targetSpeed);
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