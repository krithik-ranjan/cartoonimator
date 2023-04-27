import { Scene } from "./Scene.js";
import { Keyframe } from "./Keyframe.js";
import { Sprite } from "./Sprite.js";
import { flattenFrame, findObjects } from "./Utils.js";

const FRAME_RATE = 10;

export const Cartoonimator = class {
    constructor(windowWidth, windowHeight) {
        this.detector = new AR.Detector({
            dictionaryName: 'ARUCO'
        });

        this.markers = new Map();
        this.lastMarkerDetectionTime = 0;

        this.width = windowWidth;
        this.height = windowHeight;

        this.numScenes = 0;
        this.scenes = [];
    }

    getNewSceneId() {
        let id = `s${this.numScenes}`;
        this.numScenes++;

        return id;
    }

    getNewKeyframeId(sceneId) {
        let i;
        for (i = 0; i < this.scenes.length; i++) {
            if (this.scenes[i].getId() === sceneId)
                return this.scenes[i].getNewKeyframeId();
        }
    }

    getNextSceneTimestamp() {
        if (this.scenes.length === 0) return 0;

        let lastTimestamp = this.scenes[this.scenes.length - 1].getLastTimestamp();
        // let lastTimestamp = 0;
        // let i;
        // for (i = 0; i < this.scenes.length; i++) {
        //     if (this.scenes[i].getLastTimestamp() > lastTimestamp)
        //         lastTimestamp = this.scenes[i].getLastTimestamp();
        // }

        return (lastTimestamp + 1);
    }

    getNextKeyframeTimestamp(sceneId) {
        let i;
        for (i = 0; i < this.scenes.length; i++) {
            if (this.scenes[i].getId() === sceneId) {
                // if (this.scenes[i].keyframes.length === 0) return this.scenes[i].getTime() / FRAME_RATE;
                // else {
                //     lastTimestamp = this.scenes[i].getLastTimestamp();
                //     return (lastTimestamp + 1) / FRAME_RATE;
                // }
                let lastTimestamp = this.scenes[i].getLastTimestamp();
                console.log(`[DEBUG] Last timestamp: ${lastTimestamp}`);
                if (this.scenes[i].keyframes.length === 0) return lastTimestamp;
                else return (lastTimestamp + 1);
            }
                
        }

        // console.log(`[DEBUG] Last timestamp: ${lastTimestamp}`);

        // return (lastTimestamp + 1) / FRAME_RATE;
    }

    updateSceneTimestamp(id, newTime) {
        let i;
        for (i = 0; i < this.scenes.length; i++) {
            if (this.scenes[i].getId() === id) 
                this.scenes[i].updateTimestamp(newTime);
        }
    }

    updateKeyframeTimestamp(id, sceneId, newTime) {
        let i;
        for (i = 0; i < this.scenes.length; i++) {
            if (this.scenes[i].getId() === sceneId) 
                this.scenes[i].updateKeyframeTimestamp(id, newTime);
        }
    }

    detectMarkers(imageData) {
        if (Date.now() > this.lastMarkerDetectionTime + 2000){
            this.markers.clear();
            this.lastMarkerDetectionTime = Date.now();
        }

        let markers = this.detector.detect(imageData);

        let i;
        for (i = 0; i !== markers.length; i++) {
            if (Math.abs(markers[i].corners[0].x - markers[i].corners[2].x) <= 100 && 
                    Math.abs(markers[i].corners[0].y - markers[i].corners[2].y) <= 100) {
                this.markers.set(markers[i].id, markers[i].corners);
                // markObjects(markers[i].id);
            }
        }

        return (this.markers.has(10) && this.markers.has(11) && this.markers.has(12) && this.markers.has(13))
    }

    getMarkerMap() {
        return this.markers;
    }

    addScene(frameImg, id) {
        console.log(`[DEBUG] Markers found:`);
        for (const markerID of this.markers.keys()) console.log(`\t${markerID}`);

        if (this.markers.has(10) && this.markers.has(11) && this.markers.has(12) && this.markers.has(13)) {
            let _ = flattenFrame(frameImg, this.markers, this.width, this.height);

            console.log('[DEBUG] Frame Flattened');
            console.log(`[DEBUG] Width: ${this.width}, Height: ${this.height}`);
            console.log(`[DEBUG] Image size: ${frameImg.cols}, ${frameImg.rows}`);

            // Crop to frame area
            let rect = new cv.Rect(50, 50, this.width, this.height);
            let temp = new cv.Mat();
            console.log('[DEBUG] Image Extracted');

            temp = frameImg.roi(rect);

            temp.copyTo(frameImg);

            temp.delete();
            console.log('[DEBUG] Image Extracted');

            // Check if scene already present
            let i;
            for (i = 0; i < this.scenes.length; i++) {
                if (this.scenes[i].getId() === id) {
                    this.scenes[i].updateImage(frameImg);
                    console.log(`[INFO] Updated scene [${id}]`)
                    return 1;
                }
            }
            this.scenes.push(new Scene(id, frameImg));
            console.log(`[INFO] Added scene [${id}]`);

            return 1;
        }
        else {
            return 0;
        }
    }

    addKeyframe(frameImg, id, sceneId) {
        console.log(`[DEBUG] Markers found:`);
        for (const markerID of this.markers.keys()) console.log(`\t${markerID}`);

        if (this.markers.has(10) && this.markers.has(11) && this.markers.has(12) && this.markers.has(13)) {
            let M = flattenFrame(frameImg, this.markers, this.width, this.height);

            let sprites = findObjects(frameImg, this.markers, M);

            // Crop to frame area
            let rect = new cv.Rect(50, 50, this.width, this.height);
            let temp = new cv.Mat();
            temp = frameImg.roi(rect);
            temp.copyTo(frameImg);

            temp.delete();

            let i;
            for (i = 0; i < this.scenes.length; i++) {
                if (this.scenes[i].getId() === sceneId) {
                    console.log(`[INFO] In scene [${sceneId}]`);
                    this.scenes[i].addKeyframe(id, sprites);
                }
            }
            return 1;
        }
        else {
            return 0;
        }
    }

    deleteScene(id) {
        let i;
        for (i = 0; i < this.scenes.length; i++) {
            if (this.scenes[i].getId() === id) {
                this.scenes[i].clearScene();
                this.scenes.splice(i, 1);
                break;
            }
        }

        console.log(`[DEBUG] Deleted scene ${id}, current number of scenes: ${this.scenes.length}`);
    }

    deleteKeyframe(id, sceneId) {
        let i;
        for (i = 0; i < this.scenes.length; i++) {
            if (this.scenes[i].getId() === sceneId) {
                this.scenes[i].deleteKeyframe(id);
            }
        }
    }

    _getSceneIdx(timestamp) {
        let sceneIdx = 0; 

        if (timestamp === 0) sceneIdx = 0;

        let i;
        for (i = 1; i < this.scenes.length; i++) {
            if (this.scenes[i].getTime() > timestamp) {
                sceneIdx = i - 1;
                break;
            }
            else if (this.scenes[i].getTime() === timestamp) {
                sceneIdx = i;
                break;
            }
        }

        if (timestamp > this.scenes[this.scenes.length - 1].getTime()) {
            sceneIdx = this.scenes.length - 1;
        }

        return sceneIdx;
    }

    _animationLoop(context) {
        let thisFrame = new cv.Mat();

        let sceneIdx = this._getSceneIdx(this.currTime);

        console.log(`[DEBUG] Scene [${this.scenes[sceneIdx].id}] at time ${this.currTime}`);
        this.scenes[sceneIdx].animateScene(thisFrame, this.currTime);

        // Add frame to canvas
        let frameImageData = new ImageData(new Uint8ClampedArray(thisFrame.data), 
                                thisFrame.cols,
                                thisFrame.rows);
        context.putImageData(frameImageData, 0, 0);

        this.currTime = this.currTime + 1;
    }

    playVideo(context) {
        console.log('#### PLAYING VIDEO ####');
        
        let deltaTime = 1 / FRAME_RATE * 1000;
        let maxTime = this.getNextSceneTimestamp() / FRAME_RATE;
        console.log(`[DEBUG] Animation delta: ${deltaTime}ms, total time: ${maxTime}ms`);

        this.currTime = 0;

        // Print out scene and keyframe info for debugging
        let i;
        for (i = 0; i < this.scenes.length; i++) {
            this.scenes[i].printSceneInfo();
        }

        // mediaRecorder.start();

        let timerId = setInterval( () => {
            this._animationLoop(context);
        }, deltaTime);

        setTimeout( () => {
            console.log('#### FINISHED VIDEO ####');
            clearInterval(timerId);

            // mediaRecorder.stop();
        }, maxTime);
    }

    downloadVideo(context, mediaRecorder) {
        console.log('#### PLAYING VIDEO ####');
        
        let deltaTime = 1 / FRAME_RATE * 1000;
        let maxTime = this.getNextSceneTimestamp() / FRAME_RATE;
        console.log(`[DEBUG] Animation delta: ${deltaTime}ms, total time: ${maxTime}ms`);

        this.currTime = 0;

        // Print out scene and keyframe info for debugging
        let i;
        for (i = 0; i < this.scenes.length; i++) {
            this.scenes[i].printSceneInfo();
        }

        mediaRecorder.start();

        let timerId = setInterval( () => {
            this._animationLoop(context);
        }, deltaTime);

        setTimeout( () => {
            console.log('#### FINISHED VIDEO ####');
            clearInterval(timerId);

            mediaRecorder.stop();
        }, maxTime);
    }
}
