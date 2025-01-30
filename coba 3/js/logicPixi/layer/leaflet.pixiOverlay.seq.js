L.PixiOverlay.Seq = L.PixiOverlay.Group.extend ({
	_activeLayer: null,

	/**
		Start first pixi in current group;
	*/
	pixiStart: function() {
		var layer = this.getFirstLayer();
		if (layer) {
			this.__prepareStart();
			layer.pixiStart();
			this.fire(L.PixiOverlay.Event.Started, {layer: this}, false);
		}

		return this;
	},

	/**
		Stops all pixi in current group;
	*/
	pixiStop: function() {
		this.invoke("pixiStop");
		this._activeLayer = null;
		this.fire(L.PixiOverlay.Event.Ended, {layer: this}, false);

		return this;
	},

	/**
		Pause current pixi in current group;
	*/
	pixiPause: function() {
		if (this._activeLayer) {
			this._activeLayer.pixiPause();
			this.fire(L.PixiOverlay.Event.Paused, {layer: this}, false);
		}

		return this;
	},

	/**
		Resume last pixi in current group;
	*/
	pixiResume: function() {
		if (this._activeLayer) {
			this._activeLayer.pixiResume();
			this.fire(L.PixiOverlay.Event.Resumed, {layer: this}, false);
		}

		return this;
	},

	/**
		Reset all pixi in current group;
	*/
	pixiToggle: function () {
		if (this._activeLayer) {
			this.pixiPause();
		} else {
			this.pixiResume();
		}

		return this;
	},

	getFirstLayer: function() {
		var allLayers = this.getLayers();
		return allLayers.length ? allLayers[0] : null;
	},

	__prepareStart: function() {
		var self = this;
		this.getLayers().forEach(function(l){
			l.setLatLngs([]);
			
			l.off(L.PixiOverlay.Event.Ended, self.__clearActiveLayer__, self);
			l.on(L.PixiOverlay.Event.Ended, self.__clearActiveLayer__, self);

			l.off(L.PixiOverlay.Event.Started, self.__putActiveLayer__, self);
			l.on(L.PixiOverlay.Event.Started, self.__putActiveLayer__, self);
		});
	},

	__clearActiveLayer__: function (e) {
		this._activeLayer = null;
		var layers = this.getLayers();
		var currentId = e.layer._leaflet_id;
		var currentObject = layers.filter(function(f){ return f._leaflet_id == currentId })[0];
		var nextIndex = layers.indexOf(currentObject) + 1;
		if (layers.length > nextIndex) {
			layers[nextIndex].pixiStart();
		} else {
			this.fire(L.PixiOverlay.Event.Ended, {layer: this}, false);
		}
	},

	__putActiveLayer__: function (e) {
		this._activeLayer = e.layer;
		this.fire(L.PixiOverlay.Event.Section, {layer: this._activeLayer}, false);
	}
});

L.pixiOverlay.seq = function(pixiOverlay, options){
    return new L.PixiOverlay.Seq(pixiOverlay, options);
};
