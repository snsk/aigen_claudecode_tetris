import * as PIXI from 'pixi.js';
import { 
  TetrominoType, 
  TETROMINO_COLORS, 
  BOARD_WIDTH, 
  BOARD_HEIGHT, 
  HIDDEN_ROWS
} from '@/types/tetris';
import { Game } from '@/core/game';
import { PieceData } from '@/core/piece';
import { AnimationUtils } from '@/utils/animation-utils';
import { ParticleSystem } from '@/utils/particle-system';

/**
 * Constants for rendering
 */
const BLOCK_SIZE = 28;
const BOARD_PADDING = 2;
const GRID_COLOR = 0x333333;
const GHOST_ALPHA = 0.3;

/**
 * Main renderer class using PixiJS
 */
export class Renderer {
  private app: PIXI.Application;
  private game: Game;
  
  private boardContainer: PIXI.Container;
  private gridGraphics: PIXI.Graphics;
  private blocksContainer: PIXI.Container;
  private pieceContainer: PIXI.Container;
  private ghostContainer: PIXI.Container;
  private effectsContainer: PIXI.Container;
  
  private holdCanvas: HTMLCanvasElement | null = null;
  private nextCanvases: HTMLCanvasElement[] = [];
  
  private blockTextures: Map<TetrominoType, PIXI.Texture> = new Map();
  private particleSystem!: ParticleSystem;
  
  private frameCount = 0;
  private fpsUpdateTimer = 0;

  constructor(game: Game) {
    this.game = game;
    
    // Initialize PixiJS application
    this.app = new PIXI.Application();
    
    // Initialize containers
    this.boardContainer = new PIXI.Container();
    this.gridGraphics = new PIXI.Graphics();
    this.blocksContainer = new PIXI.Container();
    this.pieceContainer = new PIXI.Container();
    this.ghostContainer = new PIXI.Container();
    this.effectsContainer = new PIXI.Container();
  }

  /**
   * Initialize the renderer
   */
  async init(
    gameContainer: HTMLElement,
    holdElement: HTMLElement,
    nextElement: HTMLElement
  ): Promise<void> {
    // Initialize PIXI app
    await this.app.init({
      width: BOARD_WIDTH * BLOCK_SIZE + BOARD_PADDING * 2,
      height: BOARD_HEIGHT * BLOCK_SIZE + BOARD_PADDING * 2,
      backgroundColor: 0x0a0a0a,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: false, // Pixel art style
      preference: 'webgl', // Prefer WebGL, fallback to Canvas2D
    });

    // Add canvas to container
    gameContainer.appendChild(this.app.canvas as HTMLCanvasElement);

    // Setup board rendering
    this.setupBoard();
    
    // Setup preview containers
    this.setupHoldContainer(holdElement);
    this.setupNextContainers(nextElement);
    
    // Create block textures
    this.createBlockTextures();
    
    // Initialize particle system
    this.particleSystem = new ParticleSystem(this.app, this.effectsContainer);
    
    // Subscribe to game events
    this.subscribeToGameEvents();
    
    // Start render loop
    this.app.ticker.add(this.render.bind(this));
  }

  /**
   * Setup the main game board
   */
  private setupBoard(): void {
    // Position board container
    this.boardContainer.x = BOARD_PADDING;
    this.boardContainer.y = BOARD_PADDING;

    // Draw grid
    this.drawGrid();
    
    // Add layers in correct order
    this.boardContainer.addChild(this.gridGraphics);
    this.boardContainer.addChild(this.blocksContainer);
    this.boardContainer.addChild(this.ghostContainer);
    this.boardContainer.addChild(this.pieceContainer);
    this.boardContainer.addChild(this.effectsContainer);
    
    this.app.stage.addChild(this.boardContainer);
  }

  /**
   * Draw the background grid
   */
  private drawGrid(): void {
    this.gridGraphics.clear();
    
    // Draw grid lines
    this.gridGraphics.lineStyle(1, GRID_COLOR, 0.3);
    
    // Vertical lines
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      this.gridGraphics.moveTo(x * BLOCK_SIZE, 0);
      this.gridGraphics.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
    }
    
    // Horizontal lines (only visible area)
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      this.gridGraphics.moveTo(0, y * BLOCK_SIZE);
      this.gridGraphics.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
    }
  }

  /**
   * Create textures for tetromino blocks
   */
  private createBlockTextures(): void {
    Object.entries(TETROMINO_COLORS).forEach(([type, color]) => {
      const graphics = new PIXI.Graphics();
      
      // Main block
      graphics.beginFill(color);
      graphics.drawRect(1, 1, BLOCK_SIZE - 2, BLOCK_SIZE - 2);
      graphics.endFill();
      
      // Highlight (top-left)
      graphics.beginFill(color, 0.3);
      graphics.drawPolygon([
        0, 0,
        BLOCK_SIZE, 0,
        BLOCK_SIZE - 4, 4,
        4, 4,
        4, BLOCK_SIZE - 4,
        0, BLOCK_SIZE
      ]);
      graphics.endFill();
      
      // Shadow (bottom-right)
      graphics.beginFill(0x000000, 0.3);
      graphics.drawPolygon([
        BLOCK_SIZE, BLOCK_SIZE,
        0, BLOCK_SIZE,
        4, BLOCK_SIZE - 4,
        BLOCK_SIZE - 4, BLOCK_SIZE - 4,
        BLOCK_SIZE - 4, 4,
        BLOCK_SIZE, 0
      ]);
      graphics.endFill();
      
      // Create texture
      const texture = this.app.renderer.generateTexture(graphics);
      this.blockTextures.set(type as TetrominoType, texture);
      
      graphics.destroy();
    });
  }

  /**
   * Setup hold container
   */
  private setupHoldContainer(element: HTMLElement): void {
    this.holdCanvas = document.createElement('canvas');
    this.holdCanvas.width = 96;
    this.holdCanvas.height = 96;
    this.holdCanvas.style.backgroundColor = '#1a1a1a';
    element.appendChild(this.holdCanvas);
  }

  /**
   * Setup next piece containers
   */
  private setupNextContainers(element: HTMLElement): void {
    for (let i = 0; i < 5; i++) {
      const div = document.createElement('div');
      div.className = 'w-24 h-16';
      element.appendChild(div);
      
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 64;
      canvas.style.backgroundColor = '#1a1a1a';
      div.appendChild(canvas);
      
      this.nextCanvases.push(canvas);
    }
  }

  /**
   * Subscribe to game events
   */
  private subscribeToGameEvents(): void {
    this.game.on('line_clear', (event) => {
      this.animateLineClear(event.data.lines);
      this.emitLineClearParticles(event.data.lines);
    });
    
    this.game.on('piece_landing', (event) => {
      // Emit particles when piece first touches the ground
      this.emitPieceLandingParticles(event.data.piece);
    });
    
    this.game.on('piece_lock', () => {
      this.animatePieceLock();
      // Don't emit landing particles here anymore since we handle it in piece_landing
    });
    
    this.game.on('tspin', () => {
      this.animateTSpin();
    });
    
    this.game.on('combo', (event) => {
      this.animateCombo(event.data.combo);
    });
  }

  /**
   * Main render loop
   */
  private render(ticker: PIXI.Ticker): void {
    const deltaTime = ticker.deltaMS;
    
    // Update FPS counter
    this.frameCount++;
    this.fpsUpdateTimer += deltaTime;
    if (this.fpsUpdateTimer >= 1000) {
      const fps = Math.round(this.frameCount * 1000 / this.fpsUpdateTimer);
      document.getElementById('fps')!.textContent = fps.toString();
      this.frameCount = 0;
      this.fpsUpdateTimer = 0;
    }
    
    // Update game
    this.game.update(deltaTime);
    
    // Update particle system
    this.particleSystem.update(deltaTime);
    
    // Render board
    this.renderBoard();
    this.renderCurrentPiece();
    this.renderGhostPiece();
    this.renderHoldPiece();
    this.renderNextPieces();
    
    // Update UI
    this.updateUI();
  }

  /**
   * Render the game board
   */
  private renderBoard(): void {
    this.blocksContainer.removeChildren();
    
    const grid = this.game.getBoard().getGrid();
    
    for (let y = HIDDEN_ROWS; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const cell = grid[y][x];
        if (cell !== null) {
          const sprite = new PIXI.Sprite(this.blockTextures.get(cell));
          sprite.x = x * BLOCK_SIZE;
          sprite.y = (y - HIDDEN_ROWS) * BLOCK_SIZE;
          this.blocksContainer.addChild(sprite);
        }
      }
    }
  }

  /**
   * Render the current falling piece
   */
  private renderCurrentPiece(): void {
    this.pieceContainer.removeChildren();
    
    const piece = this.game.getCurrentPiece();
    if (!piece) return;
    
    const shape = PieceData.getShape(piece.type, piece.rotation);
    const texture = this.blockTextures.get(piece.type);
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 0) continue;
        
        const x = piece.position.x + col;
        const y = piece.position.y + row - HIDDEN_ROWS;
        
        if (y >= 0) {
          const sprite = new PIXI.Sprite(texture);
          sprite.x = x * BLOCK_SIZE;
          sprite.y = y * BLOCK_SIZE;
          this.pieceContainer.addChild(sprite);
        }
      }
    }
  }

  /**
   * Render the ghost piece
   */
  private renderGhostPiece(): void {
    this.ghostContainer.removeChildren();
    
    const piece = this.game.getCurrentPiece();
    const ghostPos = this.game.getGhostPosition();
    if (!piece || !ghostPos) return;
    
    const shape = PieceData.getShape(piece.type, piece.rotation);
    const texture = this.blockTextures.get(piece.type);
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 0) continue;
        
        const x = ghostPos.x + col;
        const y = ghostPos.y + row - HIDDEN_ROWS;
        
        if (y >= 0) {
          const sprite = new PIXI.Sprite(texture);
          sprite.x = x * BLOCK_SIZE;
          sprite.y = y * BLOCK_SIZE;
          sprite.alpha = GHOST_ALPHA;
          this.ghostContainer.addChild(sprite);
        }
      }
    }
  }

  /**
   * Render hold piece
   */
  private renderHoldPiece(): void {
    if (!this.holdCanvas) return;
    
    const ctx = this.holdCanvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, this.holdCanvas.width, this.holdCanvas.height);
    
    const holdPiece = this.game.getHoldPiece();
    if (!holdPiece) return;
    
    this.drawPreviewPiece(ctx, holdPiece, 48, 48);
  }

  /**
   * Render next pieces
   */
  private renderNextPieces(): void {
    const nextPieces = this.game.getNextPieces(5);
    
    nextPieces.forEach((type, index) => {
      const canvas = this.nextCanvases[index];
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      this.drawPreviewPiece(ctx, type, 48, 32);
    });
  }

  /**
   * Draw a piece on Canvas2D
   */
  private drawPreviewPiece(
    ctx: CanvasRenderingContext2D,
    type: TetrominoType, 
    centerX: number, 
    centerY: number
  ): void {
    const shape = PieceData.getShape(type, 0);
    const color = TETROMINO_COLORS[type];
    const blockSize = 20;
    
    // Calculate bounds
    let minX = shape[0].length, maxX = 0;
    let minY = shape.length, maxY = 0;
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 1) {  
          minX = Math.min(minX, col);
          maxX = Math.max(maxX, col);
          minY = Math.min(minY, row);
          maxY = Math.max(maxY, row);
        }
      }
    }
    
    const width = (maxX - minX + 1) * blockSize;
    const height = (maxY - minY + 1) * blockSize;
    const offsetX = centerX - width / 2;
    const offsetY = centerY - height / 2;
    
    // Convert hex color to CSS color
    const hexColor = color.toString(16).padStart(6, '0');
    const cssColor = `#${hexColor}`;
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] === 0) continue;
        
        const x = offsetX + (col - minX) * blockSize;
        const y = offsetY + (row - minY) * blockSize;
        
        // Draw main block
        ctx.fillStyle = cssColor;
        ctx.fillRect(x + 1, y + 1, blockSize - 2, blockSize - 2);
        
        // Draw border
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, blockSize - 1, blockSize - 1);
      }
    }
  }

  /**
   * Update UI elements (handled by UIManager)
   */
  private updateUI(): void {
    // UI updates are now handled by UIManager
  }

  /**
   * Animate line clear
   */
  private animateLineClear(lines: number[]): void {
    const flashes = AnimationUtils.createLineClearFlash(lines, BOARD_WIDTH, BLOCK_SIZE, HIDDEN_ROWS);
    
    flashes.forEach(flash => {
      setTimeout(() => {
        AnimationUtils.fadeOut(flash, this.effectsContainer, 500, 0.05);
      }, 50);
      
      this.effectsContainer.addChild(flash);
    });
  }

  /**
   * Animate piece lock
   */
  private animatePieceLock(): void {
    // Flash effect removed per user request
  }

  /**
   * Animate T-Spin
   */
  private animateTSpin(): void {
    const glow = AnimationUtils.createTSpinGlow(BOARD_WIDTH, BOARD_HEIGHT, BLOCK_SIZE);
    this.effectsContainer.addChild(glow);
    AnimationUtils.fadeOut(glow, this.effectsContainer, 2000, 0.02);
  }

  /**
   * Animate combo
   */
  private animateCombo(combo: number): void {
    const text = AnimationUtils.createComboText(combo, BOARD_WIDTH, BOARD_HEIGHT, BLOCK_SIZE);
    this.effectsContainer.addChild(text);
    AnimationUtils.scaleAndFade(text, this.effectsContainer);
  }

  /**
   * Emit particles for piece landing
   */
  private emitPieceLandingParticles(piece: any): void {
    if (!piece) return;
    
    const shape = PieceData.getShape(piece.type, piece.rotation);
    const color = TETROMINO_COLORS[piece.type as TetrominoType];
    
    // Find the bottom blocks of the piece for particle emission
    for (let col = 0; col < shape[0].length; col++) {
      for (let row = shape.length - 1; row >= 0; row--) {
        if (shape[row][col] === 1) {
          const worldX = (piece.position.x + col + 0.5) * BLOCK_SIZE;
          const worldY = (piece.position.y + row - HIDDEN_ROWS + 1) * BLOCK_SIZE;
          
          // Only emit if the block is visible (not in hidden area)
          if (piece.position.y + row >= HIDDEN_ROWS) {
            this.particleSystem.emitPieceLanding(worldX, worldY, color, 4);
          }
          break; // Only the bottom block in each column
        }
      }
    }
  }

  /**
   * Emit particles for line clear
   */
  private emitLineClearParticles(lines: number[]): void {
    if (lines.length === 0) return;
    
    // Calculate the average Y position for the particle effect center
    const visibleLines = lines.filter(line => line >= HIDDEN_ROWS);
    if (visibleLines.length === 0) return;
    
    const avgY = visibleLines.reduce((sum, line) => sum + line, 0) / visibleLines.length;
    const worldY = (avgY - HIDDEN_ROWS + 0.5) * BLOCK_SIZE;
    const startX = 0;
    const endX = BOARD_WIDTH * BLOCK_SIZE;
    
    // Emit particles based on total line count, centered on average position
    this.particleSystem.emitLineClear(startX, endX, worldY, lines.length);
  }

  /**
   * Destroy the renderer
   */
  destroy(): void {
    this.particleSystem?.destroy();
    this.app.destroy(true, { children: true });
  }
}