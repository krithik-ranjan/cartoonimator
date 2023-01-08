var video, canvas, context, imageData, detector;

// Set constraints for the video stream
var constraints = { video: { facingMode: {exact: "environment"}}, audio: false };
var cameraActive = false;

// Global object to track markers
var markers;
var markerMap = new Map();

// Cartoonimator handler 
let handler = new CartoonimatorHandler();

function onLoad() {
    console.log("Hellow?");


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
        for (i = 0; i !== markers.length; i++) {
            console.log(`Updating marker ${markers[i].id}`);
            markerMap.set(markers[i].id, markers[i].corners);
        }

        drawCorners(markers);
        drawId(markers);
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

function drawCorners(markers) {
    var corners, corner, i, j;

    context.lineWidth = 3;

    for (i = 0; i !== markers.length; ++ i) {
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

const click = document.querySelector('#click');

function saveFrame() {
    // Obtain active canvas
    var preview = activeFrame.querySelector('.preview');
    var previewContext = preview.getContext('2d');

    // Add current frame 
    console.log(`Markers found overall: `);
    for (const markerId of markerMap.keys()) {
        console.log(markerId);
    }

    let frameImg = cv.matFromImageData(imageData);
    let res = handler.addFrame(frameImg, activeFrame.id, markerMap);

    if (res === -1) {
        debugOut.innerHTML = `Try again`;
        return;
    }

    // Process image to display
    let dst = new cv.Mat()
    let dsize = new cv.Size(128, 96);
    // console.log(`${dsize}`);
    // img.convertTo(dst, cv.CV_8U, 0.5, 0);
    // cv.cvtColor(img, dst, cv.COLOR_RGBA2BGRA);
    cv.resize(frameImg, dst, dsize, 0, 0, cv.INTER_AREA);
    cv.imshow('hello', frameImg);

    console.log(`Original size: ${frameImg.cols}, ${frameImg.rows}; Compressed size: ${dst.cols}, ${dst.rows}`);
    let framePreview = new ImageData(new Uint8ClampedArray(dst.data),
                        dst.cols,
                        dst.rows);

    // previewContext.putImageData(framePreview, 0, 0);

    // previewContext.scale(0.1, 0.1)

    // console.log('Added image');

    capturePage.style.display = "none";
    mainPage.style.display = "block";

    cameraActive = false;
    markerMap.clear();

    dst.delete();
}

click.addEventListener('click', saveFrame);

function onOpenCVReady() {
    console.log("OpenCV Ready.");
}