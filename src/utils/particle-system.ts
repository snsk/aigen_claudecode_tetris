import * as PIXI from 'pixi.js';

/**
 * Particle interface
 */
interface Particle {
  sprite: PIXI.Sprite;
  velocity: { x: number; y: number };
  life: number;
  maxLife: number;
  gravity: number;
  scale: number;
  rotation: number;
  rotationSpeed: number;
  alpha: number;
}

/**
 * Particle system for visual effects
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private container: PIXI.Container;
  private app: PIXI.Application;
  private particlePool: PIXI.Sprite[] = [];
  private maxParticles = 200;

  constructor(app: PIXI.Application, container: PIXI.Container) {
    this.app = app;
    this.container = container;
    this.initializePool();
  }

  /**
   * Initialize particle pool for performance
   */
  private initializePool(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      const sprite = new PIXI.Sprite();
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.particlePool.push(sprite);
      this.container.addChild(sprite);
    }
  }

  /**
   * Get a sprite from the pool
   */
  private getPooledSprite(): PIXI.Sprite | null {
    for (const sprite of this.particlePool) {
      if (!sprite.visible) {
        sprite.visible = true;
        return sprite;
      }
    }
    return null;
  }

  /**
   * Return sprite to pool
   */
  private returnToPool(sprite: PIXI.Sprite): void {
    sprite.visible = false;
    sprite.scale.set(1);
    sprite.rotation = 0;
    sprite.alpha = 1;
  }

  /**
   * Create block texture for particles
   */
  private createBlockTexture(color: number, size: number = 4): PIXI.Texture {
    const graphics = new PIXI.Graphics();
    graphics.beginFill(color);
    graphics.drawRect(0, 0, size, size);
    graphics.endFill();
    
    return this.app.renderer.generateTexture(graphics);
  }

  /**
   * Emit particles for piece landing
   */
  emitPieceLanding(x: number, y: number, color: number, count: number = 8): void {
    const texture = this.createBlockTexture(color, 3);
    
    for (let i = 0; i < count; i++) {
      const sprite = this.getPooledSprite();
      if (!sprite) break;

      sprite.texture = texture;
      sprite.x = x + (Math.random() - 0.5) * 20;
      sprite.y = y + (Math.random() - 0.5) * 10;
      sprite.scale.set(0.5 + Math.random() * 0.5);

      const particle: Particle = {
        sprite,
        velocity: {
          x: (Math.random() - 0.5) * 80,
          y: -Math.random() * 50 - 20
        },
        life: 0,
        maxLife: 0.5 + Math.random() * 0.3,
        gravity: 150 + Math.random() * 100,
        scale: sprite.scale.x,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10,
        alpha: 0.8 + Math.random() * 0.2
      };

      this.particles.push(particle);
    }
  }

  /**
   * Emit particles for line clear
   */
  emitLineClear(startX: number, endX: number, y: number, lineCount: number): void {
    // Base particle count increases dramatically with line count
    let baseParticleCount: number;
    let colors: number[];
    let sparkleIntensity: number;
    
    switch (lineCount) {
      case 1:
        // Single line - moderate effect
        baseParticleCount = 20;
        colors = [0xffffff, 0xffff99, 0x99ffff];
        sparkleIntensity = 1;
        break;
      case 2:
        // Double line - enhanced effect
        baseParticleCount = 35;
        colors = [0xffffff, 0xffff00, 0x00ffff, 0xff88ff, 0x88ff88];
        sparkleIntensity = 2;
        break;
      case 3:
        // Triple line - impressive effect
        baseParticleCount = 55;
        colors = [0xffffff, 0xffff00, 0xff8800, 0xff4444, 0x44ff44, 0x4444ff, 0xff44ff];
        sparkleIntensity = 3;
        break;
      case 4:
        // Tetris - spectacular effect
        baseParticleCount = 80;
        colors = [0xffffff, 0xffff00, 0xff8800, 0xff4444, 0x44ff44, 0x4444ff, 0xff44ff, 0xff0088, 0x8800ff];
        sparkleIntensity = 5;
        break;
      default:
        baseParticleCount = Math.min(lineCount * 20, 100);
        colors = [0xffffff, 0xffff00, 0xff8800, 0xff4444, 0x44ff44, 0x4444ff, 0xff44ff];
        sparkleIntensity = Math.min(lineCount, 5);
    }
    
    // Main particle burst
    for (let i = 0; i < baseParticleCount; i++) {
      const sprite = this.getPooledSprite();
      if (!sprite) break;

      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 2 + Math.random() * 4 + (lineCount * 0.5);
      const texture = this.createBlockTexture(color, size);
      
      sprite.texture = texture;
      sprite.x = startX + Math.random() * (endX - startX);
      sprite.y = y + (Math.random() - 0.5) * 30;
      sprite.scale.set(0.4 + Math.random() * 0.8 + (lineCount * 0.1));

      // More dramatic velocity for higher line counts
      const velocityMultiplier = 1 + (lineCount * 0.3);
      const particle: Particle = {
        sprite,
        velocity: {
          x: (Math.random() - 0.5) * 250 * velocityMultiplier,
          y: -Math.random() * 120 - 60 - (lineCount * 20)
        },
        life: 0,
        maxLife: 0.9 + Math.random() * 0.6 + (lineCount * 0.1),
        gravity: 80 + Math.random() * 60,
        scale: sprite.scale.x,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 20,
        alpha: 0.9 + Math.random() * 0.1
      };

      this.particles.push(particle);
    }

    // Always emit sparkles, but intensity varies
    this.emitSparkles(startX + (endX - startX) / 2, y, sparkleIntensity);
    
    // Add extra burst effects for Tetris
    if (lineCount === 4) {
      this.emitTetrisBurst(startX, endX, y);
    }
  }

  /**
   * Emit sparkle particles for special effects
   */
  private emitSparkles(x: number, y: number, intensity: number): void {
    const sparkleCount = intensity * 12;
    
    for (let i = 0; i < sparkleCount; i++) {
      const sprite = this.getPooledSprite();
      if (!sprite) break;

      // Vary sparkle colors and sizes based on intensity
      const sparkleColors = [0xffffff, 0xffff88, 0x88ffff, 0xff88ff];
      const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
      const size = 0.5 + Math.random() * 2 + (intensity * 0.3);
      const texture = this.createBlockTexture(color, size);
      
      sprite.texture = texture;
      sprite.x = x + (Math.random() - 0.5) * (120 + intensity * 20);
      sprite.y = y + (Math.random() - 0.5) * (80 + intensity * 10);
      sprite.scale.set(0.2 + Math.random() * 0.4 + (intensity * 0.05));

      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * (120 + intensity * 30);

      const particle: Particle = {
        sprite,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 40 - (intensity * 10)
        },
        life: 0,
        maxLife: 0.4 + Math.random() * 0.3 + (intensity * 0.1),
        gravity: 0, // Sparkles don't fall
        scale: sprite.scale.x,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * (25 + intensity * 5),
        alpha: 1
      };

      this.particles.push(particle);
    }
  }

  /**
   * Emit special Tetris burst effect
   */
  private emitTetrisBurst(startX: number, endX: number, y: number): void {
    const centerX = startX + (endX - startX) / 2;
    
    // Large central burst
    for (let i = 0; i < 30; i++) {
      const sprite = this.getPooledSprite();
      if (!sprite) break;

      const color = [0xffd700, 0xffffff, 0xff4444, 0x44ff44, 0x4444ff][Math.floor(Math.random() * 5)];
      const texture = this.createBlockTexture(color, 3 + Math.random() * 4);
      
      sprite.texture = texture;
      sprite.x = centerX + (Math.random() - 0.5) * 40;
      sprite.y = y + (Math.random() - 0.5) * 20;
      sprite.scale.set(0.8 + Math.random() * 0.8);

      // Radial burst pattern
      const angle = Math.random() * Math.PI * 2;
      const speed = 200 + Math.random() * 150;

      const particle: Particle = {
        sprite,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 100
        },
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8,
        gravity: 50 + Math.random() * 40,
        scale: sprite.scale.x,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 15,
        alpha: 1
      };

      this.particles.push(particle);
    }

    // Additional side bursts
    for (let side = 0; side < 2; side++) {
      const burstX = side === 0 ? startX : endX;
      
      for (let i = 0; i < 15; i++) {
        const sprite = this.getPooledSprite();
        if (!sprite) break;

        const color = 0xffd700;
        const texture = this.createBlockTexture(color, 2 + Math.random() * 2);
        
        sprite.texture = texture;
        sprite.x = burstX + (Math.random() - 0.5) * 30;
        sprite.y = y + (Math.random() - 0.5) * 15;
        sprite.scale.set(0.5 + Math.random() * 0.5);

        const direction = side === 0 ? -1 : 1;
        const particle: Particle = {
          sprite,
          velocity: {
            x: direction * (100 + Math.random() * 100),
            y: -Math.random() * 80 - 60
          },
          life: 0,
          maxLife: 0.8 + Math.random() * 0.4,
          gravity: 80 + Math.random() * 60,
          scale: sprite.scale.x,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 20,
          alpha: 1
        };

        this.particles.push(particle);
      }
    }
  }

  /**
   * Update all particles
   */
  update(deltaTime: number): void {
    const dt = deltaTime / 1000; // Convert to seconds

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update life
      particle.life += dt;
      
      if (particle.life >= particle.maxLife) {
        // Remove dead particle
        this.returnToPool(particle.sprite);
        this.particles.splice(i, 1);
        continue;
      }

      // Update position
      particle.sprite.x += particle.velocity.x * dt;
      particle.sprite.y += particle.velocity.y * dt;

      // Apply gravity
      particle.velocity.y += particle.gravity * dt;

      // Update rotation
      particle.sprite.rotation += particle.rotationSpeed * dt;

      // Update scale and alpha based on life
      const lifeRatio = 1 - (particle.life / particle.maxLife);
      particle.sprite.scale.set(particle.scale * lifeRatio);
      particle.sprite.alpha = particle.alpha * lifeRatio;

      // Add some air resistance
      particle.velocity.x *= 0.98;
      particle.velocity.y *= 0.995;
    }
  }

  /**
   * Get active particle count
   */
  getParticleCount(): number {
    return this.particles.length;
  }

  /**
   * Clear all particles
   */
  clear(): void {
    for (const particle of this.particles) {
      this.returnToPool(particle.sprite);
    }
    this.particles.length = 0;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clear();
    for (const sprite of this.particlePool) {
      sprite.destroy();
    }
    this.particlePool.length = 0;
  }
}