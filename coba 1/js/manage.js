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
        this.updateInitialPositions(); // Memperbarui posisi awal semua objek
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

    play() {
        if (!this.isPlaying && this.utils) {
            this.isPlaying = true;
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

        const deltaTime = 1 / CONFIG.frameRate;
        let allFinished = true;

        this.objects.forEach((obj) => {
            if (!obj.movement.hasReachedEnd()) {
                allFinished = false;
                const newPosition = obj.movement.updatePosition(deltaTime);
                const point = this.utils.latLngToLayerPoint([newPosition.lat, newPosition.lng]);
                obj.sprite.x = point.x;
                obj.sprite.y = point.y;
                obj.sprite.rotation = (newPosition.bearing * Math.PI) / 180;
                obj.sprite.visible = true;
            } else {
                // Ketika mencapai tujuan, tetap tampilkan objek
                obj.sprite.visible = true;
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