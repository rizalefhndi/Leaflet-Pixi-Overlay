import { Movement } from './logic.js';
import { CONFIG } from './config.js';

export function viewPergerakan(map) {
  map.getPane('mapPane').style.backgroundColor = '#333';

   // Create control buttons
   
   const controlsDiv = document.createElement('div');
   controlsDiv.className = 'simulation-controls';
   controlsDiv.innerHTML = `
	   <button id="playBtn">Play</button>
	   <button id="stopBtn">Stop</button>
	   <button id="resumeBtn">Resume</button>
   `;
   document.body.appendChild(controlsDiv);

   const randomRouteIndex = Math.floor(Math.random() * Object.keys(CONFIG.waypoints).length);
   const randomRoute = CONFIG.waypoints[`route${randomRouteIndex + 1}`];
   const aircraftMovement = new Movement(randomRoute, CONFIG.initialSpeed, CONFIG.acceleration);
   let aircraftLayer;

   document.getElementById('playBtn').addEventListener('click', () => aircraftMovement.startMovement());
   document.getElementById('stopBtn').addEventListener('click', () => aircraftMovement.pause());
   document.getElementById('resumeBtn').addEventListener('click', () => aircraftMovement.resume());

  function updateAircraftPosition() {
    const newPosition = aircraftMovement.moveAircraft();
    if (aircraftLayer) {
      aircraftLayer.setLatLng(newPosition);
    } else {
      const randomMarkerType = CONFIG.markerTypes[Math.floor(Math.random() * CONFIG.markerTypes.length)];
      const aircraftIcon = L.icon({
        iconUrl: `./assets/${randomMarkerType}`,
        iconSize: [32, 32],
      });
      aircraftLayer = L.marker([newPosition.lat, newPosition.lng], {
        icon: aircraftIcon,
        className: 'aircraft-marker',
      })
      .addTo(map)
      .setZIndexOffset(1);
    }
    requestAnimationFrame(updateAircraftPosition);
  }

  const aircraftMarkerStyle = document.createElement('style');
  aircraftMarkerStyle.innerHTML = `.aircraft-marker { filter: drop-shadow(0px 5px 5px rgba(0,0,0,1)); }`;
  document.head.appendChild(aircraftMarkerStyle);

  aircraftMovement.startMovement();
  updateAircraftPosition();
}