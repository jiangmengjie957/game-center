import * as THREE from 'three';
import { audioManager } from './audio';
import { GameState, TARGET_TYPES, BLADE_COLOR, BLADE_TRAIL_LENGTH, GRAVITY, SPAWN_RATE, BLADE_WIDTH } from './constants';

interface GameConfig {
  canvas: HTMLCanvasElement;
  onScoreUpdate: (score: number) => void;
  onLivesUpdate: (lives: number) => void;
  onGameOver: () => void;
}

class Target {
  mesh: THREE.Object3D;
  velocity: THREE.Vector3;
  type: any;
  isActive: boolean = true;
  rotationSpeed: THREE.Vector3;

  constructor(type: any, position: THREE.Vector3, velocity: THREE.Vector3) {
    this.type = type;
    this.velocity = velocity;
    this.rotationSpeed = new THREE.Vector3(
      Math.random() - 0.5,
      Math.random() - 0.5,
      Math.random() - 0.5
    ).multiplyScalar(5);

    // Create Sprite with Emoji
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.font = '96px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type.emoji, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    this.mesh = new THREE.Sprite(material);
    this.mesh.scale.set(1.5, 1.5, 1.5);
    this.mesh.position.copy(position);
  }

  update(dt: number) {
    // Physics
    this.velocity.y += GRAVITY * dt;
    this.mesh.position.add(this.velocity.clone().multiplyScalar(dt));
    this.mesh.rotation.x += this.rotationSpeed.x * dt;
    this.mesh.rotation.y += this.rotationSpeed.y * dt;
  }
}

class EarthButton {
  mesh: THREE.Mesh;
  constructor() {
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    
    // Procedural Earth Texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#006994'; // Ocean
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#4CAF50'; // Land
    // Simple noise-like drawing
    for(let i=0; i<40; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 256;
        const r = Math.random() * 50 + 20;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshStandardMaterial({ 
        map: texture,
        roughness: 0.5,
        metalness: 0.1
    });
    this.mesh = new THREE.Mesh(geometry, material);
  }
}

export class GameEngine {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  
  targets: Target[] = [];
  earth: EarthButton;
  
  // Blade visuals & Logic
  cursor: THREE.Mesh;
  targetHandPos: THREE.Vector3 = new THREE.Vector3(0, -10, 0); // The raw input position
  currentHandPos: THREE.Vector3 = new THREE.Vector3(0, -10, 0); // The smoothed position
  isHandDetected: boolean = false;

  bladeMesh: THREE.Mesh;
  bladePositions: THREE.Vector3[] = [];
  bladeGeometry: THREE.BufferGeometry;
  
  state: GameState = GameState.MENU;
  score: number = 0;
  lives: number = 3;
  
  lastTime: number = 0;
  spawnTimer: number = 0;
  
  callbacks: GameConfig;

  // Coordinate mapping
  viewWidth: number = 10;
  viewHeight: number = 10;

  constructor(config: GameConfig) {
    this.callbacks = config;
    
    // Scene Setup
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.z = 5;
    
    // Update view bounds
    const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
    this.viewHeight = 2 * Math.tan(vFOV / 2) * this.camera.position.z;
    this.viewWidth = this.viewHeight * this.camera.aspect;

    this.renderer = new THREE.WebGLRenderer({ canvas: config.canvas, alpha: true, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 5, 5);
    this.scene.add(dirLight);

    // --- Cursor Setup ---
    const cursorGeo = new THREE.SphereGeometry(0.15, 16, 16);
    const cursorMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    this.cursor = new THREE.Mesh(cursorGeo, cursorMat);
    // Add a glow effect
    const glowGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: BLADE_COLOR, transparent: true, opacity: 0.4 });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    this.cursor.add(glowMesh);
    this.scene.add(this.cursor);
    this.cursor.visible = false;

    // --- Blade Ribbon Setup ---
    const maxPoints = BLADE_TRAIL_LENGTH;
    this.bladeGeometry = new THREE.BufferGeometry();
    
    // Pre-allocate buffers (DynamicDrawUsage hint)
    const positions = new Float32Array(maxPoints * 2 * 3);
    const posAttr = new THREE.BufferAttribute(positions, 3);
    posAttr.setUsage(THREE.DynamicDrawUsage);
    this.bladeGeometry.setAttribute('position', posAttr);
    
    const colors = new Float32Array(maxPoints * 2 * 3);
    const colAttr = new THREE.BufferAttribute(colors, 3);
    colAttr.setUsage(THREE.DynamicDrawUsage);
    this.bladeGeometry.setAttribute('color', colAttr);

    const indices = [];
    for (let i = 0; i < maxPoints - 1; i++) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
    }
    this.bladeGeometry.setIndex(indices);

    const bladeMat = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        vertexColors: true,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    this.bladeMesh = new THREE.Mesh(this.bladeGeometry, bladeMat);
    this.bladeMesh.frustumCulled = false;
    this.scene.add(this.bladeMesh);

    // Earth Button
    this.earth = new EarthButton();
    this.scene.add(this.earth.mesh);
    this.earth.mesh.position.set(0, 0, 0);

    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
    this.viewHeight = 2 * Math.tan(vFOV / 2) * this.camera.position.z;
    this.viewWidth = this.viewHeight * this.camera.aspect;
  }

  startGame() {
    this.state = GameState.PLAYING;
    this.score = 0;
    this.lives = 3;
    this.targets.forEach(t => this.scene.remove(t.mesh));
    this.targets = [];
    this.earth.mesh.visible = false;
    this.callbacks.onScoreUpdate(this.score);
    this.callbacks.onLivesUpdate(this.lives);
    audioManager.playStart();
  }

  endGame() {
    this.state = GameState.GAME_OVER;
    this.earth.mesh.visible = true;
    this.callbacks.onGameOver();
  }

  spawnTarget() {
    const types = Object.values(TARGET_TYPES);
    const type = types[Math.floor(Math.random() * types.length)];
    
    const startX = (Math.random() - 0.5) * (this.viewWidth * 0.8);
    const startY = -this.viewHeight / 2 - 1;
    
    const velX = -startX * (0.5 + Math.random() * 0.5); 
    const velY = (this.viewHeight * 1.2) * (0.8 + Math.random() * 0.4) * 0.35; 
    
    const jumpVel = Math.sqrt(2 * Math.abs(GRAVITY) * (this.viewHeight * 0.6 + Math.random() * 2));

    const target = new Target(
      type,
      new THREE.Vector3(startX, startY, 0),
      new THREE.Vector3(velX * 0.5, jumpVel, 0)
    );
    
    this.scene.add(target.mesh);
    this.targets.push(target);
  }

  createExplosion(position: THREE.Vector3, color: string) {
    const particleCount = 10;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities: any = [];
    
    for(let i=0; i<particleCount; i++) {
        positions[i*3] = position.x;
        positions[i*3+1] = position.y;
        positions[i*3+2] = position.z;
        velocities.push(new THREE.Vector3(
            (Math.random()-0.5)*5,
            (Math.random()-0.5)*5,
            (Math.random()-0.5)*5
        ));
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: color, size: 0.1 });
    const particles = new THREE.Points(geometry, material);
    this.scene.add(particles);
    
    const fadeOut = () => {
        material.opacity -= 0.05;
        const posAttr = particles.geometry.attributes.position;
        for(let i=0; i<particleCount; i++) {
             posAttr.setXYZ(i, 
                posAttr.getX(i) + velocities[i].x * 0.03,
                posAttr.getY(i) + velocities[i].y * 0.03,
                posAttr.getZ(i) + velocities[i].z * 0.03
             );
        }
        posAttr.needsUpdate = true;
        if(material.opacity > 0) requestAnimationFrame(fadeOut);
        else this.scene.remove(particles);
    };
    material.transparent = true;
    fadeOut();
  }

  updateBladeGeometry() {
    const points = this.bladePositions;
    const positions = this.bladeGeometry.attributes.position.array as Float32Array;
    const colors = this.bladeGeometry.attributes.color.array as Float32Array;
    
    // Blade settings
    const baseWidth = BLADE_WIDTH;
    const color = new THREE.Color(BLADE_COLOR);

    // If not enough points, collapse everything to 0
    if (points.length < 2) {
        for (let i = 0; i < positions.length; i++) positions[i] = 0;
        this.bladeGeometry.attributes.position.needsUpdate = true;
        return;
    }

    // Build ribbon
    for (let i = 0; i < points.length; i++) {
        const index = i * 2;
        const curr = points[i];
        
        // Calculate direction for normal
        let dir = new THREE.Vector3();
        if (i < points.length - 1) {
            dir.subVectors(points[i], points[i+1]);
        } else if (i > 0) {
            dir.subVectors(points[i-1], points[i]);
        }
        dir.normalize();
        
        // Tapering width: thinner at the tail
        const progress = i / (BLADE_TRAIL_LENGTH - 1); // 0 at head, 1 at tail
        const currentWidth = baseWidth * (1 - Math.pow(progress, 2)); // Quadratic taper

        // Perpendicular vector (-y, x)
        const perp = new THREE.Vector3(-dir.y, dir.x, 0).multiplyScalar(currentWidth * 0.5);
        
        // Vertex 1
        positions[index * 3] = curr.x + perp.x;
        positions[index * 3 + 1] = curr.y + perp.y;
        positions[index * 3 + 2] = curr.z;
        
        // Vertex 2
        positions[(index + 1) * 3] = curr.x - perp.x;
        positions[(index + 1) * 3 + 1] = curr.y - perp.y;
        positions[(index + 1) * 3 + 2] = curr.z;

        // Colors
        const alpha = Math.max(0, 1.0 - progress * 1.5); // Fade out faster
        
        for (let k = 0; k < 2; k++) {
            colors[(index + k) * 3] = color.r * alpha;
            colors[(index + k) * 3 + 1] = color.g * alpha;
            colors[(index + k) * 3 + 2] = color.b * alpha;
        }
    }
    
    // Fill remaining buffer
    for (let i = points.length * 2 * 3; i < positions.length; i++) {
        positions[i] = positions[points.length * 2 * 3 - 3];
    }

    this.bladeGeometry.attributes.position.needsUpdate = true;
    this.bladeGeometry.attributes.color.needsUpdate = true;
  }

  // Called from vision loop (approx 30fps)
  updateHand(x: number, y: number) {
    this.isHandDetected = true;
    const worldX = -(x - 0.5) * this.viewWidth; 
    const worldY = -(y - 0.5) * this.viewHeight;
    this.targetHandPos.set(worldX, worldY, 0);
  }

  handleSlice(target: Target, index: number) {
    audioManager.playSlice();
    this.createExplosion(target.mesh.position, target.type.color);
    
    this.scene.remove(target.mesh);
    this.targets.splice(index, 1);

    if (target.type.type === 'BOMB') {
      audioManager.playBomb();
      this.endGame();
    } else {
      audioManager.playSplat();
      this.score += target.type.score;
      this.callbacks.onScoreUpdate(this.score);
    }
  }

  // Main Render Loop (approx 60fps)
  loop(time: number) {
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    // --- SMOOTH HAND TRACKING ---
    if (this.isHandDetected) {
        // Interpolate current position towards target position
        // Factor 0.3 gives a responsive yet smooth feel at 60fps
        this.currentHandPos.lerp(this.targetHandPos, 0.3);
        
        this.cursor.visible = true;
        this.cursor.position.copy(this.currentHandPos);

        // Update Blade Trail with high-frequency interpolated points
        this.bladePositions.unshift(this.currentHandPos.clone());
        if (this.bladePositions.length > BLADE_TRAIL_LENGTH) {
            this.bladePositions.pop();
        }
        
        this.updateBladeGeometry();
        
        // --- COLLISION DETECTION (Moved to loop for accuracy) ---
        if (this.bladePositions.length >= 2) {
            const p1 = this.bladePositions[0];
            const p2 = this.bladePositions[1];
            
            // Check Earth
            if (this.state === GameState.MENU || this.state === GameState.GAME_OVER) {
                if (p1.distanceTo(this.earth.mesh.position) < 1.2) {
                    this.startGame();
                }
            }

            // Check Targets
            if (this.state === GameState.PLAYING) {
                const line = new THREE.Line3(p1, p2);
                const closestPoint = new THREE.Vector3();

                for (let i = this.targets.length - 1; i >= 0; i--) {
                const t = this.targets[i];
                line.closestPointToPoint(t.mesh.position, true, closestPoint);
                const dist = closestPoint.distanceTo(t.mesh.position);
                
                if (dist < t.type.radius) {
                    this.handleSlice(t, i);
                }
                }
            }
        }
    }

    // Update Earth
    if (this.earth.mesh.visible) {
        this.earth.mesh.rotation.y += dt;
        this.earth.mesh.rotation.x += dt * 0.3;
    }

    // Update Targets
    if (this.state === GameState.PLAYING) {
      this.spawnTimer += dt;
      if (this.spawnTimer > SPAWN_RATE) {
        this.spawnTimer = 0;
        this.spawnTarget();
      }

      for (let i = this.targets.length - 1; i >= 0; i--) {
        const t = this.targets[i];
        t.update(dt);
        
        if (t.mesh.position.y < -this.viewHeight/2 - 2) {
          this.scene.remove(t.mesh);
          this.targets.splice(i, 1);
          
          if (t.type.type !== 'BOMB' && t.type.type !== 'POOP') {
             this.lives--;
             this.callbacks.onLivesUpdate(this.lives);
             if (this.lives <= 0) this.endGame();
          }
        }
      }
    } else {
        for (let i = this.targets.length - 1; i >= 0; i--) {
             this.scene.remove(this.targets[i].mesh);
        }
        this.targets = [];
    }

    this.renderer.render(this.scene, this.camera);
  }
}