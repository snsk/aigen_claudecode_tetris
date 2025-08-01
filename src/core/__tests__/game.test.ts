import { describe, it, expect, beforeEach } from 'vitest';
import { Game, InputAction, GameEvent } from '../game';
import { GameState, TetrominoType, BOARD_WIDTH, TOTAL_HEIGHT } from '@/types/tetris';

describe('Game', () => {
  let game: Game;

  beforeEach(() => {
    game = new Game();
  });

  describe('game state management', () => {
    it('should start in IDLE state', () => {
      expect(game.getState()).toBe(GameState.IDLE);
    });

    it('should transition to PLAYING when started', () => {
      game.start();
      expect(game.getState()).toBe(GameState.PLAYING);
    });

    it('should spawn a piece when started', () => {
      game.start();
      expect(game.getCurrentPiece()).not.toBeNull();
    });

    it('should reset game state', () => {
      game.start();
      game.handleInput(InputAction.HARD_DROP, true);
      const stats = game.getStats();
      expect(stats.score).toBeGreaterThan(0);
      
      game.reset();
      expect(game.getState()).toBe(GameState.IDLE);
      expect(game.getStats().score).toBe(0);
      expect(game.getCurrentPiece()).toBeNull();
    });
  });

  describe('input handling', () => {
    beforeEach(() => {
      game.start();
    });

    it('should move piece left', () => {
      const piece = game.getCurrentPiece()!;
      const initialX = piece.position.x;
      
      game.handleInput(InputAction.MOVE_LEFT, true);
      
      expect(game.getCurrentPiece()!.position.x).toBe(initialX - 1);
    });

    it('should move piece right', () => {
      const piece = game.getCurrentPiece()!;
      const initialX = piece.position.x;
      
      game.handleInput(InputAction.MOVE_RIGHT, true);
      
      expect(game.getCurrentPiece()!.position.x).toBe(initialX + 1);
    });

    it('should not move piece beyond boundaries', () => {
      // Move far left
      for (let i = 0; i < 20; i++) {
        game.handleInput(InputAction.MOVE_LEFT, true);
      }
      
      const leftmostX = game.getCurrentPiece()!.position.x;
      game.handleInput(InputAction.MOVE_LEFT, true);
      expect(game.getCurrentPiece()!.position.x).toBe(leftmostX); // Should not move further
    });

    it('should rotate piece clockwise', () => {
      const initialRotation = game.getCurrentPiece()!.rotation;
      
      game.handleInput(InputAction.ROTATE_CW, true);
      
      const newRotation = game.getCurrentPiece()!.rotation;
      expect(newRotation).toBe((initialRotation + 1) % 4);
    });

    it('should rotate piece counter-clockwise', () => {
      const initialRotation = game.getCurrentPiece()!.rotation;
      
      game.handleInput(InputAction.ROTATE_CCW, true);
      
      const newRotation = game.getCurrentPiece()!.rotation;
      expect(newRotation).toBe((initialRotation + 3) % 4);
    });

    it('should soft drop piece', () => {
      const initialY = game.getCurrentPiece()!.position.y;
      const initialScore = game.getStats().score;
      
      game.handleInput(InputAction.SOFT_DROP, true);
      
      expect(game.getCurrentPiece()!.position.y).toBe(initialY + 1);
      expect(game.getStats().score).toBe(initialScore + 1); // Soft drop gives 1 point
    });

    it('should hard drop piece', () => {
      const initialScore = game.getStats().score;
      
      game.handleInput(InputAction.HARD_DROP, true);
      
      // Piece should be locked and new piece spawned
      expect(game.getStats().score).toBeGreaterThan(initialScore);
    });

    it('should pause and unpause game', () => {
      game.handleInput(InputAction.PAUSE, true);
      expect(game.getState()).toBe(GameState.PAUSED);
      
      game.handleInput(InputAction.PAUSE, true);
      expect(game.getState()).toBe(GameState.PLAYING);
    });
  });

  describe('hold functionality', () => {
    beforeEach(() => {
      game.start();
    });

    it('should hold current piece', () => {
      const currentType = game.getCurrentPiece()!.type;
      
      game.handleInput(InputAction.HOLD, true);
      
      expect(game.getHoldPiece()).toBe(currentType);
      expect(game.getCurrentPiece()!.type).not.toBe(currentType);
    });

    it('should swap hold piece', () => {
      const firstType = game.getCurrentPiece()!.type;
      
      // Hold first piece
      game.handleInput(InputAction.HOLD, true);
      const secondType = game.getCurrentPiece()!.type;
      
      // Hold second piece (should swap)
      game.handleInput(InputAction.HOLD, true);
      
      expect(game.getHoldPiece()).toBe(secondType);
      expect(game.getCurrentPiece()!.type).toBe(firstType);
    });

    it('should not allow hold after hard drop until next piece', () => {
      game.handleInput(InputAction.HOLD, true);
      const holdPiece = game.getHoldPiece();
      
      // Try to hold again immediately
      game.handleInput(InputAction.HOLD, true);
      
      // Should not change
      expect(game.getHoldPiece()).toBe(holdPiece);
    });
  });

  describe('line clearing', () => {
    it('should clear single line and update score', () => {
      game.start();
      
      // Manually set up a nearly complete line
      const board = game.getBoard();
      const grid = board.getGrid();
      for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        grid[TOTAL_HEIGHT - 1][x] = TetrominoType.I;
      }
      
      const initialLines = game.getStats().lines;
      const initialScore = game.getStats().score;
      
      // Place a piece to complete the line
      // This is a simplified test - in real game we'd need to position piece properly
      board.clearLines();
      
      // Manually trigger line clear handling
      (game as any).handleLineClears(1);
      
      expect(game.getStats().lines).toBe(initialLines + 1);
      expect(game.getStats().score).toBeGreaterThan(initialScore);
    });

    it('should handle multiple line clears', () => {
      game.start();
      const initialScore = game.getStats().score;
      
      // Manually trigger line clear handling for tetris
      (game as any).handleLineClears(4);
      
      expect(game.getStats().lines).toBe(4);
      // Tetris should give more points than 4 singles
      expect(game.getStats().score).toBeGreaterThan(initialScore + 400);
    });

    it('should track combo', () => {
      game.start();
      
      // Clear lines consecutively
      (game as any).handleLineClears(1);
      expect(game.getStats().combo).toBe(1);
      
      (game as any).handleLineClears(1);
      expect(game.getStats().combo).toBe(2);
      
      // Spawn a piece without clearing lines to reset combo
      (game as any).stats.combo = 0;
      
      (game as any).handleLineClears(1);
      expect(game.getStats().combo).toBe(1);
    });

    it('should track back-to-back tetris', () => {
      game.start();
      
      // First tetris
      (game as any).handleLineClears(4);
      expect(game.getStats().backToBack).toBe(true);
      
      const scoreAfterFirst = game.getStats().score;
      
      // Second tetris (should get bonus)
      (game as any).handleLineClears(4);
      const scoreAfterSecond = game.getStats().score;
      
      // Second tetris should give 1.5x points
      const secondTetrisScore = scoreAfterSecond - scoreAfterFirst;
      expect(secondTetrisScore).toBeGreaterThan(800); // Base tetris is 800
    });
  });

  describe('level progression', () => {
    it('should increase level every 10 lines', () => {
      game.start();
      
      expect(game.getStats().level).toBe(0);
      
      (game as any).handleLineClears(10);
      expect(game.getStats().level).toBe(1);
      
      (game as any).handleLineClears(10);
      expect(game.getStats().level).toBe(2);
    });

    it('should cap level at 29', () => {
      game.start();
      
      // Clear 300 lines
      (game as any).stats.lines = 300;
      (game as any).stats.level = 0;
      (game as any).handleLineClears(10);
      
      expect(game.getStats().level).toBe(29);
    });
  });

  describe('game over conditions', () => {
    it('should end game at 999 lines', () => {
      game.start();
      
      (game as any).stats.lines = 998;
      (game as any).handleLineClears(1);
      
      expect(game.getStats().lines).toBe(999);
      
      // Next piece lock should trigger completion
      (game as any).lockCurrentPiece();
      expect(game.getState()).toBe(GameState.COMPLETED);
    });
  });

  describe('event system', () => {
    it('should emit events', () => {
      const events: GameEvent[] = [];
      
      game.on('line_clear', (event) => {
        events.push(event);
      });
      
      game.start();
      (game as any).handleLineClears(2);
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('line_clear');
    });

    it('should handle multiple listeners', () => {
      let count1 = 0;
      let count2 = 0;
      
      game.on('piece_lock', () => count1++);
      game.on('piece_lock', () => count2++);
      
      game.start();
      game.handleInput(InputAction.HARD_DROP, true);
      
      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });

    it('should remove listeners', () => {
      let count = 0;
      const handler = () => count++;
      
      game.on('piece_lock', handler);
      game.off('piece_lock', handler);
      
      game.start();
      game.handleInput(InputAction.HARD_DROP, true);
      
      expect(count).toBe(0);
    });
  });

  describe('gravity and locking', () => {
    it('should apply gravity over time', () => {
      game.start();
      const initialY = game.getCurrentPiece()!.position.y;
      
      // Simulate time passing
      game.update(1000); // 1 second
      
      expect(game.getCurrentPiece()!.position.y).toBeGreaterThan(initialY);
    });

    it('should lock piece after lock delay', () => {
      game.start();
      
      // Move piece to bottom
      for (let i = 0; i < 25; i++) {
        game.handleInput(InputAction.SOFT_DROP, true);
      }
      
      // Piece should be at bottom but not locked yet
      const piece = game.getCurrentPiece()!;
      expect(piece.locked).toBe(true); // Marked for locking
      
      // Wait for lock delay
      game.update(600); // 500ms lock delay + buffer
      
      // Should have spawned new piece
      expect(game.getCurrentPiece()!.type).not.toBe(piece.type);
    });
  });

  describe('DAS (Delayed Auto Shift)', () => {
    it('should auto-repeat movement after delay', () => {
      game.start();
      const initialX = game.getCurrentPiece()!.position.x;
      
      // Press and hold left
      game.handleInput(InputAction.MOVE_LEFT, true);
      
      // Initial move
      expect(game.getCurrentPiece()!.position.x).toBe(initialX - 1);
      
      // Wait for DAS delay
      game.update(200); // DAS delay
      
      // Should continue moving
      const afterDasX = game.getCurrentPiece()!.position.x;
      expect(afterDasX).toBeLessThan(initialX - 1);
    });

    it('should stop DAS on release', () => {
      game.start();
      
      // Press and hold
      game.handleInput(InputAction.MOVE_LEFT, true);
      game.update(200);
      
      // Release
      game.handleInput(InputAction.MOVE_LEFT, false);
      
      const currentX = game.getCurrentPiece()!.position.x;
      game.update(100);
      
      // Should not move further
      expect(game.getCurrentPiece()!.position.x).toBe(currentX);
    });
  });
});