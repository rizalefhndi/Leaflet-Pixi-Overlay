L.PixiOverlay = L.PixiOverlay || {
	Event: {
		Started: 'pixi-started',
		Paused: 'pixi-paused',
		Resumed: 'pixi-resumed',
		Section: 'pixi-section',
		Ended: 'pixi-ended',
		Move: 'pixi-move',
	},
};

L.pixiOverlay = L.pixiOverlay || {};

L.PixiOverlay.Animate = {
	options: {
		pane: 'polymotionPane',
		attribution: '--------------' + new Date().getFullYear() + ' ',
	},
	pixiOptions: {
		auto: false,
		easing: function (x) {
			return x;
		}, // linear
		speed: 0, // KM/H
		duration: 0, // ms
		startTime: new Date(), // Time
	},
	
	markerOptions: undefined,

	initialize: function (latlngs, options, pixiOptions, markerOptions) {
		L.Util.setOptions(this, options);
		this.pixiOptions = L.Util.extend({}, this.pixiOptions, pixiOptions || {});
		this.markerOptions = L.Util.extend({}, markerOptions || {});

		this._bounds = L.latLngBounds();
		this._linePoints = this._convertLatLngs(latlngs);
		if (!L.PixiOverlay.Utils.isFlat(this._linePoints)) {
			this._linePoints = this._linePoints[0];
		}

		this._initializeMarker();
		this._latlngs = [];
		L.Util.stamp(this);
	},

	addLatLng: function (latLng, ring) {
		latLng = L.PixiOverlay.Utils.toLatLng(latLng);
		this._linePoints.push(latLng);
		if (this._latlngs.length) {
		  this._latlngs.push(latLng);
		}
		return this;
	},

	beforeAdd: function (map) {
		if (!map.getPane(this.options.pane)) {
		  map.createPane(this.options.pane).style.zIndex = 599;
		}
	
		this._renderer = map.getRenderer(this);
	},

	onAdd: function (map) {
		this._renderer._initPath(this);
		this._reset();
		this._renderer._addPath(this);
		if (this.__marker && this.markerOptions.showMarker) {
		  this.__marker.addTo(map);
		}
	
		if (this.__marker._icon && this.__marker._icon.children.length) {
		  var baseRotationAngle = this.__marker._icon.children[0].getAttribute('pixi-base');
		  if (baseRotationAngle) {
			this.__marker._icon.children[0].style.transform = 'rotate(' + baseRotationAngle + 'deg)';
		  }
		}
	
		if (this.pixiOptions.auto) {
		  this.pixiStart();
		}
	
		return this;
	},

	onRemove: function (map) {
		this.pixiStop();
		if (this.__marker) {
		  map.removeLayer(this.__marker);
		}
	
		this._renderer._removePath(this);
	},

	_pixi: function (startTime) {
		var ellapsedTime = new Date().getTime() - startTime;
		var durationRatio = 1; // 0 - 1
		if (this.pixiOptions.duration) {
		  durationRatio = ellapsedTime / this.pixiOptions.duration;
		}
		if (durationRatio < 1) {
		  durationRatio = this.pixiOptions.easing(durationRatio, ellapsedTime, 0, 1, this.pixiOptions.duration);
		  var nextPoint = L.PixiOverlay.Utils.interpolateOnLine(this._map, this._linePoints, durationRatio);
	
		  let layer = this.getMarker();
		  if (layer.options.icon) {
			let id = layer.options.icon.options.id_point;
			// titan.current[id] = nextPoint.predecessor
		  }
	
		  // for(var izc=0; izc<this._linePoints.length; izc++){
		  // 	var lp = this._linePoints[izc].lat
		  // 	if(lp.toString().includes("5.5141")){
		  // 		titan.tmp.push([this._linePoints,nextPoint])
		  // 	}
		  // }
	
		  L.Polyline.prototype.addLatLng.call(this, nextPoint.latLng);
		  this._drawMarker(nextPoint.latLng);
	
		  this.__ellapsedTime = ellapsedTime;
		  this.animation = L.Util.requestAnimFrame(function () {
			this._pixi(startTime);
		  }, this);
		} else {
		  this.pixiStop(true);
		}
	},

	_drawMarker: function (nextPoint) {
		var marker = this.getMarker();
		if (marker) {
		  var prevPoint = marker.getLatLng();
	
		  // [0, 0] Means that marker is not added yet to the map
		  var initialPoints = this._linePoints[0];
		  if (prevPoint.lat === initialPoints.lat && prevPoint.lng === initialPoints.lng) {
			marker.addTo(this._map);
			marker.addEventParent(this);
		  } else {
			if (marker._icon && marker._icon.children.length) {
			  var needToRotateMarker = marker._icon.children[0].getAttribute('pixi-base');
	
			  if (needToRotateMarker) {
				var pixiMarkerOnLine = 0;
				if (needToRotateMarker && !isNaN(+needToRotateMarker)) {
				  pixiMarkerOnLine = +needToRotateMarker;
				}
	
				marker._icon.children[0].style.transform = 'rotate(-' + Math.round(L.PixiOverlay.Utils.getAngle(prevPoint, nextPoint) + pixiMarkerOnLine) + 'deg)';
			  }
			}
		  }
		  let nowPoint = marker.getLatLng();
		  let heading = this._getHeadingMarker(nowPoint, nextPoint);
		  let distance = this._GetDistance(nowPoint, nextPoint);
	
		  marker.setLatLng(nextPoint);
		  // Laporan.send("Bergerak dari posisi "+ prevPoint.lat +","+prevPoint.lng+ " bergerak ke posisi " + nextPoint.lat+","+nextPoint.lng, playerName, ObjectItem,nextPoint.lat,nextPoint.lng,Kecepatan,Health, 0);
		  this.fire(L.PixiOverlay.Event.Move, { layer: this, distance: distance, heading: heading }, false);
		}
	},

	_GetDistance(point1, point2) {
		var x2 = (point2.lng - point1.lng) * (point2.lng - point1.lng);
		var y2 = (point2.lat - point1.lat) * (point2.lat - point1.lat);
		var dtmp = x2 + y2;
		var d = Math.sqrt(dtmp);
		return d * 111; // return kilometer
	},

	_getHeadingMarker: function (point, nextPoint) {
		// get angle between two points
		var angleInDegrees = (Math.atan2(point.lat - nextPoint.lat, point.lng - nextPoint.lng) * 180) / Math.PI;
	
		// move heading north
		let ang = 180 + angleInDegrees;
		var sudut_arr = 0;
		if (ang == 0) {
		  sudut_arr = ang + 90;
		}
		if (ang > 0 && ang <= 90) {
		  sudut_arr = 90 - ang;
		}
		if (ang > 90 && ang <= 180) {
		  var a = ang - 90;
		  sudut_arr = 360 - a;
		}
		if (ang > 180 && ang <= 270) {
		  var a = ang - 180;
		  sudut_arr = 270 - a;
		}
		if (ang > 270 && ang < 360) {
		  var a = ang - 270;
		  sudut_arr = 180 - a;
		}
		if (ang == 360) {
		  sudut_arr = 90;
		}
		return sudut_arr;
	},

	_removeMarker: function (animEnded) {
		if (this.markerOptions && this.__marker) {
		  if (!animEnded || this.markerOptions.removeOnEnd) {
			this._map?.removeLayer(this.__marker);
		  }
		}
	},

	_initializeMarker: function () {
		if (this.markerOptions) {
		  this.__marker = L.marker(this._linePoints[0], this.markerOptions);
		}
	},

	changeIcon: function (markerOptions) {
		let marker = this.getMarker();
		this._map?.removeLayer(this.__marker);
		let prevPoint = marker.getLatLng();
		this.__marker = L.marker(prevPoint, markerOptions).addTo(map);
	},

	pixiStart: function () {
		if (this._map && !this.animation) {
		  if (!this.pixiOptions.duration) {
			if (this.pixiOptions.speed) {
			  this.pixiOptions.duration = L.PixiOverlay.Utils.getDuration(this._map, this._linePoints, this.pixiOptions.speed);
			} else {
			  this.pixiOptions.duration = 0;
			}
		  }
		  this.setLatLngs([]);
		  this._pixi(new Date().getTime());
		  this.fire(L.PixiOverlay.Event.Started, { layer: this }, false);
		}
		return this;
	},

	pixiStop: function (animEnded) {
		this.pixiPause();
		this.setLatLngs(this._linePoints);
		this.__ellapsedTime = null;
		this._removeMarker(animEnded);
		this.fire(L.PixiOverlay.Event.Ended, { layer: this }, false);
	
		return this;
	},

	pixiPause: function () {
		if (!this.animation) return this;
		
		L.Util.cancelAnimFrame(this.animation);
		this.animation = null;
		this.__ellapsedTime = new Date().getTime() - this._startTime;
		this.fire(L.PixiOverlay.Event.Paused, { 
			layer: this,
			time: this.__ellapsedTime 
		}, false);
		return this;
	},

	pixiResume: function () {
		if (this.animation || !this.__ellapsedTime) return this;

		// Calculate duration if needed
		if (!this.pixiOptions.duration && this.pixiOptions.speed) {
			this.pixiOptions.duration = L.PixiOverlay.Utils.getDuration(
				this._map, 
				this._linePoints, 
				this.pixiOptions.speed
			);
		}

		const currentTime = new Date().getTime();
		this._startTime = currentTime - this.__ellapsedTime;
		this._pixi(this.__ellapsedTime);
		
		this.fire(L.PixiOverlay.Event.Resumed, { 
			layer: this,
			time: this.__ellapsedTime 
		}, false);
		return this;
	},

	pixiToggle: function () {
		return this.animation ? this.pixiPause() : this.pixiResume();
	},

	pixiDuration: function (duration) {
		var prevDuration = this.pixiSpeed.duration;
		this.pixiOptions.duration = duration || 0;
	
		if (this.animation && prevDuration) {
		  this.pixiPause();
		  this.__ellapsedTime = this.__ellapsedTime * (prevDuration / duration);
		  this.pixiOptions.duration = duration;
		  this.pixiResume();
		}
		return this;
	},

	pixiSpeed: function (speed) {
		var prevSpeed = this.pixiOptions.speed;
		this.pixiOptions.speed = speed || 0;
	
		if (this.animation && prevSpeed) {
		  this.pixiPause();
		  this.__ellapsedTime = this.__ellapsedTime * (prevSpeed / speed);
		  this.pixiOptions.duration = L.PixiOverlay.Utils.getDuration(this._map, this._linePoints, this.pixiOptions.speed);
		  this.pixiResume();
		}
	
		return this;
	},

	getMarker: function () {
		return this.__marker;
	},
	
	getMarkers: function () {
		return [this.getMarker()];
	},

}
L.PixiOverlay.Layer = L.Polyline.extend(L.PixiOverlay.Animate);

L.pixiOverlay = function(latlngs, options, pixiOptions, markerOptions) {
	const app = new PIXI.Application({
		transparent: true,
		antialias: true
	});

	const overlay = new L.PixiOverlay.Layer(latlngs, {
		...options,
		renderer: app.renderer,
		container: app.stage
	}, pixiOptions, markerOptions);

	// Add PIXI specific methods
	overlay.addSprite = function(texture, x, y) {
		const sprite = new PIXI.Sprite(texture);
		sprite.position.set(x, y);
		this.options.container.addChild(sprite);
		return sprite;
	};

	overlay.addGraphics = function() {
		const graphics = new PIXI.Graphics();
		this.options.container.addChild(graphics);
		return graphics;
	};

	overlay.update = function() {
		this.options.renderer.render(this.options.container);
	};

	return overlay;
};
L.PixiOverlay.Utils = {

	toLatLng: function(input) {
        // Pastikan input selalu menjadi LatLng
        return L.latLng(input);
    },

	 // Interpolasi pada garis
	 interpolateOnLine: function(map, linePoints, ratio) {
        if (linePoints.length < 2) {
            throw new Error("Minimal 2 titik diperlukan untuk interpolasi");
        }

        // Cari segment yang tepat
        const totalDistance = this.calculateTotalDistance(linePoints);
        const targetDistance = totalDistance * ratio;
        
        let currentDistance = 0;
        for (let i = 0; i < linePoints.length - 1; i++) {
            const segmentDistance = this.getDistance(linePoints[i], linePoints[i+1]);
            
            if (currentDistance + segmentDistance >= targetDistance) {
                const segmentRatio = (targetDistance - currentDistance) / segmentDistance;
                return {
                    latLng: this.interpolateLatLng(linePoints[i], linePoints[i+1], segmentRatio),
                    predecessor: linePoints[i]
                };
            }
            
            currentDistance += segmentDistance;
        }

        // Jika ratio 1, kembalikan titik terakhir
        return {
            latLng: linePoints[linePoints.length - 1],
            predecessor: linePoints[linePoints.length - 2]
        };
    },

    interpolateLatLng: function(start, end, ratio) {
        return L.latLng(
            start.lat + (end.lat - start.lat) * ratio,
            start.lng + (end.lng - start.lng) * ratio
        );
    },

    calculateTotalDistance: function(points) {
        let totalDistance = 0;
        for (let i = 0; i < points.length - 1; i++) {
            totalDistance += this.getDistance(points[i], points[i+1]);
        }
        return totalDistance;
    },

    getDistance: function(point1, point2) {
        // Menggunakan Haversine formula untuk jarak yang lebih akurat
        const R = 6371; // Radius bumi dalam km
        const dLat = this.toRad(point2.lat - point1.lat);
        const dLon = this.toRad(point2.lng - point1.lng);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    },

    toRad: function(degrees) {
        return degrees * Math.PI / 180;
    },

    getDuration: function(map, points, speed) {
        const distance = this.calculateTotalDistance(points);
        return (distance / speed) * 3600 * 1000; // ms
    },


	// Add utility methods for coordinate conversion
	latLngToPixiPoint: function(map, latlng) {
		const point = map.latLngToContainerPoint(latlng);
		return new PIXI.Point(point.x, point.y);
	},

	// Add distance calculation in pixels
	getPixelDistance: function(map, latlng1, latlng2) {
		const p1 = map.latLngToContainerPoint(latlng1);
		const p2 = map.latLngToContainerPoint(latlng2);
		return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
	},

	// Add interpolation in pixel space
	interpolatePixiPoint: function(pointA, pointB, ratio) {
		return new PIXI.Point(
			pointA.x + (pointB.x - pointA.x) * ratio,
			pointA.y + (pointB.y - pointA.y) * ratio
		);
	}
};