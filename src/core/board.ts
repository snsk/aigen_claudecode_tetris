import { 
  TetrominoType, 
  Position, 
  BOARD_WIDTH, 
  TOTAL_HEIGHT 
} from '@/types/tetris';
import { PieceData } from './piece';

/**
 * Game board management
 * Handles collision detection, line clearing, and board state
 */
export class Board {
  private grid: (TetrominoType | null)[][];

  constructor() {
    this.grid = this.createEmptyGrid();
  }

  /**
   * Create an empty grid
   */
  private createEmptyGrid(): (TetrominoType | null)[][] {
    return Array(TOTAL_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(null));
  }

  /**
   * Get the current grid state
   */
  getGrid(): (TetrominoType | null)[][] {
    return this.grid;
  }

  /**
   * Check if a piece can be placed at the given position
   */
  isValidPosition(
    type: TetrominoType,
    position: Position,
    rotation: number
  ): boolean {
    const shape = PieceData.getShape(type, rotation);

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 0) continue;

        const boardX = position.x + col;
        const boardY = position.y + row;

        // Check boundaries
        if (boardX < 0 || boardX >= BOARD_WIDTH) {
          return false;
        }

        // Check collision with existing pieces (allow pieces in hidden area)
        if (boardY >= 0 && boardY < TOTAL_HEIGHT && this.grid[boardY][boardX] !== null) {
          return false;
        }

        // Don't allow pieces to go below the board
        if (boardY >= TOTAL_HEIGHT) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Lock a piece onto the board
   */
  lockPiece(
    type: TetrominoType,
    position: Position,
    rotation: number
  ): void {
    const shape = PieceData.getShape(type, rotation);

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 0) continue;

        const boardX = position.x + col;
        const boardY = position.y + row;

        if (boardY >= 0 && boardY < TOTAL_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          this.grid[boardY][boardX] = type;
        }
      }
    }
  }

  /**
   * Clear completed lines and return the number of lines cleared
   */
  clearLines(): number[] {
    const clearedLines: number[] = [];

    // Check each row from bottom to top and remove immediately
    let row = TOTAL_HEIGHT - 1;
    while (row >= 0) {
      if (this.isLineFull(row)) {
        console.log(`Clearing line ${row}:`, this.grid[row]);
        clearedLines.push(row);
        // Remove the line immediately and add empty line at top
        this.grid.splice(row, 1);
        this.grid.unshift(Array(BOARD_WIDTH).fill(null));
        // Don't decrement row since we removed a line and all lines shifted down
      } else {
        // Only move to the next row if we didn't clear a line
        row--;
      }
    }

    if (clearedLines.length > 0) {
      console.log(`Total cleared lines: ${clearedLines.length}`);
    }

    return clearedLines.reverse(); // Return in top-to-bottom order
  }

  /**
   * Check if a line is full
   */
  private isLineFull(row: number): boolean {
    // Ensure the row exists and has exactly BOARD_WIDTH cells
    if (row < 0 || row >= TOTAL_HEIGHT || !this.grid[row]) {
      return false;
    }
    
    // Check that the row has the correct width
    if (this.grid[row].length !== BOARD_WIDTH) {
      return false;
    }
    
    // Check that every cell contains a valid tetromino type (not null or undefined)
    return this.grid[row].every(cell => 
      cell !== null && 
      cell !== undefined && 
      Object.values(TetrominoType).includes(cell as TetrominoType)
    );
  }

  /**
   * Check if the game is over (pieces can't spawn)
   * This should only be called after trying to place a piece
   */
  isGameOver(): boolean {
    // Game over is determined by spawn position validity, not board state
    // This method is kept for compatibility but should be used carefully
    return false;
  }

  /**
   * Get the ghost piece position (where the piece would land)
   */
  getGhostPosition(
    type: TetrominoType,
    position: Position,
    rotation: number
  ): Position {
    let ghostY = position.y;

    // Move down until we hit something
    while (this.isValidPosition(type, { x: position.x, y: ghostY + 1 }, rotation)) {
      ghostY++;
    }

    return { x: position.x, y: ghostY };
  }

  /**
   * Reset the board
   */
  reset(): void {
    this.grid = this.createEmptyGrid();
  }

  /**
   * Get statistics about the current board state
   */
  getBoardStats(): {
    height: number;
    holes: number;
    bumpiness: number;
  } {
    const columnHeights = Array(BOARD_WIDTH).fill(0);
    let holes = 0;

    // Calculate column heights and holes
    for (let col = 0; col < BOARD_WIDTH; col++) {
      let foundBlock = false;
      
      for (let row = 0; row < TOTAL_HEIGHT; row++) {
        if (this.grid[row][col] !== null) {
          if (!foundBlock) {
            columnHeights[col] = TOTAL_HEIGHT - row;
            foundBlock = true;
          }
        } else if (foundBlock) {
          holes++;
        }
      }
    }

    // Calculate bumpiness (sum of height differences)
    let bumpiness = 0;
    for (let i = 0; i < BOARD_WIDTH - 1; i++) {
      bumpiness += Math.abs(columnHeights[i] - columnHeights[i + 1]);
    }

    return {
      height: Math.max(...columnHeights),
      holes,
      bumpiness,
    };
  }
}