import { CONFIG } from '../config.js';

export class MotionEngine {
    constructor(map) {
        this.map = map;
        this.motionObjects = new Map();
        this.markers = new Map();
    }

    initialize() {
        // Nothing special needed for initialization
    }

    addObject(id, waypoints, markerOptions) {
        // Check if waypoints is properly structured
        if (!waypoints || !waypoints.route) {
            console.error('Invalid waypoints structure:', waypoints);
            return;
        }

        // Create marker for motion object
        const marker = L.marker(waypoints.route[0], {
            icon: markerOptions.icon,
            rotationAngle: 0,
            rotationOrigin: 'center center'
        });

        // Create motion path
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

        motionLine.on('motion', (e) => {
            try {
                const latLng = e.latlng;
                if (!latLng) {
                    console.warn('No latlng in motion event');
                    return;
                }
                
                marker.setLatLng(latLng);
                console.log('Marker updated:', latLng);
                // Ensure marker is using custom icon
                if (marker._icon && markerOptions.icon) {
                    marker.setIcon(markerOptions.icon);
                }
                
                if (e.nextLatLng) {
                    const bearing = this.calculateBearing(latLng, e.nextLatLng);
                    marker._icon.style.transform = `rotate(${bearing}deg)`;
                }
            } catch (error) {
                console.error('Error in motion event:', error);
            }
        });

        motionLine.on('motionend', () => {
            console.log(`Motion ended for ${id}`);
            this.motionObjects.get(id).isPlaying = false;
        });

        // Add to map
        motionLine.addTo(this.map);
        marker.addTo(this.map);

        // Store objects
        this.motionObjects.set(id, {
            waypoints,
            motionLine,
            marker,
            isPlaying: false
        });

        // Add click handler
        marker.on('click', () => this.showInfoCard(id, waypoints));

        return motionLine;
    }

    removeObject(id) {
        // Cari objek berdasarkan ID
        const obj = this.motionObjects.get(id);
        if (!obj) {
            console.warn(`Object with ID ${id} not found`);
            return;
        }

        // Hapus marker dan motion line dari peta
        if (this.map.hasLayer(obj.marker)) {
            this.map.removeLayer(obj.marker);
        }
        if (this.map.hasLayer(obj.motionLine)) {
            this.map.removeLayer(obj.motionLine);
        }

        // Hapus dari koleksi
        this.motionObjects.delete(id);
        console.log(`Object with ID ${id} removed successfully`);
    }

    calculateBearing(start, end) {
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
    
        return bearing;
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
    
                    // Start motion with logging
                    console.log(`Starting motion for ${id}`, {
                        route: obj.waypoints.route,
                        marker: obj.marker.getLatLng()
                    });
                    
                    try {
                        obj.motionLine.motionStart();
                        console.log(`Motion started successfully for ${id}`);
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
                    obj.motionLine.motionStop();
                    obj.isPlaying = false;
                    console.log(`Stopped motion for object ID: ${id}`);
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
                    // Get current position and next position
                    const points = obj.motionLine.getLatLngs();
                    const currentIndex = obj.motionLine._motion ? obj.motionLine._motion._currentIndex : 0;
                    
                    if (points && points.length > currentIndex + 1) {
                        const currentPos = points[currentIndex];
                        const nextPos = points[currentIndex + 1];
                        
                        // Calculate and set rotation
                        const bearing = this.calculateBearing(currentPos, nextPos);
                        if (obj.marker._icon) {
                            obj.marker._icon.style.transform = `rotate(${bearing}deg)`;
                        }
                    }

                    obj.motionLine.motionResume();
                    obj.isPlaying = true;
                    console.log(`Resumed motion for object ID: ${id}`, {
                        position: obj.marker.getLatLng()
                    });
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
                            obj.marker._icon.style.transform = 
                                obj.marker._icon.style.transform.replace(
                                    /rotate\([^)]*\)/, 
                                    `rotate(${bearing}deg)`
                                );
                        }
                    }
                }
            } catch (error) {
                console.warn(`Error updating position for object ID: ${id}`, error);
            }
        });
    }
}