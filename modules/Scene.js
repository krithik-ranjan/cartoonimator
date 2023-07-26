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

    getJSON() {
        let kfArr = [];
        for (let i = 0; i < this.keyframes.length; i++) {
            kfArr.push(this.keyframes[i].getJSON());
        }

        let jsonObj = {
            id: this.id,
            time: this.time,
            numKeyframes: this.numKeyframes,
            keyframes: kfArr
        }

        return jsonObj;
    }

    getNewKeyframeId() {
        let id = `kf${this.numKeyframes}`;
        this.numKeyframes++;

        return id;
    }

    getLastTimestamp() {
        if (this.keyframes.length === 0) return this.time;
        return this.keyframes[this.keyframes.length - 1].getTime();

        // let lastTimestamp = this.time;

        // let i; 
        // for (i = 0; i < this.keyframes.length; i++) {
        //     if (this.keyframes[i].time !== undefined && this.keyframes[i].time > lastTimestamp)
        //         lastTimestamp = this.keyframes[i].time;
        // }

        // return lastTimestamp;
    }

    getId() {
        return this.id;
    }

    getTime() {
        return this.time;
    }

    updateImage(img) {
        img.copyTo(this.sceneImg);        
    }

    updateTimestamp(newTime) {
        this.time = newTime;

        // console.log(`[DEBUG] Updated timestamp of scene [${this.id}] to ${this.time}`);
    }

    updateKeyframeTimestamp(id, newTime) {
        let i;
        for (i = 0; i < this.keyframes.length; i++) {
            if (this.keyframes[i].getId() === id) {
                if (this.keyframes[i].getTime() === this.time) {
                    console.log(`[DEBUG] Updating [${this.id}] starting time to ${newTime}`);
                    this.time = newTime;
                }
                this.keyframes[i].updateTimestamp(newTime);
            }
        }
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
        console.log(`\t[INFO] Added keyframe [${id}] with sprites:`);
        for (const sprite of sprites.keys()) console.log(`\t\t${sprite}`);

        this.keyframes.push(new Keyframe(id, sprites));
    }

    clearScene() {
        this.sceneImg.delete();

        let i;
        for (i = 0; i < this.keyframes.length; i++) {
            this.keyframes[i].clearKeyframe();
        }
    }

    deleteKeyframe(id) {
        let i;
        for (i = 0; i < this.keyframes.length; i++) {
            if (this.keyframes[i].getId() === id) {
                this.keyframes[i].clearKeyframe();
                this.keyframes.splice(i, 1);
                break;
            }
        }

        console.log(`[DEBUG] Deleted keyframe ${id} of ${this.id}, current number of kfs: ${this.keyframes.length}`);
    }

    printSceneInfo() {
        console.log(`- Scene [${this.id}] at time ${this.time}`);
        let i;
        for (i = 0; i < this.keyframes.length; i++) {
            this.keyframes[i].printKeyframeInfo();
        }
    }

    animateScene(frameImg, timestamp) {
        this.sceneImg.copyTo(frameImg);

        let i;
        for (i = 0; i < this.keyframes.length - 1; i++) {
            console.log(`\t\t[DEBUG] Frame at ${timestamp} (${this.keyframes[i].getId()})`);
            if (this.keyframes[i].getTime() === timestamp) this.keyframes[i].animateThisKeyframe(frameImg);
            else if (this.keyframes[i].getTime() < timestamp && timestamp < this.keyframes[i+1].getTime()) {
                this.keyframes[i].animateIntermediateKeyframe(frameImg, this.keyframes[i+1], timestamp);
            }
        }

        // Check with last keyframe
        let lastKf = this.keyframes.length-1;
        if (this.keyframes[lastKf].getTime() === timestamp) this.keyframes[lastKf].animateThisKeyframe(frameImg);
    }
}