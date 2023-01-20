var video, canvas, context, imageData, detector, playback;

// Set constraints for the video stream
var constraints = { video: { facingMode: {exact: "environment"}}, audio: false };
var cameraActive = false;

// Global object to track markers
var markers;
var markerMap = new Map();

// Cartoonimator handler 
let handler; 

function onLoad() {
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    canvas.width = window.screen.width;
    canvas.height = window.screen.width * 0.75;// canvas.width * ((0.25 * window.screen.height) / window.screen.width);
    canvas.style.width = canvas.width;
    canvas.style.height = canvas.height;

    console.log(`Canvas width = ${canvas.width}, ${canvas.height}`);
    // canvas.width = parseInt(canvas.style.width);
    // canvas.height = parseInt(canvas.style.height);

    // Setup for video playback
    playback = document.getElementById("playback");
    playback.width = window.screen.width;
    playback.height = window.screen.width * 0.75;
    playback.style.width = playback.width;
    playback.style.height = playback.height;

    handler = new CartoonimatorHandler(playback.width, playback.height);

    if (navigator.mediaDevices === undefined) {
        navigator.mediaDevices = {};
    }

    if (navigator.mediaDevices.getUserMedia === undefined) {
        navigator.mediaDevices.getUserMedia = function(constraints) {
            var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            if (!getUserMedia) {
                return Promise.reject(new Error('getUserMedia is not implemented'));
            }

            return new Promise(function(resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        }
    }

    navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" }, audio: false })
        .then(function(stream) {
            if ("srcObject" in video) {
                video.srcObject = stream;
            }
            else {
                video.src = window.URL.createObjectURL(stream);
            }
        })
        .catch(function(error) {
            console.error("Oops. Something is broken.", error);
        });
    
    detector = new AR.Detector({
        dictionaryName: 'ARUCO'
    });

    requestAnimationFrame(tick);
}

window.addEventListener("load", onLoad, false);

function tick() {
    requestAnimationFrame(tick);

    if (video.readyState === video.HAVE_ENOUGH_DATA && cameraActive) {
        cameraPreview();

        markers = detector.detect(imageData);
        
        // Add markers to map
        let i;
        
        drawCorners(markers);
        drawId(markers);

        for (i = 0; i !== markers.length; i++) {
            // console.log(`Updating marker ${markers[i].id}`);
            // Check if valid marker 
            if (Math.abs(markers[i].corners[0].x - markers[i].corners[2].x) <= 100 && 
                    Math.abs(markers[i].corners[0].y - markers[i].corners[2].y) <= 100) {
                markerMap.set(markers[i].id, markers[i].corners);
                // markObjects(markers[i].id);
            } 
        }

        // For debugging object detection
        // markObjects();
    }
}

let debugOut = document.getElementById('debug');

function cameraPreview() {
    // Scale video 
    // let width = canvas.width;
    // let height = canvas.height;
    // let height = width * (video.videoHeight / video.videoWidth);

    // debugOut.innerHTML = `Canvas dimensions: ${canvas.width}, ${canvas.height} <br>Video dimensions: ${video.videoWidth}, ${video.videoHeight}`;

    // context.drawImage(video, 0, 0, width, height);
    if (video.videoHeight < video.videoWidth) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, canvas.width, canvas.height);
        imageData = context.getImageData(0, 0, video.videoWidth, video.videoHeight);

    }
    else {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoWidth * 0.75, 0, 0, canvas.width, canvas.height);
        imageData = context.getImageData(0, 0, video.videoWidth, video.videoWidth * 0.75);
    }
    
    // imageData = context.getImageData(0, 0, video.videoWidth, video.videoHeight);
}

function checkValidMarker(id) {
    return ((id >= 10) && (id < 14)) || ((id >= 100) && (id < 120));
}

function drawCorners(markers) {
    var corners, corner, i, j;

    context.lineWidth = 3;

    for (i = 0; i !== markers.length; ++ i) {
        if (!checkValidMarker(markers[i].id))
            continue;

        corners = markers[i].corners;

        context.strokeStyle = "red";
        context.beginPath();

        for (j = 0; j !== corners.length; ++ j) {
            corner = corners[j];
            context.moveTo(corner.x, corner.y);
            corner = corners[(j+1) % corners.length];
            context.lineTo(corner.x, corner.y);
        }

        context.stroke();
        context.closePath();

        context.strokeStyle = "green";
        context.strokeRect(corners[0].x - 2, corners[0].y - 2, 4, 4);
    }
}

function drawId(markers) {
    var corners, corner, x, y, i, j;

    context.strokeStyle = "blue";
    context.lineWidth = 1;

    for (i = 0; i !== markers.length; ++ i) {
        if (!checkValidMarker(markers[i].id))
            continue;
        // console.log("Found marker: ", markers[i].id);

        corners = markers[i].corners;

        x = Infinity;
        y = Infinity;

        for (j = 0; j !== corners.length; ++ j) {
            corner = corners[j];

            x = Math.min(x, corner.x);
            y = Math.min(y, corner.y);
        }

        context.strokeText(markers[i].id, x, y);
    }
}

function markObjects(markerId) {
    let i = markerId;
    let topLeft, bottomLeft, topRight, bottomRight;
    if (markerMap.has(i) && i >= 100 && i < 120) {
        // console.log(`Found object ${i}`);

        // Based on marker corners, find object corners
        // Top left corner is the same as marker corner
        topLeft = markerMap.get(i)[0];
        // console.log(`Top left corner: ${topLeft.x}, ${topLeft.y}`)

        bottomRight = markerMap.get(i)[2];
        // console.log(`Bottom right marker corner: ${bottomRight.x}, ${bottomRight.y}`)

        bottomRight.x = topLeft.x + (bottomRight.x - topLeft.x) * 4;
        bottomRight.y = topLeft.y + (bottomRight.y - topLeft.y) * 4;
        // console.log(`Bottom right corner: ${bottomRight.x}, ${bottomRight.y}`)

        // Based on calculation from https://www.quora.com/Given-two-diagonally-opposite-points-of-a-square-how-can-I-find-out-the-other-two-points-in-terms-of-the-coordinates-of-the-known-points
        topRight = markerMap.get(i)[1];
        topRight.x = (topLeft.x + bottomRight.x + bottomRight.y - topLeft.y) / 2;
        topRight.y = (topLeft.x - bottomRight.x + topLeft.y + bottomRight.y) / 2;

        bottomLeft = markerMap.get(i)[3];
        bottomLeft.x = (topLeft.x + bottomRight.x + topLeft.y - bottomRight.y) / 2;
        bottomLeft.y = (bottomRight.x - topLeft.x + topLeft.y + bottomRight.y) / 2;

        context.lineWidth = 3;
        context.strokeStyle = 'yellow';

        context.beginPath();
        context.moveTo(topLeft.x, topLeft.y);
        context.lineTo(topRight.x, topRight.y);
        context.lineTo(bottomRight.x, bottomRight.y);
        context.lineTo(bottomLeft.x, bottomLeft.y);
        context.lineTo(topLeft.x, topLeft.y);
        context.stroke();
        context.closePath();
    }
}

// const gallery = document.querySelector('.gallery');

// function captureInfo() {
//     for (i = 0; i !== markers.length; ++ i) {
//         const m_info = document.createElement('p');
//         m_info.setAttribute('class', 'gallery');
//         gallery.appendChild(m_info);

//         m_info.innerHTML = "Marker: " + markers[i].id;
//     }

//     click.innerHTML = `${video.videoWidth}, ${video.videoHeight}`
//     console.log(`${this.parentElement}`)
// }

// function captureImg() {
//     const img = document.createElement('canvas');
//     img.setAttribute('class', 'gallery');
//     gallery.appendChild(img);

//     // img.getContext("2d").drawImage(imageData, 0, 0, 50, 30);
//     img.getContext("2d").putImageData(imageData, 0, 0);
// }

// Functions to add a frame
const mainPage = document.querySelector("#main");
const capturePage = document.querySelector("#camera");
const playPage = document.querySelector('#play');
const captureButton = document.querySelectorAll(".capture");

// Variable for active frame
let activeFrame;

function captureFrame() {
    // Remove main page and show capture page
    mainPage.style.display = "none";
    capturePage.style.display = "block";

    cameraActive = true;

    // Display parent 
    activeFrame = this.parentNode.parentNode;
    console.log(`Parent: ${this.parentNode.parentNode.id}`)
}

for (const button of captureButton){
    button.addEventListener('click', captureFrame);
}

const clickBtn = document.querySelector('#clickBtn');
const timeBlank = document.querySelector('#timestamp');

function saveFrame() {
    // Obtain timestamp
    let timestamp = timeBlank.value;
    if (timestamp.length === 0) {
        debugOut.innerHTML = 'Please enter timestamp for this frame.'
        return;
    }
    timestamp = parseInt(timestamp);
    console.log(`Time: ${timestamp}`);

    // Obtain active canvas
    var preview = activeFrame.querySelector('.preview');
    var previewContext = preview.getContext('2d');

    // Add current frame 
    console.log(`Markers found overall: `);
    for (const markerId of markerMap.keys()) {
        console.log(markerId);
    }

    let frameImg = cv.matFromImageData(imageData);
    let res;

    if (activeFrame.className === 'scene') {
        res = handler.flattenFrame(frameImg, markerMap, 0);

        if (res === -1) {
            debugOut.innerHTML = 'Scene not found. Try again.';
            return;
        }
    }
    else if (activeFrame.className === 'step') {
        res = handler.flattenFrameWithObjects(frameImg, markerMap, timestamp);

        if (res === -1) {
            debugOut.innerHTML = 'No objects found. Try again.';
            return;
        }
    }

    // Process image based on whether it is a scene or not
    // if (activeFrame.id === 'scene') {
    //     res = handler.flattenFrame(frameImg, markerMap, 0.0);

    //     if (res === -1) {
    //         debugOut.innerHTML = 'Scene not found. Try again.';
    //         return;
    //     }
    // }
    // else if (activeFrame.id === 'step1') {
    //     res = handler.flattenFrameWithObjects(frameImg, markerMap, 0.0);
    //     if (res === -1) {
    //         debugOut.innerHTML = 'No objects found. Try again.';
    //         return;
    //     }
    // }
    // else if (activeFrame.id === 'step2') {
    //     res = handler.flattenFrameWithObjects(frameImg, markerMap, 2.0);
    //     if (res === -1) {
    //         debugOut.innerHTML = 'No objects found. Try again.';
    //         return;
    //     }
    // }
    // else if (activeFrame.id === 'step3') {
    //     res = handler.flattenFrameWithObjects(frameImg, markerMap, 5.0);
    //     if (res === -1) {
    //         debugOut.innerHTML = 'No objects found. Try again.';
    //         return;
    //     }
    // }

    // Process image to display
    let dst = new cv.Mat()
    let dsize = new cv.Size(128, 96);
    // console.log(`${dsize}`);
    // img.convertTo(dst, cv.CV_8U, 0.5, 0);
    // cv.cvtColor(img, dst, cv.COLOR_RGBA2BGRA);
    cv.resize(frameImg, dst, dsize, 0, 0, cv.INTER_AREA);
    // cv.imshow('hello', dst);

    console.log(`Original size: ${frameImg.cols}, ${frameImg.rows}; Compressed size: ${dst.cols}, ${dst.rows}`);
    let framePreview = new ImageData(new Uint8ClampedArray(dst.data),
                        dst.cols,
                        dst.rows);

    previewContext.putImageData(framePreview, 0, 0);
    console.log(`ImageData size: ${framePreview.width}, ${framePreview.height}`);

    // previewContext.scale(0.1, 0.1)

    // console.log('Added image');

    capturePage.style.display = "none";
    mainPage.style.display = "block";

    cameraActive = false;
    markerMap.clear();

    frameImg.delete();
    dst.delete();

    debugOut.innerHTML = '';
}

clickBtn.addEventListener('click', saveFrame);

function backToMainFromCamera() {
    capturePage.style.display = "none";
    mainPage.style.display = "block";

    cameraActive = false;
    markerMap.clear();
}

const backButtonCamera = document.querySelector('#backBtnCamera');
backButtonCamera.addEventListener('click', backToMainFromCamera);

function playVideo() {
    mainPage.style.display = "none";
    playPage.style.display = "block";
    
    let playbackContext = playback.getContext('2d');
    handler.playVideo(playbackContext);
}

const playButton = document.querySelector('#playBtn');
playButton.addEventListener('click', playVideo);

function backToMainFromPlay() {
    let playbackContext = playback.getContext('2d');
    playbackContext.fillStyle = "#444444";
    playbackContext.fillRect(0, 0, playback.width, playback.height);

    mainPage.style.display = "block";
    playPage.style.display = "none";
}

const backButtonPlay = document.querySelector('#backBtnPlay');
backButtonPlay.addEventListener('click', backToMainFromPlay);

function onOpenCVReady() {
    console.log("OpenCV Ready.");
}

function addStep() {
    // Remove footer
    const footer = document.getElementById('footer');
    footer.remove();

    const stepDiv = document.createElement('div');
    stepDiv.className = 'step';
    stepDiv.id = 'step4';
    mainPage.appendChild(stepDiv);

    const frameInfo = document.createElement('div');
    frameInfo.className = 'frame-info';
    stepDiv.appendChild(frameInfo);

    const label = document.createElement('h2');
    label.innerHTML = 'Step: ';
    const capture = document.createElement('img');
    capture.className = 'capture';
    capture.src = 'images/camera.png';
    capture.alt = 'Capture button';
    const del = document.createElement('img');
    del.className = 'delete';
    del.src = 'images/trash.png';
    del.alt = 'Delete button';
    frameInfo.appendChild(label);
    frameInfo.appendChild(capture);
    frameInfo.appendChild(del);

    const frameImg = document.createElement('div');
    frameImg.className = 'frame-img';
    stepDiv.appendChild(frameImg);

    const preview = document.createElement('canvas');
    preview.className = 'preview';
    preview.width = '128';
    preview.height = '96';
    frameImg.appendChild(preview);

    const line = document.createElement('hr');
    stepDiv.appendChild(line);

    // Add footer
    mainPage.appendChild(footer);
}

const addButton = document.querySelector('#addBtn');
addButton.addEventListener('click', addStep);