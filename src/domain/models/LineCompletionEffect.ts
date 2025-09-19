import { Position } from './Position';

export enum EffectType {
  ROW_COMPLETION = 'ROW_COMPLETION',
  COLUMN_COMPLETION = 'COLUMN_COMPLETION'
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

export class LineCompletionEffect {
  private static readonly CELL_DELAY = 50; // 50ms delay between cells
  private static readonly EFFECT_STEPS = 10; // 10 animation steps per cell
  private static readonly STEP_INTERVAL = 10; // 10ms per step

  constructor(
    public readonly id: string,
    public readonly type: EffectType,
    public readonly lineIndex: number,
    public readonly cellPositions: Position[],
    public readonly state: EffectState,
    public readonly startTime: number,
    public readonly cellEffects: CellEffectState[] = []
  ) {}

  static createRowEffect(id: string, rowIndex: number): LineCompletionEffect {
    const cellPositions: Position[] = [];
    for (let col = 0; col < 9; col++) {
      cellPositions.push(new Position(rowIndex, col));
    }

    return new LineCompletionEffect(
      id,
      EffectType.ROW_COMPLETION,
      rowIndex,
      cellPositions,
      EffectState.PENDING,
      Date.now(),
      []
    );
  }

  static createColumnEffect(id: string, colIndex: number): LineCompletionEffect {
    const cellPositions: Position[] = [];
    for (let row = 0; row < 9; row++) {
      cellPositions.push(new Position(row, colIndex));
    }

    return new LineCompletionEffect(
      id,
      EffectType.COLUMN_COMPLETION,
      colIndex,
      cellPositions,
      EffectState.PENDING,
      Date.now(),
      []
    );
  }

  start(): LineCompletionEffect {
    const startTime = Date.now();
    const cellEffects: CellEffectState[] = this.cellPositions.map((position, index) => ({
      position,
      startTime: startTime + (index * LineCompletionEffect.CELL_DELAY),
      stepIndex: 0,
      isActive: false,
      isCompleted: false
    }));

    return new LineCompletionEffect(
      this.id,
      this.type,
      this.lineIndex,
      this.cellPositions,
      EffectState.PLAYING,
      startTime,
      cellEffects
    );
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

    return new LineCompletionEffect(
      this.id,
      this.type,
      this.lineIndex,
      this.cellPositions,
      newState,
      this.startTime,
      updatedCellEffects
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