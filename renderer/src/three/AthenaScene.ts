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

export class AthenaScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer | null = null;
  private clock: THREE.Clock;
  private animationFrameId: number | null = null;
  private container: HTMLDivElement | null = null;
  
  // Callbacks for external animation updates
  private onUpdateCallbacks: ((delta: number) => void)[] = [];

  constructor() {
    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Initialize camera
    // Position camera at a comfortable distance for viewing a character
    this.camera = new THREE.PerspectiveCamera(
      35, // FOV
      window.innerWidth / window.innerHeight, // Aspect
      0.1, // Near
      1000 // Far
    );
    this.camera.position.set(0, 1.4, 3);
    this.camera.lookAt(0, 1.2, 0);

    // Initialize clock for delta time
    this.clock = new THREE.Clock();

    // Setup lighting
    this.setupLighting();
  }

  /**
   * Setup scene lighting
   * Using a combination of directional and ambient light
   * for a balanced, professional look
   */
  private setupLighting(): void {
    // Add debug helpers
    const axesHelper = new THREE.AxesHelper(5);
    this.scene.add(axesHelper);
    console.log('🟢 [AthenaScene] Added axes helper (RGB = XYZ)');

    const gridHelper = new THREE.GridHelper(10, 10);
    this.scene.add(gridHelper);
    console.log('🟢 [AthenaScene] Added grid helper');

    // Ambient light for overall scene illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);
    console.log('🟢 [AthenaScene] Added ambient light');

    // Main directional light (key light)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(1, 2, 1);
    this.scene.add(directionalLight);

    // Fill light (softer, from opposite side)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-1, 1, -1);
    this.scene.add(fillLight);

    // Rim light (from behind, adds depth)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, 1, -2);
    this.scene.add(rimLight);
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
      alpha: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    console.log('🟢 [AthenaScene] Renderer created');
    console.log('🟢 [AthenaScene] Renderer size:', this.renderer.getSize(new THREE.Vector2()));

    // Add canvas to container
    container.appendChild(this.renderer.domElement);
    console.log('🟢 [AthenaScene] Canvas added to DOM');

    // Setup window resize handling
    this.setupResizeHandler();

    // Start render loop
    this.startRenderLoop();
    console.log('🟢 [AthenaScene] Render loop started');
    console.log('🟢 [AthenaScene] Camera position:', this.camera.position);
    console.log('🟢 [AthenaScene] Scene children:', this.scene.children.length);
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

      // Log first few frames
      if (frameCount < 3) {
        console.log(`🎬 [AthenaScene] Frame ${frameCount}: delta=${delta.toFixed(3)}s, scene children=${this.scene.children.length}`);
      }
      frameCount++;

      // Call all registered update callbacks
      this.onUpdateCallbacks.forEach(callback => callback(delta));

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
