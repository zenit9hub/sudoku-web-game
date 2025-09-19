import { SudokuGrid } from '../models/SudokuGrid';
import { Position } from '../models/Position';
import { LineCompletionEffect } from '../models/LineCompletionEffect';

export interface LineCompletionEvent {
  type: 'ROW_COMPLETED' | 'COLUMN_COMPLETED';
  lineIndex: number;
  positions: Position[];
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
          positions: this.getRowPositions(lastMovePosition.row)
        });
      }

      // Check column completion for the last move
      if (this.isColumnComplete(grid, lastMovePosition.col)) {
        completions.push({
          type: 'COLUMN_COMPLETED',
          lineIndex: lastMovePosition.col,
          positions: this.getColumnPositions(lastMovePosition.col)
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

  createEffectsFromCompletions(completions: LineCompletionEvent[]): LineCompletionEffect[] {
    return completions.map(completion => {
      const id = `${completion.type}_${completion.lineIndex}_${Date.now()}`;

      if (completion.type === 'ROW_COMPLETED') {
        return LineCompletionEffect.createRowEffect(id, completion.lineIndex);
      } else {
        return LineCompletionEffect.createColumnEffect(id, completion.lineIndex);
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