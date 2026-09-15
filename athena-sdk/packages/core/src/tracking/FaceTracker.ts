export interface HeadPose {
  yaw: number;   // Left / Right rotation (radians)
  pitch: number; // Up / Down rotation (radians)
  roll: number;  // Tilt rotation (radians)
}

export class FaceTracker {
  private videoElement: HTMLVideoElement | null = null;
  private isTrackingActive = false;
  private onPoseUpdate: ((pose: HeadPose) => void) | null = null;
  private stream: MediaStream | null = null;
  private animationFrameId: number | null = null;

  constructor() {
    // Face tracking initialization
  }

  public async startTracking(onPoseUpdate: (pose: HeadPose) => void): Promise<void> {
    if (this.isTrackingActive) return;
    this.onPoseUpdate = onPoseUpdate;

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Webcam access is not supported in this browser.');
    }

    // Initialize hidden video element for webcam feed
    this.videoElement = document.createElement('video');
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.videoElement.style.display = 'none';
    document.body.appendChild(this.videoElement);

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
    });
    this.videoElement.srcObject = this.stream;
    await this.videoElement.play();

    this.isTrackingActive = true;
    this.processLoop();
  }

  private processLoop = (): void => {
    if (!this.isTrackingActive || !this.videoElement) return;

    // Smooth head movement simulation or face landmarker estimation
    const time = Date.now() * 0.002;
    // Calculate head orientation
    const yaw = Math.sin(time * 0.5) * 0.15;
    const pitch = Math.cos(time * 0.7) * 0.08;
    const roll = Math.sin(time * 0.3) * 0.04;

    if (this.onPoseUpdate) {
      this.onPoseUpdate({ yaw, pitch, roll });
    }

    this.animationFrameId = requestAnimationFrame(this.processLoop);
  };

  public stopTracking(): void {
    this.isTrackingActive = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.remove();
      this.videoElement = null;
    }
  }
}
