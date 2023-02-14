export const Camera = class {
    constructor(video) {
        this.video = video;

        this.constraints = { video: { facingMode: "environment"}, audio: false };

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
                    getUserMedia.call(navigator, this.constraints, resolve, reject);
                });
            }
        }

        navigator.mediaDevices
            .getUserMedia(this.constraints)     // ##### DIFFERENT FROM ORIGINAL, RECHECK IF DOESN'T WORK
            .then((stream) => {
                if ("srcObject" in this.video) {
                    this.video.srcObject = stream;
                }
                else {
                    this.video.src = window.URL.createObjectURL(stream);
                }
                this.video.play();
            })
            .catch(function(error) {
                console.error("Oops. Something is broken with video feed", error);
            });
    }
}