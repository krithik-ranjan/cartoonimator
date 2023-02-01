class SceneReel {
    constructor() {
        this.scenes = []
    }

    addScene(sceneFrame, timestamp) {
        let frame = new cv.Mat();
        sceneFrame.copyTo(frame);

        // console.log(`Adding scene at ${timestamp}`);
        // console.log(`Scene size: ${frame.cols}, ${frame.rows}`);
        // this.scenes.push({time: timestamp, frame: frame});

        // console.log(`Total scenes: ${this.scenes.length}`);

        // TODO: Add sorted insert for scenes
        if (this.scenes.length === 0) {
            this.scenes.push({time: timestamp, frame: frame});
        }
        else {
            let i;
            for (i = 0; i < this.scenes.length; i++) {
                if (this.scenes[i].time > timestamp) break;
            }
            console.log(`Adding scene at time ${timestamp} at index ${i}`);
            this.scenes.splice(i, 0, {time: timestamp, frame: frame});
        }
    }

    deleteScene(timestamp) {
        let i; 
        for (i = 0; i < this.scenes.length; i++) {
            if (this.scenes[i].time === timestamp) {
                console.log(`[SceneReel] Deleting at time ${timestamp}`);
                this.scenes.splice(i, 1);
                break;
            }
        }
    }

    getSceneIdx(timestamp) {
        let sceneIdx = 0;
        
        if (timestamp === 0) {
            sceneIdx = 0;
        }

        let i;
        for (i = 1; i < this.scenes.length; i++) {
            if (this.scenes[i].time > timestamp) {
                sceneIdx = i - 1;
                break;
            }
            if (this.scenes[i].time === timestamp) {
                sceneIdx = i;
                break;
            }
        }

        if (timestamp > this.scenes[this.scenes.length - 1].time) {
            sceneIdx = this.scenes.length - 1;
        }

        return sceneIdx;
    }

    putSceneOnFrame(timestamp) {
        let sceneIdx = this.getSceneIdx(timestamp);

        console.log(`\tScene: ${sceneIdx} starting at time: ${this.scenes[sceneIdx].time}`);

        // console.log(`\tScene: ${sceneIdx}, total scenes: ${this.scenes.length}`);
        // let sceneImageData = new ImageData(new Uint8ClampedArray(this.scenes[sceneIdx].frame.data), 
        //                         this.scenes[sceneIdx].frame.cols,
        //                         this.scenes[sceneIdx].frame.rows);
        // context.putImageData(sceneImageData, 0, 0);
        return this.scenes[sceneIdx].frame;
    }
}
