import { describe, it, expect, beforeEach } from 'vitest';
import { Board } from '../board';
import { TetrominoType, BOARD_WIDTH, TOTAL_HEIGHT } from '@/types/tetris';

describe('Board', () => {
  let board: Board;

  beforeEach(() => {
    board = new Board();
  });

  describe('initialization', () => {
    it('should create an empty board', () => {
      const grid = board.getGrid();
      expect(grid).toHaveLength(TOTAL_HEIGHT);
      expect(grid[0]).toHaveLength(BOARD_WIDTH);
      
      // Check all cells are empty
      for (let row of grid) {
        for (let cell of row) {
          expect(cell).toBeNull();
        }
      }
    });
  });

  describe('isValidPosition', () => {
    it('should allow valid positions', () => {
      expect(board.isValidPosition(TetrominoType.I, { x: 5, y: 10 }, 0)).toBe(true);
      expect(board.isValidPosition(TetrominoType.O, { x: 0, y: 0 }, 0)).toBe(true);
    });

    it('should reject positions outside left boundary', () => {
      expect(board.isValidPosition(TetrominoType.I, { x: -1, y: 10 }, 0)).toBe(false);
      expect(board.isValidPosition(TetrominoType.I, { x: -2, y: 10 }, 1)).toBe(false);
    });

    it('should reject positions outside right boundary', () => {
      expect(board.isValidPosition(TetrominoType.I, { x: BOARD_WIDTH - 3, y: 10 }, 0)).toBe(false);
      expect(board.isValidPosition(TetrominoType.O, { x: BOARD_WIDTH - 1, y: 10 }, 0)).toBe(false);
    });

    it('should reject positions below the board', () => {
      expect(board.isValidPosition(TetrominoType.I, { x: 5, y: TOTAL_HEIGHT }, 0)).toBe(false);
    });

    it('should reject positions that collide with existing pieces', () => {
      // Lock a piece first
      board.lockPiece(TetrominoType.O, { x: 4, y: 18 }, 0);
      
      // Try to place another piece at the same position
      expect(board.isValidPosition(TetrominoType.I, { x: 4, y: 18 }, 0)).toBe(false);
      expect(board.isValidPosition(TetrominoType.T, { x: 3, y: 17 }, 0)).toBe(false);
    });

    it('should allow pieces in the hidden area (negative y)', () => {
      expect(board.isValidPosition(TetrominoType.I, { x: 5, y: -2 }, 0)).toBe(true);
    });
  });

  describe('lockPiece', () => {
    it('should lock a piece on the board', () => {
      board.lockPiece(TetrominoType.I, { x: 0, y: 19 }, 0);
      const grid = board.getGrid();
      
      // Check I piece is locked horizontally
      expect(grid[19][0]).toBe(TetrominoType.I);
      expect(grid[19][1]).toBe(TetrominoType.I);
      expect(grid[19][2]).toBe(TetrominoType.I);
      expect(grid[19][3]).toBe(TetrominoType.I);
    });

    it('should handle pieces partially in hidden area', () => {
      board.lockPiece(TetrominoType.T, { x: 4, y: -1 }, 0);
      const grid = board.getGrid();
      
      // Only the visible part should be locked
      expect(grid[0][4]).toBe(TetrominoType.T);
      expect(grid[0][5]).toBe(TetrominoType.T);
      expect(grid[0][6]).toBe(TetrominoType.T);
    });
  });

  describe('clearLines', () => {
    it('should clear a single full line', () => {
      const grid = board.getGrid();
      
      // Fill bottom line
      for (let x = 0; x < BOARD_WIDTH; x++) {
        grid[TOTAL_HEIGHT - 1][x] = TetrominoType.I;
      }
      
      const clearedLines = board.clearLines();
      expect(clearedLines).toEqual([TOTAL_HEIGHT - 1]);
      
      // Check line is cleared
      const newGrid = board.getGrid();
      for (let x = 0; x < BOARD_WIDTH; x++) {
        expect(newGrid[TOTAL_HEIGHT - 1][x]).toBeNull();
      }
    });

    it('should clear multiple consecutive lines', () => {
      const grid = board.getGrid();
      
      // Fill bottom 3 lines
      for (let y = TOTAL_HEIGHT - 3; y < TOTAL_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          grid[y][x] = TetrominoType.O;
        }
      }
      
      const clearedLines = board.clearLines();
      expect(clearedLines).toHaveLength(3);
      
      // Check all lines are cleared
      const newGrid = board.getGrid();
      for (let y = TOTAL_HEIGHT - 3; y < TOTAL_HEIGHT; y++) {
        for (let x = 0; x < BOARD_WIDTH; x++) {
          expect(newGrid[y][x]).toBeNull();
        }
      }
    });

    it('should clear non-consecutive lines', () => {
      const grid = board.getGrid();
      
      // Fill lines 19 and 21 (0-indexed)
      for (let x = 0; x < BOARD_WIDTH; x++) {
        grid[19][x] = TetrominoType.T;
        grid[21][x] = TetrominoType.L;
      }
      
      const clearedLines = board.clearLines();
      expect(clearedLines).toHaveLength(2);
      expect(clearedLines).toContain(19);
      expect(clearedLines).toContain(21);
    });

    it('should not clear incomplete lines', () => {
      const grid = board.getGrid();
      
      // Fill line except one cell
      for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        grid[TOTAL_HEIGHT - 1][x] = TetrominoType.S;
      }
      
      const clearedLines = board.clearLines();
      expect(clearedLines).toHaveLength(0);
      
      // Check line is not cleared
      const newGrid = board.getGrid();
      for (let x = 0; x < BOARD_WIDTH - 1; x++) {
        expect(newGrid[TOTAL_HEIGHT - 1][x]).toBe(TetrominoType.S);
      }
    });

    it('should handle the bug case: clear lines after already clearing lines', () => {
      const grid = board.getGrid();
      
      // Setup: Create a situation where line 20 and 21 are full
      for (let x = 0; x < BOARD_WIDTH; x++) {
        grid[20][x] = TetrominoType.I;
        grid[21][x] = TetrominoType.O;
      }
      
      // First clear
      let clearedLines = board.clearLines();
      expect(clearedLines).toHaveLength(2);
      
      // Now add another full line at the bottom
      const newGrid = board.getGrid();
      for (let x = 0; x < BOARD_WIDTH; x++) {
        newGrid[21][x] = TetrominoType.T;
      }
      
      // Second clear should work correctly
      clearedLines = board.clearLines();
      expect(clearedLines).toHaveLength(1);
      expect(clearedLines).toEqual([21]);
    });
  });

  describe('getGhostPosition', () => {
    it('should find ghost position for a piece', () => {
      const ghostPos = board.getGhostPosition(TetrominoType.T, { x: 5, y: 0 }, 0);
      expect(ghostPos.x).toBe(5);
      expect(ghostPos.y).toBe(20); // Should drop to bottom
    });

    it('should stop ghost at obstacles', () => {
      // Place an obstacle
      board.lockPiece(TetrominoType.O, { x: 5, y: 18 }, 0);
      
      const ghostPos = board.getGhostPosition(TetrominoType.T, { x: 5, y: 0 }, 0);
      expect(ghostPos.x).toBe(5);
      expect(ghostPos.y).toBe(16); // Should stop above the O piece
    });
  });

  describe('reset', () => {
    it('should clear the board', () => {
      // Add some pieces
      board.lockPiece(TetrominoType.I, { x: 0, y: 19 }, 0);
      board.lockPiece(TetrominoType.O, { x: 5, y: 18 }, 0);
      
      board.reset();
      
      const grid = board.getGrid();
      for (let row of grid) {
        for (let cell of row) {
          expect(cell).toBeNull();
        }
      }
    });
  });

  describe('getBoardStats', () => {
    it('should calculate board statistics correctly', () => {
      // Create a simple board state
      board.lockPiece(TetrominoType.I, { x: 0, y: 19 }, 0);
      board.lockPiece(TetrominoType.O, { x: 4, y: 18 }, 0);
      
      const stats = board.getBoardStats();
      
      expect(stats.height).toBe(2); // Two rows high
      expect(stats.holes).toBe(0); // No holes
      expect(stats.bumpiness).toBeGreaterThan(0); // Surface is not flat
    });

    it('should detect holes correctly', () => {
      const grid = board.getGrid();
      
      // Create a hole: piece on top, empty below
      grid[18][0] = TetrominoType.T;
      grid[19][0] = null;
      grid[20][0] = TetrominoType.I;
      grid[21][0] = TetrominoType.I;
      
      const stats = board.getBoardStats();
      expect(stats.holes).toBe(1);
    });
  });
});