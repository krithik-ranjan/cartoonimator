import { Camera } from "./modules/Camera.js";
import { Cartoonimator } from "./modules/Cartoonimator.js";

var video, canvas, context, imageData, detector, playback;

// Set constraints for the video stream
// var constraints = { video: { facingMode: {exact: "environment"}}, audio: false };
var cameraActive = false;

var videoStream;
var mediaRecorder;
var chunks = [];

// Global object to track markers
var markers;
var markerMap = new Map();

// Cartoonimator handler 
let handler, newHandler;

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

    // Setup for video download 
    videoStream = playback.captureStream(10);
    mediaRecorder = new MediaRecorder(videoStream);

    mediaRecorder.ondataavailable = function(e) {
        chunks.push(e.data);
    }
    mediaRecorder.onstop = function(e) {
        var blob = new Blob(chunks, { 'type' : 'video/mp4' });
        chunks = [];
    
        const recordingURL = URL.createObjectURL(blob);
    
        const a = document.createElement('a');
        a.style = "display: none;";
        a.href = recordingURL;
        a.download = "video.mp4";
        document.body.appendChild(a);
    
        a.click();
    
        setTimeout(() => {
            URL.revokeObjectURL(recordingURL);
            document.body.removeChild(a);
        }, 0);
    }

    handler = new CartoonimatorHandler(playback.width, playback.height);
    newHandler = new Cartoonimator(playback.width, playback.height);
    
    detector = new AR.Detector({
        dictionaryName: 'ARUCO'
    });

    let cameraManager = new Camera(video);
    requestAnimationFrame(tick);
}

window.addEventListener("load", onLoad, false);

function tick() {
    requestAnimationFrame(tick);

    if (video.readyState === video.HAVE_ENOUGH_DATA && cameraActive) {
        cameraPreview();

        let foundMarkers = newHandler.detectMarkers(imageData);
        markerMap = newHandler.getMarkerMap();

        debugOut.innerHTML = 'Markers found: ';
        for (let markerId of markerMap.keys()) {
            if (markerId >= 100 && markerId < 110) debugOut.innerHTML += `${markerId} `;
        }

        if (foundMarkers) {
            let checkImage = document.getElementById("markerCheck");
            context.drawImage(checkImage, 20, 20, 80, 80);
        }
    }
}

function cameraPreview() {
    if (video.videoHeight < video.videoWidth) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, canvas.width, canvas.height);
        imageData = context.getImageData(0, 0, video.videoWidth, video.videoHeight);

    }
    else {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoWidth * 0.75, 0, 0, canvas.width, canvas.height);
        imageData = context.getImageData(0, 0, video.videoWidth, video.videoWidth * 0.75);
    }
}


let debugOut = document.getElementById('debug');

// Data structure to store info about current frames
// let presentFrames = new Map();
// let numScenes = 1;
// let numSteps = 1;
// presentFrames.set('s0', {active: false, timestamp: undefined});
// presentFrames.set('kf0', {active: false, timestamp: undefined});

// Functions to add a frame
const mainPage = document.querySelector("#main");
const capturePage = document.querySelector("#camera");
const playPage = document.querySelector('#play');
let captureButton = document.querySelectorAll(".capture");

// Variable for active frame
let activeFrame;
let activeFrameTime;

function showCapturePage() {
    // Remove main page and show capture page
    mainPage.style.display = "none";
    capturePage.style.display = "block";
    video.play();

    cameraActive = true;

    // Display parent 
    activeFrame = this.parentNode.parentNode.parentNode;
    console.log(`Active frame: ${activeFrame.className}`);
}

for (const button of captureButton){
    button.addEventListener('click', showCapturePage);
}

const clickBtn = document.querySelector('#clickBtn');
const timeBlank = document.querySelector('#timestamp');

function saveFrame() {

    // Obtain active canvas
    var preview = activeFrame.querySelector('.preview');
    var previewContext = preview.getContext('2d');

    // // Add current frame 
    // console.log(`Markers found overall: `);
    // for (const markerId of markerMap.keys()) {
    //     console.log(markerId);
    // }

    let frameImg = cv.matFromImageData(imageData);
    let res;

    if (activeFrame.className === 'scene') {
        // res = handler.flattenFrame(frameImg, markerMap, timestamp);
        res = newHandler.addScene(frameImg, activeFrame.id);

        if (res === 0) {
            debugOut.innerHTML = 'Scene not found. Try again.';
            return;
        }

        newHandler.updateSceneTimestamp(activeFrame.id, activeFrameTime);

        // Add to frame map
        // console.log(`Updating [${activeFrame.id}]`);
        // presentFrames.set(activeFrame.id, {active: true, timestamp: timestamp});
    }
    else if (activeFrame.className === 'keyframe') {
        res = newHandler.addKeyframe(frameImg, activeFrame.id, activeFrame.dataset.scene, activeFrameTime);
        // res = handler.flattenFrameWithObjects(frameImg, markerMap, timestamp);

        if (res === 0) {
            debugOut.innerHTML = 'No objects found. Try again.';
            return;
        };

        newHandler.updateKeyframeTimestamp(activeFrame.id, activeFrame.dataset.scene, activeFrameTime);

        // console.log(`Updating [${activeFrame.id}]`);
        // presentFrames.set(activeFrame.id, {active: true, timestamp: timestamp});
    }

    // Process image to display
    let dst = new cv.Mat()
    let dsize = new cv.Size(128, 96);
    cv.resize(frameImg, dst, dsize, 0, 0, cv.INTER_AREA);

    console.log(`Original size: ${frameImg.cols}, ${frameImg.rows}; Compressed size: ${dst.cols}, ${dst.rows}`);
    let framePreview = new ImageData(new Uint8ClampedArray(dst.data),
                        dst.cols,
                        dst.rows);

    previewContext.putImageData(framePreview, 0, 0);
    console.log(`ImageData size: ${framePreview.width}, ${framePreview.height}`);

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

function addKeyframe() {
    let activeScene = this.parentNode;
    let keyframeId = activeScene.id + newHandler.getNewKeyframeId(activeScene.id);
    activeFrameTime = newHandler.getNextKeyframeTimestamp(activeScene.id);
    console.log(`[DEBUG] Adding keyframe [${keyframeId}] to scene [${activeScene.id}] at time ${activeFrameTime}`);

    const addKeyframeButton = activeScene.querySelector('.add-keyframe');
    addKeyframeButton.remove();

    // const line = activeScene.querySelector('.scene-line');
    // line.remove();

//     activeScene.innerHTML += `
// <div class="keyframe" id="${keyframeId}">
//     <hr>
//     <div class="frame-info">
//         <h2 class="label">Step at <input type="number" id="timestamp" min="0" max="60" value=${activeFrameTime}>
//         </h2>
//         <img class="capture" src="images/camera.png" alt="Capture button">
//         <img class="delete" src="images/trash.png" alt="Delete button">    
//     </div>
//     <div class="frame-img">
//         <canvas class="preview" width="128" height="96"></canvas>
//     </div>
// </div>
// `;

    const keyframeDiv = document.createElement('div');
    keyframeDiv.className = 'keyframe';
    keyframeDiv.id = keyframeId;
    keyframeDiv.dataset.scene = activeScene.id;

    let sceneFramesDiv = activeScene.querySelector('.scene-frames');
    sceneFramesDiv.appendChild(keyframeDiv);

    keyframeDiv.innerHTML = `
    <h3 class="frame-label">Keyframe <input type="number" class="timestamp" min="0" max="60" step="0.1" value=${activeFrameTime}></h3>
    <div class="frame-content">
        <canvas class="preview frame-img" width="128" height="96"></canvas>
        <div class="frame-info">
            <button class="capture" alt="Capture button">CAPTURE</button>
            <button class="delete" alt="Capture button">DELETE</button>   
        </div>
    </div>
`;

    // const line = document.createElement('hr');
    // keyframeDiv.appendChild(line);

    // const frameInfo = document.createElement('div');
    // frameInfo.className = 'frame-info';
    // keyframeDiv.appendChild(frameInfo);

    // const label = document.createElement('h2');
    // label.innerHTML = 'Kf at';
    // label.className = 'label';
    // const textbox = document.createElement('input');
    // textbox.type = 'number';
    // textbox.id = 'timestamp';
    // textbox.min = 0;
    // textbox.max = 60;
    // textbox.value = activeFrameTime;
    // textbox.addEventListener('change', updateTimestamp);
    // const capture = document.createElement('img');
    // capture.className = 'capture';
    // capture.src = 'images/camera.png';
    // capture.alt = 'Capture button';
    // capture.addEventListener('click', showCapturePage);
    // const del = document.createElement('img');
    // del.className = 'delete';
    // del.src = 'images/trash.png';
    // del.alt = 'Delete button';
    // del.addEventListener('click', deleteFrame);
    // frameInfo.appendChild(label);
    // frameInfo.appendChild(textbox);
    // frameInfo.appendChild(document.createElement('br'));
    // frameInfo.appendChild(capture);
    // frameInfo.appendChild(del);

    // const frameImg = document.createElement('div');
    // frameImg.className = 'frame-img';
    // keyframeDiv.appendChild(frameImg);

    // const preview = document.createElement('canvas');
    // preview.className = 'preview';
    // preview.width = '128';
    // preview.height = '96';
    // frameImg.appendChild(preview);

    activeScene.appendChild(addKeyframeButton);
    // activeScene.appendChild(line);

    let addKeyframeButtons = document.querySelectorAll(".add-keyframe");
    for (const button of addKeyframeButtons){
        button.addEventListener('click', addKeyframe);
    }

    let timeTextbox = document.querySelectorAll('.timestamp');
    for (const textbox of timeTextbox) {
        textbox.addEventListener('change', updateTimestamp);
    }

    let captureButtons = document.querySelectorAll('.capture');
    for (const button of captureButtons) {
        button.addEventListener('click', showCapturePage);
    }

    let deleteButtons = document.querySelectorAll('.delete');
    for (const button of deleteButtons) {
        button.addEventListener('click', deleteFrame);
    }

    // Show capture page to click scene
    mainPage.style.display = "none";
    capturePage.style.display = "block";
    video.play();
    cameraActive = true;
    activeFrame = document.getElementById(keyframeId);
}

// let addKeyframeButtons = document.querySelectorAll(".add-keyframe");
// for (const button of addKeyframeButtons){
//     button.addEventListener('click', addKeyframe);
// }

function addScene() {
    let sceneId = newHandler.getNewSceneId();
    activeFrameTime = newHandler.getNextSceneTimestamp();
    console.log(`[DEBUG] Adding new scene [${sceneId}] at time ${activeFrameTime}`);

    const addSceneButton = document.querySelector('.add-scene');
    addSceneButton.remove();

//     mainPage.innerHTML += `
// <div class="scene" id="${sceneId}">
//     <div class="frame-info">
//         <h2 class="label">Scene at</h2>
//         <img class="capture" src="images/camera.png" alt="Capture button">
//         <img class="delete" src="images/trash.png" alt="Delete button">    
//     </div>
//     <div class="frame-img">
//         <canvas class="preview" id="hello" width="128" height="96"></canvas>
//     </div>
//     <button type="button" class="add-keyframe">Add Keyframe</button>
//     <hr class="scene-line">
// </div>
// `;

    const sceneDiv = document.createElement('div');
    sceneDiv.className = 'scene';
    sceneDiv.id = sceneId;

    mainPage.appendChild(sceneDiv);

//     sceneDiv.innerHTML = `
//     <div class="frame-info">
//         <h2 class="label">Scene</h2>
//         <img class="capture" src="images/camera.png" alt="Capture button">
//         <img class="delete" src="images/trash.png" alt="Delete button">    
//     </div>
//     <div class="frame-img">
//         <canvas class="preview" width="128" height="96"></canvas>
//     </div>
//     <button type="button" class="add-keyframe">Add Keyframe</button>
//     <hr class="scene-line">
// `;

    sceneDiv.innerHTML = `
    <h2 class="label">Scene 1</h2>
    <div class="scene-content">
        <canvas class="preview frame-img" id="hello" width="128" height="96"></canvas>

        <div class="frame-info">
            <button class="capture" alt="Capture button">CAPTURE</button>
            <button class="delete" alt="Capture button">DELETE</button>
        </div>
    </div>
    <div class="scene-frames"></div>
    <button class="add-keyframe">Add Keyframe</button>
`;

    // const frameInfo = document.createElement('div');
    // frameInfo.className = 'frame-info';
    // sceneDiv.appendChild(frameInfo);

    // const label = document.createElement('h2');
    // label.innerHTML = 'Scene at';
    // label.className = 'label';
    // const textbox = document.createElement('input');
    // textbox.type = 'number';
    // textbox.id = 'timestamp';
    // textbox.min = 0;
    // textbox.max = 60;
    // textbox.value = activeFrameTime;
    // textbox.addEventListener('change', updateTimestamp);
    // const capture = document.createElement('img');
    // capture.className = 'capture';
    // capture.src = 'images/camera.png';
    // capture.alt = 'Capture button';
    // capture.addEventListener('click', showCapturePage);
    // const del = document.createElement('img');
    // del.className = 'delete';
    // del.src = 'images/trash.png';
    // del.alt = 'Delete button';
    // del.addEventListener('click', deleteFrame);
    // frameInfo.appendChild(label);
    // frameInfo.appendChild(textbox);
    // frameInfo.appendChild(document.createElement('br'));
    // frameInfo.appendChild(capture);
    // frameInfo.appendChild(del);

    // const frameImg = document.createElement('div');
    // frameImg.className = 'frame-img';
    // sceneDiv.appendChild(frameImg);

    // const preview = document.createElement('canvas');
    // preview.className = 'preview';
    // preview.width = '128';
    // preview.height = '96';
    // frameImg.appendChild(preview);

    // const addKeyframeButton = document.createElement('button');
    // addKeyframeButton.type = 'button';
    // addKeyframeButton.className = 'add-keyframe';
    // addKeyframeButton.innerHTML = 'Add Keyframe';
    // addKeyframeButton.addEventListener('click', addKeyframe);
    // sceneDiv.appendChild(addKeyframeButton);

    // const line = document.createElement('hr');
    // sceneDiv.appendChild(line);

    mainPage.appendChild(addSceneButton);

    let addKeyframeButtons = document.querySelectorAll(".add-keyframe");
    for (const button of addKeyframeButtons){
        button.addEventListener('click', addKeyframe);
    }

    let timeTextbox = document.querySelectorAll('.timestamp');
    for (const textbox of timeTextbox) {
        textbox.addEventListener('change', updateTimestamp);
    }

    let captureButtons = document.querySelectorAll('.capture');
    for (const button of captureButtons) {
        button.addEventListener('click', showCapturePage);
    }

    let deleteButtons = document.querySelectorAll('.delete');
    for (const button of deleteButtons) {
        button.addEventListener('click', deleteFrame);
    }

    // Show capture page to click scene
    mainPage.style.display = "none";
    capturePage.style.display = "block";
    video.play();
    cameraActive = true;
    activeFrame = document.getElementById(sceneId);
}

let addSceneButton = document.querySelector(".add-scene");
addSceneButton.addEventListener('click', addScene);
// for (const button of addSceneButtons){
//     button.addEventListener('click', addScene);
// }

function updateTimestamp() {
    let activeFrameType = this.parentNode.parentNode.className;
    let activeFrameId = this.parentNode.parentNode.id;

    console.log(`[INFO] Updating timestamp of ${activeFrameType} [${activeFrameId}] to ${this.value}`);
    
    if (activeFrameType === 'scene') {
        newHandler.updateSceneTimestamp(activeFrameId, this.value);
    }
    else {
        newHandler.updateKeyframeTimestamp(activeFrameId, activeFrame.dataset.scene, this.value);
    }
}

function deleteFrame() {
    // Display parent 
    activeFrame = this.parentNode.parentNode.parentNode;
    console.log(`[INFO] Deleting ${activeFrame.id}`);

    if (activeFrame.className === 'scene')
        newHandler.deleteScene(activeFrame.id);
    else 
        newHandler.deleteKeyframe(activeFrame.id, activeFrame.dataset.scene);

    activeFrame.remove();
}

function playVideo() {
    mainPage.style.display = "none";
    playPage.style.display = "block";
    
    let playbackContext = playback.getContext('2d');

    // handler.playVideo(playbackContext, mediaRecorder);
    newHandler.playVideo(playbackContext, mediaRecorder);
}

const playButton = document.querySelector('#playBtn');
playButton.addEventListener('click', playVideo);

function downloadVideo() {
    mainPage.style.display = "none";
    playPage.style.display = "block";
    
    let playbackContext = playback.getContext('2d');

    // handler.playVideo(playbackContext, mediaRecorder);
    newHandler.downloadVideo(playbackContext, mediaRecorder);
}

const downloadButton = document.querySelector('#downloadBtn');
downloadButton.addEventListener('click', downloadVideo);

function backToMainFromPlay() {
    let playbackContext = playback.getContext('2d');
    playbackContext.fillStyle = "#444444";
    playbackContext.fillRect(0, 0, playback.width, playback.height);

    mainPage.style.display = "block";
    playPage.style.display = "none";
}

const backButtonPlay = document.querySelector('#backBtnPlay');
backButtonPlay.addEventListener('click', backToMainFromPlay);









// function addStep() {
//     // Remove footer
//     const footer = document.getElementById('footer');
//     footer.remove();

//     const stepDiv = document.createElement('div');
//     stepDiv.className = 'step';
//     stepDiv.id = `step${numSteps}`;
//     numSteps++;

//     mainPage.appendChild(stepDiv);

//     const frameInfo = document.createElement('div');
//     frameInfo.className = 'frame-info';
//     stepDiv.appendChild(frameInfo);

//     const label = document.createElement('h2');
//     label.innerHTML = 'Step at _';
//     label.className = 'label';
//     const capture = document.createElement('img');
//     capture.className = 'capture';
//     capture.src = 'images/camera.png';
//     capture.alt = 'Capture button';
//     const del = document.createElement('img');
//     del.className = 'delete';
//     del.src = 'images/trash.png';
//     del.alt = 'Delete button';
//     frameInfo.appendChild(label);
//     frameInfo.appendChild(capture);
//     frameInfo.appendChild(del);

//     const frameImg = document.createElement('div');
//     frameImg.className = 'frame-img';
//     stepDiv.appendChild(frameImg);

//     const preview = document.createElement('canvas');
//     preview.className = 'preview';
//     preview.width = '128';
//     preview.height = '96';
//     frameImg.appendChild(preview);

//     const line = document.createElement('hr');
//     stepDiv.appendChild(line);

//     // Add footer
//     mainPage.appendChild(footer);

//     // Add event listeners
//     captureButton = document.querySelectorAll(".capture");
//     for (const button of captureButton){
//         button.addEventListener('click', captureFrame);
//     }
//     deleteButton = document.querySelectorAll(".delete");
//     for (const button of deleteButton){
//         button.addEventListener('click', deleteFrame);
//     }
// }

// const addButton = document.querySelector('#addBtn');
// addButton.addEventListener('click', addStep);

// function addScene() {
//     // Remove footer
//     const footer = document.getElementById('footer');
//     footer.remove();

//     const sceneDiv = document.createElement('div');
//     sceneDiv.className = 'scene';
//     sceneDiv.id = `scene${numScenes}`;
//     numScenes++;

//     mainPage.appendChild(sceneDiv);

//     const frameInfo = document.createElement('div');
//     frameInfo.className = 'frame-info';
//     sceneDiv.appendChild(frameInfo);

//     const label = document.createElement('h2');
//     label.innerHTML = 'Scene at _';
//     label.className = 'label';
//     const capture = document.createElement('img');
//     capture.className = 'capture';
//     capture.src = 'images/camera.png';
//     capture.alt = 'Capture button';
//     const del = document.createElement('img');
//     del.className = 'delete';
//     del.src = 'images/trash.png';
//     del.alt = 'Delete button';
//     frameInfo.appendChild(label);
//     frameInfo.appendChild(capture);
//     frameInfo.appendChild(del);

//     const frameImg = document.createElement('div');
//     frameImg.className = 'frame-img';
//     sceneDiv.appendChild(frameImg);

//     const preview = document.createElement('canvas');
//     preview.className = 'preview';
//     preview.width = '128';
//     preview.height = '96';
//     frameImg.appendChild(preview);

//     const line = document.createElement('hr');
//     sceneDiv.appendChild(line);

//     // Add footer
//     mainPage.appendChild(footer);

//     // Add event listeners
//     captureButton = document.querySelectorAll(".capture");
//     for (const button of captureButton){
//         button.addEventListener('click', captureFrame);
//     }
//     deleteButton = document.querySelectorAll(".delete");
//     for (const button of deleteButton){
//         button.addEventListener('click', deleteFrame);
//     }
// }

// const addSceneButton = document.querySelector('#addSceneBtn');
// addSceneButton.addEventListener('click', addScene);