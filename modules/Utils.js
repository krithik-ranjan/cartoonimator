import { Sprite } from "./Sprite.js";

const OBJECT_MARKER_SCALE = 4;

function flattenFrame(frame, markers, width, height) {
    let topLeft, topRight, bottomRight, bottomLeft;

    topLeft = markers.get(10)[0];
    topRight = markers.get(11)[0];
    bottomRight = markers.get(12)[0];
    bottomLeft = markers.get(13)[0];

    let dst = new cv.Mat();
    let dsize = new cv.Size(frame.cols, frame.rows);
    let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [topLeft.x, topLeft.y, topRight.x, topRight.y, bottomRight.x, bottomRight.y, bottomLeft.x, bottomLeft.y]);
    let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [50, 50, width + 50, 50, width + 50, height + 50, 50, height + 50]);
    let M = cv.getPerspectiveTransform(srcTri, dstTri);
    cv.warpPerspective(frame, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

    dst.copyTo(frame);
    
    dst.delete();
    srcTri.delete();
    dstTri.delete();

    return M;
}

function _getPointTransform(point, M) {
    let x = (M.doubleAt(0, 0)*point.x + M.doubleAt(0, 1)*point.y + M.doubleAt(0, 2)) / (M.doubleAt(2, 0)*point.x + M.doubleAt(2, 1)*point.y + M.doubleAt(2, 2));
    let y = (M.doubleAt(1, 0)*point.x + M.doubleAt(1, 1)*point.y + M.doubleAt(1, 2)) / (M.doubleAt(2, 0)*point.x + M.doubleAt(2, 1)*point.y + M.doubleAt(2, 2));
    // console.log(`(${x}, ${y})`);
    return new cv.Point(parseInt(x, 10), parseInt(y, 10));
}

function _removeBackground(frame) {
    let imgGrey = new cv.Mat(frame.rows, frame.cols, frame.type());
    cv.cvtColor(frame, imgGrey, cv.COLOR_RGBA2GRAY);

    // let fg = new cv.Mat(frame.rows, frame.cols, frame.type());
    let fg = new cv.Mat.zeros(frame.rows, frame.cols, frame.type());
    // cv.cvtColor(fg, fg, cv.COLOR_RGBA2RGB);
    cv.threshold(imgGrey, fg, 170, 255, cv.THRESH_BINARY_INV);

    // cv.cvtColor(fg, fg, cv.COLOR_RGB2RGBA);

    cv.cvtColor(fg, fg, cv.COLOR_GRAY2RGBA);
    // imgGrey.copyTo(frame);
    // console.log(`Og type: ${frame.type()}, fg type: ${fg.type()}`);

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

    // console.log(`Removed background`);

    imgGrey.delete();
    fg.delete();
    // img_grey.copyTo(frame);
}

function findObjects(frame, markers, M) {
    let i, topLeft, bottomLeft, topRight, bottomRight;
    let foundSprites = new Map();
    for (i = 100; i < 110; i++) {
        if (markers.has(i)) {
            // console.log(`Getting transformed points for marker ${i}`);
            // Based on marker corners, find object corners
            // Top left corner is the same as marker corner
            topLeft = _getPointTransform(markers.get(i)[0], M);

            bottomRight = _getPointTransform(markers.get(i)[2], M);
            bottomRight.x = topLeft.x + (bottomRight.x - topLeft.x) * OBJECT_MARKER_SCALE;
            bottomRight.y = topLeft.y + (bottomRight.y - topLeft.y) * OBJECT_MARKER_SCALE;

            // Based on calculation from https://www.quora.com/Given-two-diagonally-opposite-points-of-a-square-how-can-I-find-out-the-other-two-points-in-terms-of-the-coordinates-of-the-known-points
            topRight = _getPointTransform(markers.get(i)[1], M);
            topRight.x = (topLeft.x + bottomRight.x + bottomRight.y - topLeft.y) / 2;
            topRight.y = (topLeft.x - bottomRight.x + topLeft.y + bottomRight.y) / 2;

            bottomLeft = _getPointTransform(markers.get(i)[3], M);
            bottomLeft.x = (topLeft.x + bottomRight.x + topLeft.y - bottomRight.y) / 2;
            bottomLeft.y = (bottomRight.x - topLeft.x + topLeft.y + bottomRight.y) / 2;
            
            let mask = new cv.Mat(frame.rows, frame.cols, frame.type());
            cv.rectangle(mask, new cv.Point(0, 0), new cv.Point(frame.cols, frame.rows), new cv.Scalar(0, 0, 0, 255), cv.FILLED);

            let center = new cv.Point((topLeft.x + bottomRight.x) / 2, (topLeft.y + bottomRight.y) / 2);
            let side = Math.hypot((topLeft.x - topRight.x), (topLeft.y - topRight.y));
            // console.log(`Circle mask at (${center.x}, ${center.y}) with side ${side}.`)
            // cv.circle(mask, center, side / 2, new cv.Scalar(255, 255, 255, 255), cv.FILLED);
            cv.circle(mask, center, side * 0.4, new cv.Scalar(255, 255, 255, 255), cv.FILLED);


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
            cv.circle(dst, topLeft, 1.5 * side / OBJECT_MARKER_SCALE, new cv.Scalar(255, 255, 255, 255), cv.FILLED);

            _removeBackground(dst);

            // Crop object and add to map 
            let pos = new cv.Point(center.x - side/2, center.y - side/2);
            let rect = new cv.Rect(pos.x, pos.y, side, side);
            let roiObject = new cv.Mat();
            roiObject = dst.roi(rect);
            let rot = (Math.atan2(topRight.y - topLeft.y, topRight.x - topLeft.x)) * (180 / Math.PI);

            pos.x = pos.x - 50;
            pos.y = pos.y - 50;

            // foundSprites.push(new Sprite(pos, rot, side, roiObject));
            console.log(`[DEBUG] Adding sprite ${i}`);
            foundSprites.set(i, new Sprite(pos, rot, side, roiObject));

            mask.delete();
            dst.delete();
        }
    }
     
    return foundSprites;
}

export { flattenFrame, findObjects }; 