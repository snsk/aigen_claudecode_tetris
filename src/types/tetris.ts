/**
 * Tetromino types according to Tetris Design Guideline
 */
export enum TetrominoType {
  I = 'I',
  O = 'O',
  T = 'T',
  S = 'S',
  Z = 'Z',
  J = 'J',
  L = 'L',
}

/**
 * Rotation states for SRS (Super Rotation System)
 */
export enum RotationState {
  SPAWN = 0,
  RIGHT = 1,
  DOUBLE = 2,
  LEFT = 3,
}

/**
 * Game states
 */
export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  COMPLETED = 'COMPLETED',
}

/**
 * Position on the game board
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Tetromino piece data
 */
export interface Piece {
  type: TetrominoType;
  position: Position;
  rotation: RotationState;
  locked: boolean;
  lockTimer: number;
}

/**
 * Game statistics
 */
export interface GameStats {
  score: number;
  level: number;
  lines: number;
  combo: number;
  backToBack: boolean;
}

/**
 * Board dimensions
 */
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const HIDDEN_ROWS = 2;
export const TOTAL_HEIGHT = BOARD_HEIGHT + HIDDEN_ROWS;

/**
 * Game timings (in milliseconds)
 */
export const LOCK_DELAY = 500;
export const DAS_DELAY = 170;
export const DAS_PERIOD = 50;

/**
 * Scoring constants
 */
export const SCORE_SINGLE = 100;
export const SCORE_DOUBLE = 300;
export const SCORE_TRIPLE = 500;
export const SCORE_TETRIS = 800;
export const SCORE_SOFT_DROP = 1;
export const SCORE_HARD_DROP = 2;

/**
 * Color palette for tetrominos (high contrast for accessibility)
 */
export const TETROMINO_COLORS: Record<TetrominoType, number> = {
  [TetrominoType.I]: 0x00f0f0, // Cyan
  [TetrominoType.O]: 0xf0f000, // Yellow  
  [TetrominoType.T]: 0xa000f0, // Purple
  [TetrominoType.S]: 0x00f000, // Green
  [TetrominoType.Z]: 0xf00000, // Red
  [TetrominoType.J]: 0x0000f0, // Blue
  [TetrominoType.L]: 0xf0a000, // Orange
};