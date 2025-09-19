import { Position } from './Position';
import { LineCompletionEffect, EffectType, EffectAnimation, EffectState, CellEffectState } from './LineCompletionEffect';

export class LinearEffect extends LineCompletionEffect {
  private static readonly CELL_DELAY = 35; // ms delay between cells

  static createRowEffect(id: string, rowIndex: number): LinearEffect {
    const cellPositions: Position[] = [];
    for (let col = 0; col < 9; col++) {
      cellPositions.push(new Position(rowIndex, col));
    }

    return new LinearEffect(
      id,
      EffectType.ROW_COMPLETION,
      EffectAnimation.LINEAR,
      rowIndex,
      cellPositions,
      EffectState.PENDING,
      Date.now(),
      []
    );
  }

  static createColumnEffect(id: string, colIndex: number): LinearEffect {
    const cellPositions: Position[] = [];
    for (let row = 0; row < 9; row++) {
      cellPositions.push(new Position(row, colIndex));
    }

    return new LinearEffect(
      id,
      EffectType.COLUMN_COMPLETION,
      EffectAnimation.LINEAR,
      colIndex,
      cellPositions,
      EffectState.PENDING,
      Date.now(),
      []
    );
  }

  start(): LinearEffect {
    const startTime = Date.now();
    const cellEffects = this.createCellEffects(startTime);

    return new LinearEffect(
      this.id,
      this.type,
      this.animation,
      this.lineIndex,
      this.cellPositions,
      EffectState.PLAYING,
      startTime,
      cellEffects,
      this.completionPosition
    );
  }

  protected calculateCellStartTime(cellIndex: number, baseStartTime: number): number {
    // Linear effect: sequential from left to right or top to bottom
    return baseStartTime + (cellIndex * LinearEffect.CELL_DELAY);
  }
}