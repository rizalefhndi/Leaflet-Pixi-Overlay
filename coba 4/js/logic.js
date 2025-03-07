import { CONFIG } from './config.js';

export class Movement {
    constructor(waypoints, initialSpeed) {
        this.waypoints = waypoints;
        this.currentSegmentIndex = 0;
        
        // Position properties
        this.currentPosition = {
            lat: waypoints.route[0][0],
            lng: waypoints.route[0][1],
            bearing: 0,
            altitude: 0 // Will be set by setCharacteristics
        };

        this.engineType = waypoints.engineType || 'pixi';
        this.characteristics = null;
        this.targetAltitude = 0; // Will be set by setCharacteristics
        
        // Speed properties
        this.speed = 0; // Will be set by setCharacteristics
        this.targetSpeed = 0; // Will be set by setCharacteristics
        
        // Turn properties
        this.targetBearing = this.calculateInitialBearing();
        this.turnRate = 0; // Will be set by setCharacteristics
        
        // Fuel properties
        this.fuel = CONFIG.common.fuel.capacity;
        
        // State flags
        this.isPaused = false;
        this.lastPosition = null;
    }

    setCharacteristics(characteristics) {
        this.characteristics = characteristics;
        this.speed = characteristics.speed.initial;
        this.targetSpeed = characteristics.speed.max;
        this.currentPosition.altitude = characteristics.altitude.initial;
        this.targetAltitude = characteristics.altitude.max;
        this.turnRate = characteristics.turn.rate;
    }

    // Rest of your Movement class methods from paste-2.txt
    // Make sure all methods use this.characteristics instead of CONFIG.movement
    
    pause() {
        this.isPaused = true;
        this.lastPosition = { ...this.currentPosition };
    }

    resume() {
        this.isPaused = false;
    }

    reset() {
        this.currentSegmentIndex = 0;
        this.speed = this.characteristics.speed.initial;
        this.currentPosition = {
            lat: this.waypoints.route[0][0],
            lng: this.waypoints.route[0][1],
            bearing: 0,
            altitude: this.characteristics.altitude.initial
        };
        this.fuel = CONFIG.common.fuel.capacity;
        this.isPaused = false;
    }

    getCurrentPosition() {
        return {
            lat: this.currentPosition.lat,
            lng: this.currentPosition.lng,
            bearing: this.currentPosition.bearing,
            speed: this.speed,
            altitude: this.currentPosition.altitude,
            fuel: this.fuel.toFixed(2)
        };
    }

    setTurnRate(type) {
        switch(type) {
            case 'slack':
                this.turnRate = this.characteristics.turn.min;
                break;
            case 'normal':
                this.turnRate = (this.characteristics.turn.min + this.characteristics.turn.max) / 2;
                break;
            case 'tight':
                this.turnRate = this.characteristics.turn.max;
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
            ? this.characteristics.altitude.climbRate
            : -this.characteristics.altitude.climbRate;
    
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
            this.speed += this.characteristics.speed.acceleration * deltaTime;
            this.speed = Math.min(this.speed, targetSpeed);
        } else {
            this.speed -= this.characteristics.speed.deceleration * deltaTime;
            this.speed = Math.max(this.speed, targetSpeed);
        }
    }

    updateBearing(deltaTime) {
        const currentBearing = this.currentPosition.bearing;
        const bearingDiff = ((this.targetBearing - currentBearing + 540) % 360) - 180;
        
        if (Math.abs(bearingDiff) < 1) {
            this.currentPosition.bearing = this.targetBearing;
            return;
        }

        const turnDirection = bearingDiff > 0 ? 1 : -1;
        const turnAmount = this.turnRate * deltaTime;
        
        this.currentPosition.bearing = (currentBearing + turnAmount * turnDirection + 360) % 360;
    }

    calculateFuelConsumption(deltaTime, isInTurn, isClimbing) {
        const distanceCovered = (this.speed / 3600) * deltaTime; // Convert speed to km/s
        let consumption;

        if (isInTurn) {
            const turnRate = this.turnRate;
            const minTurn = this.characteristics.turn.min;
            const maxTurn = this.characteristics.turn.max;
            if (turnRate <= minTurn + (maxTurn - minTurn) / 3) {
                consumption = CONFIG.common.fuel.consumptionRate.turning.slack;
            } else if (turnRate <= minTurn + 2 * (maxTurn - minTurn) / 3) {
                consumption = CONFIG.common.fuel.consumptionRate.turning.normal;
            } else {
                consumption = CONFIG.common.fuel.consumptionRate.turning.tight;
            }
        } else if (isClimbing) {
            consumption = CONFIG.common.fuel.consumptionRate.climbing;
        } else {
            consumption = CONFIG.common.fuel.consumptionRate.cruising;
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
        const isClimbing = Math.abs(this.currentPosition.altitude - this.targetAltitude) > 1;
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
        const fuelUsed = this.calculateFuelConsumption(deltaTime, isInTurn, isClimbing);
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
        return this.currentSegmentIndex >= this.waypoints.route.length - 2;
    }

    // Helper methods for calculations
    toRadians(degrees) {
        return degrees * Math.PI / 180;
    }

    toDegrees(radians) {
        return radians * 180 / Math.PI;
    }

    calculateBearing(start, end) {
        if (!start || !end || start.length < 2 || end.length < 2) {
            console.error('Invalid start or end coordinates:', start, end);
            return 0;
        }
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