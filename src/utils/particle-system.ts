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
  private maxParticles = 500;

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
  emitPieceLanding(x: number, y: number, color: number, count: number = 16): void {
    // Create texture varieties for nice but controlled effect
    const mainTexture = this.createBlockTexture(color, 5);
    const mediumTexture = this.createBlockTexture(color, 3);
    const smallTexture = this.createBlockTexture(0xffffff, 2);
    const tinyTexture = this.createBlockTexture(0xffffff, 1);
    
    // Main particle burst - nicely balanced
    for (let i = 0; i < count; i++) {
      const sprite = this.getPooledSprite();
      if (!sprite) break;

      // Use different textures with balanced distribution
      if (i < count * 0.3) {
        sprite.texture = mainTexture;
      } else if (i < count * 0.6) {
        sprite.texture = mediumTexture;
      } else {
        sprite.texture = smallTexture;
      }
      
      sprite.x = x + (Math.random() - 0.5) * 50;
      sprite.y = y + (Math.random() - 0.5) * 20;
      sprite.scale.set(0.6 + Math.random() * 0.8);

      const particle: Particle = {
        sprite,
        velocity: {
          x: (Math.random() - 0.5) * 140,
          y: -Math.random() * 100 - 40
        },
        life: 0,
        maxLife: 0.8 + Math.random() * 0.6,
        gravity: 100 + Math.random() * 80,
        scale: sprite.scale.x,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 15,
        alpha: 0.95 + Math.random() * 0.05
      };

      this.particles.push(particle);
    }
    
    // Controlled sparkle burst
    for (let i = 0; i < 8; i++) {
      const sprite = this.getPooledSprite();
      if (!sprite) break;

      const sparkleColors = [0xffffff, 0xffd700, 0xff88ff, 0x88ffff, color];
      const sparkleColor = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
      const sparkleTexture = this.createBlockTexture(sparkleColor, 1.5 + Math.random());
      
      sprite.texture = sparkleTexture;
      sprite.x = x + (Math.random() - 0.5) * 60;
      sprite.y = y + (Math.random() - 0.5) * 30;
      sprite.scale.set(0.4 + Math.random() * 0.6);

      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 60;

      const particle: Particle = {
        sprite,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 30
        },
        life: 0,
        maxLife: 0.8 + Math.random() * 0.4,
        gravity: 20, // Light gravity for sparkles
        scale: sprite.scale.x,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 20,
        alpha: 1
      };

      this.particles.push(particle);
    }

    // Small scatter particles for texture
    for (let i = 0; i < 10; i++) {
      const sprite = this.getPooledSprite();
      if (!sprite) break;

      sprite.texture = tinyTexture;
      sprite.x = x + (Math.random() - 0.5) * 70;
      sprite.y = y + (Math.random() - 0.5) * 25;
      sprite.scale.set(0.3 + Math.random() * 0.4);

      const particle: Particle = {
        sprite,
        velocity: {
          x: (Math.random() - 0.5) * 180,
          y: -Math.random() * 60 - 20
        },
        life: 0,
        maxLife: 0.6 + Math.random() * 0.4,
        gravity: 130 + Math.random() * 80,
        scale: sprite.scale.x,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 25,
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
        // Single line - modest but satisfying
        baseParticleCount = 25;
        colors = [0xffffff, 0xffff99, 0x99ffff, 0xff99ff];
        sparkleIntensity = 1;
        break;
      case 2:
        // Double line - enhanced effect
        baseParticleCount = 45;
        colors = [
          0xffffff, 0xffd700, 0xff4444, 0x44ff44, 0x4444ff, 0xff44ff,
          0x44ffff, 0xffff44
        ];
        sparkleIntensity = 3;
        break;
      case 3:
        // Triple line - impressive fireworks
        baseParticleCount = 80;
        colors = [
          0xffffff, 0xffd700, 0xff6600, 0x66ff00, 0x0066ff, 0xff0066,
          0x6600ff, 0x00ff66, 0xff3366, 0x33ff66, 0x6633ff, 0xff6633
        ];
        sparkleIntensity = 6;
        break;
      case 4:
        // Tetris - spectacular supernova
        baseParticleCount = 140;
        colors = [
          0xffffff, 0xffd700, 0xff0000, 0x00ff00, 0x0000ff, 0xff00ff,
          0x00ffff, 0xffff00, 0xff4400, 0x44ff00, 0x0044ff, 0xff0044,
          0x4400ff, 0x00ff44, 0xff8800, 0x88ff00, 0x0088ff, 0xff0088,
          0x8800ff, 0x00ff88
        ];
        sparkleIntensity = 12;
        break;
      default:
        baseParticleCount = Math.min(lineCount * 35, 180);
        colors = [0xffffff, 0xffd700, 0xff8800, 0xff4444, 0x44ff44, 0x4444ff, 0xff44ff];
        sparkleIntensity = Math.min(lineCount * 3, 15);
    }
    
    // EPIC MAIN PARTICLE EXPLOSION
    for (let i = 0; i < baseParticleCount; i++) {
      const sprite = this.getPooledSprite();
      if (!sprite) break;

      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = 3 + Math.random() * 6 + (lineCount * 1.0);
      const texture = this.createBlockTexture(color, size);
      
      sprite.texture = texture;
      sprite.x = startX + Math.random() * (endX - startX);
      sprite.y = y + (Math.random() - 0.5) * (40 + lineCount * 10);
      sprite.scale.set(0.6 + Math.random() * 1.2 + (lineCount * 0.2));

      // MASSIVE velocity for epic explosion
      const velocityMultiplier = 1.5 + (lineCount * 0.5);
      const particle: Particle = {
        sprite,
        velocity: {
          x: (Math.random() - 0.5) * 300 * velocityMultiplier,
          y: -Math.random() * 150 - 80 - (lineCount * 30)
        },
        life: 0,
        maxLife: 1.2 + Math.random() * 0.8 + (lineCount * 0.2),
        gravity: 60 + Math.random() * 50,
        scale: sprite.scale.x,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 25,
        alpha: 1
      };

      this.particles.push(particle);
    }

    // ADDITIONAL WAVE BURST FOR EXTRA SPECTACLE (only for 2+ lines)
    const secondaryCount = lineCount >= 2 ? Math.floor(baseParticleCount * 0.4) : 0;
    for (let i = 0; i < secondaryCount; i++) {
      const sprite = this.getPooledSprite();
      if (!sprite) break;

      const color = colors[Math.floor(Math.random() * colors.length)];
      const texture = this.createBlockTexture(color, 2 + Math.random() * 3);
      
      sprite.texture = texture;
      sprite.x = startX + Math.random() * (endX - startX);
      sprite.y = y + (Math.random() - 0.5) * 20;
      sprite.scale.set(0.3 + Math.random() * 0.6);

      // Secondary wave with different pattern
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 100 + (lineCount * 20);

      const particle: Particle = {
        sprite,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 60
        },
        life: 0,
        maxLife: 0.8 + Math.random() * 0.5,
        gravity: 80 + Math.random() * 60,
        scale: sprite.scale.x,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 30,
        alpha: 0.8 + Math.random() * 0.2
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
    const sparkleCount = intensity * 15; // Controlled sparkles
    
    for (let i = 0; i < sparkleCount; i++) {
      const sprite = this.getPooledSprite();
      if (!sprite) break;

      // ULTRA RAINBOW sparkle colors
      const sparkleColors = [
        0xffffff, 0xffd700, 0xff88ff, 0x88ffff, 0xffff88, 0xff8888,
        0x88ff88, 0x8888ff, 0xffaa88, 0xaaffaa, 0xaaaaff, 0xffaaff,
        0x88aaff, 0xaa88ff, 0xffaa88, 0xaaffff
      ];
      const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
      const size = 1 + Math.random() * 3 + (intensity * 0.4);
      const texture = this.createBlockTexture(color, size);
      
      sprite.texture = texture;
      sprite.x = x + (Math.random() - 0.5) * (150 + intensity * 30);
      sprite.y = y + (Math.random() - 0.5) * (100 + intensity * 15);
      sprite.scale.set(0.3 + Math.random() * 0.8 + (intensity * 0.08));

      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * (150 + intensity * 40);

      const particle: Particle = {
        sprite,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 50 - (intensity * 15)
        },
        life: 0,
        maxLife: 0.6 + Math.random() * 0.5 + (intensity * 0.15),
        gravity: 0, // Sparkles float magically
        scale: sprite.scale.x,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * (35 + intensity * 8),
        alpha: 1
      };

      this.particles.push(particle);
    }

    // ADD EXTRA MAGICAL TWINKLE STARS
    for (let i = 0; i < intensity * 5; i++) {
      const sprite = this.getPooledSprite();
      if (!sprite) break;

      const twinkleTexture = this.createBlockTexture(0xffffff, 0.8);
      sprite.texture = twinkleTexture;
      sprite.x = x + (Math.random() - 0.5) * (200 + intensity * 40);
      sprite.y = y + (Math.random() - 0.5) * (120 + intensity * 20);
      sprite.scale.set(0.2 + Math.random() * 0.5);

      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;

      const particle: Particle = {
        sprite,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 30
        },
        life: 0,
        maxLife: 1.0 + Math.random() * 1.0 + (intensity * 0.2),
        gravity: -10, // NEGATIVE gravity for floating twinkles
        scale: sprite.scale.x,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 50,
        alpha: 1
      };

      this.particles.push(particle);
    }
  }

  /**
   * Emit special Tetris burst effect - ULTIMATE NUCLEAR EXPLOSION
   */
  private emitTetrisBurst(startX: number, endX: number, y: number): void {
    const centerX = startX + (endX - startX) / 2;
    
    // ABSOLUTELY MASSIVE CENTRAL SUPERNOVA
    for (let i = 0; i < 80; i++) {
      const sprite = this.getPooledSprite();
      if (!sprite) break;

      const superColors = [
        0xffd700, 0xffffff, 0xff0000, 0x00ff00, 0x0000ff, 0xff00ff,
        0x00ffff, 0xffff00, 0xff4444, 0x44ff44, 0x4444ff, 0xff44ff,
        0xffaa44, 0xaaff44, 0x44aaff, 0xaa44ff
      ];
      const color = superColors[Math.floor(Math.random() * superColors.length)];
      const texture = this.createBlockTexture(color, 6 + Math.random() * 8);
      
      sprite.texture = texture;
      sprite.x = centerX + (Math.random() - 0.5) * 80;
      sprite.y = y + (Math.random() - 0.5) * 40;
      sprite.scale.set(1.2 + Math.random() * 1.8);

      // ULTIMATE RADIAL EXPLOSION
      const angle = Math.random() * Math.PI * 2;
      const speed = 300 + Math.random() * 250;

      const particle: Particle = {
        sprite,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 150
        },
        life: 0,
        maxLife: 2.0 + Math.random() * 1.5,
        gravity: 30 + Math.random() * 25,
        scale: sprite.scale.x,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 15,
        alpha: 1
      };

      this.particles.push(particle);
    }

    // ENHANCED TRIPLE LAYER SIDE FIREWORKS
    for (let side = 0; side < 2; side++) {
      const burstX = side === 0 ? startX : endX;
      
      // Layer 1: Big gold bursts
      for (let i = 0; i < 35; i++) {
        const sprite = this.getPooledSprite();
        if (!sprite) break;

        const color = [0xffd700, 0xffff44, 0xff8844, 0xffaa00][Math.floor(Math.random() * 4)];
        const texture = this.createBlockTexture(color, 4 + Math.random() * 4);
        
        sprite.texture = texture;
        sprite.x = burstX + (Math.random() - 0.5) * 70;
        sprite.y = y + (Math.random() - 0.5) * 35;
        sprite.scale.set(0.9 + Math.random() * 1.0);

        const direction = side === 0 ? -1 : 1;
        const particle: Particle = {
          sprite,
          velocity: {
            x: direction * (150 + Math.random() * 150),
            y: -Math.random() * 120 - 100
          },
          life: 0,
          maxLife: 1.5 + Math.random() * 0.8,
          gravity: 50 + Math.random() * 40,
          scale: sprite.scale.x,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 20,
          alpha: 1
        };

        this.particles.push(particle);
      }
    }

    // SPECTACULAR CONSTELLATION OF FLOATING STARS
    for (let i = 0; i < 40; i++) {
      const sprite = this.getPooledSprite();
      if (!sprite) break;

      const starColors = [0xffd700, 0xffffff, 0xffff88, 0x88ffff, 0xff88ff];
      const starColor = starColors[Math.floor(Math.random() * starColors.length)];
      const texture = this.createBlockTexture(starColor, 1.5 + Math.random());
      
      sprite.texture = texture;
      sprite.x = centerX + (Math.random() - 0.5) * 150;
      sprite.y = y + (Math.random() - 0.5) * 80;
      sprite.scale.set(0.4 + Math.random() * 0.8);

      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 120;

      const particle: Particle = {
        sprite,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 80
        },
        life: 0,
        maxLife: 2.5 + Math.random() * 1.5,
        gravity: -30, // STRONG negative gravity for magical floating
        scale: sprite.scale.x,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 40,
        alpha: 1
      };

      this.particles.push(particle);
    }

    // RAINBOW SHOCKWAVE RINGS
    for (let ring = 0; ring < 3; ring++) {
      for (let i = 0; i < 16; i++) {
        const sprite = this.getPooledSprite();
        if (!sprite) break;

        const ringColors = [0xff0000, 0xff8800, 0xffff00, 0x88ff00, 0x00ff00, 0x0088ff, 0x0000ff, 0x8800ff];
        const color = ringColors[i % ringColors.length];
        const texture = this.createBlockTexture(color, 2);
        
        sprite.texture = texture;
        
        const angle = (i / 16) * Math.PI * 2;
        const distance = 30 + ring * 20;
        
        sprite.x = centerX + Math.cos(angle) * distance;
        sprite.y = y + Math.sin(angle) * distance * 0.6;
        sprite.scale.set(0.4 + Math.random() * 0.4);

        const speed = 200 + ring * 50;

        const particle: Particle = {
          sprite,
          velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed * 0.8 - 40
          },
          life: 0,
          maxLife: 1.2 + Math.random() * 0.6,
          gravity: 0, // No gravity for perfect ring expansion
          scale: sprite.scale.x,
          rotation: angle,
          rotationSpeed: (Math.random() - 0.5) * 25,
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