import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './engine';
import { visionManager } from './vision';
import { audioManager } from './audio';
import { GameState } from './constants';
import { Camera, RefreshCw, Trophy, Heart } from 'lucide-react';

const FruitNinja = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const skeletonCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const requestRef = useRef<number>(0);
  
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [loading, setLoading] = useState(true);

  // Initialize Game and Vision
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      // 1. Init Vision
      await visionManager.initialize();
      
      if (!mounted) return;

      // 2. Setup Camera
      if (videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 640 }, 
              height: { ideal: 480 }, 
              frameRate: { ideal: 30 } 
            } 
          });
          videoRef.current.srcObject = stream;
          // Ensure it plays
          await videoRef.current.play().catch(e => console.error("Video play failed:", e));
        } catch (err) {
          console.error("Camera access denied:", err);
          alert("Please enable camera access to play!");
        }
      }

      // 3. Init Engine
      if (canvasRef.current && !engineRef.current) {
        engineRef.current = new GameEngine({
          canvas: canvasRef.current,
          onScoreUpdate: setScore,
          onLivesUpdate: setLives,
          onGameOver: () => setGameState(GameState.GAME_OVER)
        });
      }
      
      setLoading(false);
      startLoop();
    };

    init();

    return () => {
      mounted = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      // Optional: Stop camera stream tracks if strict cleanup needed
    };
  }, []);

  const startLoop = () => {
    const loop = (time: number) => {
      requestRef.current = requestAnimationFrame(loop);

      // Vision Processing
      if (videoRef.current && skeletonCanvasRef.current) {
        const result = visionManager.detect(videoRef.current);
        const ctx = skeletonCanvasRef.current.getContext('2d');
        
        // Draw Skeleton Feed
        if (ctx) {
          ctx.clearRect(0, 0, skeletonCanvasRef.current.width, skeletonCanvasRef.current.height);
          
          if (result && result.landmarks) {
             for (const landmarks of result.landmarks) {
                // Draw connections
                drawSkeleton(ctx, landmarks);
                
                // Update Game Hand Position (Index Finger Tip is index 8)
                const indexTip = landmarks[8];
                if (indexTip && engineRef.current) {
                  engineRef.current.updateHand(indexTip.x, indexTip.y);
                }
             }
          }
        }
      }

      // Game Physics/Render
      if (engineRef.current) {
        engineRef.current.loop(time);
        
        // Sync React State for Menu visibility (optimization: do less frequently if performance hit)
        if (engineRef.current.state !== gameState) {
          setGameState(engineRef.current.state);
        }
      }
    };
    requestAnimationFrame(loop);
  };

  const drawSkeleton = (ctx: CanvasRenderingContext2D, landmarks: any[]) => {
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#ff0000';
    
    // Draw connections (Simplified for index finger game)
    // Connecting Index finger (5 -> 6 -> 7 -> 8)
    ctx.beginPath();
    ctx.moveTo(landmarks[5].x * ctx.canvas.width, landmarks[5].y * ctx.canvas.height);
    ctx.lineTo(landmarks[6].x * ctx.canvas.width, landmarks[6].y * ctx.canvas.height);
    ctx.lineTo(landmarks[7].x * ctx.canvas.width, landmarks[7].y * ctx.canvas.height);
    ctx.lineTo(landmarks[8].x * ctx.canvas.width, landmarks[8].y * ctx.canvas.height);
    ctx.stroke();

    // Draw Index finger tip specifically bigger
    const idx = landmarks[8];
    if (idx) {
        ctx.beginPath();
        ctx.arc(idx.x * ctx.canvas.width, idx.y * ctx.canvas.height, 8, 0, 2 * Math.PI);
        ctx.fillStyle = 'cyan';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        ctx.stroke();
    }
  };

  const handleStartInteraction = () => {
    audioManager.resume();
  };

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden" onClick={handleStartInteraction}>
      
      {/* 3D Game Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10" />

      {/* UI Overlay */}
      <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-8">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start text-white">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold bg-black/50 p-2 rounded backdrop-blur-sm">
              <span className="text-cyan-400">Gesture</span> Fruit Slicer
            </h1>
            <p className="text-sm bg-black/30 p-2 rounded max-w-md">
              Raise your index finger to slice. <br/>
              Slice the <span className="text-green-400 font-bold">EARTH</span> to start!
            </p>
          </div>
          
          {gameState === GameState.PLAYING && (
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-4xl font-bold bg-black/50 px-4 py-2 rounded-full">
                <Trophy className="text-yellow-400" size={32} />
                {score}
              </div>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <Heart 
                    key={i} 
                    className={`${i < lives ? 'text-red-500 fill-red-500' : 'text-gray-600'} transition-colors`} 
                    size={32} 
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center Messages */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          {loading && (
            <div className="flex flex-col items-center text-white animate-pulse">
              <RefreshCw className="animate-spin mb-4" size={48} />
              <div className="text-2xl">Loading AI Vision...</div>
            </div>
          )}
          
          {!loading && gameState === GameState.MENU && (
            <div className="bg-black/60 p-6 rounded-xl backdrop-blur text-white border border-white/20">
              <h2 className="text-4xl font-bold mb-4">Ready?</h2>
              <p className="text-xl">Slice the Globe to Begin!</p>
            </div>
          )}

          {!loading && gameState === GameState.GAME_OVER && (
            <div className="bg-red-900/80 p-8 rounded-xl backdrop-blur text-white border border-red-500 shadow-2xl animate-bounce">
              <h2 className="text-6xl font-black mb-2">GAME OVER</h2>
              <p className="text-3xl mb-4">Final Score: {score}</p>
              <p className="text-xl text-red-200">Slice the Globe to Retry</p>
            </div>
          )}
        </div>

        {/* Bottom Right Camera Feed */}
        <div className="absolute bottom-4 right-4 w-64 h-48 bg-black border-2 border-gray-700 rounded-lg overflow-hidden shadow-lg pointer-events-auto">
          <video 
            ref={videoRef} 
            className="absolute inset-0 w-full h-full object-cover opacity-60 scale-x-[-1]" 
            muted 
            playsInline
            autoPlay
          />
          <canvas 
            ref={skeletonCanvasRef} 
            width={640} 
            height={480} 
            className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" 
          />
          <div className="absolute top-2 left-2 flex items-center gap-1 text-xs text-green-400 font-mono bg-black/70 px-2 rounded">
            <Camera size={12} />
            LIVE FEED
          </div>
        </div>
      </div>
    </div>
  );
};

export default FruitNinja;