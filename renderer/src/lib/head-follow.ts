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
            const neck = vrm.humanoid?.getNormalizedBoneNode("neck");
            const chest = vrm.humanoid?.getNormalizedBoneNode("upperChest") || vrm.humanoid?.getNormalizedBoneNode("chest");

            if (head) {
                // 70% of rotation on head
                head.rotation.y = currentPose.yaw * 0.7;
                head.rotation.x = currentPose.pitch * 0.7;
                head.rotation.z = currentPose.roll * 0.7;
            }

            if (neck) {
                // 20% on neck
                neck.rotation.y = currentPose.yaw * 0.2;
                neck.rotation.x = currentPose.pitch * 0.2;
                neck.rotation.z = currentPose.roll * 0.2;
            }

            if (chest) {
                // 10% on chest + Lean
                chest.rotation.y = currentPose.yaw * 0.1;
                chest.rotation.x = (currentPose.pitch * 0.1) + (currentPose.lean * 0.3);
                chest.rotation.z = currentPose.roll * 0.1;
            }
        }
    };
}
