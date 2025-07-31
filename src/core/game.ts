import {
  GameState,
  GameStats,
  Piece,
  TetrominoType,
  RotationState,
  Position,
  LOCK_DELAY,
  DAS_DELAY,
  DAS_PERIOD,
  SCORE_SINGLE,
  SCORE_DOUBLE,
  SCORE_TRIPLE,
  SCORE_TETRIS,
  SCORE_SOFT_DROP,
  SCORE_HARD_DROP,
} from '@/types/tetris';
import { Board } from './board';
import { BagRandomizer } from './bag';
import { PieceData } from './piece';

/**
 * Input actions
 */
export enum InputAction {
  MOVE_LEFT = 'MOVE_LEFT',
  MOVE_RIGHT = 'MOVE_RIGHT',
  SOFT_DROP = 'SOFT_DROP',
  HARD_DROP = 'HARD_DROP',
  ROTATE_CW = 'ROTATE_CW',
  ROTATE_CCW = 'ROTATE_CCW',
  HOLD = 'HOLD',
  PAUSE = 'PAUSE',
}

/**
 * Game events
 */
export interface GameEvent {
  type: 'line_clear' | 'piece_lock' | 'game_over' | 'level_up' | 'tspin' | 'combo';
  data?: any;
}

/**
 * Main game logic controller
 */
export class Game {
  private board: Board;
  private bag: BagRandomizer;
  private state: GameState = GameState.IDLE;
  private stats: GameStats = {
    score: 0,
    level: 0,
    lines: 0,
    combo: 0,
    backToBack: false,
  };

  private currentPiece: Piece | null = null;
  private holdPiece: TetrominoType | null = null;
  private canHold = true;

  private dropTimer = 0;
  private lockTimer = 0;
  private dasTimer = 0;
  private dasDirection: 'left' | 'right' | null = null;

  private lastWasRotation = false;
  private eventHandlers: Map<string, ((event: GameEvent) => void)[]> = new Map();

  constructor() {
    this.board = new Board();
    this.bag = new BagRandomizer();
  }

  /**
   * Start a new game
   */
  start(): void {
    this.reset();
    this.state = GameState.PLAYING;
    this.spawnNextPiece();
  }

  /**
   * Reset game state
   */
  reset(): void {
    this.board.reset();
    this.bag.reset();
    this.state = GameState.IDLE;
    this.stats = {
      score: 0,
      level: 0,
      lines: 0,
      combo: 0,
      backToBack: false,
    };
    this.currentPiece = null;
    this.holdPiece = null;
    this.canHold = true;
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.dasTimer = 0;
    this.dasDirection = null;
  }

  /**
   * Update game logic
   * @param deltaTime Time since last update in milliseconds
   */
  update(deltaTime: number): void {
    if (this.state !== GameState.PLAYING || !this.currentPiece) {
      return;
    }

    // Handle DAS (Delayed Auto Shift)
    if (this.dasDirection) {
      this.dasTimer += deltaTime;
      if (this.dasTimer >= DAS_DELAY) {
        const dasSteps = Math.floor((this.dasTimer - DAS_DELAY) / DAS_PERIOD);
        for (let i = 0; i < dasSteps; i++) {
          if (this.dasDirection === 'left') {
            this.movePiece(-1, 0);
          } else {
            this.movePiece(1, 0);
          }
        }
        this.dasTimer = DAS_DELAY + ((this.dasTimer - DAS_DELAY) % DAS_PERIOD);
      }
    }

    // Handle gravity
    this.dropTimer += deltaTime;
    const dropInterval = this.getDropInterval();
    
    while (this.dropTimer >= dropInterval) {
      this.dropTimer -= dropInterval;
      if (!this.movePiece(0, 1)) {
        // Can't move down, start lock timer
        if (!this.currentPiece.locked) {
          this.currentPiece.locked = true;
        }
      }
    }

    // Handle lock delay
    if (this.currentPiece.locked) {
      this.lockTimer += deltaTime;
      if (this.lockTimer >= LOCK_DELAY) {
        this.lockCurrentPiece();
      }
    } else {
      this.lockTimer = 0;
    }
  }

  /**
   * Handle input
   */
  handleInput(action: InputAction, pressed: boolean): void {
    if (this.state !== GameState.PLAYING) {
      if (action === InputAction.PAUSE && pressed && this.state === GameState.PAUSED) {
        this.state = GameState.PLAYING;
      }
      return;
    }

    if (action === InputAction.PAUSE && pressed) {
      this.state = GameState.PAUSED;
      return;
    }

    if (!this.currentPiece) return;

    switch (action) {
      case InputAction.MOVE_LEFT:
        if (pressed) {
          this.movePiece(-1, 0);
          this.dasDirection = 'left';
          this.dasTimer = 0;
        } else if (this.dasDirection === 'left') {
          this.dasDirection = null;
          this.dasTimer = 0;
        }
        break;

      case InputAction.MOVE_RIGHT:
        if (pressed) {
          this.movePiece(1, 0);
          this.dasDirection = 'right';
          this.dasTimer = 0;
        } else if (this.dasDirection === 'right') {
          this.dasDirection = null;
          this.dasTimer = 0;
        }
        break;

      case InputAction.SOFT_DROP:
        if (pressed) {
          if (this.movePiece(0, 1)) {
            this.stats.score += SCORE_SOFT_DROP;
          }
        }
        break;

      case InputAction.HARD_DROP:
        if (pressed) {
          this.performHardDrop();
        }
        break;

      case InputAction.ROTATE_CW:
        if (pressed) {
          this.rotatePiece(true);
        }
        break;

      case InputAction.ROTATE_CCW:
        if (pressed) {
          this.rotatePiece(false);
        }
        break;

      case InputAction.HOLD:
        if (pressed && this.canHold) {
          this.performHold();
        }
        break;
    }
  }

  /**
   * Move the current piece
   */
  private movePiece(dx: number, dy: number): boolean {
    if (!this.currentPiece) return false;

    const newPosition = {
      x: this.currentPiece.position.x + dx,
      y: this.currentPiece.position.y + dy,
    };

    if (this.board.isValidPosition(this.currentPiece.type, newPosition, this.currentPiece.rotation)) {
      this.currentPiece.position = newPosition;
      this.lastWasRotation = false;

      // Reset lock timer if piece moved horizontally or rotated
      if (dx !== 0 && this.currentPiece.locked) {
        this.lockTimer = 0;
      }

      return true;
    }

    return false;
  }

  /**
   * Rotate the current piece
   */
  private rotatePiece(clockwise: boolean): boolean {
    if (!this.currentPiece) return false;

    const oldRotation = this.currentPiece.rotation;
    const newRotation = clockwise
      ? PieceData.getNextRotationCW(oldRotation)
      : PieceData.getNextRotationCCW(oldRotation);

    // Try basic rotation
    if (this.board.isValidPosition(this.currentPiece.type, this.currentPiece.position, newRotation)) {
      this.currentPiece.rotation = newRotation;
      this.lastWasRotation = true;
      if (this.currentPiece.locked) {
        this.lockTimer = 0;
      }
      return true;
    }

    // Try wall kicks
    const kicks = PieceData.getWallKickOffsets(this.currentPiece.type, oldRotation, newRotation);
    for (const kick of kicks) {
      const kickPosition = {
        x: this.currentPiece.position.x + kick.x,
        y: this.currentPiece.position.y + kick.y,
      };

      if (this.board.isValidPosition(this.currentPiece.type, kickPosition, newRotation)) {
        this.currentPiece.position = kickPosition;
        this.currentPiece.rotation = newRotation;
        this.lastWasRotation = true;
        if (this.currentPiece.locked) {
          this.lockTimer = 0;
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Perform hard drop
   */
  private performHardDrop(): void {
    if (!this.currentPiece) return;

    let dropDistance = 0;
    while (this.movePiece(0, 1)) {
      dropDistance++;
    }

    this.stats.score += dropDistance * SCORE_HARD_DROP;
    this.lockCurrentPiece();
  }

  /**
   * Perform hold
   */
  private performHold(): void {
    if (!this.currentPiece || !this.canHold) return;

    const heldType = this.currentPiece.type;
    
    if (this.holdPiece) {
      this.currentPiece = {
        type: this.holdPiece,
        position: PieceData.getSpawnPosition(this.holdPiece),
        rotation: RotationState.SPAWN,
        locked: false,
        lockTimer: 0,
      };
    } else {
      this.spawnNextPiece();
    }

    this.holdPiece = heldType;
    this.canHold = false;
    this.dropTimer = 0;
    this.lockTimer = 0;
  }

  /**
   * Lock the current piece and spawn the next one
   */
  private lockCurrentPiece(): void {
    if (!this.currentPiece) return;

    this.board.lockPiece(
      this.currentPiece.type,
      this.currentPiece.position,
      this.currentPiece.rotation
    );

    // Check for T-Spin
    if (this.currentPiece.type === TetrominoType.T) {
      const isTSpin = PieceData.isTSpin(
        this.board.getGrid(),
        this.currentPiece.position,
        this.currentPiece.rotation,
        this.lastWasRotation
      );
      
      if (isTSpin) {
        this.emit({ type: 'tspin' });
      }
    }

    this.emit({ type: 'piece_lock', data: { piece: this.currentPiece } });

    // Clear lines
    const clearedLines = this.board.clearLines();
    if (clearedLines.length > 0) {
      this.handleLineClears(clearedLines.length);
      this.emit({ type: 'line_clear', data: { lines: clearedLines } });
    } else {
      // Reset combo
      this.stats.combo = 0;
    }

    // Check game over
    if (this.board.isGameOver()) {
      this.state = GameState.GAME_OVER;
      this.emit({ type: 'game_over' });
      return;
    }

    // Check for completion (999 lines)
    if (this.stats.lines >= 999) {
      this.state = GameState.COMPLETED;
      return;
    }

    // Spawn next piece
    this.spawnNextPiece();
    this.canHold = true;
  }

  /**
   * Handle line clears and scoring
   */
  private handleLineClears(numLines: number): void {
    this.stats.lines += numLines;
    
    // Update combo
    this.stats.combo++;
    if (this.stats.combo > 1) {
      this.emit({ type: 'combo', data: { combo: this.stats.combo } });
    }

    // Calculate score
    let baseScore = 0;
    switch (numLines) {
      case 1:
        baseScore = SCORE_SINGLE;
        this.stats.backToBack = false;
        break;
      case 2:
        baseScore = SCORE_DOUBLE;
        this.stats.backToBack = false;
        break;
      case 3:
        baseScore = SCORE_TRIPLE;
        this.stats.backToBack = false;
        break;
      case 4:
        baseScore = SCORE_TETRIS;
        if (this.stats.backToBack) {
          baseScore *= 1.5;
        }
        this.stats.backToBack = true;
        break;
    }

    // Apply level multiplier and combo bonus
    this.stats.score += baseScore * (this.stats.level + 1) + (50 * this.stats.combo * (this.stats.level + 1));

    // Update level (every 10 lines)
    const newLevel = Math.min(Math.floor(this.stats.lines / 10), 29);
    if (newLevel > this.stats.level) {
      this.stats.level = newLevel;
      this.emit({ type: 'level_up', data: { level: newLevel } });
    }
  }

  /**
   * Spawn the next piece
   */
  private spawnNextPiece(): void {
    const type = this.bag.next();
    const position = PieceData.getSpawnPosition(type);

    this.currentPiece = {
      type,
      position,
      rotation: RotationState.SPAWN,
      locked: false,
      lockTimer: 0,
    };

    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lastWasRotation = false;

    // Check if the spawn position is valid
    if (!this.board.isValidPosition(type, position, RotationState.SPAWN)) {
      this.state = GameState.GAME_OVER;
      this.emit({ type: 'game_over' });
    }
  }

  /**
   * Get drop interval based on level
   */
  private getDropInterval(): number {
    // Standard marathon speed curve
    const framesPerDrop = Math.max(1, 48 - (this.stats.level * 2));
    return (framesPerDrop / 60) * 1000; // Convert to milliseconds
  }

  /**
   * Subscribe to game events
   */
  on(event: string, handler: (event: GameEvent) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  /**
   * Emit game event
   */
  private emit(event: GameEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }

  // Getters
  getState(): GameState { return this.state; }
  getStats(): GameStats { return { ...this.stats }; }
  getBoard(): Board { return this.board; }
  getCurrentPiece(): Piece | null { return this.currentPiece; }
  getHoldPiece(): TetrominoType | null { return this.holdPiece; }
  getNextPieces(count: number): TetrominoType[] { return this.bag.preview(count); }
  
  getGhostPosition(): Position | null {
    if (!this.currentPiece) return null;
    return this.board.getGhostPosition(
      this.currentPiece.type,
      this.currentPiece.position,
      this.currentPiece.rotation
    );
  }
}