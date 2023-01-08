
class CartoonimatorHandler {
    constructor() {
        this.scenes = [];
        this.steps  = [];
        this.detector = new AR.Detector({dictionaryName: 'ARUCO'});
    }

    _flattenFrame(frame, markers) {
        let topLeft, topRight, bottomRight, bottomLeft;

        var i;
        // for (i = 0; i !== markers.length; i++) {
        //     if (markers[i].id === 10) {
        //         topLeft = markers[i].corners[0];
        //         console.log(`Top left corner: ${topLeft.x}, ${topLeft.y}`);
        //     }
        //     else if (markers[i].id === 11) {
        //         topRight = markers[i].corners[0];
        //         console.log(`Top right corner: ${topRight.x}, ${topRight.y}`);
        //     }
        //     else if (markers[i].id === 12) {
        //         bottomRight = markers[i].corners[0];
        //         console.log(`Bottom right corner: ${bottomRight.x}, ${bottomRight.y}`);
        //     }
        //     else if (markers[i].id === 13) {
        //         bottomLeft = markers[i].corners[0];
        //         console.log(`Bottom left corner: ${bottomLeft.x}, ${bottomLeft.y}`);
        //     }
        // } 
        
        if (markers.has(10)) {
            topLeft = markers.get(10)[0];
            console.log(`Top left corner: ${topLeft.x}, ${topLeft.y}`);
        }
        else if (markers.has(11)) {
            topRight = markers.get(11)[0];
            console.log(`Top right corner: ${topRight.x}, ${topRight.y}`);
        }
        else if (markers.has(12)) {
            bottomRight = markers.get(12)[0];
            console.log(`Bottom right corner: ${bottomRight.x}, ${bottomRight.y}`);
        }
        else if (markers.has(13)) {
            bottomLeft = markers.get(13)[0];
            console.log(`Bottom left corner: ${bottomLeft.x}, ${bottomLeft.y}`);
        }

        if (topLeft === undefined || topRight === undefined || bottomRight === undefined || bottomLeft === undefined)
            return undefined;

        let dst = new cv.Mat();
        let dsize = new cv.Size(frame.cols, frame.rows);
        let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [topLeft.x, topLeft.y, topRight.x, topRight.y, bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y]);
        let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, 128, 0, 128, 96, 0, 96]);
        let M = cv.getPerspectiveTransform(srcTri, dstTri);
        cv.warpPerspective(frame, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

        // Result size 
        console.log(`Warped size: ${dst.cols}, ${dst.rows}`);

        cv.imshow('hello', dst);
        dst.delete();

        return 0;
    }

    addFrame(imageData, id, markers) {
        // let markers = this.detector.detect(imageData);
        // console.log(`Number of markers found: ${markers.length}`);

        let frame = cv.matFromImageData(imageData);

        // Flatten image
        let res = this._flattenFrame(frame, markers);
        if (res === -1) console.log('All markers not found.');

        if (id === 'scene') {
            console.log('Adding to scene.');
            this.scenes.push(frame);
        }
        else {
            console.log('Adding to step.');
            this.steps.push(frame);
        }
    }
}