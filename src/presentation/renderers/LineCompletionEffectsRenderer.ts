import { LineCompletionEffect, CellEffectState } from '../../domain/models/LineCompletionEffect';

export interface EffectRenderOptions {
  theme: 'light' | 'dark';
  highlightColor?: string;
  glowColor?: string;
  animationDuration?: number;
}

export class LineCompletionEffectsRenderer {
  constructor(
    private ctx: CanvasRenderingContext2D,
    private cellSize: number
  ) {}

  updateDimensions(cellSize: number): void {
    this.cellSize = cellSize;
  }

  renderEffects(effects: LineCompletionEffect[], options: EffectRenderOptions): void {
    effects.forEach(effect => {
      if (effect.isPlaying()) {
        this.renderEffect(effect, options);
      }
    });
  }

  private renderEffect(effect: LineCompletionEffect, options: EffectRenderOptions): void {
    const activeCells = effect.getActiveCellEffects();

    activeCells.forEach(cellEffect => {
      this.renderCellEffect(cellEffect, effect, options);
    });
  }

  private renderCellEffect(cellEffect: CellEffectState, effect: LineCompletionEffect, options: EffectRenderOptions): void {
    const progress = effect.getCellEffectProgress(cellEffect.position);
    if (!progress) return;

    const x = cellEffect.position.col * this.cellSize;
    const y = cellEffect.position.row * this.cellSize;

    this.renderScalingEffect(x, y, progress.scale, progress.opacity, options);
  }

  private renderScalingEffect(x: number, y: number, scale: number, opacity: number, options: EffectRenderOptions): void {
    const centerX = x + this.cellSize / 2;
    const centerY = y + this.cellSize / 2;
    const scaledSize = this.cellSize * scale;
    const scaledX = centerX - scaledSize / 2;
    const scaledY = centerY - scaledSize / 2;

    this.ctx.save();
    this.ctx.globalAlpha = opacity;

    // Base color based on theme
    const baseColor = options.theme === 'dark' ? '255, 215, 0' : '255, 140, 0'; // Gold

    // Create gradient effect
    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, scaledSize / 2
    );

    gradient.addColorStop(0, `rgba(${baseColor}, ${opacity})`);
    gradient.addColorStop(0.7, `rgba(${baseColor}, ${opacity * 0.6})`);
    gradient.addColorStop(1, `rgba(${baseColor}, 0)`);

    // Draw the effect box
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(scaledX, scaledY, scaledSize, scaledSize);

    // Add border effect
    this.ctx.strokeStyle = `rgba(${baseColor}, ${opacity * 0.8})`;
    this.ctx.lineWidth = Math.max(1, scale * 2);
    this.ctx.strokeRect(scaledX, scaledY, scaledSize, scaledSize);

    // Add subtle inner glow
    this.ctx.shadowColor = `rgba(${baseColor}, ${opacity})`;
    this.ctx.shadowBlur = scale * 5;
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 0;
    this.ctx.strokeRect(scaledX + 2, scaledY + 2, scaledSize - 4, scaledSize - 4);

    this.ctx.restore();
  }


  // Helper method to check if any effects are currently playing
  hasActiveEffects(effects: LineCompletionEffect[]): boolean {
    return effects.some(effect => effect.isPlaying());
  }

  // Update effects and remove completed ones
  updateEffects(effects: LineCompletionEffect[], currentTime: number): LineCompletionEffect[] {
    return effects
      .map(effect => effect.updateProgress(currentTime))
      .filter(effect => !effect.isCompleted());
  }
}