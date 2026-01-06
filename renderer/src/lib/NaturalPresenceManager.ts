import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';

// Define types for our dynamically imported modules
type HeadFollower = {
    update: () => void;
    setTarget: (target: THREE.Vector3) => void;
    setPose: (yaw: number, pitch: number, roll: number, distance: number) => void;
};

type FaceLandmarkerResult = import('@mediapipe/tasks-vision').FaceLandmarkerResult;

export class NaturalPresenceManager {
    private vrm: VRM | null = null;
    // private scene: THREE.Scene | null = null; // Unused
    private headFollower: HeadFollower | null = null;
    private lookTargetObj: THREE.Object3D | null = null;

    private stopBlinking: (() => void) | null = null;
    private stopIdle: (() => void) | null = null;
    private faceTracker: any | null = null; // Type as any to avoid eager import of FaceTracker class

    // State
    private isFaceDetected = false;
    private lastFaceTime = 0;
    private isInitialized = false;

    constructor() { }

    public async initialize(vrm: VRM, camera: THREE.Camera) {
        if (this.isInitialized) this.dispose();

        this.vrm = vrm;

        console.log("✨ [NaturalPresence] Initializing with Camera reference...");

        // 0. Setup LookAt Target
        this.lookTargetObj = camera.getObjectByName("LookTarget") as THREE.Object3D;
        if (!this.lookTargetObj) {
            this.lookTargetObj = new THREE.Object3D();
            this.lookTargetObj.name = "LookTarget";
            // Attach to CAMERA so tracking is screen-relative
            camera.add(this.lookTargetObj);
        }

        if (vrm.lookAt) {
            vrm.lookAt.target = this.lookTargetObj;
        }

        try {
            // 1. Load Modules Parallel
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
            // Warn: FaceTracker usually asks for permission immediately upon startTracking
            // We might want to delay this? For now, we init immediately as per behavior.
            this.faceTracker.startTracking(this.handleFaceResults).catch((e: any) => {
                console.error("❌ [NaturalPresence] Face Tracking failed:", e);
            });

            this.isInitialized = true;
            console.log("✨ [NaturalPresence] fully initialized.");

        } catch (error) {
            console.error("❌ [NaturalPresence] Failed to load modules:", error);
        }
    }

    /**
     * Called every frame from main loop
     */
    public update(_delta: number) {
        if (!this.vrm || !this.headFollower) return;

        // Head Follower needs frame update for smoothing
        this.headFollower.update();
    }

    private handleIdleTarget = (target: THREE.Vector3) => {
        // Only apply idle if NO face detected recently
        if (!this.isFaceDetected && (Date.now() - this.lastFaceTime > 1000)) {
            if (this.lookTargetObj && this.headFollower) {
                this.lookTargetObj.position.set(target.x, 1.25 + target.y, 1.5);
                this.headFollower.setTarget(target);
            }
        }
    };

    private handleFaceResults = (result: FaceLandmarkerResult) => {
        if (!this.headFollower || !this.lookTargetObj) return;

        if (result.faceLandmarks.length > 0) {
            this.isFaceDetected = true;
            this.lastFaceTime = Date.now();

            const nose = result.faceLandmarks[0][1];
            const leftEye = result.faceLandmarks[0][33];
            const rightEye = result.faceLandmarks[0][263];

            // 1. Yaw/Pitch
            // Calculate raw angles from screenspace
            const x = (nose.x - 0.5) * 2.0;
            const y = -(nose.y - 0.5) * 2.0;

            // Base Sensitivity
            let headYaw = x * 0.5;
            let headPitch = y * 0.35;

            // CLAMP to Human Limits (Neck constraints)
            // Yaw: +/- 50 degrees (approx 0.87 radians)
            // Pitch: +/- 30 degrees (approx 0.52 radians)
            const maxYaw = 0.8;
            const maxPitch = 0.5;

            headYaw = THREE.MathUtils.clamp(headYaw, -maxYaw, maxYaw);
            headPitch = THREE.MathUtils.clamp(headPitch, -maxPitch, maxPitch);

            // 2. Roll
            const dY = (rightEye.y - leftEye.y) * -1;
            const dX = rightEye.x - leftEye.x;

            // Disable roll mimicry - Avatar should stay upright
            const roll = 0;

            // 3. Distance
            const dist = Math.sqrt(dX * dX + dY * dY);

            // Apply
            // LookTarget is now child of CAMERA, so (0,0,dist) is center of screen.
            const lookSensitivity = 2.0;
            this.lookTargetObj.position.set(x * lookSensitivity * -1, y * lookSensitivity, -1.5);
            // Note: Z is negative because camera looks down -Z. 
            // Actually, if child of camera:
            // Camera looks down -Z? No, default Threejs camera looks down -Z.
            // But we want the target to be IN FRONT of the camera.
            // So Z should be negative (if looking down -Z). 
            // Wait, let's verify visual result. Usually Z=-1 is in front.

            this.headFollower.setPose(headYaw * -1, headPitch, roll, dist);

        } else {
            this.isFaceDetected = false;
        }
    };

    public dispose() {
        console.log("🧹 [NaturalPresence] Disposing...");
        if (this.stopBlinking) this.stopBlinking();
        if (this.stopIdle) this.stopIdle();

        if (this.faceTracker) {
            this.faceTracker.stop();
            this.faceTracker = null;
        }

        this.headFollower = null;
        this.vrm = null;
        this.isInitialized = false;
    }
}
