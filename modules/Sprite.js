export const Sprite = class {
    constructor(position, rotation, size, spriteImg) {
        this.pos = position;
        this.rot = rotation; 
        this.size = size;
        this.img = spriteImg.clone();
    }

    deleteSprite() {
        this.img.delete();
    }
}