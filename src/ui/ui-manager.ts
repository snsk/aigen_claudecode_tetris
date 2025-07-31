import { GameStats } from '@/types/tetris';
import { ErrorHandler } from '@/utils/error-handler';

/**
 * UI management class - handles DOM updates and dialogs
 */
export class UIManager {
  private scoreElement: HTMLElement;
  private levelElement: HTMLElement;
  private linesElement: HTMLElement;
  private fpsElement: HTMLElement;

  constructor() {
    this.scoreElement = ErrorHandler.getRequiredElement('score');
    this.levelElement = ErrorHandler.getRequiredElement('level');
    this.linesElement = ErrorHandler.getRequiredElement('lines');
    this.fpsElement = ErrorHandler.getRequiredElement('fps');
  }

  /**
   * Update game statistics display
   */
  updateStats(stats: GameStats): void {
    ErrorHandler.safe(() => {
      this.scoreElement.textContent = stats.score.toString();
      this.levelElement.textContent = stats.level.toString();
      this.linesElement.textContent = stats.lines.toString();
    }, 'UI stats update');
  }

  /**
   * Update FPS display
   */
  updateFPS(fps: number): void {
    ErrorHandler.safe(() => {
      this.fpsElement.textContent = fps.toString();
    }, 'FPS update');
  }

  /**
   * Show game dialog (game over, completion, etc.)
   */
  showDialog(config: {
    title: string;
    subtitle?: string;
    stats?: GameStats;
    buttonText: string;
    buttonColor?: string;
    onRestart: () => void;
  }): void {
    const dialog = document.createElement('div');
    dialog.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    
    const buttonColorClass = config.buttonColor || 'bg-blue-600 hover:bg-blue-700';
    
    dialog.innerHTML = `
      <div class="bg-tetris-grid border-2 border-tetris-border rounded-lg p-8 text-center">
        <h2 class="text-3xl font-bold mb-4 ${config.buttonColor === 'bg-yellow-600' ? 'text-yellow-400' : ''}">${config.title}</h2>
        ${config.subtitle ? `<p class="text-xl mb-4">${config.subtitle}</p>` : ''}
        ${config.stats ? `
          <div class="space-y-2 mb-6">
            <p>Score: ${config.stats.score}</p>
            <p>Lines: ${config.stats.lines}</p>
            <p>Level: ${config.stats.level}</p>
          </div>
        ` : ''}
        <button id="restart-btn" class="${buttonColorClass} px-6 py-2 rounded">
          ${config.buttonText}
        </button>
      </div>
    `;

    document.body.appendChild(dialog);

    const restartBtn = document.getElementById('restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        document.body.removeChild(dialog);
        config.onRestart();
      });
    }
  }

  /**
   * Show game over dialog
   */
  showGameOverDialog(stats: GameStats, onRestart: () => void): void {
    this.showDialog({
      title: 'GAME OVER',
      stats,
      buttonText: 'Play Again',
      onRestart,
    });
  }

  /**
   * Show completion dialog (999 lines)
   */
  showCompletionDialog(stats: GameStats, onRestart: () => void): void {
    this.showDialog({
      title: 'CONGRATULATIONS!',
      subtitle: 'You completed 999 lines!',
      stats: {
        score: stats.score,
        lines: stats.lines,
        level: stats.level,
        combo: stats.combo,
        backToBack: stats.backToBack,
      },
      buttonText: 'Play Again',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      onRestart,
    });
  }
}