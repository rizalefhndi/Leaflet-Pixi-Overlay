// import { CONFIG } from './config.js';


// class ObjectPergerakan {
//   constructor(waypoints, initialSpeed = CONFIG.initialSpeed) {
//     this.waypoints = waypoints;
//     this.currentSegmentIndex = 0;

//     this.currentPosition = {
//         lat: waypoints.route[0][0],
//         lng: waypoints.route[0][1],
//         bearing: 0,
//         altitude: 0
//     };
    
//     this.speed = initialSpeed;

//     this.objectPergerakan = false;

//     this.motionPolylines = [];
//     this.isPlaying = false;
//   }

//   setObjectPergerakan(route) {
//     const motionPolyline = L.motion.polyline(waypoints, {
//       color: "transparent",
//       misi: data.misi || false
//     }, {
//       auto: false,
//       speed: data.speed || CONFIG.initialSpeed
//     }, {
//       showMarker: true,
//       opacity: 1,
//       removeOnEnd: data.removeOnEnd || false,
//       length: data.length || 0,
//       width: data.width || 0,
//       grouIcon: data.grouIcon || null,
//       icon: data.icon || null
//     }).addTo(map);
    
//     this.motionPolylines.push(motionPolyline);
//     this.setupEventListeners(motionPolyline);
//   }

//   removeObjectPergerakan() {
//     this.motionPolylines.forEach((polyline) => {
//       polyline.remove();
//     });
//     this.motionPolylines = [];
//   }

//   setupEventListeners(motionPolyline) {
//     motionPolyline.on(L.Motion.Event.Started, this.onStart.bind(this));
//     motionPolyline.on(L.Motion.Event.Paused, this.onPause.bind(this));
//     motionPolyline.on(L.Motion.Event.Resumed, this.onResume.bind(this));
//     motionPolyline.on(L.Motion.Event.Ended, this.onEnd.bind(this));
//     motionPolyline.on(L.Motion.Event.Move, this.onMove.bind(this));
//   }

//   getLatLng(status){
//     let latlng = false;
//     // if(this.objectPergerakan){
//       // latlng = this.objectPergerakan.getMarker().getLatLng();
//     // }else{
//       latlng = this.object.getLatLng();
//       if(status === 'objectPergerakan'){
//         if(this.objectPergerakan){
//           latlng = this.objectPergerakan.getMarker().getLatLng();
//         }
//       }
//     // }
//     return latlng;
//   }

//   getSpeed() {
//     // return Km/jam
//     let kecepatan = this.properties.kecepatan.split("|");
//     if (kecepatan[1] == "kilometer") {
//       return Number(kecepatan[0]);
//     } else if (kecepatan[1] == "miles") {
//       return (Number(kecepatan[0]) * 1.60934);
//     } else if (kecepatan[1] == "knot") {
//       return (Number(kecepatan[0]) * 1.852);
//     } else if (kecepatan[1] == "mach") {
//       return (Number(kecepatan[0]) * 1225.04);
//     }
//   }
//   setSpeed(kecepatan, type) {
//     this.properties.kecepatan = kecepatan + "|" + type;
//   }

//   mediaSetSpeed(speed) {
//     if (this.objectPergerakan) {
//       let kecepatan = this.properties.kecepatan.split('|');
//       let convSpeed = speed;
//       // console.log(kecepatan);
//       // console.log(convSpeed);
//       switch (kecepatan[1]) {
//         case 'kilometer':
//           convSpeed = Number(convSpeed);
//           break;
//         case 'miles':
//           convSpeed /= 1.60934;
//           break;
//         case 'knot':
//           convSpeed /= 1.852;
//           break;
//         case 'mach':
//           convSpeed /= 1225.04;
//           break;
//         default:
//           break;
//       } 
//       this.setSpeed(convSpeed, kecepatan[1]);

//       let percepatan = speed * Number(MultiPlayer.schedule.livePercepatan);
      
//       this.objectPergerakan.motionSpeed(percepatan);

//       if(MultiPlayer.controlClient){
//         MultiPlayer.controlClient.send('media-minimap', {
//             media: 'speed',
//             id_point: this.getId(),
//             speed: percepatan
//         });
//       }
//     } else {
//       // console.log(this);
//       // toastr.error("Jalur tidak ada");
//       // console.log("z");
//     }
//   }

//   mediaStart() {
//     if (this.objectPergerakan) {
//       // console.log("masuk");
//       if (Global.isEmpty(this.dataRanjau) === false) {
//         let now = new Date(MultiPlayer.schedule.getTime()).getTime();
//         if (now <= this.dataRanjau.finisProses) {
//           console.log(`Unit ${this.getNamaObject()} Sedang Membersihkan Ranjau!`);
//           return false;
//         } else {
//           this.dataRanjau = {};
//         }
//       }
//       this.objectPergerakan.motionStart();
//       if(MultiPlayer.controlClient){
//         MultiPlayer.controlClient.send('media-minimap', {
//             media: 'play',
//             id_point: this.getId()
//         });
//       }
//       this.media = "play";
//       return true;
//     } else {
//       toastr.error("Jalur tidak ada");
//       return false;
//     }
//   }

//   mediaStop() {
//     if (this.objectPergerakan) {
//       this.objectPergerakan.motionStop(true);
//       if(MultiPlayer.controlClient){
//         MultiPlayer.controlClient.send('media-minimap', {
//             media: 'stop',
//             id_point: this.getId()
//         });
//       }
//       this.media = "stop";
//     } else {
//       toastr.error("Jalur tidak ada");
//       console.log("x");
//     }
//   }

//   mediaPause() {
//     if(this.objectPergerakan){
//       this.objectPergerakan.motionPause();
//       if(MultiPlayer.controlClient){
//         MultiPlayer.controlClient.send('media-minimap', {
//             media: 'pause',
//             id_point: this.getId()
//         });
//       }
//       this.media = "pause";
//     }
//   }

//   mediaResume() {
//     if (this.objectPergerakan) {
//       this.objectPergerakan.motionResume();
//       if(MultiPlayer.controlClient){
//         MultiPlayer.controlClient.send('media-minimap', {
//             media: 'resume',
//             id_point: this.getId()
//         });
//       }
//       this.media = "resume";
//     }
//     return true;

//   }

//   // mediaStart() {
//   //   console.log("Motion started");
//   //   this.isPlaying = true;
//   // }

//   // mediaPause() {
//   //   console.log("Motion paused");
//   //   this.isPlaying = false;
//   // }

//   // mediaResume() {
//   //   console.log("Motion resumed");
//   //   this.isPlaying = true;
//   // }

//   // mediaStop() {
//   //   console.log("Motion ended");
//   //   this.isPlaying = false;
//   // }

//   // onMove(evt) {
//   //   console.log("Motion moved", evt);
//   // }

//   // startMotion() {
//   //   this.motionPolylines.forEach((polyline) => {
//   //     polyline.start();
//   //   });
//   // }

//   // pauseMotion() {
//   //   this.motionPolylines.forEach((polyline) => {
//   //     polyline.pause();
//   //   });
//   // }

//   // stopMotion() {
//   //   this.motionPolylines.forEach((polyline) => {
//   //     polyline.stop();
//   //   });
//   // }
// }

// export { ObjectPergerakan };


import { CONFIG } from './config.js';

class ObjectPergerakan {
  constructor(map, waypoints, initialSpeed = CONFIG.initialSpeed) {

    this.map = map;
    this.waypoints = waypoints;
    this.currentSegmentIndex = 0;

    this.currentPosition = {
        lat: waypoints[0][0],
        lng: waypoints[0][1],
        bearing: this.targetBearing,
        altitude: 0
    };
    
    this.targetBearing = this.calculateInitialBearing();

    this.speed = initialSpeed;
    this.objectPergerakan = false;
    this.motionPolylines = [];
    this.isPlaying = false;

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
    // Check if evt and evt.latlng are defined
    if (!evt || !evt.latlng) {
      // console.warn('Invalid move event:', evt);
      return;
    }
  
    const currentLatLng = [evt.latlng.lat, evt.latlng.lng];
    
    const nextWaypointIndex = this.currentSegmentIndex + 1;
    if (nextWaypointIndex < this.waypoints.length) {
      const nextLatLng = this.waypoints[nextWaypointIndex];
      
      // Ensure both current and next latlngs are valid
      if (currentLatLng && nextLatLng) {
        const bearing = this.calculateBearing(
          currentLatLng,
          nextLatLng
        );
    
        this.targetBearing = bearing;
    
        // Check if objectPergerakan and getMarker exist before calling
        if (this.objectPergerakan && this.objectPergerakan.getMarker()) {
          this.objectPergerakan.getMarker().setIcon(
            this.createCustomIcon(this.targetBearing)
          );
        }
      }
    }
    
    console.log("Marker moved to:", currentLatLng);
  }

  getLatLng(status){
    let latlng = false;
    if(this.objectPergerakan){
      latlng = this.objectPergerakan.getMarker().getLatLng();
    }
    return latlng;
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
      this.objectPergerakan.motionStart();
      this.media = "play";
      return true;
    }
    return false;
  }

  mediaStop() {
    if (this.objectPergerakan) {
      this.objectPergerakan.motionStop(true);
      this.media = "stop";
    }
  }

  mediaPause() {
    if(this.objectPergerakan){
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
    const lat1 = this.toRadians(start[0]);
    const lon1 = this.toRadians(start[1]);
    const lat2 = this.toRadians(end[0]);
    const lon2 = this.toRadians(end[1]);

    const deltaLon = lon2 - lon1;

    const y = Math.sin(deltaLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
             Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

    let bearing = this.toDegrees(Math.atan2(y, x));
    return (bearing + 360) % 360;
  }

  toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  toDegrees(radians) {
      return radians * 180 / Math.PI;
  }
}

export { ObjectPergerakan };