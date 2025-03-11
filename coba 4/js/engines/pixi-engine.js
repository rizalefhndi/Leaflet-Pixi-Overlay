import { CONFIG } from '../config.js';
import { Movement } from '../logic.js';

export class PixiEngine {
    constructor(container) {
        this.container = container;
        this.objects = new Map();
        this.utils = null;
        this.isPlaying = false;
        this.animationFrameId = null;
    }

    initialize(utils) {
        this.utils = utils;
        this.container.visible = true;
        this.container.sortableChildren = true;
    }

    addObject(id, waypoints, texture) {
        // Create sprite
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.scale.set(0.01);
        sprite.alpha = 100; // Make sure sprite is visible
        sprite.visible = true;
        
        // Set zIndex to ensure visibility
        sprite.zIndex = 1;
        // console.log("Sprite added to container:", sprite);
        // Create movement object
        const movement = new Movement(waypoints);
        
        // Set engine characteristics
        movement.setCharacteristics(CONFIG.engineTypes.pixi.characteristics);
        
        // Add to collection
        this.objects.set(id, { 
            movement, 
            sprite,
            engineType: 'pixi' 
        });
        
        // Add to container
        this.container.addChild(sprite);
        
        // Initial position
        if (this.utils) {
            const currentPos = waypoints.route[0];
            const point = this.utils.latLngToLayerPoint(currentPos);
            sprite.position.set(point.x, point.y);
            console.log("Initial sprite position:", sprite.position); // Pastikan ini muncul di konsol
        }
        
        // Add click handler
        sprite.interactive = true;
        sprite.buttonMode = true;
        sprite.on('pointerdown', () => this.showInfoCard(id));
        
        return sprite;
    }

    showInfoCard(id) {
        const obj = this.objects.get(id);
        if (obj) {
            const card = document.getElementById("card");
            if (!card) return;
            
            card.style.display = "block";
            const currentPosition = obj.movement.getCurrentPosition();
            
            const cardBody = card.querySelector(".card-body");
            cardBody.innerHTML = `
                <div class="modern-aircraft">
                    <p><strong>Type:</strong> <span>Modern Aircraft</span></p>
                    <p><strong>ID:</strong> <span>${id}</span></p>
                    <p><strong>Speed:</strong> <span>${currentPosition.speed.toFixed(2)} km/h</span></p>
                    <p><strong>Altitude:</strong> <span>${currentPosition.altitude.toFixed(2)} m</span></p>
                    <p><strong>Fuel:</strong> <span>${currentPosition.fuel} kg</span></p>
                    <p><strong>Position:</strong> <span>Lat: ${currentPosition.lat.toFixed(6)}, <br> Lng: ${currentPosition.lng.toFixed(6)}</span></p>
                </div>
            `;
        }
    }

    updateObjectPosition(id) {
        const obj = this.objects.get(id);
        if (obj && this.utils) {
            const currentPos = obj.movement.getCurrentPosition();
            const point = this.utils.latLngToLayerPoint([currentPos.lat, currentPos.lng]);
            obj.sprite.x = point.x;
            obj.sprite.y = point.y;
            obj.sprite.rotation = (currentPos.bearing * Math.PI) / 180;
        }
    }

    onMapMove() {
        if (this.utils) {
            this.objects.forEach((obj, id) => {
                this.updateObjectPosition(id);
            });
        }
    }

    play() {
        if (!this.isPlaying && this.utils) {
            this.isPlaying = true;
            this.animate();
        }
    }
    
    stop() {
        this.isPlaying = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.objects.forEach(({ movement }) => {
                movement.pause();
            });
        }
    }

    resume() {
        if (!this.isPlaying && this.utils) {
            this.isPlaying = true;
            this.objects.forEach(({ movement }) => {
                movement.resume();
            });
            this.animate();
        }
    }

    animate() {
        if (!this.isPlaying || !this.utils) return;
        // console.log("Animating PIXI objects"); // Pastikan ini muncul di konsol

        const deltaTime = 1 / CONFIG.frameRate;
        let allFinished = true;
    
        this.objects.forEach((obj, id) => {
            if (!obj.movement.hasReachedEnd()) {
                allFinished = false;
                const newPosition = obj.movement.updatePosition(deltaTime);
                const point = this.utils.latLngToLayerPoint([newPosition.lat, newPosition.lng]);
                obj.sprite.position.set(point.x, point.y);
                obj.sprite.rotation = (newPosition.bearing * Math.PI) / 180;
                // console.log("Updating sprite position:", obj.sprite.position);
            }
        });
    
        this.utils.getRenderer().render(this.utils.getContainer());
    
        if (!allFinished) {
            this.animationFrameId = requestAnimationFrame(() => this.animate());
        } else {
            this.stop();
        }
    }
}