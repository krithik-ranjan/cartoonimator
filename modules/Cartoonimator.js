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

    get markerMap() {
        return this.markers;
    }

    addScene(frameImg, id) {
        if (this.markers.has(10) && this.markers.has(11) && this.markers.has(12) && this.markers.has(13)) {
            let _ = flattenFrame(frameImg, this.markers, this.width, this.height);

            // Crop to frame area
            let rect = new cv.Rect(100, 100, this.width, this.height);
            let temp = new cv.Mat();
            temp = frameImg.roi(rect);
            temp.copyTo(frameImg);

            temp.delete();

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
        if (this.markers.has(10) && this.markers.has(11) && this.markers.has(12) && this.markers.has(13)) {
            let M = flattenFrame(frameImg, this.markers, this.width, this.height);

            let sprites = findObjects(frameImg, this.markers, M);

            // Crop to frame area
            let rect = new cv.Rect(100, 100, this.width, this.height);
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
}
