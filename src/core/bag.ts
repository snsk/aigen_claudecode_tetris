import { TetrominoType } from '@/types/tetris';

/**
 * 7-Bag Random Generator
 * Ensures all 7 pieces appear exactly once per bag before reshuffling
 */
export class BagRandomizer {
  private currentBag: TetrominoType[] = [];
  private nextBag: TetrominoType[] = [];
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Date.now();
    this.fillBag(this.currentBag);
    this.fillBag(this.nextBag);
  }

  /**
   * Get the next piece from the bag
   */
  next(): TetrominoType {
    if (this.currentBag.length === 0) {
      this.currentBag = this.nextBag;
      this.nextBag = [];
      this.fillBag(this.nextBag);
    }

    return this.currentBag.shift()!;
  }

  /**
   * Preview upcoming pieces without removing them
   * @param count Number of pieces to preview
   */
  preview(count: number): TetrominoType[] {
    const allPieces = [...this.currentBag, ...this.nextBag];
    
    // If we need more pieces than available, generate more bags
    while (allPieces.length < count) {
      const tempBag: TetrominoType[] = [];
      this.fillBag(tempBag);
      allPieces.push(...tempBag);
    }

    return allPieces.slice(0, count);
  }

  /**
   * Fill a bag with all 7 tetromino types and shuffle
   */
  private fillBag(bag: TetrominoType[]): void {
    // Add all 7 pieces
    bag.push(
      TetrominoType.I,
      TetrominoType.O,
      TetrominoType.T,
      TetrominoType.S,
      TetrominoType.Z,
      TetrominoType.J,
      TetrominoType.L
    );

    // Fisher-Yates shuffle
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
  }

  /**
   * Simple pseudorandom number generator
   * Using Linear Congruential Generator for reproducibility
   */
  private random(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 2147483648;
    return this.seed / 2147483648;
  }

  /**
   * Reset the randomizer with a new seed
   */
  reset(seed?: number): void {
    this.seed = seed ?? Date.now();
    this.currentBag = [];
    this.nextBag = [];
    this.fillBag(this.currentBag);
    this.fillBag(this.nextBag);
  }
}