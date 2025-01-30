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
		if (!L.Motion.Utils.isFlat(this._linePoints)) {
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
		if (this.animation) {
		  L.Util.cancelAnimFrame(this.animation);
		  this.animation = null;
		  this.fire(L.PixiOverlay.Event.Paused, { layer: this }, false);
		}
	
		return this;
	},

	pixiResume: function () {
		if (!this.animation && this.__ellapsedTime) {
		  if (!this.pixiOptions.duration) {
			if (this.pixiOptions.speed) {
			  this.pixiOptions.duration = L.PixiOverlay.Utils.getDuration(this._map, this._linePoints, this.pixiOptions.speed);
			} else {
			  this.pixiOptions.duration = 0;
			}
		  }
		  this._pixi(new Date().getTime() - this.__ellapsedTime);
		  this.fire(L.PixiOverlay.Event.Resumed, { layer: this }, false);
		}
	
		return this;
	},

	pixiToggle: function () {
		if (this.animation) {
		  if (this.__ellapsedTime) {
			this.pixiPause();
		  }
		} else {
		  if (this.__ellapsedTime) {
			this.pixiResume();
		  } else {
			this.pixiStart();
		  }
		}
	
		return this;
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
