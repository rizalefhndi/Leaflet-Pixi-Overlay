// js/view.js
import { EngineController } from './core/engineController.js';
import { CONFIG } from './config.js';

export function initializePixiOverlay(map) {
    const engineController = new EngineController(map);

    // Create enhanced control panel
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'simulation-controls';
    controlsDiv.innerHTML = `
        <div class="control-group">
            <h4>Simulation Control</h4>
            <div class="engine-types">
                <div class="pixi-info">Modern Aircraft | Pixi</div>
                <div class="motion-info">Classic Aircraft | Motion</div>
            </div>
            <div class="control-buttons">
                <button id="playBtn">Play All</button>
                <button id="stopBtn">Stop All</button>
                <button id="resumeBtn">Resume All</button>
            </div>
        </div>
    `;
    document.body.appendChild(controlsDiv);

    // Event listeners for controls
    setupEventListeners(engineController);

    // Load markers
    const loader = new PIXI.Loader();
    [...CONFIG.engineTypes.pixi.markers, ...CONFIG.engineTypes.motion.markers].forEach(marker => {
        loader.add(marker, `./assets/${marker}`);
    });

    loader.load(() => {
        // console.log("Assets loaded successfully");
        // Create objects for each route
        Object.keys(CONFIG.waypoints).forEach((route, index) => {
            const waypoints = CONFIG.waypoints[route];
            
            // Select appropriate marker based on engine type
            const engineType = waypoints.engineType;
            const markerPool = CONFIG.engineTypes[engineType].markers;
            const randomMarker = markerPool[Math.floor(Math.random() * markerPool.length)];

            // Pastikan texture valid
            const texture = loader.resources[randomMarker].texture;
            if (!texture) {
                console.error("Texture not found for marker:", randomMarker);
                return;
            }

            // Create object with appropriate engine
            engineController.createObject(`Aircraft_${index}`, {
                ...waypoints,
                marker: randomMarker
            }, texture);
        });

        setupPixiOverlay(map, engineController);
        setupInfoCard();
    });
}

function setupEventListeners(engineController) {
    document.getElementById('playBtn').addEventListener('click', () => engineController.play());
    document.getElementById('stopBtn').addEventListener('click', () => engineController.stop());
    document.getElementById('resumeBtn').addEventListener('click', () => engineController.resume());
}

function setupPixiOverlay(map, engineController) {
    const pixiOverlay = L.pixiOverlay((utils) => {
        // console.log("PIXI Overlay initialized", utils); // Pastikan ini muncul di konsol

        engineController.initialize(utils);
    }, new PIXI.Container(), {
        padding: 0,
        forceCanvas: false,
        preserveDrawingBuffer: true
    });

    pixiOverlay.addTo(map);

    // Handle map movement
    map.on('move', () => engineController.onMapMove());
    map.on('zoom', () => engineController.onMapMove());
    // console.log("PixiOverlay added to map");

}

function setupInfoCard() {
    const card = document.createElement('div');
    card.id = 'card';
    card.className = 'card';
    card.style.display = 'none';
    card.innerHTML = `
        <div class="card-header">
            <h5>Aircraft Details</h5>
        </div>
        <div class="card-body"></div>
    `;
    document.body.appendChild(card);
}