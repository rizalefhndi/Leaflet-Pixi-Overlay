import { CONFIG } from '../config.js';

export class MotionEngine {
    constructor(map) {
        this.map = map;
        this.motionObjects = new Map();
        this.markers = new Map();
        this.currentMarker = null;

    }

    cleanup() {
        this.motionObjects.forEach((obj, id) => {
            if (obj.marker && this.map.hasLayer(obj.marker)) {
                this.map.removeLayer(obj.marker);
            }
        });
    }

    // cleanup() {
    //     if (this.currentMarker && this.map.hasLayer(this.currentMarker)) {
    //         this.map.removeLayer(this.currentMarker); // Hapus marker dari peta
    //         this.currentMarker = null; // Reset referensi marker
    //         console.log('Marker cleaned up');
    //     }
    // }

    // cleanup() {
    //     this.motionObjects.forEach((obj, id) => {
    //         // Hapus marker dari peta
    //         if (this.map.hasLayer(obj.marker)) {
    //             this.map.removeLayer(obj.marker);
    //         }
    //         // Hapus motion line dari peta
    //         if (this.map.hasLayer(obj.motionLine)) {
    //             this.map.removeLayer(obj.motionLine);
    //         }
    //     });
    //     this.motionObjects.clear(); // Kosongkan koleksi
    //     console.log('All markers and motion lines cleaned up');
    // }

    initialize() {
        // Nothing special needed for initialization
        this.cleanup();
    }

    addObject(id, waypoints, markerOptions) {
        // Check if waypoints is properly structured
        if (!waypoints || !waypoints.route) {
            console.error('Invalid waypoints structure:', waypoints);
            return;
        }

        // Hapus marker sebelumnya jika ada
        // this.cleanup();
        
        if (this.motionObjects.has(id)) {
            const existing = this.motionObjects.get(id);
            if (existing.motionLine) {
                if (existing.motionLine.motionMarker) {
                    this.map.removeLayer(existing.motionLine.motionMarker);
                }
                this.map.removeLayer(existing.motionLine);
            }
            this.motionObjects.delete(id);
        }
        // Create marker for motion object
        const marker = L.marker(waypoints.route[0], {
            icon: markerOptions.icon,
            rotationAngle: 0,
            rotationOrigin: 'center center'
        }).addTo(this.map);

        this.currentMarker = marker;
    
        // Create motion path without its own marker
        const motionLine = L.motion.polyline(
            waypoints.route,
            {
                color: 'transparent',
                weight: 2
            },
            {
                auto: false,
                duration: this.calculateDuration(waypoints.route) * 1000,
                easing: L.Motion.Ease.linear
            },
            {
                removeOnEnd: false,
                showMarker: true,
                icon: markerOptions.icon
            }
        );
    
        // Update our own marker position and rotation during motion
        // motionLine.on('motion', (e) => {
        //     try {
        //         const latLng = e.latlng;
        //         if (!latLng) {
        //             console.warn(`Invalid motion event data for ${id}`);
        //             return;
        //         }

        //         marker.setLatLng(latLng);
                
        //         if (e.nextLatLng) {
        //             // Get current point index
        //             // const points = waypoints.route;
        //             // const currentIndex = points.findIndex(p => 
        //             //     p[0] === latLng.lat && p[1] === latLng.lng
        //             // );
                    
        //             // // Get turn type for current segment
        //             // const turnRate = waypoints.turn[currentIndex] || 'normal';
                    
        //             const bearing = this.calculateBearing(
        //                 {lat: latLng.lat, lng: latLng.lng},
        //                 {lat: e.nextLatLng.lat, lng: e.nextLatLng.lng},
        //                 turnRate
        //             );

        //             marker.setRotationAngle(bearing);
                    
        //             console.log(`Bearing: ${bearing}°`);
        //             // Apply rotation to the marker
        //             // if (marker._icon) {
        //             //     const translate = marker._icon.style.transform.match(/translate3d\([^)]+\)/) || ['translate3d(0px, 0px, 0px)'];
        //             //     const currentRotation = this.getCurrentRotation(marker._icon);
        //             //     const newRotation = this.smoothRotation(currentRotation, bearing, turnRate);
                        
        //             //     // marker._icon.style.transform = `${translate[0]} rotate(${newRotation}deg)`;
        //             //     // marker._currentRotation = newRotation;
        //             //     marker.setRotationAngle(newRotation);

        //             //     // Log turn information
        //             //     console.log(`Turn rate: ${turnRate}, Bearing: ${bearing}°, Rotation: ${newRotation}°`);
        //             // }
        //         }
        //     } catch (error) {
        //         console.error('Error in motion event:', error);
        //     }
        // });

        motionLine.on('motion', (e) => {
            try {
                const latLng = e.latlng;
                if (!latLng || !motionLine.motionMarker) return;

                if (e.nextLatLng) {
                    const bearing = this.calculateBearing(
                        {lat: latLng.lat, lng: latLng.lng},
                        {lat: e.nextLatLng.lat, lng: e.nextLatLng.lng}
                    );

                    // Update rotation using rotatedMarker plugin
                    motionLine.motionMarker.setRotationAngle(bearing);
                    console.log(`Bearing for ${id}: ${bearing}°`);
                }
            } catch (error) {
                console.error('Error in motion event:', error);
            }
        });
        // Add other event handlers...
        // motionLine.on('motionstart', () => {
        //     console.log(`Motion START for ${id}`);
        // });
    
        // motionLine.on('motionend', () => {
        //     console.log(`Motion ended for ${id}`);
        //     this.motionObjects.get(id).isPlaying = false;
        // });
    
        // Add to map
        motionLine.addTo(this.map);
        // marker.addTo(this.map);
    
        // Store objects
        this.motionObjects.set(id, {
            waypoints,
            motionLine,
            marker,
            isPlaying: false
        });
        // console.log('events:', motionLine._events);

        return motionLine;
    }

    removeObject(id) {
        const obj = this.motionObjects.get(id);
        if (obj) {
            if (obj.motionLine) {
                if (obj.motionLine.motionMarker) {
                    this.map.removeLayer(obj.motionLine.motionMarker);
                }
                this.map.removeLayer(obj.motionLine);
            }
            this.motionObjects.delete(id);
        }
    }

    getCurrentRotation(element) {
        if (!element) return 0;
        const transform = element.style.transform;
        const match = transform.match(/rotate\(([^)]+)deg\)/);
        return match ? parseFloat(match[1]) : 0;
    }
    smoothRotation(current, target, turnRate = 'normal') {
        // Get turn configuration
        const turnConfig = CONFIG.engineTypes.motion.characteristics.turn;
        let turnSpeed;
        
        switch(turnRate) {
            case 'slack':
                turnSpeed = turnConfig.min / 100;
                break;
            case 'tight':
                turnSpeed = turnConfig.max / 100;
                break;
            default: // normal
                turnSpeed = ((turnConfig.min + turnConfig.max) / 2) / 100;
        }
        
        // Normalize angles
        let delta = ((target - current + 540) % 360) - 180;
        // Apply smooth interpolation with turn rate
        return (current + delta * turnSpeed + 360) % 360;
    }
    calculateBearing(start, end, turnRate = 'normal') {
        const startLat = start.lat * Math.PI / 180;
        const startLng = start.lng * Math.PI / 180;
        const endLat = end.lat * Math.PI / 180;
        const endLng = end.lng * Math.PI / 180;
    
        const dLng = endLng - startLng;
    
        const y = Math.sin(dLng) * Math.cos(endLat);
        const x = Math.cos(startLat) * Math.sin(endLat) -
                 Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
    
        let bearing = Math.atan2(y, x) * 180 / Math.PI;
        bearing = (bearing + 360) % 360;
        
        // Apply turn rate modification
        const turnConfig = CONFIG.engineTypes.motion.characteristics.turn;
        let turnMultiplier;
        
        switch(turnRate) {
            case 'slack':
                turnMultiplier = turnConfig.min / turnConfig.rate;
                break;
            case 'tight':
                turnMultiplier = turnConfig.max / turnConfig.rate;
                break;
            default: // normal
                turnMultiplier = (turnConfig.min + turnConfig.max) / (2 * turnConfig.rate);
        }
        
        // Add 90 degrees to align marker's heading with its direction
        return (bearing + 90) % 360 * turnMultiplier;
    }

    calculateDuration(route) {
        let totalDistance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            const p1 = L.latLng(route[i]);
            const p2 = L.latLng(route[i + 1]);
            totalDistance += p1.distanceTo(p2);
        }
        
        const speed = CONFIG.engineTypes.motion.characteristics.speed.initial;
        const duration = (totalDistance / 1000) / (speed / 3600);

        return duration;
    }

    showInfoCard(id, waypoints) {
        const card = document.getElementById("card");
        if (!card) return;

        card.style.display = "block";
        const cardBody = card.querySelector(".card-body");
        
        cardBody.innerHTML = `
            <div class="classic-aircraft">
                <p><strong>ID:</strong> <span>${id}</span></p>
                <p><strong>Type:</strong> <span>Classic Aircraft</span></p>
                <p><strong>Route Points:</strong> <span>${waypoints.route.length}</span></p>
            </div>
        `;
    }

    play() {
        this.motionObjects.forEach((obj, id) => {
            if (!obj.isPlaying) {
                try {
                    // Ensure layers are visible
                    if (!this.map.hasLayer(obj.motionLine)) {
                        obj.motionLine.addTo(this.map);
                    }
                    if (!this.map.hasLayer(obj.marker)) {
                        obj.marker.addTo(this.map);
                    }
    
                    // Set initial position
                    const startPos = obj.waypoints.route[0];
                    obj.marker.setLatLng(startPos);
                    
                    try {
                        obj.motionLine.motionStart();
                        // console.log(`Motion started successfully for ${id}`);
                        obj.isPlaying = true;
                    } catch (error) {
                        console.error(`Error starting motion for ${id}:`, error);
                    }
    
                } catch (error) {
                    console.error(`Error starting motion for ${id}:`, error);
                }
            }
        });
    }

    stop() {
        this.motionObjects.forEach((obj, id) => {
            if (obj.isPlaying) {
                try {
                    obj.motionLine.motionPause();
                    obj.isPlaying = false;
                    // console.log(`Stopped motion for object ID: ${id}`);
                    
                    // Keep the marker visible at current position
                    if (obj.motionLine.motionMarker) {
                        const currentPos = obj.motionLine.motionMarker.getLatLng();
                        obj.marker.setLatLng(currentPos);
                        obj.marker.setOpacity(1);
                    }
                } catch (error) {
                    console.error(`Error stopping motion for object ID: ${id}`, error);
                }
            }
        });
    }

    resume() {
        this.motionObjects.forEach((obj, id) => {
            if (!obj.isPlaying) {
                try {
                    // Get current position
                    const currentPos = obj.marker.getLatLng();
                    const points = obj.motionLine.getLatLngs();
                    
                    // Find the closest point in the route to resume from
                    let closestIndex = 0;
                    let minDistance = Infinity;
                    
                    points.forEach((point, index) => {
                        const distance = currentPos.distanceTo(point);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestIndex = index;
                        }
                    });
                    
                    if (points && points.length > closestIndex + 1) {
                        obj.motionLine._motion._currentIndex = closestIndex;
                        obj.motionLine.motionResume();
                        obj.isPlaying = true;
                        
                        // console.log(`Resumed motion for object ID: ${id} from index: ${closestIndex}`);
                    } else {
                        obj.motionLine.motionStart();
                        obj.isPlaying = true;
                        console.log(`Restarted motion for object ID: ${id}`);
                    }
                } catch (error) {
                    console.error(`Error resuming motion for object ID: ${id}`, error);
                }
            }
        });
    }

    onMapMove() {
        this.motionObjects.forEach((obj, id) => {
            try {
                if (obj.motionLine && obj.motionLine._motion) {
                    const points = obj.motionLine.getLatLngs();
                    const currentIndex = obj.motionLine._motion._currentIndex || 0;
                    
                    if (points && points.length > currentIndex) {
                        const currentPos = points[currentIndex];
                        obj.marker.setLatLng(currentPos);
                        
                        // Update rotation if there's a next point
                        if (points.length > currentIndex + 1) {
                            const nextPos = points[currentIndex + 1];
                            const bearing = this.calculateBearing(currentPos, nextPos);
                            obj.marker.setRotationAngle(bearing);
                            // obj.marker._icon.style.transform = 
                            //     obj.marker._icon.style.transform.replace(
                            //         /rotate\([^)]*\)/, 
                            //         `rotate(${bearing}deg)`
                            //     );
                        }
                    }
                }
            } catch (error) {
                console.warn(`Error updating position for object ID: ${id}`, error);
            }
        });
    }
}