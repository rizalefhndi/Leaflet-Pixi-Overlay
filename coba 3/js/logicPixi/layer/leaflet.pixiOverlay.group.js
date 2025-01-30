L.PixiOverlay.Group = L.FeatureGroup.extend ({
	options: {
		pane: L.PixiOverlay.Animate.options.pane,
		attribution: L.PixiOverlay.Animate.options.attribution,
	},

	/**
		Starts all pixi in current group;
	*/
	pixiStart: function () {
		this.invoke("pixiStart");
		this.fire(L.PixiOverlay.Event.Started, {layer: this}, false);
		return this;
	},

	/**
		Stops all pixi in current group;
	*/
	pixiStop: function () {
		this.invoke("pixiStop");
		this.fire(L.PixiOverlay.Event.Ended, {layer: this}, false);
		return this;
	},

	/**
		Pauses all pixi in current group;
	*/
	pixiPause: function () {
		this.invoke("pixiPause");
		this.fire(L.PixiOverlay.Event.Paused, {layer: this}, false);
		return this;
	},

	/**
		Reset all pixi in current group;
	*/
	pixiResume: function () {
		this.invoke("pixiResume");
		this.fire(L.PixiOverlay.Event.Resumed, {layer: this}, false);
		return this;
	},

	/**
		Reset all pixi in current group;
	*/
	pixiToggle: function () {
		this.invoke("pixiToggle");
		return this;
	},

	/**
		Returns markers array from all inner layers without flattering.
	*/
	getMarkers: function () {
		return this.getLayers().map(function(l) { return l.getMarkers(); });
	}
});

L.pixiOverlay.group = function(pixiOverlays, options){
    return new L.PixiOverlay.Group(pixiOverlays, options);
};
