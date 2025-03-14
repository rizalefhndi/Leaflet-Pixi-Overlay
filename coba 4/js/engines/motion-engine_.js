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

    initialize() {
        // Nothing special needed for initialization
        this.cleanup();
    }

    addObject(id, waypoints, markerOptions) {
        // Create motion polyline
        const objectPergerakan = L.motion.polyline(
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
    
        // Store only motion object
        this.motionObjects.set(id, {
            waypoints,
            objectPergerakan,
            isPlaying: false
        });
    
        return objectPergerakan;
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
                    // Only add motion polyline to map
                    if (!this.map.hasLayer(obj.objectPergerakan)) {
                        obj.objectPergerakan.addTo(this.map);
                    }
    
                    // Start motion
                    obj.objectPergerakan.motionStart();
                    obj.isPlaying = true;
    
                } catch (error) {
                    console.error(`Error playing motion for ${id}:`, error);
                }
            }
        });
    }

    stop() {
        this.motionObjects.forEach((obj, id) => {
            if (obj.isPlaying) {
                try {
                    obj.objectPergerakan.motionPause();
                    obj.isPlaying = false;
                    // console.log(`Stopped motion for object ID: ${id}`);
                    
                    // Keep the marker visible at current position
                    if (obj.objectPergerakan.motionMarker) {
                        const currentPos = obj.objectPergerakan.motionMarker.getLatLng();
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
                    if (!this.map.hasLayer(obj.objectPergerakan)) {
                        obj.objectPergerakan.addTo(this.map);
                    }

                    const points = obj.objectPergerakan.getLatLngs();
                    if (!points || points.length === 0) {
                        console.warn(`No route points found for ${id}`);
                        return;
                    }

                    let currentPos;
                    if (obj.objectPergerakan.motionMarker) {
                        currentPos = obj.objectPergerakan.motionMarker.getLatLng();
                    } else {
                        currentPos = points[0];
                    }
                    
                    let closestIndex = 0;
                    let minDistance = Infinity;
                    
                    points.forEach((point, index) => {
                        const distance = L.latLng(currentPos).distanceTo(point);
                        if (distance < minDistance) {
                            minDistance = distance;
                            closestIndex = index;
                        }
                    });
                    
                    // Resume from closest point
                    if (points.length > closestIndex + 1) {
                        obj.objectPergerakan._motion._currentIndex = closestIndex;
                        obj.objectPergerakan.motionResume();
                        obj.isPlaying = true;
                    } else {
                        obj.objectPergerakan.motionStart();
                        obj.isPlaying = true;
                    }
    
                } catch (error) {
                    console.error(`Error resuming motion for ${id}:`, error);
                }
            }
        });
    }
    onMapMove() {
        this.motionObjects.forEach((obj, id) => {
            try {
                if (obj.objectPergerakan && 
                    obj.objectPergerakan._motion && 
                    obj.objectPergerakan.motionMarker) {
                    
                    const points = obj.objectPergerakan.getLatLngs();
                    const currentIndex = obj.objectPergerakan._motion._currentIndex || 0;
                    
                    if (points && points.length > currentIndex + 1) {
                        const currentPos = points[currentIndex];
                        const nextPos = points[currentIndex + 1];
                        const bearing = this.calculateBearing(currentPos, nextPos);
                        
                        // Use motion marker instead of separate marker
                        obj.objectPergerakan.motionMarker.setRotationAngle(bearing);
                    }
                }
            } catch (error) {
                console.warn(`Motion update skipped for ${id}`);
            }
        });
    }
}