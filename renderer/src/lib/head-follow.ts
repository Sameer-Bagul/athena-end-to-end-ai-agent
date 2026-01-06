import * as THREE from "three";
import { VRM } from "@pixiv/three-vrm";

// We need to store state per VRM instance if multiple exist, 
// but for single user app, module level var is "okay" but risky.
// Better to return an update function.

export function createHeadFollower(vrm: VRM) {
    const targetPose = {
        yaw: 0,
        pitch: 0,
        roll: 0,
        lean: 0,
        distance: 0
    };

    // Smooth pose state
    const currentPose = {
        yaw: 0,
        pitch: 0,
        roll: 0,
        lean: 0
    };

    return {
        setTarget: (target: THREE.Vector3) => {
            // Legacy/Idle support: Convert target x/y to yaw/pitch
            targetPose.yaw = target.x * 0.5;
            targetPose.pitch = -target.y * 0.3;
            targetPose.roll = 0;
            targetPose.lean = 0;
        },
        setPose: (yaw: number, pitch: number, roll: number, distance: number) => {
            targetPose.yaw = yaw;
            targetPose.pitch = pitch;
            targetPose.roll = roll;

            // Map distance to lean (0..1)
            // Distance ~ 0.15 (far) to 0.4 (close)
            const minD = 0.15;
            const maxD = 0.4;
            targetPose.lean = THREE.MathUtils.clamp((distance - minD) / (maxD - minD), 0, 1);
        },
        update: () => {
            // Smooth Dampening
            const damp = 0.15;
            currentPose.yaw = THREE.MathUtils.lerp(currentPose.yaw, targetPose.yaw, damp);
            currentPose.pitch = THREE.MathUtils.lerp(currentPose.pitch, targetPose.pitch, damp);
            currentPose.roll = THREE.MathUtils.lerp(currentPose.roll, targetPose.roll, damp);
            currentPose.lean = THREE.MathUtils.lerp(currentPose.lean, targetPose.lean, damp);

            const head = vrm.humanoid?.getNormalizedBoneNode("head");
            const chest = vrm.humanoid?.getNormalizedBoneNode("upperChest") || vrm.humanoid?.getNormalizedBoneNode("chest");

            if (head) {
                // Apply Head Rotation (Y=Yaw, X=Pitch, Z=Roll)
                head.rotation.y = currentPose.yaw;
                head.rotation.x = currentPose.pitch;
                head.rotation.z = currentPose.roll;
            }

            if (chest) {
                // Apply Lean (rotate chest forward)
                // Max lean ~ 15 degrees
                chest.rotation.x = currentPose.lean * 0.3;
            }
        }
    };
}
