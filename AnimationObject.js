class AnimationObject {
    constructor(id) {
        console.log(`Creating object [${id}]`);
        this.id = id;
        // this.forms = new Map();
        this.transition = [];
    }

    addObjectInstance(objectImg, position, rotation, size, timestamp) {
        // console.log(`Adding instance of object [${this.id}] at time ${timestamp} at pos: (${position.x}, ${position.y}) with rotation: ${rotation} and size: ${size}`);
        // this.transition.push({time: timestamp, img: objectImg.clone(), pos: position, rot: rotation, size: size});

        // TODO: Add sorted insert for object transitions
        if (this.transition.length === 0) {
            this.transition.push({time: timestamp, img: objectImg.clone(), pos: position, rot: rotation, size: size});
        }
        else {
            let i;
            for (i = 0; i < this.transition.length; i++) {
                if (this.transition[i].time > timestamp) break;
            }
            console.log(`Adding instance of object [${this.id}] at time ${timestamp} at pos: (${position.x}, ${position.y}) with rotation: ${rotation} and size: ${size} at index: ${i}`);
            this.transition.splice(i, 0, {time: timestamp, img: objectImg.clone(), pos: position, rot: rotation, size: size});
        }
    }

    removeObjectInstance(timestamp) {
        let i; 
        for (i = 0; i < this.transition.length; i++) {
            if (this.transition[i].time === timestamp) {
                console.log(`[Object ${this.id}] Deleting instance at time ${timestamp}`);
                this.transition.splice(i, 1);
                break;
            }
        }
    }

    _putImageData(frame, img, pos) {
        // let objImageData = new ImageData(new Uint8ClampedArray(img.data), 
        //                     img.cols,
        //                     img.rows);

        // context.putImageData(objImageData, pos.x, pos.y);
        console.log(`\t\t\t Putting object at ${pos.x}, ${pos.y}`);
        for (let i = 0; i < img.rows; i++) {
            for (let j = 0; j < img.cols; j++) {
                if (img.ucharPtr(i, j)[3] === 255) {
                    frame.ucharPtr(i + pos.y, j + pos.x)[0] = img.ucharPtr(i, j)[0];
                    frame.ucharPtr(i + pos.y, j + pos.x)[1] = img.ucharPtr(i, j)[1];
                    frame.ucharPtr(i + pos.y, j + pos.x)[2] = img.ucharPtr(i, j)[2];
                }
            }
        }
    }

    _findIntermediatePos(idx1, idx2, timestamp) {
        let spX = (this.transition[idx2].pos.x - this.transition[idx1].pos.x) / (this.transition[idx2].time - this.transition[idx1].time);
        let spY = (this.transition[idx2].pos.y - this.transition[idx1].pos.y) / (this.transition[idx2].time - this.transition[idx1].time);
        
        let currX = this.transition[idx1].pos.x + spX * (timestamp - this.transition[idx1].time);
        let currY = this.transition[idx1].pos.y + spY * (timestamp - this.transition[idx1].time);

        // console.log(`Sp X: ${spX}, Sp Y: ${spY}`);
        // console.log(`X: ${currX}, Y: ${currY}`);
        // console.log(`X: ${this.transition[idx1].pos.x}, Y: ${this.transition[idx1].pos.y}`);
        
        return new cv.Point(currX, currY);
    }

    _findIntermediateRot(idx1, idx2, timestamp) {
        let spTheta = (this.transition[idx2].rot - this.transition[idx1].rot) / (this.transition[idx2].time - this.transition[idx1].time);

        return (-1) * spTheta * (timestamp - this.transition[idx1].time);
    }

    putObjectInFrame(timestamp, frame) {
        console.log(`\tObject: ${this.id}`);
        if (timestamp < this.transition[0].time || timestamp > this.transition[this.transition.length - 1].time)
            return;

        if (timestamp === this.transition[0].time) {
            console.log(`\t\tImage ${0} at position: (${this.transition[0].pos.x}, ${this.transition[0].pos.y})`);
            this._putImageData(frame, this.transition[0].img, this.transition[0].pos);
            return;
        }

        let i;
        for (i = 1; i < this.transition.length; i++) {
            if (timestamp === this.transition[i].time) {
                console.log(`\t\tImage ${i} at position: (${this.transition[i].pos.x}, ${this.transition[i].pos.y})`);
                this._putImageData(frame, this.transition[i].img, this.transition[i].pos);
                break;
            }
            else if (timestamp < this.transition[i].time) {
                let currPos = this._findIntermediatePos(i-1, i, timestamp);
                let currRot = this._findIntermediateRot(i-1, i, timestamp);

                console.log(`\t\tImage ${i-1} at position: (${currPos.x}, ${currPos.y}) with rotation ${currRot}`);

                // Rotate object image
                let center = new cv.Point((this.transition[i-1].size) / 2, (this.transition[i-1].size) / 2);
                let M = cv.getRotationMatrix2D(center, currRot, 1);
                console.log(`### Rotating ${currRot} from (${center.x}, ${center.y})`);
                let dst = new cv.Mat();
                let dsize = new cv.Size(this.transition[i-1].img.rows, this.transition[i-1].img.cols);

                cv.warpAffine(this.transition[i-1].img, dst, M, dsize, cv.INTER_LINEAR);

                // Put onto context 
                this._putImageData(frame, dst, currPos);
                dst.delete();

                break;
            }
        }
    }

}
