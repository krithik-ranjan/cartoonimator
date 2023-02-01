const FRAME_RATE = 10;

class CartoonimatorHandler {
    constructor(windowWidth, windowHeight) {
        this.scenes = new SceneReel();
        this.objects = new Map();

        this.width = windowWidth;
        this.height = windowHeight;
        console.log(`Output window size: ${this.width}, ${this.height}`);

        this.objectMarkerScale = 4;
        this.maxTime = 0;
        this.currTime = 0;
    }

    deleteScene(time) {
        this.scenes.deleteScene(time * FRAME_RATE);
    }

    deleteStep(time) {
        let timestamp = time * FRAME_RATE;
        let scene = this.scenes.getSceneIdx(timestamp);

        // Iterate over objects to delete their instances 
        let i;
        for (i = 100; i < 110; i++) {
            if (this.objects.has(`${i}-${sceneIdx}`)) {
                console.log(`Deleting object ${i} at time ${time}`);
                this.objects.get(`${i}-${sceneIdx}`).removeObjectInstance(timestamp);
            }
        }   
    }

    flattenFrame(frame, markers, time) {
        let topLeft, topRight, bottomRight, bottomLeft;
       
        if (markers.has(10)) {
            topLeft = markers.get(10)[0];
            console.log(`Top left corner: ${topLeft.x}, ${topLeft.y}`);
        }
        if (markers.has(11)) {
            topRight = markers.get(11)[0];
            console.log(`Top right corner: ${topRight.x}, ${topRight.y}`);
        }
        if (markers.has(12)) {
            bottomRight = markers.get(12)[0];
            console.log(`Bottom right corner: ${bottomRight.x}, ${bottomRight.y}`);
        }
        if (markers.has(13)) {
            bottomLeft = markers.get(13)[0];
            console.log(`Bottom left corner: ${bottomLeft.x}, ${bottomLeft.y}`);
        }

        if (topLeft === undefined || topRight === undefined || bottomRight === undefined || bottomLeft === undefined)
            return -1;

        let dst = new cv.Mat();
        let dsize = new cv.Size(frame.cols, frame.rows);
        let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [topLeft.x, topLeft.y, topRight.x, topRight.y, bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y]);
        let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, this.width, 0, this.width, this.height, 0, this.height]);
        let M = cv.getPerspectiveTransform(srcTri, dstTri);
        cv.warpPerspective(frame, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

        // Crop to required area
        let rect = new cv.Rect(0, 0, this.width, this.height);
        let tmp = new cv.Mat();
        tmp = dst.roi(rect);
        // frame = dst.roi(rect);
        // cv.rectangle(dst, new cv.Point(0, 0), new cv.Point(this.width, this.height), new cv.Scalar(255, 0, 255, 255, 5));

        // Add scene to reel 
        let timestamp = time * FRAME_RATE;
        if (timestamp > this.maxTime) this.maxTime = timestamp;
        this.scenes.addScene(tmp, timestamp);

        // Result copy 
        // dsize = new cv.Size(this.width, this.height);
        // cv.resize(dst, frame, dsize, 0, 0, cv.INTER_AREA);
        tmp.copyTo(frame);
        tmp.delete();      
        dst.delete();

        return 0;
    }

    flattenFrameWithObjects(frame, markers, time) {
        let topLeft, topRight, bottomRight, bottomLeft;
       
        if (markers.has(10)) {
            topLeft = markers.get(10)[0];
            // console.log(`Top left corner: ${topLeft.x}, ${topLeft.y}`);
        }
        if (markers.has(11)) {
            topRight = markers.get(11)[0];
            // console.log(`Top right corner: ${topRight.x}, ${topRight.y}`);
        }
        if (markers.has(12)) {
            bottomRight = markers.get(12)[0];
            // console.log(`Bottom right corner: ${bottomRight.x}, ${bottomRight.y}`);
        }
        if (markers.has(13)) {
            bottomLeft = markers.get(13)[0];
            // console.log(`Bottom left corner: ${bottomLeft.x}, ${bottomLeft.y}`);
        }

        if (topLeft === undefined || topRight === undefined || bottomRight === undefined || bottomLeft === undefined)
            return -1;

        let dst = new cv.Mat();
        let dsize = new cv.Size(frame.cols, frame.rows);
        let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [topLeft.x, topLeft.y, topRight.x, topRight.y, bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y]);
        let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, this.width, 0, this.width, this.height, 0, this.height]);
        let M = cv.getPerspectiveTransform(srcTri, dstTri);
        cv.warpPerspective(frame, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

        // Crop to required area
        let rect = new cv.Rect(0, 0, this.width, this.height);
        let tmp = new cv.Mat();
        tmp = dst.roi(rect);
        tmp.copyTo(dst);

        // Update the locations of all other markers through perspective transform and then mask
        let res = this._findObjects(dst, markers, M, time);

        // Copy over flattened frame for preview
        dst.copyTo(frame);

        console.log(`Updated objects for time ${time}`);

        tmp.delete();
        dst.delete();

        return res;
    }

    _getPointTransform(point, M) {
        let x = (M.doubleAt(0, 0)*point.x + M.doubleAt(0, 1)*point.y + M.doubleAt(0, 2)) / (M.doubleAt(2, 0)*point.x + M.doubleAt(2, 1)*point.y + M.doubleAt(2, 2));
        let y = (M.doubleAt(1, 0)*point.x + M.doubleAt(1, 1)*point.y + M.doubleAt(1, 2)) / (M.doubleAt(2, 0)*point.x + M.doubleAt(2, 1)*point.y + M.doubleAt(2, 2));
        // console.log(`(${x}, ${y})`);
        return new cv.Point(parseInt(x, 10), parseInt(y, 10));
    }

    _removeBackground(frame) {
        let imgGrey = new cv.Mat(frame.rows, frame.cols, frame.type());
        cv.cvtColor(frame, imgGrey, cv.COLOR_RGBA2GRAY);

        // let fg = new cv.Mat(frame.rows, frame.cols, frame.type());
        let fg = new cv.Mat.zeros(frame.rows, frame.cols, frame.type());
        // cv.cvtColor(fg, fg, cv.COLOR_RGBA2RGB);
        cv.threshold(imgGrey, fg, 170, 255, cv.THRESH_BINARY_INV);

        // cv.cvtColor(fg, fg, cv.COLOR_RGB2RGBA);

        cv.cvtColor(fg, fg, cv.COLOR_GRAY2RGBA);
        // imgGrey.copyTo(frame);
        console.log(`Og type: ${frame.type()}, fg type: ${fg.type()}`);

        cv.bitwise_and(frame, fg, frame);

        // Change transparency channel 
        let imgPlanes = new cv.MatVector();
        cv.split(frame, imgPlanes);
        cv.cvtColor(fg, fg, cv.COLOR_RGBA2GRAY);
        let fgPlanes = new cv.MatVector();
        cv.split(fg, fgPlanes);

        imgPlanes.set(3, fgPlanes.get(0));
        cv.merge(imgPlanes, frame);
        // fg.copyTo(frame);

        console.log(`Removed background`);

        imgGrey.delete();
        fg.delete();
        // img_grey.copyTo(frame);
    }

    _findObjects(frame, markers, M, time) {
        // Iterate over markers 20 to 42 to find all possible objects in the scene 
        let i, topLeft, bottomLeft, topRight, bottomRight;
        let found = false;
        for (i = 100; i < 110; i++) {
            if (markers.has(i)) {
                found = true;

                console.log(`Getting transformed points for marker ${i}`);
                // Based on marker corners, find object corners
                // Top left corner is the same as marker corner
                topLeft = this._getPointTransform(markers.get(i)[0], M);

                bottomRight = this._getPointTransform(markers.get(i)[2], M);
                bottomRight.x = topLeft.x + (bottomRight.x - topLeft.x) * this.objectMarkerScale;
                bottomRight.y = topLeft.y + (bottomRight.y - topLeft.y) * this.objectMarkerScale;

                // Based on calculation from https://www.quora.com/Given-two-diagonally-opposite-points-of-a-square-how-can-I-find-out-the-other-two-points-in-terms-of-the-coordinates-of-the-known-points
                topRight = this._getPointTransform(markers.get(i)[1], M);
                topRight.x = (topLeft.x + bottomRight.x + bottomRight.y - topLeft.y) / 2;
                topRight.y = (topLeft.x - bottomRight.x + topLeft.y + bottomRight.y) / 2;

                bottomLeft = this._getPointTransform(markers.get(i)[3], M);
                bottomLeft.x = (topLeft.x + bottomRight.x + topLeft.y - bottomRight.y) / 2;
                bottomLeft.y = (bottomRight.x - topLeft.x + topLeft.y + bottomRight.y) / 2;

                // let mask = cv.Mat.zeros(frame.rows, frame.cols, frame.type());
                let mask = new cv.Mat(frame.rows, frame.cols, frame.type());
                cv.rectangle(mask, new cv.Point(0, 0), new cv.Point(frame.cols, frame.rows), new cv.Scalar(0, 0, 0, 255), cv.FILLED);

                let center = new cv.Point((topLeft.x + bottomRight.x) / 2, (topLeft.y + bottomRight.y) / 2);
                let side = Math.hypot((topLeft.x - topRight.x), (topLeft.y - topRight.y));
                console.log(`Circle mask at (${center.x}, ${center.y}) with side ${side}.`)
                cv.circle(mask, center, side / 2, new cv.Scalar(255, 255, 255, 255), cv.FILLED);

                // Extract object 
                let dst = new cv.Mat(frame.rows, frame.cols, frame.type());
                cv.rectangle(dst, new cv.Point(0, 0), new cv.Point(frame.cols, frame.rows), new cv.Scalar(255, 255, 255, 255), cv.FILLED);

                // cv.bitwise_not(dst, dst);
                cv.bitwise_and(frame, mask, dst);

                // Make background white 
                cv.cvtColor(mask, mask, cv.COLOR_RGBA2GRAY);
                cv.bitwise_not(mask, mask);
                cv.cvtColor(mask, mask, cv.COLOR_GRAY2RGBA)
                cv.bitwise_or(dst, mask, dst);

                // Hide ArUco marker
                cv.circle(dst, topLeft, 1.5 * side / this.objectMarkerScale, new cv.Scalar(255, 255, 255, 255), cv.FILLED);

                this._removeBackground(dst);

                // Crop object and add to map 
                let pos = new cv.Point(center.x - side/2, center.y - side/2);
                let rect = new cv.Rect(pos.x, pos.y, side, side);
                let roiObject = new cv.Mat();
                roiObject = dst.roi(rect);
                let rotation = (Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x)) * (180 / Math.PI);

                let timestamp = time * FRAME_RATE;
                if (timestamp > this.maxTime) this.maxTime = timestamp;

                // Check if object already existing, else create 
                let sceneIdx = this.scenes.getSceneIdx(timestamp);
                let key = `${i}-${sceneIdx}`;
                console.log(`Adding object ${key}`);
                if (this.objects.has(key)) {
                    this.objects.get(key).addObjectInstance(roiObject, pos, rotation, side, timestamp);
                }
                else {
                    this.objects.set(key, new AnimationObject(i));
                    this.objects.get(key).addObjectInstance(roiObject, pos, rotation, side, timestamp);
                }

                // cv.add(frame, dst, frame);
                // roiObject.copyTo(frame);
                // dst.copyTo(frame);

                mask.delete();
                dst.delete();
                // ptsMat.delete();
                // pts.delete();
            }
        }

        if (!found) return -1;
        else return 0;

        // Display frame in debug window
        // cv.imshow('debug', frame);
    }

    _animationLoop(context) {
        console.log(`Frame: ${this.currTime}`);
        let t = this.currTime;
        let thisFrame = new cv.Mat();
        this.scenes.putSceneOnFrame(t).copyTo(thisFrame);

        for (const object of this.objects.values()) {
            object.putObjectInFrame(t, thisFrame);
        } 

        // Add frame to canvas
        let frameImageData = new ImageData(new Uint8ClampedArray(thisFrame.data), 
                                thisFrame.cols,
                                thisFrame.rows);
        context.putImageData(frameImageData, 0, 0);

        // console.log(`Curr time: ${this.currTime}`);
        this.currTime = this.currTime + 1;
    }

    playVideo(context, mediaRecorder) {
        console.log('####### Playing Video ########');
        console.log(`Total length: ${this.maxTime} frames, ${this.maxTime / FRAME_RATE} s`)
        let deltaTime = 1 / FRAME_RATE * 1000;
        console.log(`Animation delta time: ${deltaTime}`);
        
        this.currTime = 0;
        // let t = 5;

        mediaRecorder.start();

        let timerID = setInterval(function(handler) {
            handler._animationLoop(context);
        }, deltaTime, this);

        setTimeout(function(){
            console.log(`####### Finished Video ########`);
            clearInterval(timerID);

            mediaRecorder.stop();
        }, ((this.maxTime + 1) / FRAME_RATE * 1000));
    }

    // addFrame(frameImg, id, markers) {
    //     // Flatten image
    //     let res = this._flattenFrame(frameImg, markers);
    //     if (res === -1) {
    //         console.log("Could not find necessary markers.");
    //         return -1;
    //     }

    //     if (id === 'scene') {
    //         console.log('Adding to scene.');
    //         this.scenes.push(frameImg);
    //     }
    //     else {
    //         console.log('Adding to step.');

    //         this._findObjects(frameImg, markers);
    //         this.steps.push(frameImg);
    //     }

    //     return 0;
    // }
}