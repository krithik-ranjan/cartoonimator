import { Keyframe } from "./Keyframe.js";

export const Scene = class {
    constructor(id, img) {
        this.id = id;
        this.sceneImg = new cv.Mat();
        img.copyTo(this.sceneImg);

        this.time = undefined;

        this.numKeyframes = 0;
        this.keyframes = [];
    }

    getNewKeyframeId() {
        let id = `kf${this.numKeyframes}`;
        this.numKeyframes++;

        return id;
    }

    getId() {
        return this.id;
    }

    updateImage(img) {
        img.copyTo(this.sceneImg);        
    }

    addKeyframe(id, sprites) {
        let i;
        for (i = 0; i < this.keyframes.length; i++) {
            if (this.keyframes[i].getId() === id) {
                this.keyframes[i].updateSprites(sprites);
                console.log(`\t[INFO] Updated keyframe [${id}]`)
                return;
            }
        }
        this.keyframes.push(new Keyframe(id, sprites));
        console.log(`\t[INFO] Added keyframe [${id}]`);
    }
}