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
}