import { ObjectPergerakan } from './logic.js';
import { CONFIG } from './config.js';

function viewPergerakan(map) {
  const objectsPergerakan = [];

  // Tambahkan kontrol simulasi ke peta
  const controlsDiv = document.createElement('div');
  controlsDiv.className = 'simulation-controls';
  controlsDiv.innerHTML = `
    <button id="play-btn">Play/Pause</button>
    <button id="stop-btn">Stop</button>
  `;
  map.getContainer().appendChild(controlsDiv);

  CONFIG.waypoints.forEach((route, index) => {
    const objectPergerakan = new ObjectPergerakan(map, route);
    
    objectPergerakan.setObjectPergerakan();
    objectsPergerakan.push(objectPergerakan);
  });

  const playBtn = document.getElementById('play-btn');
  const stopBtn = document.getElementById('stop-btn');

  let isPlaying = false;

  playBtn.addEventListener('click', () => {
    if (!isPlaying) {
      objectsPergerakan.forEach(obj => obj.mediaStart());
      isPlaying = true;
      playBtn.textContent = 'Pause';
    } else {
      objectsPergerakan.forEach(obj => obj.mediaPause());
      isPlaying = false;
      playBtn.textContent = 'Play';
    }
  });

  stopBtn.addEventListener('click', () => {
    objectsPergerakan.forEach(obj => obj.mediaStop());
    isPlaying = false;
    playBtn.textContent = 'Play';
  });
}

export { viewPergerakan };