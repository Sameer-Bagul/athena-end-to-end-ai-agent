import {
    FaceLandmarker,
    FilesetResolver,
    type FaceLandmarkerResult
} from "@mediapipe/tasks-vision";

export class FaceTracker {
    private faceLandmarker: FaceLandmarker | null = null;
    private video: HTMLVideoElement | null = null;
    private lastVideoTime = -1;
    private requestAnimationFrameId: number | null = null;
    private onResults: ((result: FaceLandmarkerResult) => void) | null = null;

    async initialize() {
        console.log("📸 [FaceTracker] Initializing MediaPipe...");
        const filesetResolver = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU"
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: "VIDEO",
            numFaces: 1
        });
        console.log("📸 [FaceTracker] MediaPipe Initialized.");
    }

    async startTracking(callback: (result: FaceLandmarkerResult) => void) {
        if (!this.faceLandmarker) {
            await this.initialize();
        }

        this.onResults = callback;

        try {
            this.video = document.createElement("video");
            this.video.autoplay = true;
            this.video.playsInline = true;

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 } // Lower res for perf
            });

            this.video.srcObject = stream;
            await this.video.play();

            this.predictWebcam();
        } catch (err) {
            console.error("📸 [FaceTracker] Failed to access webcam:", err);
            throw err;
        }
    }

    predictWebcam = () => {
        if (!this.faceLandmarker || !this.video) return;

        if (this.video.currentTime !== this.lastVideoTime) {
            this.lastVideoTime = this.video.currentTime;
            const results = this.faceLandmarker.detectForVideo(this.video, performance.now());
            if (this.onResults) {
                this.onResults(results);
            }
        }

        this.requestAnimationFrameId = requestAnimationFrame(this.predictWebcam);
    };

    stop() {
        if (this.video && this.video.srcObject) {
            const stream = this.video.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            this.video = null;
        }
        if (this.requestAnimationFrameId) {
            cancelAnimationFrame(this.requestAnimationFrameId);
        }
        // Note: FaceLandmarker doesn't strictly need disposal unless switching models
    }
}
