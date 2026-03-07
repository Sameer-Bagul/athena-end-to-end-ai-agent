import { logger } from "./logger";
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
        logger.log("📸 [FaceTracker] Initializing MediaPipe...");
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
        logger.log("📸 [FaceTracker] MediaPipe Initialized.");
    }

    async startTracking(callback: (result: FaceLandmarkerResult) => void, deviceId?: string) {
        if (!this.faceLandmarker) {
            await this.initialize();
        }

        this.onResults = callback;

        try {
            // 1. Enumerate Devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === "videoinput");
            logger.log("📸 [FaceTracker] Available video devices:", videoDevices.map(d => d.label || "Unnamed Device"));

            // 2. Select requested device or find the best hardware camera
            let selectedDeviceId = deviceId || "";

            if (!selectedDeviceId) {
                const hardwareKeywords = ["integrated", "usb", "fhd", "camera", "webcam"];
                const bestDevice = videoDevices.find(d =>
                    hardwareKeywords.some(kw => d.label.toLowerCase().includes(kw)) &&
                    !d.label.toLowerCase().includes("iriun") &&
                    !d.label.toLowerCase().includes("droidcam")
                );

                if (bestDevice) {
                    logger.log("✨ [FaceTracker] Prioritizing hardware device:", bestDevice.label);
                    selectedDeviceId = bestDevice.deviceId;
                } else if (videoDevices.length > 0) {
                    logger.log("⚠️ [FaceTracker] No explicit hardware found, picking first device:", videoDevices[0].label);
                    selectedDeviceId = videoDevices[0].deviceId;
                }
            } else {
                logger.log("📸 [FaceTracker] Using requested device:", selectedDeviceId);
            }

            this.video = document.createElement("video");
            this.video.autoplay = true;
            this.video.playsInline = true;

            const constraints: MediaStreamConstraints = {
                video: selectedDeviceId
                    ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
                    : { width: { ideal: 1280 }, height: { ideal: 720 } }
            };

            logger.log("📸 [FaceTracker] Requesting stream with constraints:", JSON.stringify(constraints));
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            this.video.srcObject = stream;

            // Wait for video to be ready
            return new Promise((resolve, reject) => {
                if (!this.video) return reject("Video element is null");

                let checkAttempts = 0;
                this.video.onloadedmetadata = () => {
                    this.video!.play().then(() => {
                        // Check for the "2x2" issue
                        const checkResolution = () => {
                            if (!this.video) return;
                            if (this.video!.videoWidth > 10 && this.video!.videoHeight > 10) {
                                logger.log("✅ [FaceTracker] Camera stream active:", this.video!.videoWidth, "x", this.video!.videoHeight);
                                this.predictWebcam();
                                resolve(undefined);
                            } else if (checkAttempts < 10) {
                                checkAttempts++;
                                logger.log(`⚠️ [FaceTracker] Resolution low (${this.video!.videoWidth}x${this.video!.videoHeight}), waiting...`);
                                setTimeout(checkResolution, 200);
                            } else {
                                logger.error("❌ [FaceTracker] Camera stuck at low resolution (2x2). Likely blocked or inactive.");
                                reject("Camera stuck at 2x2");
                            }
                        };
                        checkResolution();
                    }).catch(reject);
                };

                this.video.onerror = (e) => {
                    logger.error("📸 [FaceTracker] Video element error:", e);
                    reject(e);
                };
            });
        } catch (err) {
            logger.error("📸 [FaceTracker] Failed to access webcam:", err);
            throw err;
        }
    }

    predictWebcam = () => {
        if (!this.faceLandmarker || !this.video) {
            // logger.warn("📸 [FaceTracker] Predict failed: landmarker or video null");
            return;
        }

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
        if (this.video) {
            const stream = this.video.srcObject as MediaStream;
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            this.video = null;
        }
        if (this.requestAnimationFrameId) {
            cancelAnimationFrame(this.requestAnimationFrameId);
        }
    }
}
