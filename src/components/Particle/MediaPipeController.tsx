import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { HandState } from './types';

declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

interface MediaPipeControllerProps {
  onHandStateChange: (state: HandState) => void;
  isActive: boolean;
}

export const MediaPipeController: React.FC<MediaPipeControllerProps> = ({ onHandStateChange, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<string>('Idle');
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  // Initialize MediaPipe Hands
  useEffect(() => {
    if (!window.Hands) {
      setStatus('Error: MediaPipe not loaded');
      return;
    }

    const hands = new window.Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    return () => {
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, []);

  const onResults = useCallback((results: any) => {
    if (!canvasRef.current || !videoRef.current) return;

    // Optional: Draw landmarks for debug
    // const ctx = canvasRef.current.getContext('2d');
    // if (ctx) {
    //   ctx.save();
    //   ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    //   ctx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height);
    //   if (results.multiHandLandmarks) {
    //     for (const landmarks of results.multiHandLandmarks) {
    //       window.drawConnectors(ctx, landmarks, window.HAND_CONNECTIONS, {color: '#00FF00', lineWidth: 5});
    //       window.drawLandmarks(ctx, landmarks, {color: '#FF0000', lineWidth: 2});
    //     }
    //   }
    //   ctx.restore();
    // }

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      processHandState(landmarks);
      setStatus('Active: Hand Detected');
    } else {
      // No hand detected - slowly decay or reset
      onHandStateChange({ isOpen: false, openness: 0 });
      setStatus('Active: Searching...');
    }
  }, [onHandStateChange]);

  const processHandState = (landmarks: any[]) => {
    // MediaPipe Hand Landmarks:
    // 0: Wrist
    // 5, 9, 13, 17: MCP joints (base of fingers)
    // 8, 12, 16, 20: Tips of fingers

    const wrist = landmarks[0];
    const tips = [8, 12, 16, 20]; // Index, Middle, Ring, Pinky
    const mcps = [5, 9, 13, 17];

    let totalOpenness = 0;

    tips.forEach((tipIdx, i) => {
      const mcpIdx = mcps[i];
      const tip = landmarks[tipIdx];
      const mcp = landmarks[mcpIdx];

      // Calculate 3D distances from wrist
      const distTip = Math.sqrt(
        Math.pow(tip.x - wrist.x, 2) + 
        Math.pow(tip.y - wrist.y, 2) + 
        Math.pow(tip.z - wrist.z, 2)
      );
      
      const distMcp = Math.sqrt(
        Math.pow(mcp.x - wrist.x, 2) + 
        Math.pow(mcp.y - wrist.y, 2) + 
        Math.pow(mcp.z - wrist.z, 2)
      );

      // Heuristic: When finger is open, Tip is significantly further from wrist than MCP.
      // When closed (fist), Tip is roughly same distance or closer than MCP (relative to wrist).
      // Ratio > 1.8 is roughly fully open. Ratio ~ 1.0 is closed.
      
      const ratio = distTip / distMcp;
      
      // Map ratio 1.0 -> 2.0 to 0.0 -> 1.0
      let fingerOpen = (ratio - 1.0) / 1.0;
      fingerOpen = Math.max(0, Math.min(1, fingerOpen));
      
      totalOpenness += fingerOpen;
    });

    const avgOpenness = totalOpenness / 4;
    
    // Smooth threshold
    const isOpen = avgOpenness > 0.4;

    onHandStateChange({
      isOpen,
      openness: avgOpenness
    });
  };

  // Manage Camera
  useEffect(() => {
    let camera: any = null;

    if (isActive && videoRef.current && handsRef.current) {
      setStatus('Initializing Camera...');
      
      try {
        camera = new window.Camera(videoRef.current, {
          onFrame: async () => {
            if (videoRef.current && handsRef.current) {
              await handsRef.current.send({ image: videoRef.current });
            }
          },
          width: 640,
          height: 480
        });
        
        camera.start()
          .then(() => setStatus('Active: Searching...'))
          .catch((err: any) => setStatus('Error: Camera ' + err.message));
          
        cameraRef.current = camera;
      } catch (err: any) {
        setStatus('Error: ' + err.message);
      }
    } else {
      if (cameraRef.current) {
        // MediaPipe Camera utils doesn't have a clean stop in all versions, 
        // but stopping the video element helps.
        cameraRef.current.stop();
        cameraRef.current = null;
      }
      setStatus('Idle');
    }

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [isActive]);

  return (
    <div className="absolute bottom-4 right-4 z-50 flex flex-col items-end pointer-events-none">
       <div className={`px-4 py-2 rounded-full mb-2 text-xs font-mono font-bold shadow-lg backdrop-blur-md border border-white/10 transition-colors duration-300 ${
        status.startsWith('Active') ? 'bg-green-500/80 text-white' : 
        status.startsWith('Error') ? 'bg-red-500/80 text-white' : 'bg-gray-900/80 text-gray-400'
      }`}>
        <div className="flex items-center gap-2">
           {status.startsWith('Active') && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
           {status}
        </div>
      </div>
      
      {/* Video Element for MediaPipe Processing (Hidden or Small) */}
      <video 
        ref={videoRef} 
        className="w-32 h-24 object-cover opacity-20 border border-white/20 rounded-lg pointer-events-auto" 
        style={{ display: isActive ? 'block' : 'none' }}
        playsInline 
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
