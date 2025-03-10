import { PixiEngine } from '../engines/pixi-engine.js';
import { MotionEngine } from '../engines/motion-engine.js';
import { CONFIG } from '../config.js';

export class EngineController {
    constructor(map) {
        this.map = map;
        this.pixiContainer = new PIXI.Container();
        this.pixiEngine = new PixiEngine(this.pixiContainer);
        this.motionEngine = new MotionEngine(map);
        this.utils = null;
    }

    initialize(utils) {
        this.utils = utils;
        // Make sure container is added to utils container
        const pixiContainer = utils.getContainer();
        pixiContainer.addChild(this.pixiContainer);
        
        // console.log("Engine controller initialized:", {
        //     utils,
        //     pixiContainer: this.pixiContainer
        // });
    
        this.pixiEngine.initialize(utils);
        this.motionEngine.initialize();
    }

    createObject(id, waypoints, texture) {
        const engineType = waypoints.engineType || this.determineEngineType(waypoints);
        
        if (engineType === 'pixi') {
            this.pixiEngine.addObject(id, waypoints, texture);
        } else {
            this.motionEngine.addObject(id, waypoints, {
                icon: this.createMotionIcon(waypoints.marker)
            });
        }
    }

    determineEngineType(waypoints) {
        // Use the engine type specified in the waypoints, or determine based on marker
        if (waypoints.engineType) {
            return waypoints.engineType;
        }
        
        // If not specified, check marker
        const marker = waypoints.marker;
        if (CONFIG.engineTypes.pixi.markers.includes(marker)) {
            return 'pixi';
        }
        if (CONFIG.engineTypes.motion.markers.includes(marker)) {
            return 'motion';
        }
        
        // If still can't determine, use complexity
        return waypoints.complexity > 45 ? 'pixi' : 'motion';
    }

    createMotionIcon(markerPath) {
        return L.divIcon({
            html: `<div class="motion-marker">
                    <img src="./assets/${markerPath}" width="20" height="20">
                    <div class="marker-label">Motion</div>
                  </div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            className: 'motion-custom-icon'
        });
    }

    play() {
        this.pixiEngine.play();
        this.motionEngine.play();
    }

    stop() {
        this.pixiEngine.stop();
        this.motionEngine.stop();
    }

    resume() {
        this.pixiEngine.resume();
        this.motionEngine.resume();
    }

    onMapMove() {
        this.pixiEngine.onMapMove();
        this.motionEngine.onMapMove();
    }
}