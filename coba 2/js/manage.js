import { CONFIG } from './config.js';

export class SimulationManager {
    constructor() {
        this.objects = new Map();
        this.isPlaying = false;
        this.animationFrameId = null;
        this.utils = null;
        this.initialized = false;
    }

    initialize(utils) {
        this.utils = utils;
        this.initialized = true;
        const container = utils.getContainer();
        container.visible = true;
        
        this.objects.forEach((obj) => {
            obj.sprite.visible = true;
            obj.sprite.alpha = 1;
            if (!container.children.includes(obj.sprite)) {
                container.addChild(obj.sprite);
            }
         });
    
        this.updateInitialPositions();
        utils.getRenderer().render(container);
    }

    createObject(id, movement, sprite) {
        this.objects.set(id, { movement, sprite });
        if (this.initialized) {
            this.updateObjectPosition(id); // Update posisi jika utils sudah tersedia
        }
    }

    updateInitialPositions() {
        this.objects.forEach((obj, id) => {
            this.updateObjectPosition(id);
        });
    }

    updateObjectPosition(id) {
        const obj = this.objects.get(id);
        if (obj && this.utils) {
            const currentPos = obj.movement.getCurrentPosition();
            const point = this.utils.latLngToLayerPoint([currentPos.lat, currentPos.lng]);
            obj.sprite.x = point.x;
            obj.sprite.y = point.y;
            obj.sprite.rotation = (currentPos.bearing * Math.PI) / 180;
            this.utils.getRenderer().render(this.utils.getContainer());
        }
    }

    onMapMove() {
        if (this.utils) {
            this.objects.forEach((obj, id) => {
                this.updateObjectPosition(id);
            });
        }
    }

    ensureVisibility() {
        if (this.utils) {
            this.utils.getContainer().visible = true;
            this.objects.forEach((obj) => {
                obj.sprite.visible = true;
            });
            this.utils.getRenderer().render(this.utils.getContainer());
        }
    }

    play() {
        if (!this.isPlaying && this.utils) {
            this.isPlaying = true;
            this.ensureVisibility();
            this.forceRender();
            this.objects.forEach(({ movement }) => {
                movement.resume();
            });
            this.animate();
        }
    }
    
    stop() {
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.objects.forEach(({ movement, sprite }) => {
                movement.pause();
                sprite.visible = true;
                sprite.alpha = 1;
            });
            const container = this.utils.getContainer();
            container.visible = true;
            this.utils.getRenderer().render(container);
        }
    }

    resume() {
        if (!this.isPlaying && this.utils) {
            this.isPlaying = true;
            this.ensureVisibility();
            this.forceRender();
            this.objects.forEach(({ movement }) => {
                movement.resume();
            });
            this.animate();
        }
    }

    forceRender() {
        if (this.utils) {
            const container = this.utils.getContainer();
            container.visible = true;
            container.alpha = 1;
            
            this.objects.forEach((obj) => {
                obj.sprite.visible = true;
                obj.sprite.alpha = 1;
            });
            
            this.utils.getRenderer().render(container);
        }
    }

    animate() {
        if (!this.isPlaying || !this.utils) return;
    
        const deltaTime = 1 / CONFIG.frameRate;
        let allFinished = true;
    
        // Ambil dan set container
        const container = this.utils.getContainer();
        const renderer = this.utils.getRenderer();
        
        // Pastikan container visible
        container.visible = true;
        container.alpha = 1;
    
        // Update semua objek
        this.objects.forEach((obj, id) => {
            // Reset sprite properties
            obj.sprite.visible = true;
            obj.sprite.alpha = 1;
            
            if (!obj.movement.hasReachedEnd()) {
                allFinished = false;
                
                // Update posisi
                const newPosition = obj.movement.updatePosition(deltaTime);
                const point = this.utils.latLngToLayerPoint([newPosition.lat, newPosition.lng]);
                
                // Set posisi sprite
                obj.sprite.position.set(point.x, point.y);
                obj.sprite.rotation = (newPosition.bearing * Math.PI) / 180;
                
                // Update card jika perlu
                this.updateCard(id);
            }
        });
    
        // Render ulang
        renderer.render(container);
    
        if (!allFinished) {
            this.animationFrameId = requestAnimationFrame(() => this.animate());
        } else {
            this.stop();
        }
    }

    updateCard(id) {
        const obj = this.objects.get(id);
        if (obj) {
            const currentPosition = obj.movement.getCurrentPosition();
            const card = document.getElementById("card");
            if (card.style.display === "block") {
                const cardBody = card.querySelector(".card-body");
                cardBody.innerHTML = `
                    <p><strong>Name:</strong> <span>${id.replace('object', '')}</span></p>
                    <p><strong>Speed:</strong> <span>${currentPosition.speed.toFixed(2)} km/h</span></p>
                    <p><strong>Altitude:</strong> <span>${currentPosition.altitude.toFixed(2)} m</span></p>
                    <p><strong>Fuel:</strong> <span>${currentPosition.fuel} kg</span></p>
                    <p><strong>Position:</strong> <span>Lat: ${currentPosition.lat.toFixed(6)}, <br> Lng: ${currentPosition.lng.toFixed(6)}</span></p>
                `;
            }
        } else {
            console.error(`Object with id "${id}" not found.`);
        }
    }

}