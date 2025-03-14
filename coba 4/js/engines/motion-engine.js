import { CONFIG } from '../config.js';
import { Movement } from '../logic.js';

export class MotionEngine {
    constructor(map) {
        this.map = map;
        this.motionObjects = new Map();
        this.isPlaying = false;
        this.animationFrameId = null;
    }

    initialize(utils) {
        // Store utils if needed similar to PixiEngine
        this.utils = utils;
    }

    cleanup() {
        this.motionObjects.forEach((obj) => {
            if (obj.objectPergerakan) {
                if (obj.objectPergerakan.motionMarker) {
                    this.map.removeLayer(obj.objectPergerakan.motionMarker);
                }
                this.map.removeLayer(obj.objectPergerakan);
            }
        });
        this.motionObjects.clear();
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    addObject(id, waypoints, markerOptions) {
        // Create movement logic
        const movement = new Movement(waypoints);
        movement.setCharacteristics(CONFIG.engineTypes.motion.characteristics);
    
        // Calculate duration with speed adjustment
        const baseDuration = movement.calculateDuration();
        const speedFactor = 1000;
        const adjustedDuration = baseDuration * speedFactor;
    
        // Create motion polyline with adjusted duration
        const objectPergerakan = L.motion.polyline(
            waypoints.route,
            {
                color: 'transparent',
                weight: 2
            },
            {
                auto: false,
                duration: adjustedDuration,
                easing: L.Motion.Ease.linear
            },
            {
                removeOnEnd: false,
                showMarker: true,
                icon: markerOptions.icon
            }
        );
        
        // Add interactive capability similar to PixiEngine
        if (objectPergerakan.motionMarker) {
            objectPergerakan.motionMarker.on('click', () => this.showInfoCard(id));
        }

        // Add motion handler using Movement logic - improved to handle rotation
        objectPergerakan.on('motion', (e) => {
            if (!e.latlng || !objectPergerakan.motionMarker) return;

            // Update movement logic
            const newPosition = movement.updatePosition(1/CONFIG.frameRate);
            
            // Update marker position
            objectPergerakan.motionMarker.setLatLng([newPosition.lat, newPosition.lng]);
            
            // Apply rotation directly using bearing from movement logic
            // This ensures consistent rotation behavior
            objectPergerakan.motionMarker.setRotationAngle(newPosition.bearing);
        });

        // Store objects
        this.motionObjects.set(id, {
            movement,
            objectPergerakan,
            engineType: 'motion'
        });

        return objectPergerakan;
    }

    showInfoCard(id) {
        const obj = this.motionObjects.get(id);
        if (!obj) return;

        const card = document.getElementById("card");
        if (!card) return;

        card.style.display = "block";
        const currentPosition = obj.movement.getCurrentPosition();
        
        const cardBody = card.querySelector(".card-body");
        cardBody.innerHTML = `
            <div class="classic-aircraft">
                <p><strong>ID:</strong> <span>${id}</span></p>
                <p><strong>Type:</strong> <span>Classic Aircraft</span></p>
                <p><strong>Speed:</strong> <span>${currentPosition.speed.toFixed(2)} km/h</span></p>
                <p><strong>Altitude:</strong> <span>${currentPosition.altitude.toFixed(2)} m</span></p>
                <p><strong>Fuel:</strong> <span>${currentPosition.fuel} kg</span></p>
                <p><strong>Position:</strong> <span>Lat: ${currentPosition.lat.toFixed(6)}, <br> Lng: ${currentPosition.lng.toFixed(6)}</span></p>
            </div>
        `;
    }

    updateObjectPosition(id) {
        const obj = this.motionObjects.get(id);
        if (!obj || !obj.objectPergerakan || !obj.objectPergerakan.motionMarker) return;
        
        const currentPos = obj.movement.getCurrentPosition();
        obj.objectPergerakan.motionMarker.setLatLng([currentPos.lat, currentPos.lng]);
        obj.objectPergerakan.motionMarker.setRotationAngle(currentPos.bearing);
    }

    play() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            
            this.motionObjects.forEach((obj, id) => {
                try {
                    if (!this.map.hasLayer(obj.objectPergerakan)) {
                        obj.objectPergerakan.addTo(this.map);
                    }
                    obj.movement.resume();
                    obj.objectPergerakan.motionStart();
                } catch (error) {
                    console.error(`Error playing motion for ${id}:`, error);
                }
            });
            
            // Add animation loop similar to PixiEngine for consistent updates
            this.animate();
        }
    }

    stop() {
        this.isPlaying = false;
        
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        this.motionObjects.forEach((obj, id) => {
            try {
                obj.movement.pause();
                obj.objectPergerakan.motionPause();
            } catch (error) {
                console.error(`Error stopping motion for ${id}:`, error);
            }
        });
    }

    resume() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            
            this.motionObjects.forEach((obj, id) => {
                try {
                    obj.movement.resume();
                    obj.objectPergerakan.motionResume();
                } catch (error) {
                    console.error(`Error resuming motion for ${id}:`, error);
                }
            });
            
            this.animate();
        }
    }
    
    animate() {
        if (!this.isPlaying) return;
        
        const deltaTime = 1 / CONFIG.frameRate;
        let allFinished = true;
        
        this.motionObjects.forEach((obj, id) => {
            if (!obj.movement.hasReachedEnd()) {
                allFinished = false;
                
                // Force update marker rotation to ensure consistent heading
                if (obj.objectPergerakan && obj.objectPergerakan.motionMarker) {
					console.log("Animating Motion objects"); // Pastikan ini muncul di konsol
                    const currentPos = obj.movement.getCurrentPosition();
                    obj.objectPergerakan.motionMarker.setRotationAngle(currentPos.bearing);
                }
            }
        });
        
        if (!allFinished) {
            this.animationFrameId = requestAnimationFrame(() => this.animate());
        } else {
            this.stop();
        }
    }

    onMapMove() {
        this.motionObjects.forEach((obj, id) => {
            this.updateObjectPosition(id);
        });
    }
    
    // Helper method to calculate bearing between two points
    // This ensures consistent rotation calculation with Movement class
    calculateBearing(start, end) {
        const toRadians = (degrees) => degrees * Math.PI / 180;
        const toDegrees = (radians) => radians * 180 / Math.PI;
        
        const lat1 = toRadians(start.lat);
        const lon1 = toRadians(start.lng);
        const lat2 = toRadians(end.lat);
        const lon2 = toRadians(end.lng);

        const deltaLon = lon2 - lon1;

        const y = Math.sin(deltaLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
                 Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

        let bearing = toDegrees(Math.atan2(y, x));
        return (bearing + 360) % 360;
    }
}