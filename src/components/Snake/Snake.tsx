import React, { useEffect, useRef, useState, useCallback } from "react";
import type { Point } from "./types";

// Game Constants
const INITIAL_SNAKE_LENGTH = 10;
const SEGMENT_DISTANCE = 15; // Distance between snake segments
const APPLE_RADIUS = 15;
const SNAKE_HEAD_RADIUS = 20;
const SNAKE_BODY_RADIUS = 12;

// Utility to calculate distance
const getDistance = (p1: Point, p2: Point) => {
  return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const SnakeGame: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Game State Refs (using refs to avoid re-renders in the game loop)
  const snakeRef = useRef<Point[]>([]);
  const appleRef = useRef<Point>({ x: 0, y: 0 });
  const scoreRef = useRef(0);
  const isGameActiveRef = useRef(false);

  // Initialize Game State
  const initGame = (width: number, height: number) => {
    // Start in the middle
    const startX = width / 2;
    const startY = height / 2;

    snakeRef.current = [];
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      snakeRef.current.push({ x: startX, y: startY + i * SEGMENT_DISTANCE });
    }

    respawnApple(width, height);
    scoreRef.current = 0;
    setScore(0);
    isGameActiveRef.current = true;
  };

  const respawnApple = (width: number, height: number) => {
    const margin = 50;
    appleRef.current = {
      x: margin + Math.random() * (width - margin * 2),
      y: margin + Math.random() * (height - margin * 2),
    };
  };

  const onResults = useCallback((results: any) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (!canvas || !ctx) return;

    // 1. Setup Canvas Dimensions if changed
    if (
      canvas.width !== canvas.clientWidth ||
      canvas.height !== canvas.clientHeight
    ) {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
      if (!isGameActiveRef.current) {
        initGame(canvas.width, canvas.height);
      }
    }

    const width = canvas.width;
    const height = canvas.height;

    // 2. Clear & Draw Video Background
    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Draw mirrored video
    ctx.scale(-1, 1);
    ctx.translate(-width, 0);
    ctx.drawImage(results.image, 0, 0, width, height);
    ctx.restore();

    // 3. Detect Finger
    let target: Point | null = null;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];
      // Index finger tip is landmark 8
      const indexTip = landmarks[8];

      // Convert normalized coordinates to canvas coordinates
      // Note: We mirror the x coordinate (1 - x) because the video is mirrored
      target = {
        x: (1 - indexTip.x) * width,
        y: indexTip.y * height,
      };
    }

    // 4. Update Physics
    updateSnake(target, width, height);

    // 5. Draw Game Elements
    drawGame(ctx);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSnake = (target: Point | null, width: number, height: number) => {
    const snake = snakeRef.current;
    if (snake.length === 0) return;

    // Move Head
    if (target) {
      // Smoothly interpolate head towards target (finger)
      const head = snake[0];
      const speed = 0.2; // Easing factor

      head.x += (target.x - head.x) * speed;
      head.y += (target.y - head.y) * speed;
    }
    // If no finger detected, snake stays still or moves slowly? Let's just pause movement.

    // Move Body (Inverse Kinematics / Follow Leader)
    for (let i = 1; i < snake.length; i++) {
      const curr = snake[i];
      const prev = snake[i - 1];

      const dist = getDistance(curr, prev);

      // If segment is too far from previous, pull it closer
      if (dist > SEGMENT_DISTANCE) {
        const angle = Math.atan2(curr.y - prev.y, curr.x - prev.x);
        curr.x = prev.x + Math.cos(angle) * SEGMENT_DISTANCE;
        curr.y = prev.y + Math.sin(angle) * SEGMENT_DISTANCE;
      }
    }

    // Check Collision with Apple
    const head = snake[0];
    const apple = appleRef.current;

    if (getDistance(head, apple) < SNAKE_HEAD_RADIUS + APPLE_RADIUS) {
      // Eat apple
      scoreRef.current += 1;
      setScore(scoreRef.current);
      respawnApple(width, height);

      // Grow snake
      const tail = snake[snake.length - 1];
      // Add multiple segments for effect
      for (let k = 0; k < 2; k++) {
        snake.push({ x: tail.x, y: tail.y });
      }
    }
  };

  const drawGame = (ctx: CanvasRenderingContext2D) => {
    const snake = snakeRef.current;
    const apple = appleRef.current;

    // 确保蛇有足够的长度才绘制
    if (!snake || snake.length === 0) return;

    // Draw Apple
    ctx.shadowBlur = 20;
    ctx.shadowColor = "red";
    ctx.fillStyle = "#ff4444";
    ctx.beginPath();
    ctx.arc(apple.x, apple.y, APPLE_RADIUS, 0, 2 * Math.PI);
    ctx.fill();

    // Draw Snake Body
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ff00";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Draw connection line
    ctx.beginPath();
    ctx.moveTo(snake[0].x, snake[0].y);
    for (let i = 1; i < snake.length; i++) {
      // Quadratic bezier for smoothness
      const p0 = snake[i - 1];
      const p1 = snake[i];
      const midX = (p0.x + p1.x) / 2;
      const midY = (p0.y + p1.y) / 2;
      ctx.quadraticCurveTo(p0.x, p0.y, midX, midY);
    }
    // Finish last line
    if (snake.length > 1) {
      ctx.lineTo(snake[snake.length - 1].x, snake[snake.length - 1].y);
    }

    ctx.strokeStyle = "#00ff00";
    ctx.lineWidth = SNAKE_BODY_RADIUS * 2;
    ctx.stroke();

    // Draw Snake Head details
    const head = snake[0];
    ctx.fillStyle = "#ccffcc";
    ctx.beginPath();
    ctx.arc(head.x, head.y, SNAKE_HEAD_RADIUS, 0, 2 * Math.PI);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "black";
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(head.x - 6, head.y - 6, 4, 0, 2 * Math.PI);
    ctx.arc(head.x + 6, head.y - 6, 4, 0, 2 * Math.PI);
    ctx.fill();

    ctx.shadowBlur = 0; // Reset
  };

  useEffect(() => {
    let hands: any = null;
    let camera: any = null;

    const setupMediaPipe = async () => {
      if (!window.Hands || !window.Camera) {
        // Retry if scripts haven't loaded yet
        setTimeout(setupMediaPipe, 100);
        return;
      }

      try {
        hands = new window.Hands({
          locateFile: (file: any) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults(onResults);

        if (videoRef.current) {
          camera = new window.Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && hands) {
                await hands.send({ image: videoRef.current });
              }
            },
            width: 1280,
            height: 720,
          });

          await camera.start();
          setLoading(false);
        }
      } catch (err) {
        console.error("MediaPipe initialization error:", err);
        setError("Failed to initialize camera or AI model.");
        setLoading(false);
      }
    };

    setupMediaPipe();

    return () => {
      // Cleanup if possible. MediaPipe camera doesn't have a clean stop in this version easily accessible,
      // but we can stop the video element.
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, [onResults]);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* Hidden Video Source */}
      <video
        ref={videoRef}
        className="absolute top-0 left-0 w-full h-full object-cover hidden"
        playsInline
      />

      {/* Drawing Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover"
      />

      {/* UI Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md p-4 rounded-xl border border-white/10 text-white shadow-lg pointer-events-none">
        <h1 className="text-xl font-bold text-green-400 mb-1">🐍 体感贪吃蛇</h1>
        <div className="flex items-center gap-2">
          <span className="text-gray-300 text-sm">得分:</span>
          <span className="text-2xl font-mono font-bold text-white">
            {score}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-400 max-w-[200px]">
          将你的 <strong>食指</strong> 对准摄像头来控制蛇的移动
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
          <p className="text-lg">正在加载 AI 视觉识别...</p>
          <p className="text-sm text-gray-400 mt-2">
            请允许摄像头访问权限
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 text-white p-8 text-center">
          <div className="bg-red-900/50 p-6 rounded-lg border border-red-500">
            <h2 className="text-xl font-bold mb-2">错误</h2>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-500 rounded text-white transition-colors"
            >
              重新加载
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnakeGame;
