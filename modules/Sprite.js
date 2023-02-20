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

    spriteInfo() {
        return `pos (${this.pos.x}, ${this.pos.y}), rot ${this.rot}`;
        // console.log(`\t\t- Sprite [${this.id} at (${this.pos.x}, ${this.pos.y}) with rot ${this.rot}]`);
    }
}