import { Movement } from './logic.js';
import { CONFIG } from './config.js';

export function initializePixiOverlay(map) {
    const container = new PIXI.Container();
    const movement = new Movement(CONFIG.waypoints, CONFIG.initialSpeed, CONFIG.acceleration);

    const loader = new PIXI.Loader();
    loader.add('marker', './assets/marker2.png').load(() => {
        const marker = new PIXI.Sprite(loader.resources.marker.texture);
        marker.anchor.set(0.5); 
        marker.scale.set(0.04); 
        container.addChild(marker);

        const pixiOverlay = L.pixiOverlay((utils) => {
            const renderer = utils.getRenderer();
            const projection = utils.latLngToLayerPoint;

            function animate() {
                const deltaTime = 1 / CONFIG.frameRate;
                const newPosition = movement.updatePosition(deltaTime);

                if (movement.hasReachedEnd()) {
                    console.log("Sampaiiiiii!");
                    return;
                }

                const newPoint = projection([newPosition.lat, newPosition.lng]);
                marker.x = newPoint.x;
                marker.y = newPoint.y;

                // Set rotasi marker
                marker.rotation = (newPosition.bearing * Math.PI) / 180;

                renderer.render(container);
                requestAnimationFrame(animate);
            }

            animate();
        }, container);

        pixiOverlay.addTo(map);
    });
}
