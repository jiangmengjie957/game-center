export enum ShapeType {
    HEART = 'HEART',
    FLOWER = 'FLOWER',
    STAR = 'STAR',
    BUDDHA = 'BUDDHA',
    FIREWORKS = 'FIREWORKS'
  }
  
  export interface ParticleConfig {
    color: string;
    shape: ShapeType;
    count: number;
  }
  
  export interface HandState {
    isOpen: boolean;
    openness: number; // 0.0 to 1.0
  }