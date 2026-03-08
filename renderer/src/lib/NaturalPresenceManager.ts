import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { logger } from './logger';
import type { FaceLandmarkerResult } from '@mediapipe/tasks-vision';

// Define types for our dynamically imported modules
type HeadFollower = {
    update: () => void;
    setTarget: (target: THREE.Vector3) => void;
    setPose: (yaw: number, pitch: number, roll: number, distance: number) => void;
};

export class NaturalPresenceManager {
    private vrm: VRM | null = null;
    private headFollower: HeadFollower | null = null;
    private lookTargetObj: THREE.Object3D | null = null;

    private stopBlinking: (() => void) | null = null;
    private stopIdle: (() => void) | null = null;
    private faceTracker: any | null = null;

    // State
    private isFaceDetected = false;
    private lastFaceTime = 0;
    private isInitialized = false;
    private currentDeviceId = "";

    constructor() { }

    public async initialize(vrm: VRM, camera: THREE.Camera, deviceId: string = "") {
        if (this.isInitialized) this.dispose();

        this.vrm = vrm;
        this.currentDeviceId = deviceId;

        logger.log("✨ [NaturalPresence] Initializing with Camera reference...");

        // Setup visibility listener
        document.addEventListener("visibilitychange", this.handleVisibilityChange);

        // 0. Setup LookAt Target
        this.lookTargetObj = camera.getObjectByName("LookTarget") as THREE.Object3D;
        if (!this.lookTargetObj) {
            this.lookTargetObj = new THREE.Object3D();
            this.lookTargetObj.name = "LookTarget";
            camera.add(this.lookTargetObj);
        }

        if (vrm.lookAt) {
            vrm.lookAt.target = this.lookTargetObj;
        }

        try {
            logger.log("✨ [NaturalPresence] Step 1: Loading modules...");
            const [
                { startBlinking },
                { startIdle },
                { createHeadFollower },
                { FaceTracker }
            ] = await Promise.all([
                import('./blink'),
                import('./idle'),
                import('./head-follow'),
                import('./face-tracking')
            ]);

            // 2. Start Blinking
            this.stopBlinking = startBlinking(vrm);

            // 3. Setup Head Follower
            this.headFollower = createHeadFollower(vrm);

            // 4. Start Idle Loop
            this.stopIdle = startIdle(this.handleIdleTarget);

            // 5. Start Face Tracking
            this.faceTracker = new FaceTracker();
            this.faceTracker.startTracking((results: FaceLandmarkerResult) => {
                if (!this.isInitialized) logger.log("✨ [NaturalPresence] First face tracking result received!");
                this.handleFaceResults(results);
            }, this.currentDeviceId).catch((e: any) => {
                logger.error("❌ [NaturalPresence] Face Tracking failed:", e);
            });

            this.isInitialized = true;
            logger.log("✨ [NaturalPresence] initialization call finished.");

        } catch (error) {
            logger.error("❌ [NaturalPresence] Failed to load modules:", error);
        }
    }

    private handleVisibilityChange = () => {
        if (document.hidden) {
            logger.log("⏸️ [NaturalPresence] App hidden, pausing background systems...");
            if (this.faceTracker) this.faceTracker.stop();
            if (this.stopIdle) {
                this.stopIdle();
                this.stopIdle = null;
            }
        } else if (this.isInitialized && this.vrm) {
            logger.log("▶️ [NaturalPresence] App visible, resuming background systems...");
            // Resume Face Tracking
            if (this.faceTracker) {
                this.faceTracker.startTracking((results: FaceLandmarkerResult) => {
                    this.handleFaceResults(results);
                }, this.currentDeviceId).catch((e: any) => {
                    logger.error("❌ [NaturalPresence] Resume Tracking failed:", e);
                });
            }
            // Resume Idle
            if (!this.stopIdle) {
                import('./idle').then(({ startIdle }) => {
                    this.stopIdle = startIdle(this.handleIdleTarget);
                });
            }
        }
    };

    public async setCameraDevice(deviceId: string) {
        if (!this.faceTracker || this.currentDeviceId === deviceId) return;

        logger.log("✨ [NaturalPresence] Switching camera to:", deviceId);
        this.currentDeviceId = deviceId;

        // Stop current tracking
        this.faceTracker.stop();

        // Start again with new device
        this.faceTracker.startTracking((results: FaceLandmarkerResult) => {
            this.handleFaceResults(results);
        }, deviceId).catch((e: any) => {
            logger.error("❌ [NaturalPresence] Failed to switch camera:", e);
        });
    }

    public update(_delta: number) {
        if (!this.vrm || !this.headFollower || document.hidden) return;
        this.headFollower.update();
    }

    private handleIdleTarget = (target: THREE.Vector3) => {
        if (!this.isFaceDetected && (Date.now() - this.lastFaceTime > 1000)) {
            if (this.lookTargetObj && this.headFollower) {
                const scale = 0.5;
                this.lookTargetObj.position.set(target.x * scale, target.y * scale * 0.5, 2.0);
                this.headFollower.setTarget(target);
            }
        }
    };

    private handleFaceResults = (result: FaceLandmarkerResult) => {
        if (document.hidden || !this.headFollower || !this.lookTargetObj) return;

        if (result.faceLandmarks.length > 0) {
            this.isFaceDetected = true;
            this.lastFaceTime = Date.now();

            const nose = result.faceLandmarks[0][1];
            const leftEye = result.faceLandmarks[0][33];
            const rightEye = result.faceLandmarks[0][263];

            // 1. Yaw/Pitch
            const x = (nose.x - 0.5) * 2.0;
            const y = -(nose.y - 0.5) * 2.0;

            let headYaw = x * 0.5;
            let headPitch = y * 0.35;

            const maxYaw = 0.8;
            const maxPitch = 0.5;

            headYaw = THREE.MathUtils.clamp(headYaw, -maxYaw, maxYaw);
            headPitch = THREE.MathUtils.clamp(headPitch, -maxPitch, maxPitch);

            // 2. Roll (Disabled)
            const roll = 0;

            // 3. Distance
            const dX = rightEye.x - leftEye.x;
            const dist = Math.abs(dX);

            // 4. Saccades & Convergence
            const time = Date.now() * 0.001;
            const saccadeStrength = 0.015;
            const saccadeX = (Math.floor(Math.sin(time * 5) * 2) / 2) * saccadeStrength;
            const saccadeY = (Math.floor(Math.cos(time * 7) * 2) / 2) * saccadeStrength;

            const userZ = THREE.MathUtils.lerp(1.5, 0.5, THREE.MathUtils.smoothstep(dist, 0.1, 0.4));

            const lookSensitivity = 1.8;
            this.lookTargetObj.position.set(
                (x * lookSensitivity * -1) + saccadeX,
                (y * lookSensitivity) + saccadeY,
                userZ
            );

            this.headFollower.setPose(headYaw * -1, headPitch, roll, dist);
        } else {
            this.isFaceDetected = false;
        }
    };

    public dispose() {
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
        if (this.stopBlinking) this.stopBlinking();
        if (this.stopIdle) this.stopIdle();
        if (this.faceTracker) this.faceTracker.stop();
        this.headFollower = null;
        this.vrm = null;
        this.isInitialized = false;
    }
}

export const naturalPresenceManager = new NaturalPresenceManager();
