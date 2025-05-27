import { Movement } from './logic.js';
import { CONFIG } from './config.js';
import { SimulationManager } from './manage.js';

export function initializePixiOverlay(map) {
    const container = new PIXI.Container();
    container.visible = true;
    container.sortableChildren = true; 
    container.alpha = 1;

    const simulationManager = new SimulationManager();

    map.on('move', () => {
        simulationManager.onMapMove();
    });

    // Create control buttons
    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'simulation-controls';
    controlsDiv.innerHTML = `
        <button id="playBtn">Play</button>
        <button id="stopBtn">Stop</button>
        <button id="resumeBtn">Resume</button>
    `;
    document.body.appendChild(controlsDiv);

    // Add button event listeners
    document.getElementById('playBtn').addEventListener('click', () => simulationManager.play());
    document.getElementById('stopBtn').addEventListener('click', () => simulationManager.stop());
    document.getElementById('resumeBtn').addEventListener('click', () => simulationManager.resume());

    // Load all markers
    const loader = new PIXI.Loader();
    CONFIG.markerTypes.forEach(marker => {
        loader.add(marker, `./assets/${marker}`);
    });

    loader.load(() => {
         // Draw polylines for each route
         Object.keys(CONFIG.waypoints).forEach(route => {
            const waypoints = CONFIG.waypoints[route];
            
            // Create a Leaflet polyline from waypoints
            const polyline = L.polyline(waypoints, { color: 'red', weight: 0.5 });
            polyline.addTo(map); // Add the polyline to the map
        });


        // Create multiple objects with random markers and routes
        Object.keys(CONFIG.waypoints).forEach((route, index) => {
            const randomMarker = CONFIG.markerTypes[Math.floor(Math.random() * CONFIG.markerTypes.length)];
            const movement = new Movement(CONFIG.waypoints[route], CONFIG.initialSpeed, CONFIG.acceleration);
            const id = `Pesawat ${index}`;

            const marker = new PIXI.Sprite(loader.resources[randomMarker].texture);
            marker.anchor.set(0.5);
            marker.scale.set(0.01);
            marker.alpha = 1;
            marker.zIndex = index + 1;
            marker.visible = true;
            marker.interactive = true;
            marker.buttonMode = true;
            container.addChild(marker);

             // Add click event listener to each marker
            //  marker.interactive = true;
            //  marker.buttonMode = true;
 
             marker.on('pointerdown', function() {
                 // Menampilkan card kecil di bawah kiri
                 const card = document.getElementById("card");
                 card.style.display = "block";
 
                 // Mengubah konten card sesuai dengan data objek
                 const currentPosition = movement.getCurrentPosition();

                 const cardBody = card.querySelector(".card-body");
                 cardBody.innerHTML = `
                    <p><strong>Name:</strong> <span>${id}</span></p>
                    <p><strong>Speed:</strong> <span>${currentPosition.speed} km/h</span></p>
                    <p><strong>Altitude:</strong> <span>${currentPosition.altitude} m</span></p>
                    <p><strong>Fuel:</strong> <span>${currentPosition.fuel} kg</span></p>
                    <p><strong>Position:</strong> <span>Lat: ${currentPosition.lat}, <br> Lng: ${currentPosition.lng}</span></p>
                `;

             });

            // simulationManager.createObject(`object${index}`, movement, marker);
            simulationManager.createObject(id, movement, marker);

        });

        const pixiOverlay = L.pixiOverlay((utils) => {
            // Set utils container properties
            const utils_container = utils.getContainer();
            utils_container.visible = true;
            utils_container.alpha = 1;

            simulationManager.initialize(utils);
            
            // Force initial render
            utils.getRenderer().render(utils_container);
        }, container, {
            padding: 0,
            forceCanvas: false,
            preserveDrawingBuffer: true
        });

        pixiOverlay.addTo(map);
    });
}

