// facialMapping.ts
// Maps FBX animation filenames to facial blendshape expressions

export type FacialExpression = {
  name: string; // e.g. 'Joy', 'Angry', 'Surprised'
  value: number; // 0.0 - 1.0
  duration?: number; // ms, optional
};

export type AnimationFacialMap = {
  [fbxFile: string]: FacialExpression[];
};

export const animationFacialMap: AnimationFacialMap = {
  'Talking.fbx': [
    { name: 'Joy', value: 0.7 },
    { name: 'Blink', value: 1.0, duration: 300 },
  ],
  'Jump.fbx': [
    { name: 'Surprised', value: 1.0 },
  ],
  'idle1.fbx': [
    { name: 'Neutral', value: 0.5 },
  ],
  // Add more mappings as needed
};