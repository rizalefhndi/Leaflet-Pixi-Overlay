import { CONFIG } from './config.js';

export class Movement {
    constructor(waypoints, initialSpeed = CONFIG.movement.speed.initial) {
        this.waypoints = waypoints;
        this.currentSegmentIndex = 0;

        console.log('waypoints: ', waypoints)
        
        // Position and movement state
        this.currentPosition = {
            lat: waypoints.route[0][0],
            lng: waypoints.route[0][1],
            bearing: 0,
            altitude: CONFIG.movement.altitude.initial
        };

        this.targetAltitude = CONFIG.movement.altitude.max;
        
        // Speed properties
        this.speed = initialSpeed;
        this.targetSpeed =  CONFIG.movement.speed.max;
        
        // Turn properties
        this.targetBearing = this.calculateInitialBearing();
        // this.turnRate = CONFIG.movement.turn.normal; // Default to normal turn rate
        
        // Fuel properties
        this.fuel = CONFIG.movement.fuel.capacity;
        
        // State flags
        this.isPaused = false;
        this.lastPosition = null;
        this.lastBearing = 0;
    }

    pause() {
        this.isPaused = true;
        this.lastPosition = { ...this.currentPosition };
    }

    resume() {
        this.isPaused = false;
    }

    reset() {
        this.currentSegmentIndex = 0;
        this.speed = CONFIG.movement.speed.initial;
        this.currentPosition = {
            lat: this.waypoints.route[0][0],
            lng: this.waypoints.route[0][1],
            bearing: 0,
            altitude: CONFIG.movement.altitude.initial
        };
        this.fuel = CONFIG.movement.fuel.capacity;
        this.isPaused = false;
    }

    getCurrentPosition() {
        return {
            lat: this.currentPosition.lat,
            lng: this.currentPosition.lng,
            bearing: this.lastBearing
        };
    }

    setTurnRate(type) {
        switch(type) {
            case 'slack':
                this.turnRate = CONFIG.movement.turn.slack;
                break;
            case 'normal':
                this.turnRate = CONFIG.movement.turn.normal;
                break;
            case 'tight':
                this.turnRate = CONFIG.movement.turn.tight;
                break;
        }
    }

    calculateInitialBearing() {
        const start = [this.waypoints.route[0][0], this.waypoints.route[0][1]];
        const end = [this.waypoints.route[1][0], this.waypoints.route[1][1]];
        return this.calculateBearing(start, end);
    }

    updateAltitude(deltaTime, targetAltitude) {
        const altitudeDiff = targetAltitude - this.currentPosition.altitude;
    
        if (Math.abs(altitudeDiff) < 1) {
            this.currentPosition.altitude = targetAltitude;
            return;
        }
    
        const climbRateSpeed = altitudeDiff > 0
            ? CONFIG.movement.altitude.climbRate
            : -CONFIG.movement.altitude.climbRate;
    
        this.currentPosition.altitude += climbRateSpeed * deltaTime;
    
        if ((climbRateSpeed > 0 && this.currentPosition.altitude > targetAltitude) ||
            (climbRateSpeed < 0 && this.currentPosition.altitude < targetAltitude)) {
            this.currentPosition.altitude = targetAltitude;
        }
    }
    

    updateSpeed(deltaTime, targetSpeed) {
        const speedDiff = targetSpeed - this.speed;
        
        if (Math.abs(speedDiff) < 1) {
            this.speed = targetSpeed;
            return;
        }

        if (speedDiff > 0) {
            this.speed += CONFIG.movement.speed.acceleration * deltaTime;
            this.speed = Math.min(this.speed, targetSpeed);
        } else {
            this.speed -= CONFIG.movement.speed.deceleration * deltaTime;
            this.speed = Math.max(this.speed, targetSpeed);
        }
    }

    updateBearing(deltaTime) {
        const currentBearing = this.currentPosition.bearing;
        const bearingDiff = ((this.targetBearing - currentBearing + 540) % 360) - 180;
        
        if (Math.abs(bearingDiff) < 0.01) {
            this.currentPosition.bearing = this.targetBearing;
            return;
        }

        const turnDirection = bearingDiff > 0 ? 1 : -1;
        const turnAmount = this.turnRate * deltaTime;
        
        this.currentPosition.bearing = (currentBearing + turnAmount * turnDirection + 360) % 360;
    }

    calculateFuelConsumption(deltaTime, isInTurn) {
        const distanceCovered = (this.speed / 3600) * deltaTime; // Convert speed to km/s
        let consumption;

        if (isInTurn) {
            switch(this.turnRate) {
                case CONFIG.movement.turn.slack:
                    consumption = CONFIG.movement.fuel.consumptionRate.turning.slack;
                    break;
                case CONFIG.movement.turn.normal:
                    consumption = CONFIG.movement.fuel.consumptionRate.turning.normal;
                    break;
                case CONFIG.movement.turn.tight:
                    consumption = CONFIG.movement.fuel.consumptionRate.turning.tight;
                    break;
            }
        } 

        return consumption * distanceCovered;
    }

    updatePosition(deltaTime) {
        if (this.isPaused || this.fuel <= 0) {
            return { ...this.currentPosition };
        }

        if (this.hasReachedEnd()) {
            return { ...this.currentPosition };
        }

        // Update speed
        this.updateSpeed(deltaTime, this.targetSpeed);

        // Update altitude
        this.updateAltitude(deltaTime, this.targetAltitude);

        // Calculate next waypoint bearing
        const nextWaypoint = this.waypoints.route[this.currentSegmentIndex + 1];
        this.targetBearing = this.calculateBearing(
            [this.currentPosition.lat, this.currentPosition.lng],
            nextWaypoint
        );

        // Check if there's a turn defined for the current segment
        if (this.waypoints.turn && this.waypoints.turn[this.currentSegmentIndex]) {
            const turnType = this.waypoints.turn[this.currentSegmentIndex]; 
            this.setTurnRate(turnType); 
        }

        // Update bearing with turn rate
        const isInTurn = Math.abs(this.targetBearing - this.currentPosition.bearing) > 1;
        this.updateBearing(deltaTime);

        // Update fuel consumption
        const fuelUsed = this.calculateFuelConsumption(deltaTime, isInTurn);
        this.fuel = Math.max(0, this.fuel - fuelUsed);

        // Calculate new position
        const distanceMoved = (this.speed / 3600) * deltaTime; // Convert to km/s
        const bearingRad = this.toRadians(this.currentPosition.bearing);
        
        // Update position using bearing and speed
        const R = 6371; // Earth's radius in km
        const lat1 = this.toRadians(this.currentPosition.lat);
        const lon1 = this.toRadians(this.currentPosition.lng);
        
        const lat2 = Math.asin(
            Math.sin(lat1) * Math.cos(distanceMoved/R) +
            Math.cos(lat1) * Math.sin(distanceMoved/R) * Math.cos(bearingRad)
        );
        
        const lon2 = lon1 + Math.atan2(
            Math.sin(bearingRad) * Math.sin(distanceMoved/R) * Math.cos(lat1),
            Math.cos(distanceMoved/R) - Math.sin(lat1) * Math.sin(lat2)
        );

        // Update current position
        this.currentPosition.lat = this.toDegrees(lat2);
        this.currentPosition.lng = this.toDegrees(lon2);

        // Check if we've reached the next waypoint
        if (this.hasReachedWaypoint(nextWaypoint)) {
            this.currentSegmentIndex++;
        }

        return { ...this.currentPosition };
    }

    hasReachedWaypoint(waypoint) {
        const distance = this.calculateDistance(
            [this.currentPosition.lat, this.currentPosition.lng],
            waypoint
        );
        return distance < 0.1; // Within 100 meters
    }

    hasReachedEnd() {
        return this.currentSegmentIndex >= this.waypoints.length - 1;
    }

    // Helper methods for calculations
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    toDegrees(radians) {
        return radians * 180 / Math.PI;
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

    calculateDistance(point1, point2) {
        const R = 6371; // Earth's radius in km
        const lat1 = this.toRadians(point1[0]);
        const lon1 = this.toRadians(point1[1]);
        const lat2 = this.toRadians(point2[0]);
        const lon2 = this.toRadians(point2[1]);

        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}