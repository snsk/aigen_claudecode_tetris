import './style.css';
import { Game, InputAction } from '@/core/game';
import { Renderer } from '@/renderer/renderer';
import { GameState } from '@/types/tetris';
import { UIManager } from '@/ui/ui-manager';
import { ErrorHandler } from '@/utils/error-handler';
import { renderBackground, updateBackgroundTime } from '@/components/Background';
import '@/components/Background.css';

/**
 * Keyboard mapping
 */
const KEY_MAPPING: Record<string, InputAction> = {
  'ArrowLeft': InputAction.MOVE_LEFT,
  'ArrowRight': InputAction.MOVE_RIGHT,
  'ArrowDown': InputAction.SOFT_DROP,
  'ArrowUp': InputAction.ROTATE_CW,
  ' ': InputAction.HARD_DROP,
  'z': InputAction.ROTATE_CCW,
  'Z': InputAction.ROTATE_CCW,
  'x': InputAction.ROTATE_CW,
  'X': InputAction.ROTATE_CW,
  'c': InputAction.HOLD,
  'C': InputAction.HOLD,
  'p': InputAction.PAUSE,
  'P': InputAction.PAUSE,
};

/**
 * Main application class
 */
class TetrisApp {
  private game: Game;
  private renderer: Renderer;
  private uiManager: UIManager;
  private pressedKeys: Set<string> = new Set();

  constructor() {
    this.game = new Game();
    this.renderer = new Renderer(this.game);
    this.uiManager = new UIManager();
  }

  /**
   * Initialize the application
   */
  async init(): Promise<void> {
    try {
      // Initialize background
      this.initBackground();
      
      // Get DOM elements with error handling
      const gameContainer = ErrorHandler.getRequiredElement('game-container');
      const holdContainer = ErrorHandler.getRequiredElement('hold-container');
      const nextContainer = ErrorHandler.getRequiredElement('next-container');

      // Initialize renderer
      await ErrorHandler.safeAsync(
        () => this.renderer.init(gameContainer, holdContainer, nextContainer),
        'Renderer initialization'
      );

      // Setup keyboard input
      this.setupKeyboardInput();

      // Setup game event handlers
      this.setupGameEvents();

      // Start UI update loop
      this.startUIUpdateLoop();

      // Start the game
      this.game.start();
    } catch (error) {
      ErrorHandler.handle(error instanceof Error ? error : new Error(String(error)), 'App initialization');
      this.showErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }

  /**
   * Initialize background component
   */
  private initBackground(): void {
    const backgroundContainer = document.getElementById('background-container');
    if (backgroundContainer) {
      const backgroundElement = renderBackground();
      backgroundContainer.appendChild(backgroundElement);
    }
  }

  /**
   * Setup keyboard input handling
   */
  private setupKeyboardInput(): void {
    // Handle keydown
    window.addEventListener('keydown', (event) => {
      // Prevent default for game keys
      if (KEY_MAPPING[event.key]) {
        event.preventDefault();
      }

      // Ignore if already pressed (for key repeat)
      if (this.pressedKeys.has(event.key)) {
        return;
      }

      this.pressedKeys.add(event.key);

      const action = KEY_MAPPING[event.key];
      if (action) {
        this.game.handleInput(action, true);
      }
    });

    // Handle keyup
    window.addEventListener('keyup', (event) => {
      this.pressedKeys.delete(event.key);

      const action = KEY_MAPPING[event.key];
      if (action) {
        this.game.handleInput(action, false);
      }
    });

    // Handle window blur (release all keys)
    window.addEventListener('blur', () => {
      this.pressedKeys.forEach(key => {
        const action = KEY_MAPPING[key];
        if (action) {
          this.game.handleInput(action, false);
        }
      });
      this.pressedKeys.clear();
    });
  }

  /**
   * Setup game event handlers
   */
  private setupGameEvents(): void {
    // Handle game over
    this.game.on('game_over', () => {
      this.showGameOverDialog();
    });

    // Handle level up
    this.game.on('level_up', (event) => {
      console.log(`Level up! New level: ${event.data.level}`);
      // Update background time based on level
      updateBackgroundTime(event.data.level);
      // Trigger level up particle effect
      this.showLevelUpEffect();
    });

    // Handle game completion (999 lines)
    this.checkGameCompletion();
  }

  /**
   * Show level up particle effect
   */
  private showLevelUpEffect(): void {
    const levelElement = document.getElementById('level');
    if (!levelElement) return;

    // Create particle container
    const particleContainer = document.createElement('div');
    particleContainer.className = 'level-up-particles';
    particleContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      pointer-events: none;
      z-index: 1000;
    `;

    // Create particles
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'level-particle';
      particle.style.cssText = `
        position: absolute;
        width: 8px;
        height: 8px;
        background: linear-gradient(45deg, #FFD700, #FFA500);
        border-radius: 50%;
        animation: levelParticle 1.5s ease-out forwards;
        transform-origin: center;
        --angle: ${(i * 30)}deg;
        --distance: ${60 + Math.random() * 40}px;
      `;
      particleContainer.appendChild(particle);
    }

    // Add to level element's parent
    levelElement.parentElement?.appendChild(particleContainer);

    // Remove after animation
    setTimeout(() => {
      particleContainer.remove();
    }, 1500);
  }

  /**
   * Check for game completion
   */
  private checkGameCompletion(): void {
    setInterval(() => {
      const state = this.game.getState();
      const stats = this.game.getStats();
      
      if (state === GameState.PLAYING && stats.lines >= 999) {
        this.showCompletionDialog();
      }
    }, 100);
  }

  /**
   * Show game over dialog
   */
  private showGameOverDialog(): void {
    const stats = this.game.getStats();
    this.uiManager.showGameOverDialog(stats, () => {
      this.game.start();
    });
  }

  /**
   * Show completion dialog (999 lines)
   */
  private showCompletionDialog(): void {
    const stats = this.game.getStats();
    this.uiManager.showCompletionDialog(stats, () => {
      this.game.start();
    });
  }

  /**
   * Start UI update loop
   */
  private startUIUpdateLoop(): void {
    let frameCount = 0;
    let fpsUpdateTimer = 0;
    let lastTime = performance.now();

    const updateLoop = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      ErrorHandler.safe(() => {
        // Update FPS counter
        frameCount++;
        fpsUpdateTimer += deltaTime;
        if (fpsUpdateTimer >= 1000) {
          const fps = Math.round(frameCount * 1000 / fpsUpdateTimer);
          this.uiManager.updateFPS(fps);
          frameCount = 0;
          fpsUpdateTimer = 0;
        }

        // Update game stats
        const stats = this.game.getStats();
        this.uiManager.updateStats(stats);
      }, 'UI update loop');

      requestAnimationFrame(updateLoop);
    };

    requestAnimationFrame(updateLoop);
  }

  /**
   * Show error message to user
   */
  private showErrorMessage(message: string): void {
    const container = document.getElementById('app');
    if (container) {
      container.innerHTML = `
        <div class="text-center p-8">
          <h1 class="text-2xl font-bold mb-4 text-red-400">Error</h1>
          <p class="mb-4">Failed to initialize the game. Please refresh the page.</p>
          <p class="text-sm text-gray-400">${message}</p>
          <button onclick="location.reload()" class="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
            Reload Game
          </button>
        </div>
      `;
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Set up global error handler
  ErrorHandler.setErrorHandler((error) => {
    console.error('Game Error:', error);
  });

  try {
    const app = new TetrisApp();
    await app.init();
  } catch (error) {
    ErrorHandler.handle(error instanceof Error ? error : new Error(String(error)), 'App startup');
  }
});