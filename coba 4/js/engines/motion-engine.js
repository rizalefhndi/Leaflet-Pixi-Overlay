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
            icon: markerOptions.icon
        });

        // Create motion path
        const motionLine = L.motion.polyline(
            waypoints.route,
            {
                color: '#red', // Motion engine color
                weight: 2
            },
            {
                auto: false,
                duration: this.calculateDuration(waypoints.route),
                easing: L.Motion.Ease.linear
            }
        );

        // Add marker to motion line
        motionLine.motionOptions = { icon: markerOptions.icon };

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

    calculateDuration(route) {
        // Calculate total distance
        let totalDistance = 0;
        for (let i = 0; i < route.length - 1; i++) {
            const p1 = L.latLng(route[i]);
            const p2 = L.latLng(route[i + 1]);
            totalDistance += p1.distanceTo(p2);
        }
        
        // Base duration on distance (1km = 1second)
        return totalDistance / 1000 * 1000; // Convert to milliseconds
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
        this.motionObjects.forEach((obj) => {
            if (!obj.isPlaying) {
                obj.motionLine.motionStart();
                obj.isPlaying = true;
            }
        });
    }

    stop() {
        this.motionObjects.forEach((obj) => {
            if (obj.isPlaying) {
                obj.motionLine.motionStop();
                obj.isPlaying = false;
            }
        });
    }

    resume() {
        this.motionObjects.forEach((obj) => {
            if (!obj.isPlaying) {
                obj.motionLine.motionResume();
                obj.isPlaying = true;
            }
        });
    }

    onMapMove() {
        // this.motionObjects.forEach((obj) => {
        //     const currentPos = obj.motionLine.getLatLngs()[obj.motionLine._motion._currentIndex];
        //     const point = this.map.latLngToLayerPoint(currentPos);
        //     obj.marker.setLatLng(currentPos); // Update posisi marker
        // });
    }

    
}