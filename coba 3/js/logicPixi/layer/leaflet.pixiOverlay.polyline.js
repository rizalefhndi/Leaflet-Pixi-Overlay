L.PixiOverlay.Polyline = L.Polyline.extend(L.PixiOverlay.Animate);

L.pixiOverlay.polyline = function(latlngs, options, pixiOptions, markerOptions){
    return new L.PixiOverlay.Polyline(latlngs, options, pixiOptions, markerOptions);
};
