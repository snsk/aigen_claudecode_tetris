/**
 * Simple script to generate PWA icons
 * This creates simple colored square icons for the PWA
 */
import * as PIXI from 'pixi.js';
import { TETROMINO_COLORS } from '@/types/tetris';

export async function generateIcons(): Promise<void> {
  const app = new PIXI.Application();
  await app.init({
    width: 512,
    height: 512,
    backgroundColor: 0x0a0a0a,
    resolution: 1,
  });

  // Create icon graphics
  const graphics = new PIXI.Graphics();
  
  // Draw background
  graphics.beginFill(0x1a1a1a);
  graphics.drawRoundedRect(0, 0, 512, 512, 64);
  graphics.endFill();
  
  // Draw tetromino blocks
  const blockSize = 80;
  const colors = Object.values(TETROMINO_COLORS);
  
  // Draw a 4x4 grid of blocks in the center
  const startX = (512 - 4 * blockSize) / 2;
  const startY = (512 - 4 * blockSize) / 2;
  
  const pattern = [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 1, 1],
    [1, 1, 1, 0],
  ];
  
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (pattern[row][col] === 1) {
        const colorIndex = (row + col) % colors.length;
        const color = colors[colorIndex];
        
        // Draw block
        graphics.beginFill(color);
        graphics.drawRect(
          startX + col * blockSize + 4,
          startY + row * blockSize + 4,
          blockSize - 8,
          blockSize - 8
        );
        graphics.endFill();
        
        // Draw highlight
        graphics.beginFill(color, 0.3);
        graphics.drawPolygon([
          startX + col * blockSize + 4,
          startY + row * blockSize + 4,
          startX + col * blockSize + blockSize - 4,
          startY + row * blockSize + 4,
          startX + col * blockSize + blockSize - 12,
          startY + row * blockSize + 12,
          startX + col * blockSize + 12,
          startY + row * blockSize + 12,
          startX + col * blockSize + 12,
          startY + row * blockSize + blockSize - 12,
          startX + col * blockSize + 4,
          startY + row * blockSize + blockSize - 4,
        ]);
        graphics.endFill();
      }
    }
  }
  
  app.stage.addChild(graphics);
  
  // Note: In a real implementation, you would extract the canvas data
  // and save it as PNG files. For this demo, we'll use placeholder icons.
  console.log('Icons would be generated here');
  
  app.destroy();
}