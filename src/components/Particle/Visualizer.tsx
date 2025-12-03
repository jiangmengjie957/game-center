import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { ShapeType, type HandState } from './types';
import { generateParticles } from '../../utils/shapes';

// Generate a soft glow texture programmatically
const getGlowTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 32, 32);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  return texture;
};

// Fix for TypeScript errors
declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      ambientLight: any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      pointsMaterial: any;
      ambientLight: any;
    }
  }
}

interface VisualizerProps {
  shape: ShapeType;
  color: string;
  handState: HandState;
}

const PARTICLE_COUNT = 12000;

const Particles: React.FC<VisualizerProps> = ({ shape, color, handState }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const targetPositionsRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  const targetColorsRef = useRef<Float32Array>(new Float32Array(PARTICLE_COUNT * 3));
  
  const glowTexture = useMemo(() => getGlowTexture(), []);

  // Initial Data
  const { positions: initialPositions, colors: initialColors } = useMemo(() => {
    return generateParticles(ShapeType.FIREWORKS, PARTICLE_COUNT, '#ffffff'); 
  }, []);

  // Update target when shape or color changes
  useEffect(() => {
    const { positions, colors } = generateParticles(shape, PARTICLE_COUNT, color);
    targetPositionsRef.current = positions;
    targetColorsRef.current = colors;
  }, [shape, color]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const geometry = pointsRef.current.geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const colors = geometry.attributes.color.array as Float32Array;
    
    const targetPos = targetPositionsRef.current;
    const targetCol = targetColorsRef.current;

    // Movement Physics
    const lerpSpeed = 2.5 * delta;
    
    // Hand Control
    // When hand is open: scale up significantly
    // When hand is closed: condense slightly below 1.0
    const baseScale = 0.8;
    const expansion = baseScale + (handState.openness * 1.5); 
    
    const noiseAmount = handState.openness * 0.2; // Vibrate more when open
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;

      // 1. Position Lerp
      const tx = targetPos[i3];
      const ty = targetPos[i3 + 1];
      const tz = targetPos[i3 + 2];

      // "Breathing" effect using sine wave on position
      const breath = 1 + Math.sin(time * 2 + i) * 0.02;

      positions[i3] += (tx * expansion * breath - positions[i3]) * lerpSpeed;
      positions[i3 + 1] += (ty * expansion * breath - positions[i3 + 1]) * lerpSpeed;
      positions[i3 + 2] += (tz * expansion * breath - positions[i3 + 2]) * lerpSpeed;

      // 2. Color Lerp
      colors[i3] += (targetCol[i3] - colors[i3]) * lerpSpeed;
      colors[i3 + 1] += (targetCol[i3 + 1] - colors[i3 + 1]) * lerpSpeed;
      colors[i3 + 2] += (targetCol[i3 + 2] - colors[i3 + 2]) * lerpSpeed;

      // 3. Jitter/Noise from Hand State
      if (handState.isOpen) {
        positions[i3] += (Math.random() - 0.5) * noiseAmount;
        positions[i3 + 1] += (Math.random() - 0.5) * noiseAmount;
        positions[i3 + 2] += (Math.random() - 0.5) * noiseAmount;
      }
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    
    // Continuous slow rotation
    pointsRef.current.rotation.y = time * 0.1;
    // Tilt based on mouse/hand could go here, but keeping it simple for now
    pointsRef.current.rotation.z = Math.sin(time * 0.2) * 0.1;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={initialPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={initialColors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        map={glowTexture}
        size={0.3} // Increased size for glow effect
        vertexColors={true} // Enable per-particle colors
        transparent={true}
        opacity={0.9}
        sizeAttenuation={true}
        blending={THREE.AdditiveBlending} // Makes them glow when overlapping
        depthWrite={false} // Crucial for transparency
      />
    </points>
  );
};

export const Visualizer: React.FC<VisualizerProps> = (props) => {
  return (
    <div className="fixed inset-0 bg-black">
      <Canvas dpr={[1, 2]} camera={{ position: [0, 0, 18], fov: 60 }}>
        <Particles {...props} />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate={true} 
          autoRotateSpeed={0.5} 
          maxPolarAngle={Math.PI / 1.5}
          minPolarAngle={Math.PI / 3}
        />
        {/* Ambient light doesn't affect Basic/Points material much but good practice */}
        <ambientLight intensity={0.5} />
      </Canvas>
    </div>
  );
};