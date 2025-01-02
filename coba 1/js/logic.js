import { CONFIG } from './config.js';

export class Movement {
    constructor(waypoints, initialSpeed, acceleration) {
        this.waypoints = waypoints;
        this.currentSegmentIndex = 0;
        this.speed = initialSpeed;
        this.acceleration = acceleration;
        this.currentPosition = { lat: waypoints[0][0], lng: waypoints[0][1] };
        this.turningPoints = this.generateTurningPoints();
        this.currentCurvePoints = null;
        this.curveProgress = 0;
        this.isTurning = false;
        this.nextTurnPrepared = false;
    }

    generateTurningPoints() {
        const turningPoints = [];
        for (let i = 1; i < this.waypoints.length - 1; i++) {
            const prev = this.waypoints[i - 1];
            const current = this.waypoints[i];
            const next = this.waypoints[i + 1];
            
            turningPoints.push({
                point: current,
                index: i,
                controlPoints: this.calculateControlPoints(prev, current, next)
            });
        }
        return turningPoints;
    }

    calculateControlPoints(prev, current, next) {
        // Hitung sudut antara segmen
        const angle1 = Math.atan2(current[0] - prev[0], current[1] - prev[1]);
        const angle2 = Math.atan2(next[0] - current[0], next[1] - current[1]);
        const angleDiff = Math.abs(angle2 - angle1);

        // Hitung jarak control point berdasarkan sudut belokan
        const turnSharpness = Math.min(1, angleDiff / Math.PI);
        const baseDistance = 0.05; // Jarak dasar control point
        const controlDistance = baseDistance * (1 + turnSharpness);

        // Hitung titik kontrol sebelum belokan
        const p1 = [
            current[0] + Math.sin(angle1) * controlDistance,
            current[1] + Math.cos(angle1) * controlDistance
        ];

        // Hitung titik kontrol setelah belokan
        const p2 = [
            current[0] + Math.sin(angle2) * controlDistance,
            current[1] + Math.cos(angle2) * controlDistance
        ];

        return { p1, p2 };
    }

    calculateBezierPoint(p0, p1, p2, p3, t) {
        const oneMinusT = 1 - t;
        const oneMinusTSquared = oneMinusT * oneMinusT;
        const oneMinusTCubed = oneMinusT * oneMinusTSquared;
        const tSquared = t * t;
        const tCubed = t * tSquared;

        return {
            lat: oneMinusTCubed * p0[0] + 3 * oneMinusTSquared * t * p1[0] + 
                 3 * oneMinusT * tSquared * p2[0] + tCubed * p3[0],
            lng: oneMinusTCubed * p0[1] + 3 * oneMinusTSquared * t * p1[1] + 
                 3 * oneMinusT * tSquared * p2[1] + tCubed * p3[1]
        };
    }

    calculateBearing(start, end) {
        const toRadians = (deg) => (deg * Math.PI) / 180;
        const toDegrees = (rad) => (rad * 180) / Math.PI;

        const lat1 = toRadians(start[0]);
        const lon1 = toRadians(start[1]);
        const lat2 = toRadians(end[0]);
        const lon2 = toRadians(end[1]);

        const deltaLon = lon2 - lon1;

        const y = Math.sin(deltaLon) * Math.cos(lat2);
        const x = Math.cos(lat1) * Math.sin(lat2) -
                 Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLon);

        let bearing = toDegrees(Math.atan2(y, x));
        return (bearing + 360) % 360;
    }

    updatePosition(deltaTime) {
        if (this.hasReachedEnd()) {
            return { ...this.currentPosition, bearing: 0 };
        }

        this.speed += this.acceleration * deltaTime;
        
        const currentWaypoint = this.waypoints[this.currentSegmentIndex];
        const nextWaypoint = this.waypoints[this.currentSegmentIndex + 1];
        const turningPoint = this.turningPoints.find(tp => tp.index === this.currentSegmentIndex + 1);

        // Hitung jarak ke waypoint berikutnya
        const distToNext = Math.sqrt(
            Math.pow(this.currentPosition.lat - nextWaypoint[0], 2) +
            Math.pow(this.currentPosition.lng - nextWaypoint[1], 2)
        );

        // Mulai belokan lebih awal (sekitar 60% dari jarak ke waypoint)
        const segmentLength = Math.sqrt(
            Math.pow(nextWaypoint[0] - currentWaypoint[0], 2) +
            Math.pow(nextWaypoint[1] - currentWaypoint[1], 2)
        );
        
        const turningThreshold = segmentLength * 0.6;

        // Persiapkan belokan berikutnya
        if (!this.isTurning && !this.nextTurnPrepared && distToNext < turningThreshold && turningPoint) {
            this.isTurning = true;
            this.nextTurnPrepared = true;
            this.curveProgress = 0;

            // Gunakan posisi saat ini sebagai titik awal kurva
            const startPoint = [this.currentPosition.lat, this.currentPosition.lng];
            const endPoint = this.waypoints[this.currentSegmentIndex + 2];

            // Sesuaikan control points berdasarkan posisi saat ini
            const adjustedP1 = [
                startPoint[0] + (turningPoint.controlPoints.p1[0] - startPoint[0]) * 0.8,
                startPoint[1] + (turningPoint.controlPoints.p1[1] - startPoint[1]) * 0.8
            ];

            const adjustedP2 = [
                endPoint[0] + (turningPoint.controlPoints.p2[0] - endPoint[0]) * 0.8,
                endPoint[1] + (turningPoint.controlPoints.p2[1] - endPoint[1]) * 0.8
            ];

            this.currentCurvePoints = {
                p0: startPoint,
                p1: adjustedP1,
                p2: adjustedP2,
                p3: endPoint
            };
        }

        let newPosition;
        let bearing;

        if (this.isTurning) {
            // Kecepatan kurva yang konsisten
            const curveSpeed = 0.01 * (CONFIG.initialSpeed / this.speed);
            this.curveProgress += curveSpeed;

            if (this.curveProgress >= 1) {
                this.isTurning = false;
                this.nextTurnPrepared = false;
                this.currentSegmentIndex++;
                newPosition = this.calculateBezierPoint(
                    this.currentCurvePoints.p0,
                    this.currentCurvePoints.p1,
                    this.currentCurvePoints.p2,
                    this.currentCurvePoints.p3,
                    1
                );
            } else {
                newPosition = this.calculateBezierPoint(
                    this.currentCurvePoints.p0,
                    this.currentCurvePoints.p1,
                    this.currentCurvePoints.p2,
                    this.currentCurvePoints.p3,
                    this.curveProgress
                );
            }
        } else {
            // Gerakan linear
            const direction = {
                lat: nextWaypoint[0] - this.currentPosition.lat,
                lng: nextWaypoint[1] - this.currentPosition.lng
            };
            
            const length = Math.sqrt(direction.lat ** 2 + direction.lng ** 2);
            const unitDirection = {
                lat: direction.lat / length,
                lng: direction.lng / length
            };

            newPosition = {
                lat: this.currentPosition.lat + unitDirection.lat * this.speed * deltaTime,
                lng: this.currentPosition.lng + unitDirection.lng * this.speed * deltaTime
            };
        }

        // Hitung bearing untuk rotasi yang mulus
        const lookAheadPoint = this.isTurning ? 
            this.calculateBezierPoint(
                this.currentCurvePoints.p0,
                this.currentCurvePoints.p1,
                this.currentCurvePoints.p2,
                this.currentCurvePoints.p3,
                Math.min(1, this.curveProgress + 0.1)
            ) : nextWaypoint;

        bearing = this.calculateBearing(
            [this.currentPosition.lat, this.currentPosition.lng],
            [lookAheadPoint.lat, lookAheadPoint.lng]
        );

        this.currentPosition = newPosition;
        return { ...newPosition, bearing };
    }

    hasReachedEnd() {
        return this.currentSegmentIndex >= this.waypoints.length - 2;
    }
}