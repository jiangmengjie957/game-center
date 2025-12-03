import * as THREE from 'three';
import { ShapeType } from '../types/particle';

export const generateParticles = (shape: ShapeType, count: number, baseColorHex: string): { positions: Float32Array, colors: Float32Array } => {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  
  const baseColor = new THREE.Color(baseColorHex);
  const secondaryColor = new THREE.Color().setHSL((baseColor.getHSL({} as any).h + 0.1) % 1, 0.8, 0.5);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    let x = 0, y = 0, z = 0;
    let r = baseColor.r, g = baseColor.g, b = baseColor.b;

    if (shape === ShapeType.HEART) {
      // 3D Heart parametric equations
      const t = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI; 
      
      // Distribution: More points in the shell, some inside
      const radius = 10 * Math.cbrt(Math.random()); 
      
      const t2 = Math.random() * Math.PI * 2;
      x = 16 * Math.pow(Math.sin(t2), 3);
      y = 13 * Math.cos(t2) - 5 * Math.cos(2 * t2) - 2 * Math.cos(3 * t2) - Math.cos(4 * t2);
      z = (Math.random() - 0.5) * 5 * (1 - Math.abs(y)/20); // Taper z based on y
      
      // Scale down
      x *= 0.35; y *= 0.35; z *= 0.35;

      // Color Gradient: Darker red/pink at bottom, bright at top
      const mix = (y + 5) / 10;
      r = baseColor.r + mix * 0.2;
      g = baseColor.g * mix; // Fade green component
      b = baseColor.b + mix * 0.2;

    } else if (shape === ShapeType.FLOWER) {
      // Rose curve / Polar flower
      const k = 4; // Petals
      const theta = Math.random() * Math.PI * 2;
      const r_base = Math.cos(k * theta);
      // Add volume
      const r_dist = r_base * 5 + (Math.random() * 2);
      
      x = r_dist * Math.cos(theta);
      y = r_dist * Math.sin(theta);
      z = (Math.random() - 0.5) * (Math.abs(r_base) * 3); 

      // Center is yellow/bright, edges are base color
      const dist = Math.sqrt(x*x + y*y);
      if (dist < 1.5) {
        r = 1.0; g = 0.9; b = 0.5; // Pollen center
      } else {
        const variation = Math.random() * 0.2;
        r = baseColor.r - variation;
        g = baseColor.g - variation;
        b = baseColor.b + variation;
      }

    } else if (shape === ShapeType.STAR) {
      // Star/Planet with rings
      const type = Math.random();
      if (type > 0.3) {
        // Planet surface
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI;
        const rad = 3.5;
        x = rad * Math.sin(v) * Math.cos(u);
        y = rad * Math.sin(v) * Math.sin(u);
        z = rad * Math.cos(v);
        
        // Variation based on latitude
        r = baseColor.r * (Math.sin(v * 5) * 0.5 + 0.5);
        g = baseColor.g;
        b = baseColor.b + 0.2;
      } else {
        // Rings
        const angle = Math.random() * Math.PI * 2;
        const dist = 5 + Math.random() * 3;
        x = dist * Math.cos(angle);
        z = dist * Math.sin(angle);
        y = (Math.random() - 0.5) * 0.2;
        
        // Ring color
        r = 0.8; g = 0.8; b = 0.9;
      }

    } else if (shape === ShapeType.BUDDHA) {
      // Abstract Meditating Figure
      const section = Math.random();
      
      if (section < 0.15) {
        // Head / Halo
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI;
        const rad = 1.2;
        x = rad * Math.sin(v) * Math.cos(u);
        y = rad * Math.sin(v) * Math.sin(u) + 3.5;
        z = rad * Math.cos(v);
        // Golden glow
        r = 1.0; g = 0.8; b = 0.2; 
      } else if (section < 0.55) {
        // Body
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI;
        const rad = 2.5 * (0.8 + Math.random() * 0.2);
        x = rad * Math.sin(v) * Math.cos(u);
        y = (rad * Math.sin(v) * Math.sin(u) * 1.2); 
        z = rad * Math.cos(v);
        // Base color
        r = baseColor.r; g = baseColor.g; b = baseColor.b;
      } else {
        // Legs/Base
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI;
        const rad = 4.2;
        x = rad * Math.sin(v) * Math.cos(u);
        y = (rad * Math.sin(v) * Math.sin(u) * 0.5) - 2.5;
        z = rad * Math.cos(v);
        // Darker base
        r = baseColor.r * 0.6; g = baseColor.g * 0.6; b = baseColor.b * 0.6;
      }

    } else if (shape === ShapeType.FIREWORKS) {
      // Explosion
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * Math.PI;
      // Power law distribution for burst effect
      const rad = Math.pow(Math.random(), 0.5) * 8; 
      x = rad * Math.sin(v) * Math.cos(u);
      y = rad * Math.sin(v) * Math.sin(u);
      z = rad * Math.cos(v);

      // Gradient from center (hot/white) to edge (color)
      const heat = 1 - (rad / 8);
      r = baseColor.r * (1 - heat) + heat;
      g = baseColor.g * (1 - heat) + heat;
      b = baseColor.b * (1 - heat) + heat;
    }

    positions[i3] = x;
    positions[i3 + 1] = y;
    positions[i3 + 2] = z;

    colors[i3] = r;
    colors[i3 + 1] = g;
    colors[i3 + 2] = b;
  }

  return { positions, colors };
};