import { VRM } from "@pixiv/three-vrm";
import * as THREE from "three";

/**
 * A map from Mixamo bone names to VRM Humanoid bone names.
 */
export const mixamoVRMRigMap: { [key: string]: string } = {
    "mixamorigHips": "hips",
    "mixamorigSpine": "spine",
    "mixamorigSpine1": "chest",
    "mixamorigSpine2": "upperChest",
    "mixamorigNeck": "neck",
    "mixamorigHead": "head",
    "mixamorigLeftShoulder": "leftShoulder",
    "mixamorigLeftArm": "leftUpperArm",
    "mixamorigLeftForeArm": "leftLowerArm",
    "mixamorigLeftHand": "leftHand",
    "mixamorigLeftHandThumb1": "leftThumbMetacarpal",
    "mixamorigLeftHandThumb2": "leftThumbProximal",
    "mixamorigLeftHandThumb3": "leftThumbDistal",
    "mixamorigLeftHandIndex1": "leftIndexProximal",
    "mixamorigLeftHandIndex2": "leftIndexIntermediate",
    "mixamorigLeftHandIndex3": "leftIndexDistal",
    "mixamorigLeftHandMiddle1": "leftMiddleProximal",
    "mixamorigLeftHandMiddle2": "leftMiddleIntermediate",
    "mixamorigLeftHandMiddle3": "leftMiddleDistal",
    "mixamorigLeftHandRing1": "leftRingProximal",
    "mixamorigLeftHandRing2": "leftRingIntermediate",
    "mixamorigLeftHandRing3": "leftRingDistal",
    "mixamorigLeftHandPinky1": "leftLittleProximal",
    "mixamorigLeftHandPinky2": "leftLittleIntermediate",
    "mixamorigLeftHandPinky3": "leftLittleDistal",
    "mixamorigRightShoulder": "rightShoulder",
    "mixamorigRightArm": "rightUpperArm",
    "mixamorigRightForeArm": "rightLowerArm",
    "mixamorigRightHand": "rightHand",
    "mixamorigRightHandThumb1": "rightThumbMetacarpal",
    "mixamorigRightHandThumb2": "rightThumbProximal",
    "mixamorigRightHandThumb3": "rightThumbDistal",
    "mixamorigRightHandIndex1": "rightIndexProximal",
    "mixamorigRightHandIndex2": "rightIndexIntermediate",
    "mixamorigRightHandIndex3": "rightIndexDistal",
    "mixamorigRightHandMiddle1": "rightMiddleProximal",
    "mixamorigRightHandMiddle2": "rightMiddleIntermediate",
    "mixamorigRightHandMiddle3": "rightMiddleDistal",
    "mixamorigRightHandRing1": "rightRingProximal",
    "mixamorigRightHandRing2": "rightRingIntermediate",
    "mixamorigRightHandRing3": "rightRingDistal",
    "mixamorigRightHandPinky1": "rightLittleProximal",
    "mixamorigRightHandPinky2": "rightLittleIntermediate",
    "mixamorigRightHandPinky3": "rightLittleDistal",
    "mixamorigLeftUpLeg": "leftUpperLeg",
    "mixamorigLeftLeg": "leftLowerLeg",
    "mixamorigLeftFoot": "leftFoot",
    "mixamorigLeftToeBase": "leftToes",
    "mixamorigRightUpLeg": "rightUpperLeg",
    "mixamorigRightLeg": "rightLowerLeg",
    "mixamorigRightFoot": "rightFoot",
    "mixamorigRightToeBase": "rightToes",
};

/**
 * Retargets a Mixamo animation clip to a VRM instance.
 * @param vrm The target VRM.
 * @param clip The source AnimationClip (from Mixamo FBX).
 * @returns A new AnimationClip retargeted to the VRM instance.
 */
export function retargetMixamoClip(vrm: VRM, clip: THREE.AnimationClip): THREE.AnimationClip {
    const tracks: THREE.KeyframeTrack[] = [];

    clip.tracks.forEach((track) => {
        // Track name is usually "mixamorigBone.position" or ".quaternion"
        const trackSplits = track.name.split('.');
        const mixamoBoneName = trackSplits[0];
        const propertyName = trackSplits[1];

        const vrmBoneName = mixamoVRMRigMap[mixamoBoneName];

        if (vrmBoneName) {
            const vrmNode = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName as any);

            if (vrmNode) {
                // Renaming logic: Use the actual Object3D name in the scene
                const vrmNodeName = vrmNode.name;

                // VRM 0.0/1.0 Humanoid Description requires us to modify the hierarchy? 
                // No, Three.js AnimationMixer matches by name.


                if (propertyName === 'quaternion') {
                    const newTrack = track.clone();
                    newTrack.name = `${vrmNodeName}.quaternion`;

                    // Mixamo Hips often face backwards relative to some VRM implementations.
                    // However, if we remove position/translation, simple rotation often works better.
                    // Let's keep the rotation as-is (standard copy) first.
                    // If the user said "doing the opposite", it might be the 180 flip was WRONG or MISSING.
                    // But usually, removing Hips Position fixes the "flying/twisting" which looks like "opposite".

                    // Let's try removing the 180 hack and relying on pure rotation copy, 
                    // BUT strictly filtering out Position tracks for Hips.

                    tracks.push(newTrack);
                }
                // CRITICAL FIX: Completely ignore Mixamo Hips POSITION tracks.
                // Mixamo animations often have root motion that conflicts with VRM world coordinates,
                // causing the model to fly away, twist, or move "opposite".
                // By ignoring position, we keep the model in place (pinned hips), which is standard for "Playground" preview.
                /*
                else if (propertyName === 'position') {
                    if (vrmBoneName === 'hips') {
                        const newTrack = track.clone();
                        newTrack.name = `${vrmNodeName}.position`;
                        const values = newTrack.values;
                        for (let i = 0; i < values.length; i++) {
                            values[i] *= 0.01; // Scale still needed if we kept it
                        }
                        tracks.push(newTrack);
                    }
                }
                */
            }
        }
    });

    return new THREE.AnimationClip('vrmAnimation', clip.duration, tracks);
}
