// Simple type definitions for the global MediaPipe objects loaded via script tags

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface Results {
  multiHandLandmarks: Point[][];
  image: HTMLVideoElement | HTMLCanvasElement | ImageBitmap;
}

export interface HandsOptions {
  maxNumHands: number;
  modelComplexity: number;
  minDetectionConfidence: number;
  minTrackingConfidence: number;
}

export interface Hands {
  setOptions(options: HandsOptions): void;
  onResults(callback: (results: Results) => void): void;
  send(input: { image: HTMLVideoElement }): Promise<void>;
  close(): Promise<void>;
}

export interface Camera {
  start(): Promise<void>;
  stop(): void;
}

// Extend the window object
declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}