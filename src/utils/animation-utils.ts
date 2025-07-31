import * as PIXI from 'pixi.js';
import { ErrorHandler } from './error-handler';

/**
 * Animation utilities for consistent effect handling
 */
export class AnimationUtils {
  /**
   * Create a fade out animation
   */
  static fadeOut(
    target: PIXI.Container | PIXI.Graphics | PIXI.Text,
    container: PIXI.Container,
    _duration: number = 1000,
    fadeStep: number = 0.02
  ): void {
    const animate = () => {
      ErrorHandler.safe(() => {
        target.alpha -= fadeStep;
        if (target.alpha <= 0) {
          container.removeChild(target);
          target.destroy();
        } else {
          requestAnimationFrame(animate);
        }
      }, 'Fade out animation');
    };
    animate();
  }

  /**
   * Create a scale up and fade animation
   */
  static scaleAndFade(
    target: PIXI.Container | PIXI.Graphics | PIXI.Text,
    container: PIXI.Container,
    scaleStep: number = 0.02,
    fadeStep: number = 0.02
  ): void {
    const animate = () => {
      ErrorHandler.safe(() => {
        target.scale.x += scaleStep;
        target.scale.y += scaleStep;
        target.alpha -= fadeStep;

        if (target.alpha <= 0) {
          container.removeChild(target);
          target.destroy();
        } else {
          requestAnimationFrame(animate);
        }
      }, 'Scale and fade animation');
    };
    animate();
  }

  /**
   * Create a flash effect
   */
  static flash(
    graphics: PIXI.Graphics,
    container: PIXI.Container,
    duration: number = 100
  ): void {
    container.addChild(graphics);
    
    setTimeout(() => {
      ErrorHandler.safe(() => {
        if (container.children.includes(graphics)) {
          container.removeChild(graphics);
          graphics.destroy();
        }
      }, 'Flash effect cleanup');
    }, duration);
  }

  /**
   * Create line clear flash graphics
   */
  static createLineClearFlash(
    lines: number[],
    boardWidth: number,
    blockSize: number,
    hiddenRows: number
  ): PIXI.Graphics[] {
    return lines.map(line => {
      const flash = new PIXI.Graphics();
      flash.beginFill(0xffffff, 0.8);
      flash.drawRect(0, (line - hiddenRows) * blockSize, boardWidth * blockSize, blockSize);
      flash.endFill();
      return flash;
    });
  }

  /**
   * Create T-Spin glow effect
   */
  static createTSpinGlow(boardWidth: number, boardHeight: number, blockSize: number): PIXI.Graphics {
    const glow = new PIXI.Graphics();
    glow.beginFill(0xa000f0, 0.5);
    glow.drawRect(0, 0, boardWidth * blockSize, boardHeight * blockSize);
    glow.endFill();
    return glow;
  }

  /**
   * Create combo text
   */
  static createComboText(combo: number, boardWidth: number, boardHeight: number, blockSize: number): PIXI.Text {
    const text = new PIXI.Text(`${combo} Ren`, {
      fontFamily: 'Arial',
      fontSize: 18,
      fill: 0xffff00,
      fontWeight: 'bold',
    });
    
    text.x = (boardWidth * blockSize) / 2;
    text.y = (boardHeight * blockSize) / 2;
    text.anchor.set(0.5);
    
    return text;
  }
}