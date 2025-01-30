L.PixiOverlay.Polygon = L.Polygon.extend(L.PixiOverlay.Animate);

L.pixiOverlay.polygon = function(latlngs, options, pixiOptions, markerOptions){
    return new L.PixiOverlay.Polygon(latlngs, options, pixiOptions, markerOptions);
};