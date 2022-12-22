var video, canvas, context, imageData, detector;

// Set constraints for the video stream
var constraints = { video: { facingMode: {exact: "environment"}}, audio: false };

// Global object to track markers
var markers;

function onLoad() {
    console.log("Hellow?");


    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

    canvas.width = window.screen.width;
    canvas.height = canvas.width * ((0.25 * window.screen.height) / window.screen.width);
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

function tick() {
    requestAnimationFrame(tick);

    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        snapshot();

        markers = detector.detect(imageData);
        drawCorners(markers);
        drawId(markers);
    }
}

function snapshot() {
    // Scale video 
    let width = canvas.width;
    let height = width * (video.videoHeight / video.videoWidth);

    context.drawImage(video, 0, 0, width, height);
    imageData = context.getImageData(0, 0, video.videoWidth, video.videoHeight);
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
        console.log("Found marker: ", markers[i].id);

        corners = markers[i].corners;

        x = Infinity;
        y = Infinity;

        for (j = 0; j !== corners.length; ++ j) {
            corner = corners[j];

            x = Math.min(x, corner.x);
            y = Math.min(x, corner.x);
        }

        context.strokeText(markers[i].id, x, y);
    }
}

const gallery = document.querySelector('.gallery');
const click = document.querySelector('#click');

function captureInfo() {
    for (i = 0; i !== markers.length; ++ i) {
        const m_info = document.createElement('p');
        m_info.setAttribute('class', 'gallery');
        gallery.appendChild(m_info);

        m_info.innerHTML = "Marker: " + markers[i].id;
    }

    click.innerHTML = `${video.videoWidth}, ${video.videoHeight}`
    console.log(`Video dimensions: ${video.videoWidth}, ${video.videoHeight}`)
}

function captureImg() {
    const img = document.createElement('canvas');
    img.setAttribute('class', 'gallery');
    gallery.appendChild(img);

    // img.getContext("2d").drawImage(imageData, 0, 0, 50, 30);
    img.getContext("2d").putImageData(imageData, 0, 0);
}

window.addEventListener("load", onLoad, false);
click.addEventListener('click', captureInfo);