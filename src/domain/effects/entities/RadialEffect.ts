import { Position } from '../../sudoku/value-objects/Position';
import { LineCompletionEffect, EffectType, EffectAnimation, EffectState } from './LineCompletionEffect';

export class RadialEffect extends LineCompletionEffect {
  private static readonly CELL_DELAY = 35; // ms delay between cells

  static createRowEffect(id: string, rowIndex: number, completionPosition: Position): RadialEffect {
    const cellPositions: Position[] = [];
    for (let col = 0; col < 9; col++) {
      cellPositions.push(new Position(rowIndex, col));
    }

    return new RadialEffect(
      id,
      EffectType.ROW_COMPLETION,
      EffectAnimation.RADIAL,
      rowIndex,
      cellPositions,
      EffectState.PENDING,
      Date.now(),
      [],
      completionPosition
    );
  }

  static createColumnEffect(id: string, colIndex: number, completionPosition: Position): RadialEffect {
    const cellPositions: Position[] = [];
    for (let row = 0; row < 9; row++) {
      cellPositions.push(new Position(row, colIndex));
    }

    return new RadialEffect(
      id,
      EffectType.COLUMN_COMPLETION,
      EffectAnimation.RADIAL,
      colIndex,
      cellPositions,
      EffectState.PENDING,
      Date.now(),
      [],
      completionPosition
    );
  }

  start(): RadialEffect {
    const startTime = Date.now();
    const cellEffects = this.createCellEffects(startTime);

    return new RadialEffect(
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
    if (!this.completionPosition) {
      // Fallback to linear if no completion position
      return baseStartTime + (cellIndex * RadialEffect.CELL_DELAY);
    }

    const cellPosition = this.cellPositions[cellIndex];
    let distance: number;

    if (this.type === EffectType.ROW_COMPLETION) {
      // For row completion, calculate distance from completion column
      distance = Math.abs(cellPosition.col - this.completionPosition.col);
    } else {
      // For column completion, calculate distance from completion row
      distance = Math.abs(cellPosition.row - this.completionPosition.row);
    }

    // Cells at the same distance start simultaneously
    // Add small random offset to prevent all cells starting at exact same time
    const randomOffset = Math.random() * 5; // 0-5ms random offset
    return baseStartTime + (distance * RadialEffect.CELL_DELAY) + randomOffset;
  }

  // Get cells grouped by their distance from completion position
  getCellsByDistance(): Map<number, Position[]> {
    if (!this.completionPosition) {
      return new Map();
    }

    const cellsByDistance = new Map<number, Position[]>();

    this.cellPositions.forEach(position => {
      let distance: number;

      if (this.type === EffectType.ROW_COMPLETION) {
        distance = Math.abs(position.col - this.completionPosition!.col);
      } else {
        distance = Math.abs(position.row - this.completionPosition!.row);
      }

      if (!cellsByDistance.has(distance)) {
        cellsByDistance.set(distance, []);
      }
      cellsByDistance.get(distance)!.push(position);
    });

    return cellsByDistance;
  }
}