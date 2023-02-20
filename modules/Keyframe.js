import { Sprite } from "./Sprite.js";

export const Keyframe = class {
    constructor(id, sprites) {
        this.id = id;
        this.sprites = sprites;

        this.time = undefined;
    }

    getId() {
        return this.id;
    }

    updateSprites(sprites) {
        let i;
        for (i = 0; i < this.sprites.length; i++) 
            this.sprites[i].deleteSprite();
        this.sprites = sprites;
    }

    updateTimestamp(newTime) {
        this.time = newTime;

        console.log(`[DEBUG] Updated timestamp of keyframe [${this.id}] to ${this.time}`);
    }

    clearKeyframe() {
        let i;
        for (i = 0; i < this.sprites.length; i++) 
            this.sprites[i].deleteSprite();
    }

    printKeyframeInfo() {
        console.log(`\t- Keyframe [${this.id}] at time ${this.time}`);
        for (let [id, sprite] of this.sprites.entries()) {
            console.log(`\t\t- Sprite [${id}]: ${sprite.spriteInfo()}`);
        }
    }
}