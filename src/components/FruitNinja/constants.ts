export enum GameState {
    MENU = 'MENU',
    PLAYING = 'PLAYING',
    GAME_OVER = 'GAME_OVER'
  }
  
  export const TARGET_TYPES = {
    WATERMELON: { type: 'WATERMELON', emoji: '🍉', score: 10, color: '#ff5555', radius: 0.5 },
    ORANGE: { type: 'ORANGE', emoji: '🍊', score: 10, color: '#ffaa00', radius: 0.4 },
    APPLE: { type: 'APPLE', emoji: '🍎', score: 10, color: '#ff0000', radius: 0.45 },
    POOP: { type: 'POOP', emoji: '💩', score: 50, color: '#a05a2c', radius: 0.4 }, // Bonus
    BOMB: { type: 'BOMB', emoji: '💣', score: 0, color: '#000000', radius: 0.6 } // Game Over
  };
  
  export const BLADE_COLOR = 0x00ffff;
  export const BLADE_WIDTH = 0.1;
  export const BLADE_TRAIL_LENGTH = 15; // Number of history points
  
  export const GRAVITY = -9.8;
  export const SPAWN_RATE = 1.5; // Seconds between spawns