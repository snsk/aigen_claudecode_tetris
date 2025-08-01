import { describe, it, expect, beforeEach } from 'vitest';
import { BagRandomizer } from '../bag';
import { TetrominoType } from '@/types/tetris';

describe('BagRandomizer', () => {
  let bag: BagRandomizer;

  beforeEach(() => {
    bag = new BagRandomizer();
  });

  describe('7-bag algorithm', () => {
    it('should generate all 7 pieces in each bag', () => {
      const pieces: TetrominoType[] = [];
      
      // Get first 7 pieces
      for (let i = 0; i < 7; i++) {
        pieces.push(bag.next());
      }
      
      // Check we have all 7 different pieces
      const uniquePieces = new Set(pieces);
      expect(uniquePieces.size).toBe(7);
      
      // Check each piece type appears exactly once
      const pieceTypes = Object.values(TetrominoType);
      for (const type of pieceTypes) {
        const count = pieces.filter(p => p === type).length;
        expect(count).toBe(1);
      }
    });

    it('should generate a new bag after 7 pieces', () => {
      const firstBag: TetrominoType[] = [];
      const secondBag: TetrominoType[] = [];
      
      // Get first bag
      for (let i = 0; i < 7; i++) {
        firstBag.push(bag.next());
      }
      
      // Get second bag
      for (let i = 0; i < 7; i++) {
        secondBag.push(bag.next());
      }
      
      // Both bags should have all 7 pieces
      expect(new Set(firstBag).size).toBe(7);
      expect(new Set(secondBag).size).toBe(7);
      
      // Bags should likely be different (not guaranteed but very likely)
      const isDifferent = firstBag.some((piece, index) => piece !== secondBag[index]);
      expect(isDifferent).toBe(true);
    });

    it('should continue generating bags indefinitely', () => {
      const allPieces: TetrominoType[] = [];
      
      // Generate 100 pieces (14+ bags)
      for (let i = 0; i < 100; i++) {
        allPieces.push(bag.next());
      }
      
      // Check each group of 7 has all pieces
      for (let bagStart = 0; bagStart < 98; bagStart += 7) {
        const bagPieces = allPieces.slice(bagStart, bagStart + 7);
        const uniquePieces = new Set(bagPieces);
        expect(uniquePieces.size).toBe(7);
      }
    });
  });

  describe('peek functionality', () => {
    it('should show upcoming pieces without consuming them', () => {
      const peeked = bag.peek(5);
      expect(peeked).toHaveLength(5);
      
      // Now consume and verify they match
      for (let i = 0; i < 5; i++) {
        expect(bag.next()).toBe(peeked[i]);
      }
    });

    it('should peek across bag boundaries', () => {
      // Consume first 6 pieces
      for (let i = 0; i < 6; i++) {
        bag.next();
      }
      
      // Peek should show last piece of current bag + first 4 of next bag
      const peeked = bag.peek(5);
      expect(peeked).toHaveLength(5);
      
      // Verify all are valid piece types
      for (const piece of peeked) {
        expect(Object.values(TetrominoType)).toContain(piece);
      }
    });

    it('should handle large peek requests', () => {
      const peeked = bag.peek(20);
      expect(peeked).toHaveLength(20);
      
      // Check first 14 pieces (2 complete bags)
      const firstBag = peeked.slice(0, 7);
      const secondBag = peeked.slice(7, 14);
      
      expect(new Set(firstBag).size).toBe(7);
      expect(new Set(secondBag).size).toBe(7);
    });

    it('should not affect the sequence when peeking', () => {
      const testBag1 = new BagRandomizer(54321);
      const testBag2 = new BagRandomizer(54321);
      
      const sequence1: TetrominoType[] = [];
      const sequence2: TetrominoType[] = [];
      
      // Generate sequence with peeking
      for (let i = 0; i < 10; i++) {
        testBag1.peek(3); // Peek but don't use
        sequence1.push(testBag1.next());
      }
      
      // Generate without peeking
      for (let i = 0; i < 10; i++) {
        sequence2.push(testBag2.next());
      }
      
      // Sequences should be identical (same seed)
      expect(sequence1).toEqual(sequence2);
    });
  });

  describe('reset functionality', () => {
    it('should reset to initial state', () => {
      // Get some pieces
      const firstRun: TetrominoType[] = [];
      for (let i = 0; i < 10; i++) {
        firstRun.push(bag.next());
      }
      
      // Reset with same seed
      const testBag = new BagRandomizer(12345);
      const firstSeq: TetrominoType[] = [];
      for (let i = 0; i < 10; i++) {
        firstSeq.push(testBag.next());
      }
      
      testBag.reset(12345);
      const secondSeq: TetrominoType[] = [];
      for (let i = 0; i < 10; i++) {
        secondSeq.push(testBag.next());
      }
      
      // Should generate same sequence
      expect(secondSeq).toEqual(firstSeq);
    });

    it('should clear internal state on reset', () => {
      // Consume part of a bag
      for (let i = 0; i < 3; i++) {
        bag.next();
      }
      
      // Peek to populate next bags
      bag.peek(15);
      
      // Reset
      bag.reset();
      
      // First 7 pieces should be a complete bag
      const pieces: TetrominoType[] = [];
      for (let i = 0; i < 7; i++) {
        pieces.push(bag.next());
      }
      
      expect(new Set(pieces).size).toBe(7);
    });
  });

  describe('randomness', () => {
    it('should produce different sequences with different instances', () => {
      const bag1 = new BagRandomizer();
      const bag2 = new BagRandomizer();
      
      // Advance bag2 by one to ensure different state
      bag2.next();
      bag1.next();
      
      const sequence1: TetrominoType[] = [];
      const sequence2: TetrominoType[] = [];
      
      for (let i = 0; i < 7; i++) {
        sequence1.push(bag1.next());
        sequence2.push(bag2.next());
      }
      
      // Very likely to be different
      const isDifferent = sequence1.some((piece, index) => piece !== sequence2[index]);
      expect(isDifferent).toBe(true);
    });
  });
});