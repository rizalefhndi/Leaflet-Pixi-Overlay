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
    this.objectPergerakan = false;
    this.motionPolylines = [];
    this.isPlaying = false;
    this.lastPosition = null;

    this.targetBearing = this.calculateInitialBearing();
    this.icon = this.createCustomIcon(this.targetBearing);
  }

  createCustomIcon(bearing) {
    const iconPath = CONFIG.markerTypes[Math.floor(Math.random() * CONFIG.markerTypes.length)];
    return L.divIcon({
        html: `<div style="transform: rotate(${bearing}deg);">
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
      color: "transparent"
    }, {
      auto: false,
      speed: this.speed
    }, {
      showMarker: true,
      opacity: 1,
      removeOnEnd: false,
      length: 0,
      width: 0,
      icon: this.icon
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

  onStart() {
    this.isPlaying = true;
    console.log("Motion started");
  }

  onPause() {
    this.isPlaying = false;
    console.log("Motion paused");
  }

  onResume() {
    this.isPlaying = true;
    console.log("Motion resumed");
  }

  onEnd() {
    this.isPlaying = false;
    console.log("Motion ended");
  }

  onMove(evt) {
    if (!evt || !evt.latlng) {
        return;
    }

    const currentLatLng = [evt.latlng.lat, evt.latlng.lng];
    this.lastPosition = currentLatLng;

    let nextWaypointIndex = this.currentSegmentIndex + 1;
    if (nextWaypointIndex >= this.waypoints.length) {
        nextWaypointIndex = this.currentSegmentIndex;
    }

    const nextLatLng = this.waypoints[nextWaypointIndex];

    if (currentLatLng && nextLatLng) {
        const newBearing = this.calculateBearing(currentLatLng, nextLatLng);

        if (this.objectPergerakan && this.objectPergerakan.getMarker()) {
            this.objectPergerakan.getMarker().setIcon(
                this.createCustomIcon(newBearing)
            );
        }

        this.currentPosition = {
            lat: currentLatLng[0],
            lng: currentLatLng[1],
            bearing: newBearing,
            altitude: 0
        };

        const currentWaypoint = this.waypoints[this.currentSegmentIndex];
        const distance = this.calculateDistance(currentLatLng, currentWaypoint);

        if (distance < 0.00001) {
            this.currentSegmentIndex = Math.min(this.currentSegmentIndex + 1, this.waypoints.length - 1);
        }
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
    this.speed = speed;
  }

  mediaSetSpeed(speed) {
    if (this.objectPergerakan) {
      this.speed = speed * CONFIG.maxSpeedMultiplier;
      this.objectPergerakan.motionSpeed(this.speed);
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

  calculateInitialBearing() {
    const start = [this.waypoints[0][0], this.waypoints[0][1]];
    const end = [this.waypoints[1][0], this.waypoints[1][1]];
    return this.calculateBearing(start, end);
  }

  calculateBearing(start, end) {
    const startLat = this.toRadians(start[0]);
    const startLng = this.toRadians(start[1]);
    const endLat = this.toRadians(end[0]);
    const endLng = this.toRadians(end[1]);

    const dLng = endLng - startLng;

    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - 
              Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

    let bearing = Math.atan2(y, x);
    bearing = this.toDegrees(bearing);
    return (bearing + 360) % 360;
  }


  calculateDistance(point1, point2) {
    const lat1 = this.toRadians(point1[0]);
    const lon1 = this.toRadians(point1[1]);
    const lat2 = this.toRadians(point2[0]);
    const lon2 = this.toRadians(point2[1]);
    
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
              
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  toDegrees(radians) {
    return radians * 180 / Math.PI;
  }
}

export { ObjectPergerakan };