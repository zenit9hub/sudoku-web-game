import { SudokuGrid } from '../aggregates/Grid';
import { Position } from '../value-objects/Position';
import { LineCompletionEffect, EffectAnimation } from '../../effects/entities/LineCompletionEffect';
import { EffectFactory } from '../../effects/services/EffectFactory';

export interface LineCompletionEvent {
  type: 'ROW_COMPLETED' | 'COLUMN_COMPLETED';
  lineIndex: number;
  positions: Position[];
  completionPosition?: Position; // 완성을 트리거한 셀의 위치
}

export class LineCompletionDetectionService {
  detectCompletions(grid: SudokuGrid, lastMovePosition?: Position): LineCompletionEvent[] {
    const completions: LineCompletionEvent[] = [];

    if (lastMovePosition) {
      // Check row completion for the last move
      if (this.isRowComplete(grid, lastMovePosition.row)) {
        completions.push({
          type: 'ROW_COMPLETED',
          lineIndex: lastMovePosition.row,
          positions: this.getRowPositions(lastMovePosition.row),
          completionPosition: lastMovePosition
        });
      }

      // Check column completion for the last move
      if (this.isColumnComplete(grid, lastMovePosition.col)) {
        completions.push({
          type: 'COLUMN_COMPLETED',
          lineIndex: lastMovePosition.col,
          positions: this.getColumnPositions(lastMovePosition.col),
          completionPosition: lastMovePosition
        });
      }
    } else {
      // Check all rows and columns
      for (let i = 0; i < 9; i++) {
        if (this.isRowComplete(grid, i)) {
          completions.push({
            type: 'ROW_COMPLETED',
            lineIndex: i,
            positions: this.getRowPositions(i)
          });
        }

        if (this.isColumnComplete(grid, i)) {
          completions.push({
            type: 'COLUMN_COMPLETED',
            lineIndex: i,
            positions: this.getColumnPositions(i)
          });
        }
      }
    }

    return completions;
  }

  createEffectsFromCompletions(
    completions: LineCompletionEvent[],
    animation: EffectAnimation = EffectAnimation.LINEAR
  ): LineCompletionEffect[] {
    return completions.map(completion => {
      if (completion.type === 'ROW_COMPLETED') {
        return EffectFactory.createRowEffect(
          completion.lineIndex,
          animation,
          completion.completionPosition
        );
      } else {
        return EffectFactory.createColumnEffect(
          completion.lineIndex,
          animation,
          completion.completionPosition
        );
      }
    });
  }

  private isRowComplete(grid: SudokuGrid, rowIndex: number): boolean {
    const row = grid.getRow(rowIndex);

    // Check if all cells are filled
    if (!row.every(cell => !cell.isEmpty())) {
      return false;
    }

    // Check if all numbers 1-9 are present (no duplicates)
    const values = new Set(row.map(cell => cell.value.value));
    return values.size === 9;
  }

  private isColumnComplete(grid: SudokuGrid, colIndex: number): boolean {
    const column = grid.getColumn(colIndex);

    // Check if all cells are filled
    if (!column.every(cell => !cell.isEmpty())) {
      return false;
    }

    // Check if all numbers 1-9 are present (no duplicates)
    const values = new Set(column.map(cell => cell.value.value));
    return values.size === 9;
  }

  private getRowPositions(rowIndex: number): Position[] {
    const positions: Position[] = [];
    for (let col = 0; col < 9; col++) {
      positions.push(new Position(rowIndex, col));
    }
    return positions;
  }

  private getColumnPositions(colIndex: number): Position[] {
    const positions: Position[] = [];
    for (let row = 0; row < 9; row++) {
      positions.push(new Position(row, colIndex));
    }
    return positions;
  }
}