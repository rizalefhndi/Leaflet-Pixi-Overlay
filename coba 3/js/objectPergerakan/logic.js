import { CONFIG } from './config.js';

export class Movement {
  constructor(waypoints, initialSpeed, acceleration) {
    this.waypoints = waypoints;
    this.currentSegmentIndex = 0;
    this.speed = initialSpeed;
    this.acceleration = acceleration;
    this.currentPosition = { 
      lat: waypoints[0][0], 
      lng: waypoints[0][1],
      bearing: 0
    };

    this.isPaused = false;
  }

  moveAircraft() {
    if (this.isPaused) {
      return this.currentPosition;
    }

    const currentWaypoint = this.waypoints[this.currentSegmentIndex];
    const nextWaypoint = this.waypoints[this.currentSegmentIndex + 1];

    if (!nextWaypoint) {
      return this.currentPosition;
    }

    const distance = this.calculateDistance(this.currentPosition, nextWaypoint);
    const bearing = this.calculateBearing(this.currentPosition, nextWaypoint);

    this.currentPosition.lat += Math.cos(bearing * Math.PI / 180) * this.speed;
    this.currentPosition.lng += Math.sin(bearing * Math.PI / 180) * this.speed;
    this.currentPosition.bearing = bearing;

    this.speed += this.acceleration;

    if (distance < CONFIG.distanceThreshold) {
      this.currentSegmentIndex++;
    }

    return this.currentPosition;
  }

  startMovement() {
    this.currentPosition = { 
      lat: this.waypoints[0][0], 
      lng: this.waypoints[0][1],
      bearing: 0
    };
    this.moveAircraft();
  }

  pause() {
    this.isPaused = true;
  }

  resume() {
    this.isPaused = false;
  }

  calculateDistance(point1, point2) {
    const R = 6371; // Radius of the earth in kilometers
    const dLat = this.toRadians(point2[0] - point1.lat);
    const dLon = this.toRadians(point2[1] - point1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2[0])) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  calculateBearing(point1, point2) {
    const dLon = this.toRadians(point2[1] - point1.lng);
    const dPhi = Math.log(Math.tan(this.toRadians(point2[0]) / 2 + Math.PI / 4) / Math.tan(this.toRadians(point1.lat) / 2 + Math.PI / 4));
    if (Math.abs(dLon) > Math.PI) {
      dLon = dLon > 0 ? -(2 * Math.PI - dLon) : (2 * Math.PI + dLon);
    }
    return (this.toDegrees(Math.atan2(dLon, dPhi)) + 360) % 360;
  }

  toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  toDegrees(radians) {
    return radians * 180 / Math.PI;
  }
}