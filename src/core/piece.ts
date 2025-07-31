import { TetrominoType, RotationState, Position } from '@/types/tetris';

/**
 * Tetromino shapes according to SRS (Super Rotation System)
 * Each tetromino has 4 rotation states
 * 1 = filled block, 0 = empty
 */
const TETROMINO_SHAPES: Record<TetrominoType, number[][][]> = {
  [TetrominoType.I]: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
  ],
  [TetrominoType.O]: [
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 1, 1, 0], [0, 1, 1, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  ],
  [TetrominoType.T]: [
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
  ],
  [TetrominoType.S]: [
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
    [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
    [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
  ],
  [TetrominoType.Z]: [
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
    [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
  ],
  [TetrominoType.J]: [
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  ],
  [TetrominoType.L]: [
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
  ],
};

/**
 * SRS Wall Kick Data
 * Offsets to try when rotating, in order
 */
const WALL_KICK_DATA: Record<string, Position[]> = {
  // J, L, S, T, Z pieces
  '0->1': [{ x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  '1->0': [{ x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  '1->2': [{ x: 1, y: 0 }, { x: 1, y: -1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  '2->1': [{ x: -1, y: 0 }, { x: -1, y: 1 }, { x: 0, y: -2 }, { x: -1, y: -2 }],
  '2->3': [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
  '3->2': [{ x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  '3->0': [{ x: -1, y: 0 }, { x: -1, y: -1 }, { x: 0, y: 2 }, { x: -1, y: 2 }],
  '0->3': [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: -2 }, { x: 1, y: -2 }],
};

// I piece has different wall kicks
const I_WALL_KICK_DATA: Record<string, Position[]> = {
  '0->1': [{ x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: -1 }, { x: 1, y: 2 }],
  '1->0': [{ x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 1 }, { x: -1, y: -2 }],
  '1->2': [{ x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 2 }, { x: 2, y: -1 }],
  '2->1': [{ x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: -2 }, { x: -2, y: 1 }],
  '2->3': [{ x: 2, y: 0 }, { x: -1, y: 0 }, { x: 2, y: 1 }, { x: -1, y: -2 }],
  '3->2': [{ x: -2, y: 0 }, { x: 1, y: 0 }, { x: -2, y: -1 }, { x: 1, y: 2 }],
  '3->0': [{ x: 1, y: 0 }, { x: -2, y: 0 }, { x: 1, y: -2 }, { x: -2, y: 1 }],
  '0->3': [{ x: -1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 2 }, { x: 2, y: -1 }],
};

/**
 * PieceData class manages tetromino shapes and rotations
 */
export class PieceData {
  /**
   * Get the shape matrix for a tetromino
   */
  static getShape(type: TetrominoType, rotation: RotationState): number[][] {
    return TETROMINO_SHAPES[type][rotation];
  }

  /**
   * Get wall kick offsets for rotation
   */
  static getWallKickOffsets(
    type: TetrominoType,
    fromRotation: RotationState,
    toRotation: RotationState
  ): Position[] {
    const key = `${fromRotation}->${toRotation}`;
    
    if (type === TetrominoType.I) {
      return I_WALL_KICK_DATA[key] || [];
    }
    
    if (type === TetrominoType.O) {
      return []; // O piece doesn't need wall kicks
    }
    
    return WALL_KICK_DATA[key] || [];
  }

  /**
   * Get the next rotation state (clockwise)
   */
  static getNextRotationCW(rotation: RotationState): RotationState {
    return ((rotation + 1) % 4) as RotationState;
  }

  /**
   * Get the next rotation state (counter-clockwise)
   */
  static getNextRotationCCW(rotation: RotationState): RotationState {
    return ((rotation + 3) % 4) as RotationState;
  }

  /**
   * Get initial spawn position for a tetromino
   */
  static getSpawnPosition(type: TetrominoType): Position {
    // Standard spawn position is centered at top of hidden area
    const shape = TETROMINO_SHAPES[type][0];
    const width = shape[0].length;
    
    return {
      x: Math.floor((10 - width) / 2),
      y: type === TetrominoType.I ? 0 : 1, // I piece spawns at very top, others one row down
    };
  }

  /**
   * Check if position is valid T-Spin
   * According to guideline, T-Spin requires 3 of 4 corners to be occupied
   */
  static isTSpin(
    board: (TetrominoType | null)[][],
    position: Position,
    _rotation: RotationState,
    lastWasRotation: boolean
  ): boolean {
    if (!lastWasRotation) return false;

    // Check the 4 corners of the T piece's 3x3 bounding box
    const corners = [
      { x: position.x, y: position.y },
      { x: position.x + 2, y: position.y },
      { x: position.x, y: position.y + 2 },
      { x: position.x + 2, y: position.y + 2 },
    ];

    let occupiedCorners = 0;
    for (const corner of corners) {
      if (
        corner.x < 0 ||
        corner.x >= 10 ||
        corner.y < 0 ||
        corner.y >= 22 ||
        board[corner.y][corner.x] !== null
      ) {
        occupiedCorners++;
      }
    }

    return occupiedCorners >= 3;
  }
}