import * as THREE from 'three';
import { VRM } from '@pixiv/three-vrm';
import { AthenaVRMLoader } from './VRMLoader.js';
import { VisemeFrame, ExpressionPreset } from '../types/index.js';

export class AthenaScene {
  private canvas: HTMLCanvasElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;

  public currentVRM: VRM | null = null;
  private loader: AthenaVRMLoader;
  private isAnimationLoopActive = false;
  private mixer: THREE.AnimationMixer | null = null;
  private currentAction: THREE.AnimationAction | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.loader = new AthenaVRMLoader();
    this.clock = new THREE.Clock();

    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0f172a); // Slate-900 background default

    // Camera setup
    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    this.camera = new THREE.PerspectiveCamera(30, aspect, 0.1, 20);
    this.camera.position.set(0, 1.35, 1.2); // Framing upper body & face
    this.camera.lookAt(0, 1.3, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting setup
    this.setupLighting();

    // Resize listener
    window.addEventListener('resize', this.onResize);
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(1.5, 2.5, 2.0);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.5); // Soft blue rim light
    fillLight.position.set(-1.5, 1.5, -1.0);
    this.scene.add(fillLight);
  }

  public async loadAvatar(url: string, onProgress?: (progress: number) => void): Promise<VRM> {
    if (this.currentVRM) {
      this.scene.remove(this.currentVRM.scene);
      this.currentVRM = null;
      if (this.mixer) {
        this.mixer.stopAllAction();
        this.mixer = null;
      }
    }

    const vrm = await this.loader.load(url, onProgress);
    this.currentVRM = vrm;
    this.scene.add(vrm.scene);

    this.mixer = new THREE.AnimationMixer(vrm.scene);

    this.setExpression('neutral');
    this.startLoop();
    return vrm;
  }

  public async playVRMA(vrmaUrl: string): Promise<THREE.AnimationAction | null> {
    if (!this.currentVRM || !this.mixer) return null;

    try {
      const clip = await this.loader.loadAnimation(vrmaUrl, this.currentVRM);
      if (this.currentAction) {
        this.currentAction.fadeOut(0.3);
      }
      const action = this.mixer.clipAction(clip);
      action.reset().fadeIn(0.3).play();
      this.currentAction = action;
      return action;
    } catch (err) {
      console.warn('Failed to load VRMA animation:', err);
      return null;
    }
  }

  public applyVisemes(visemes: VisemeFrame): void {
    if (!this.currentVRM || !this.currentVRM.expressionManager) return;
    const em = this.currentVRM.expressionManager;

    em.setValue('aa', visemes.aa);
    em.setValue('ih', visemes.ih);
    em.setValue('ou', visemes.ou);
    em.setValue('ee', visemes.ee);
    em.setValue('oh', visemes.oh);
  }

  public setExpression(expression: ExpressionPreset, value = 1.0): void {
    if (!this.currentVRM || !this.currentVRM.expressionManager) return;
    const em = this.currentVRM.expressionManager;

    const presets: ExpressionPreset[] = ['neutral', 'happy', 'angry', 'sad', 'relaxed', 'surprised'];
    presets.forEach((p) => {
      if (p === expression) {
        em.setValue(p, value);
      } else {
        em.setValue(p, 0);
      }
    });
  }

  public updateHeadPose(pose: { yaw: number; pitch: number; roll: number }): void {
    if (!this.currentVRM || !this.currentVRM.humanoid) return;
    const headNode = this.currentVRM.humanoid.getNormalizedBoneNode('head');
    if (headNode) {
      headNode.rotation.y = pose.yaw;
      headNode.rotation.x = pose.pitch;
      headNode.rotation.z = pose.roll;
    }
  }

  public startLoop(): void {
    if (this.isAnimationLoopActive) return;
    this.isAnimationLoopActive = true;
    this.animate();
  }

  public stopLoop(): void {
    this.isAnimationLoopActive = false;
  }

  private animate = (): void => {
    if (!this.isAnimationLoopActive) return;
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();
    if (this.mixer) {
      this.mixer.update(delta);
    }
    if (this.currentVRM) {
      this.currentVRM.update(delta);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private onResize = (): void => {
    if (!this.canvas) return;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    this.camera.aspect = width / height || 1;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  public dispose(): void {
    this.stopLoop();
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
