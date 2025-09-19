import { Position } from './Position';

export enum EffectType {
  ROW_COMPLETION = 'ROW_COMPLETION',
  COLUMN_COMPLETION = 'COLUMN_COMPLETION'
}

export enum EffectAnimation {
  LINEAR = 'LINEAR',     // 선형 이펙트 (기존 방식)
  RADIAL = 'RADIAL'      // 중심에서 퍼지는 이펙트
}

export enum EffectState {
  PENDING = 'PENDING',
  PLAYING = 'PLAYING',
  COMPLETED = 'COMPLETED'
}

export interface CellEffectState {
  position: Position;
  startTime: number;
  stepIndex: number; // 0-9 for 10 steps
  isActive: boolean;
  isCompleted: boolean;
}

export abstract class LineCompletionEffect {
  protected static readonly EFFECT_STEPS = 15; // animation steps per cell
  protected static readonly STEP_INTERVAL = 35; // ms per step

  constructor(
    public readonly id: string,
    public readonly type: EffectType,
    public readonly animation: EffectAnimation,
    public readonly lineIndex: number,
    public readonly cellPositions: Position[],
    public readonly state: EffectState,
    public readonly startTime: number,
    public readonly cellEffects: CellEffectState[] = [],
    public readonly completionPosition?: Position // 완성된 셀의 위치
  ) {}

  abstract start(): LineCompletionEffect;
  protected abstract calculateCellStartTime(cellIndex: number, baseStartTime: number): number;

  protected createCellEffects(startTime: number): CellEffectState[] {
    return this.cellPositions.map((position, index) => ({
      position,
      startTime: this.calculateCellStartTime(index, startTime),
      stepIndex: 0,
      isActive: false,
      isCompleted: false
    }));
  }

  updateProgress(currentTime: number): LineCompletionEffect {
    if (this.state !== EffectState.PLAYING) {
      return this;
    }

    const updatedCellEffects = this.cellEffects.map(cellEffect => {
      if (cellEffect.isCompleted) {
        return cellEffect;
      }

      const timeSinceStart = currentTime - cellEffect.startTime;

      // Cell hasn't started yet
      if (timeSinceStart < 0) {
        return cellEffect;
      }

      // Cell is now active
      if (!cellEffect.isActive) {
        return {
          ...cellEffect,
          isActive: true,
          stepIndex: 0
        };
      }

      // Update step based on time
      const stepIndex = Math.floor(timeSinceStart / LineCompletionEffect.STEP_INTERVAL);

      if (stepIndex >= LineCompletionEffect.EFFECT_STEPS) {
        return {
          ...cellEffect,
          stepIndex: LineCompletionEffect.EFFECT_STEPS - 1,
          isCompleted: true
        };
      }

      return {
        ...cellEffect,
        stepIndex: Math.max(0, stepIndex)
      };
    });

    // Check if all cells are completed
    const allCompleted = updatedCellEffects.every(effect => effect.isCompleted);
    const newState = allCompleted ? EffectState.COMPLETED : EffectState.PLAYING;

    // Create new instance with same concrete type
    const constructor = this.constructor as any;
    return new constructor(
      this.id,
      this.type,
      this.animation,
      this.lineIndex,
      this.cellPositions,
      newState,
      this.startTime,
      updatedCellEffects,
      this.completionPosition
    );
  }

  getActiveCellEffects(): CellEffectState[] {
    return this.cellEffects.filter(effect => effect.isActive && !effect.isCompleted);
  }

  getCellEffectProgress(position: Position): { scale: number; opacity: number } | null {
    const cellEffect = this.cellEffects.find(effect =>
      effect.position.equals(position)
    );

    if (!cellEffect || !cellEffect.isActive || cellEffect.isCompleted) {
      return null;
    }

    // Calculate progress (0-1) based on step index
    const progress = cellEffect.stepIndex / (LineCompletionEffect.EFFECT_STEPS - 1);

    // Scale from 100% to 150%
    const scale = 1.0 + (progress * 0.5);

    // Opacity from 100% to 0%
    const opacity = 1.0 - progress;

    return { scale, opacity };
  }

  isCompleted(): boolean {
    return this.state === EffectState.COMPLETED;
  }

  isPlaying(): boolean {
    return this.state === EffectState.PLAYING;
  }

  // Legacy method for backward compatibility
  getCurrentlyAnimatingPositions(): Position[] {
    return this.getActiveCellEffects().map(effect => effect.position);
  }
}