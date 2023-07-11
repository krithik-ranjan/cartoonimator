import { Sprite } from "./Sprite.js";

export const Keyframe = class {
    constructor(id, sprites) {
        this.id = id;
        this.sprites = sprites;

        this.time = undefined;
    }

    getJSON() {
        let jsonObj = {
            id: this.id,
            time: this.time
        }

        return jsonObj;
    }

    getId() {
        return this.id;
    }

    getTime() {
        return this.time;
    }

    updateSprites(sprites) {
        // let i;
        // for (i = 0; i < this.sprites.length; i++) 
        //     this.sprites[i].deleteSprite();
        for (let sprite of this.sprites.values())
            sprite.deleteSprite();
        this.sprites = sprites;
    }

    updateTimestamp(newTime) {
        this.time = newTime;

        console.log(`[DEBUG] Updated timestamp of keyframe [${this.id}] to ${this.time}`);
    }

    clearKeyframe() {
        // let i;
        // for (i = 0; i < this.sprites.length; i++) 
        //     this.sprites[i].deleteSprite();
        for (let sprite of this.sprites.values())
            sprite.deleteSprite();
    }

    printKeyframeInfo() {
        console.log(`\t- Keyframe [${this.id}] at time ${this.time}`);
        for (let [id, sprite] of this.sprites.entries()) {
            console.log(`\t\t- Sprite [${id}]: ${sprite.spriteInfo()}`);
        }
    }

    animateThisKeyframe(frameImg) {
        for (let sprite of this.sprites.values()) {
            sprite.addToFrame(frameImg);
        } 
    }

    animateIntermediateKeyframe(frameImg, nextKeyframe, currTime) {
        for (let [id, sprite] of this.sprites.entries()) {
            // Check if this sprite is in next keyframe 
            if (nextKeyframe.sprites.has(id)) {
                console.log(`[DEBUG] Finding intermediate for sprite [${id}] between ${this.id} and ${nextKeyframe.id}`);

                sprite.addIntermediateToFrame(frameImg, nextKeyframe.sprites.get(id), currTime, this.time, nextKeyframe.time);
            }
        }
        
        
        return;
    }
}