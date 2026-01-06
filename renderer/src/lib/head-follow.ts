import * as THREE from "three";
import { VRM } from "@pixiv/three-vrm";

// We need to store state per VRM instance if multiple exist, 
// but for single user app, module level var is "okay" but risky.
// Better to return an update function.

export function createHeadFollower(vrm: VRM) {
    const internalHeadTarget = new THREE.Vector3();
    const internalSmoothedHead = new THREE.Vector3();

    return {
        setTarget: (target: THREE.Vector3) => {
            internalHeadTarget.copy(target).multiplyScalar(0.25);
        },
        update: () => {
            internalSmoothedHead.lerp(internalHeadTarget, 0.1);

            const head = vrm.humanoid?.getNormalizedBoneNode("head");
            if (!head) return;

            head.rotation.y = internalSmoothedHead.x * 0.5;   // yaw (left/right)
            head.rotation.x = -internalSmoothedHead.y * 0.3;  // pitch (up/down)
        }
    };
}
