import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export class VisionManager {
  private handLandmarker: HandLandmarker | null = null;
  private lastVideoTime = -1;
  private isInitializing = false;

  async initialize() {
    if (this.isInitializing || this.handLandmarker) return;
    this.isInitializing = true;

    try {
      // Use 'latest' to maximize compatibility with the injected importmap version in this environment.
      // For local development, this ensures you get the latest WASM matching your npm install.
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      console.log('Vision initialized successfully');
    } catch (e) {
      console.error('Failed to init vision:', e);
      // Fallback or retry logic could go here
    } finally {
      this.isInitializing = false;
    }
  }

  detect(video: HTMLVideoElement) {
    // Ensure HandLandmarker is ready and video has enough data
    if (!this.handLandmarker) return null;
    if (video.readyState < 2) return null; // 2 = HAVE_CURRENT_DATA
    if (video.currentTime === this.lastVideoTime) return null;
    
    try {
      this.lastVideoTime = video.currentTime;
      return this.handLandmarker.detectForVideo(video, performance.now());
    } catch (error) {
      console.warn("Detection error (usually temporary):", error);
      return null;
    }
  }
}

export const visionManager = new VisionManager();