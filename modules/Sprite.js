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

    addIntermediateToFrame(frame, nextSprite, currTime, thisTime, nextTime) {
        // Find intermediate position
        let spX = (nextSprite.pos.x - this.pos.x) / (nextTime - thisTime);
        let spY = (nextSprite.pos.y - this.pos.y) / (nextTime - thisTime);

        let currX = this.pos.x + spX * (currTime - thisTime);
        let currY = this.pos.y + spY * (currTime - thisTime);

        let spTheta = (nextSprite.rot - this.rot) / (nextTime - thisTime);
        let currRot = (-1) * spTheta * (currTime - thisTime);

        // Testing size interpolation
        let spSize = (nextSprite.size - this.size) / (nextTime - thisTime);
        let currSize = spSize * (currTime - thisTime) + this.size;

        console.log(`\t\t [DEBUG] Putting intermediate sprite at ${this.pos.x}, ${this.pos.y} with rot ${this.rot}`);

        // Rotate object image
        let center = new cv.Point((this.size / 2), (this.size / 2));
        let M = cv.getRotationMatrix2D(center, currRot, 1);
        let dst = new cv.Mat();
        
        // console.log(`\t\t\t [TEST] currSize: ${currSize}, while img size: (${this.img.rows}, ${this.img.cols})`); 
        // let dsize = new cv.Size(currSize, currSize);

        let dsize = new cv.Size(this.img.rows, this.img.cols);
        cv.warpAffine(this.img, dst, M, dsize, cv.INTER_LINEAR);

        let newSize = new cv.Size(currSize, currSize);
        cv.resize(dst, dst, newSize, 0, 0, cv.INTER_AREA);

        // Put onto context
        for (let i = 0; i < dst.rows; i++) {
            for (let j = 0; j < dst.cols; j++) {
                if (dst.ucharPtr(i, j)[3] === 255) {
                    frame.ucharPtr(i + currY, j + currX)[0] = dst.ucharPtr(i, j)[0];
                    frame.ucharPtr(i + currY, j + currX)[1] = dst.ucharPtr(i, j)[1];
                    frame.ucharPtr(i + currY, j + currX)[2] = dst.ucharPtr(i, j)[2];
                }
            }
        }

        dst.delete();
    }

    addToFrame(frame) {
        console.log(`\t\t [DEBUG] Putting sprite at ${this.pos.x}, ${this.pos.y}`);
        for (let i = 0; i < this.img.rows; i++) {
            for (let j = 0; j < this.img.cols; j++) {
                if (this.img.ucharPtr(i, j)[3] === 255) {
                    frame.ucharPtr(i + this.pos.y, j + this.pos.x)[0] = this.img.ucharPtr(i, j)[0];
                    frame.ucharPtr(i + this.pos.y, j + this.pos.x)[1] = this.img.ucharPtr(i, j)[1];
                    frame.ucharPtr(i + this.pos.y, j + this.pos.x)[2] = this.img.ucharPtr(i, j)[2];
                }
            }
        }
    }
}