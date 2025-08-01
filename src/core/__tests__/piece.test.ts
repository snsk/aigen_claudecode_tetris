import { describe, it, expect } from 'vitest';
import { PieceData } from '../piece';
import { TetrominoType, RotationState } from '@/types/tetris';

describe('PieceData', () => {
  describe('getShape', () => {
    it('should return correct shape for I piece', () => {
      const shape = PieceData.getShape(TetrominoType.I, RotationState.SPAWN);
      expect(shape).toEqual([
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ]);
    });

    it('should return correct shape for O piece', () => {
      const shape = PieceData.getShape(TetrominoType.O, RotationState.SPAWN);
      expect(shape).toEqual([
        [1, 1],
        [1, 1],
      ]);
    });

    it('should return correct shape for T piece', () => {
      const shape = PieceData.getShape(TetrominoType.T, RotationState.SPAWN);
      expect(shape).toEqual([
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0],
      ]);
    });

    it('should handle rotation correctly', () => {
      // I piece vertical
      const vertical = PieceData.getShape(TetrominoType.I, RotationState.RIGHT);
      expect(vertical).toEqual([
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ]);

      // T piece 180 (using value 2 for 180 degrees)
      const flipped = PieceData.getShape(TetrominoType.T, 2);
      expect(flipped).toEqual([
        [0, 0, 0],
        [1, 1, 1],
        [0, 1, 0],
      ]);
    });

    it('should return same shape for O piece in all rotations', () => {
      const spawn = PieceData.getShape(TetrominoType.O, RotationState.SPAWN);
      const right = PieceData.getShape(TetrominoType.O, 1);
      const flip = PieceData.getShape(TetrominoType.O, 2);
      const left = PieceData.getShape(TetrominoType.O, 3);
      
      expect(spawn).toEqual(right);
      expect(spawn).toEqual(flip);
      expect(spawn).toEqual(left);
    });
  });

  describe('getSpawnPosition', () => {
    it('should return correct spawn position for I piece', () => {
      const pos = PieceData.getSpawnPosition(TetrominoType.I);
      expect(pos.x).toBe(3);
      expect(pos.y).toBe(17);
    });

    it('should return correct spawn position for O piece', () => {
      const pos = PieceData.getSpawnPosition(TetrominoType.O);
      expect(pos.x).toBe(4);
      expect(pos.y).toBe(18);
    });

    it('should return correct spawn position for other pieces', () => {
      const pieces = [
        TetrominoType.T,
        TetrominoType.S,
        TetrominoType.Z,
        TetrominoType.J,
        TetrominoType.L
      ];
      
      for (const piece of pieces) {
        const pos = PieceData.getSpawnPosition(piece);
        expect(pos.x).toBe(3);
        expect(pos.y).toBe(17);
      }
    });
  });


  describe('shape validation', () => {
    it('should have valid shapes for all pieces and rotations', () => {
      const pieces = Object.values(TetrominoType);
      const rotations = Object.values(RotationState).filter(r => typeof r === 'number') as number[];
      
      for (const piece of pieces) {
        for (const rotation of rotations) {
          const shape = PieceData.getShape(piece, rotation);
          
          // Check shape is not empty
          expect(shape.length).toBeGreaterThan(0);
          
          // Check all rows have same length
          const width = shape[0].length;
          for (const row of shape) {
            expect(row.length).toBe(width);
          }
          
          // Check shape contains at least 4 blocks (tetromino)
          let blockCount = 0;
          for (const row of shape) {
            for (const cell of row) {
              if (cell === 1) blockCount++;
            }
          }
          expect(blockCount).toBe(4);
        }
      }
    });
  });
});