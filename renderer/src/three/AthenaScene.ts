/**
 * AthenaScene.ts
 * 
 * Core Three.js scene management for Athena v1.
 * Handles scene, camera, lighting, and render loop.
 * 
 * Architecture principle:
 * - Imperative Three.js API (NOT React Three Fiber)
 * - Clean lifecycle: init → render loop → dispose
 * - No React dependencies
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class AthenaScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private container: HTMLDivElement | null = null;
  private controls: OrbitControls | null = null;

  // Scene objects for dynamic updates
  private ambientLight: THREE.AmbientLight | null = null;
  private keyLight: THREE.DirectionalLight | null = null;
  private fillLight: THREE.DirectionalLight | null = null;
  private backLight: THREE.DirectionalLight | null = null;
  private gridHelper: THREE.GridHelper | null = null;

  // Callbacks for external animation updates
  private onUpdateCallbacks: ((delta: number) => void)[] = [];

  constructor() {
    // Initialize scene
    this.scene = new THREE.Scene();

    // Background is set in setupEnvironment()
    // this.scene.background = new THREE.Color(0x09090b); 


    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(
      50, // Slightly wider FOV for better framing
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.2, 2.5); // Optimal viewing angle
    this.camera.lookAt(0, 1.0, 0);
    console.log('🟢 [AthenaScene] Camera positioned at (0, 1.2, 2.5) looking at (0, 1.0, 0)');

    // Initialize clock for delta time
    this.clock = new THREE.Clock();

    // Setup lighting
    this.setupLighting();

    // Setup environment
    this.setupEnvironment();
  }

  /**
   * Setup scene lighting
   * Professional 3-point lighting setup with HDRI-style illumination
   * Optimized for accurate color representation
   */
  /**
   * Setup scene lighting
   * Professional 3-point lighting setup with HDRI-style illumination
   * Optimized for "Fresh" look with vibrant accents
   */
  private setupLighting(): void {
    // Soft ambient light for base illumination - Increased brightness
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);
    console.log('🟢 [AthenaScene] Added ambient light (intensity: 0.6)');

    // Key light - main light source (front-right)
    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.8); // Brighter key
    this.keyLight.position.set(2, 4, 3);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.bias = -0.0001;
    this.scene.add(this.keyLight);
    console.log('🟢 [AthenaScene] Added key light');

    // Fill light - Cool Blue/Cyan to match the "fresh" theme
    this.fillLight = new THREE.DirectionalLight(0x00ffff, 1.2); // Cyan tint
    this.fillLight.position.set(-3, 1, 2);
    this.scene.add(this.fillLight);
    console.log('🟢 [AthenaScene] Added fill light (cyan tint)');

    // Back light - Warm/Magenta rim for contrast
    this.backLight = new THREE.DirectionalLight(0xff00ff, 1.5); // Magenta rim
    this.backLight.position.set(0, 3, -5);
    this.scene.add(this.backLight);
    console.log('🟢 [AthenaScene] Added back light (magenta rim)');

    // Hemisphere light - Sky (Blue) vs Ground (Purple)
    const hemiLight = new THREE.HemisphereLight(0x00aaff, 0xff00ff, 0.4);
    this.scene.add(hemiLight);
    console.log('🟢 [AthenaScene] Added hemisphere light');
  }

  /**
   * Setup environment elements
   * Adds procedural gradient sky, neon grid, and atmosphere
   */
  private setupEnvironment(): void {
    // 1. Procedural Gradient Skybox using CanvasTexture
    const canvas = document.createElement('canvas');
    canvas.width = 2;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    if (context) {
      const gradient = context.createLinearGradient(0, 0, 0, 512);
      // Top: Deep Purple/Night
      gradient.addColorStop(0, '#0f0c29');
      // Middle: Vibrant Cyan/Blue (Horizon)
      gradient.addColorStop(0.5, '#302b63');
      // Bottom: Brighter Cyan/White glow near horizon line
      gradient.addColorStop(1, '#24243e');

      context.fillStyle = gradient;
      context.fillRect(0, 0, 2, 512);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      this.scene.background = texture;
    } else {
      // Fallback
      this.scene.background = new THREE.Color(0x1a1a2e);
    }
    console.log('🟢 [AthenaScene] Added procedural gradient sky');

    // 2. Neon Grid Helper
    // Cyan center line, Deep Purple grid lines
    this.gridHelper = new THREE.GridHelper(50, 50, 0x00ffff, 0x4b0082);
    this.gridHelper.position.y = 0;
    (this.gridHelper.material as THREE.Material).transparent = true;
    (this.gridHelper.material as THREE.Material).opacity = 0.3;
    this.scene.add(this.gridHelper);
    console.log('🟢 [AthenaScene] Added neon grid helper');

    // 3. Reflective Floor (Glassy)
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x050510,
      roughness: 0.0, // Glassy
      metalness: 0.8,
      transparent: true,
      opacity: 0.5,
      envMapIntensity: 1.0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);
    console.log('🟢 [AthenaScene] Added glassy ground plane');

    // 4. Fog to blend floor into sky
    // Color should match the "bottom" or "horizon" color of the sky
    this.scene.fog = new THREE.FogExp2(0x24243e, 0.015);
    console.log('🟢 [AthenaScene] Added atmospheric fog');
  }

  /**
   * Initialize the scene with a DOM container
   * Sets up renderer and starts the render loop
   */
  public init(container: HTMLDivElement): void {
    console.log('🔵 [AthenaScene] Initializing scene...');
    console.log('🔵 [AthenaScene] Container size:', container.clientWidth, 'x', container.clientHeight);
    this.container = container;

    // Create WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    console.log('🟢 [AthenaScene] Renderer created');
    console.log('🟢 [AthenaScene] Renderer size:', this.renderer.getSize(new THREE.Vector2()));

    // Add canvas to container
    container.appendChild(this.renderer.domElement);
    console.log('🟢 [AthenaScene] Canvas added to DOM');

    // Setup orbit controls for rotating the model
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 6;
    this.controls.target.set(0, 1.0, 0);
    this.controls.maxPolarAngle = Math.PI / 1.5; // Prevent camera from going below ground
    this.controls.minPolarAngle = Math.PI / 6; // Keep camera above model
    this.controls.update();
    console.log('🟢 [AthenaScene] Orbit controls enabled with optimized settings');

    // Setup window resize handling
    this.setupResizeHandler();

    // Start render loop
    this.startRenderLoop();
    console.log('🟢 [AthenaScene] Render loop started');
    console.log('🟢 [AthenaScene] Camera position:', this.camera.position);
    console.log('🟢 [AthenaScene] Scene children:', this.scene.children.length);
  }

  /**
   * Update Light Intensity
   * Scales the intensity of all major lights
   */
  public setLightIntensity(scale: number): void {
    if (this.ambientLight) this.ambientLight.intensity = 0.4 * scale;
    if (this.keyLight) this.keyLight.intensity = 1.5 * scale;
    if (this.fillLight) this.fillLight.intensity = 0.8 * scale;
    if (this.backLight) this.backLight.intensity = 1.0 * scale;
  }

  /**
   * Set Grid Visibility
   */
  public setGridVisible(visible: boolean): void {
    if (this.gridHelper) {
      this.gridHelper.visible = visible;
    }
  }

  /**
   * Set Background Color
   */
  public setBackgroundColor(color: string): void {
    this.scene.background = new THREE.Color(color);
    // Also update fog to match for seamless look
    if (this.scene.fog instanceof THREE.FogExp2) {
      this.scene.fog.color.set(color);
    }
  }

  /**
   * Set Camera Field of View
   */
  public setCameraFov(fov: number): void {
    this.camera.fov = fov;
    this.camera.updateProjectionMatrix();
  }

  /**
   * Set Camera Target and Position
   * Smoothly transitions (or snaps) camera to new focus point
   */
  public setCameraTarget(position: THREE.Vector3, target: THREE.Vector3): void {
    if (!this.controls) return;

    this.camera.position.copy(position);
    this.controls.target.copy(target);
    this.controls.update();

    console.log(`🎥 [AthenaScene] Camera moved to:`, position);
  }

  /**
   * Handle window resize events
   * Updates camera aspect ratio and renderer size
   */
  private setupResizeHandler(): void {
    const handleResize = () => {
      if (!this.container || !this.renderer) return;

      const width = this.container.clientWidth;
      const height = this.container.clientHeight;

      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);
  }

  /**
   * Start the render loop
   * Uses requestAnimationFrame for smooth 60fps rendering
   */
  private startRenderLoop(): void {
    let frameCount = 0;
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      // Get delta time since last frame
      const delta = this.clock.getDelta();

      // Log first few frames with more detail
      if (frameCount < 5) {
        console.log(`🎬 [AthenaScene] Frame ${frameCount}:`);
        console.log(`   Delta: ${delta.toFixed(3)}s`);
        console.log(`   Scene children: ${this.scene.children.length}`);
        console.log(`   Camera position:`, this.camera.position);
        console.log(`   Camera looking at:`, this.camera.getWorldDirection(new THREE.Vector3()));
      }
      frameCount++;

      // Call all registered update callbacks
      this.onUpdateCallbacks.forEach(callback => callback(delta));

      // Update controls
      if (this.controls) {
        this.controls.update();
      }

      // Render the scene
      if (this.renderer) {
        this.renderer.render(this.scene, this.camera);
      }
    };

    animate();
  }

  /**
   * Add an object to the scene
   */
  public add(object: THREE.Object3D): void {
    console.log('🔵 [AthenaScene] Adding object to scene:', object);
    this.scene.add(object);
    console.log('🟢 [AthenaScene] Total scene children:', this.scene.children.length);
  }

  /**
   * Remove an object from the scene
   */
  public remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  /**
   * Register a callback to be called on each frame update
   * Useful for animation updates
   */
  public onUpdate(callback: (delta: number) => void): void {
    this.onUpdateCallbacks.push(callback);
  }

  /**
   * Remove an update callback
   */
  public removeUpdateCallback(callback: (delta: number) => void): void {
    const index = this.onUpdateCallbacks.indexOf(callback);
    if (index > -1) {
      this.onUpdateCallbacks.splice(index, 1);
    }
  }

  /**
   * Get the Three.js scene instance
   * Use sparingly - prefer using add/remove methods
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the camera instance
   * Useful for camera controls in the future
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Clean up all resources
   * MUST be called on component unmount to prevent memory leaks
   */
  public dispose(): void {
    // Stop render loop
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Clear update callbacks
    this.onUpdateCallbacks = [];

    // Dispose controls
    if (this.controls) {
      this.controls.dispose();
      this.controls = null;
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();

      // Remove canvas from DOM
      if (this.container && this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }

      this.renderer = null;
    }

    // Dispose all objects in scene
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry?.dispose();

        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      }
    });

    this.container = null;
  }
}
