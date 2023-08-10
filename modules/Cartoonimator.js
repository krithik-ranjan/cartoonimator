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

        this.startTime = new Date();
    }

    getJSON() {
        let sceneArr = []
        for (let i = 0; i < this.scenes.length; i++) {
            sceneArr.push(this.scenes[i].getJSON());
        }

        let currTime = new Date();

        let jsonObj = {
            elapsedTimeSeconds: (currTime.getTime() - this.startTime.getTime()) / 1000,
            numScenes: this.numScenes,
            scenes: sceneArr
        };

        return jsonObj;
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

        return (lastTimestamp + 1) / FRAME_RATE; 
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
                if (this.scenes[i].keyframes.length === 0) return lastTimestamp / FRAME_RATE;
                else return (lastTimestamp + 5) / FRAME_RATE;   // ## TEMP FIX ## Add 5 to the last timestamp to make the next happen after 0.5s (10 FPS)
            }
                
        }

        // console.log(`[DEBUG] Last timestamp: ${lastTimestamp}`);

        // return (lastTimestamp + 1) / FRAME_RATE;
    }

    updateSceneTimestamp(id, newTime) {
        let i;
        for (i = 0; i < this.scenes.length; i++) {
            if (this.scenes[i].getId() === id) 
                this.scenes[i].updateTimestamp(newTime * FRAME_RATE);
        }
    }

    updateKeyframeTimestamp(id, sceneId, newTime) {
        let i;
        for (i = 0; i < this.scenes.length; i++) {
            if (this.scenes[i].getId() === sceneId) 
                this.scenes[i].updateKeyframeTimestamp(id, newTime * FRAME_RATE);
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

            // console.log('[DEBUG] Frame Flattened');
            // console.log(`[DEBUG] Width: ${this.width}, Height: ${this.height}`);
            // console.log(`[DEBUG] Image size: ${frameImg.cols}, ${frameImg.rows}`);

            // Crop to frame area
            let rect = new cv.Rect(50, 50, this.width, this.height);
            let temp = new cv.Mat();
            // console.log('[DEBUG] Image Extracted');

            temp = frameImg.roi(rect);

            temp.copyTo(frameImg);

            temp.delete();
            // console.log('[DEBUG] Image Extracted');

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
        let i, removeIdx;
        for (i = 0; i < this.scenes.length; i++) {
            if (this.scenes[i].getId() === id) {
                // Check if the scene has repeats, delete those
                let numRepeats = this.scenes[i].removeRepeat();
                if (numRepeats > 0) {
                    // Repeats found, remove the first
                    removeIdx = i+1;
                }
                else {
                    removeIdx = i;
                }

                this.scenes[removeIdx].clearScene();
                this.scenes.splice(removeIdx, 1);

                // Update timestamps of all the remaining scenes
                let j;
                for (j = removeIdx; j < this.scenes.length; j++) {
                    if (j === 0) {
                        this.scenes[j].updateAllTimestamps(0);
                    }
                    else {
                        let newTime = this.scenes[j-1].getLastTimestamp() + 1;
                        this.scenes[j].updateAllTimestamps(newTime);
                    }
                }
                
                return numRepeats;
            }
        }

        return 0;
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

    repeatScene(id) {
        // Find the timestamp and id of repeated scene
        let i;
        for (i = 0; i < this.scenes.length; i++) {
            if (this.scenes[i].getId() === id) {
                let nextTime = this.scenes[i].getLastTimestamp() + 1;
                let nextId = this.getNewSceneId();

                let newScene = this.scenes[i].getCopy(nextTime, nextId);

                if (i === this.scenes.length - 1) {
                    this.scenes.push(newScene);
                }
                else {
                    this.scenes.splice(i+1, 0, newScene);
                    
                    // Update the timestamps of the scenes after the new one
                    let j;
                    for (j = i + 2; j < this.scenes.length; j++) {
                        let newTime = this.scenes[j-1].getLastTimestamp() + 1;
                        this.scenes[j].updateAllTimestamps(newTime);
                    }
                }

                return this.scenes[i].addRepeat();
            }
        }

        return 0;

        // Debug prints
        console.log(`### [DEBUG] ###`);
        for (i = 0; i < this.scenes.length; i++) {
            this.scenes[i].printSceneInfo();
        }

        // // Check if the scene to be repeated is the last one, and add it again
        // if (id === this.scenes[this.scenes.length - 1].getId()) {
        //     // Find timestamp of next scene
        //     let nextTime = this.getNextSceneTimestamp() * FRAME_RATE;
        //     let nextId = this.getNewSceneId();

        //     console.log(`[DEBUG] Repeating Scene ${id} to be ${nextId} at ${nextTime}`);

        //     let newScene = this.scenes[this.scenes.length - 1].getCopy(nextTime, nextId);
        //     this.scenes.push(newScene);
        // }
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

        console.log(`\t[DEBUG] Scene [${this.scenes[sceneIdx].id}] at time ${this.currTime}`);
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
        let maxTime = this.getNextSceneTimestamp() * 1000;
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
        let maxTime = this.getNextSceneTimestamp() * 1000;
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