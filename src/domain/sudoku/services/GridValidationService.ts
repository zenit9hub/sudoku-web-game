import { SudokuGrid } from '../aggregates/Grid';
import { Position } from '../value-objects/Position';
import { CellValue } from '../value-objects/CellValue';

export interface ValidationResult {
  isValid: boolean;
  conflictingPositions: Position[];
}

export class SudokuValidationService {
  validateMove(grid: SudokuGrid, position: Position, value: CellValue): ValidationResult {
    if (value.isEmpty()) {
      return { isValid: true, conflictingPositions: [] };
    }

    const conflictingPositions = this.findConflicts(grid, position, value);
    
    return {
      isValid: conflictingPositions.length === 0,
      conflictingPositions
    };
  }

  private findConflicts(grid: SudokuGrid, position: Position, value: CellValue): Position[] {
    const conflicts: Position[] = [];
    
    conflicts.push(...this.findRowConflicts(grid, position, value));
    conflicts.push(...this.findColumnConflicts(grid, position, value));
    conflicts.push(...this.findBoxConflicts(grid, position, value));
    
    return conflicts;
  }

  private findRowConflicts(grid: SudokuGrid, position: Position, value: CellValue): Position[] {
    const conflicts: Position[] = [];
    const row = grid.getRow(position.row);
    
    row.forEach(cell => {
      if (!cell.position.equals(position) && 
          cell.value.equals(value) && 
          !cell.value.isEmpty()) {
        conflicts.push(cell.position);
      }
    });
    
    return conflicts;
  }

  private findColumnConflicts(grid: SudokuGrid, position: Position, value: CellValue): Position[] {
    const conflicts: Position[] = [];
    const column = grid.getColumn(position.col);
    
    column.forEach(cell => {
      if (!cell.position.equals(position) && 
          cell.value.equals(value) && 
          !cell.value.isEmpty()) {
        conflicts.push(cell.position);
      }
    });
    
    return conflicts;
  }

  private findBoxConflicts(grid: SudokuGrid, position: Position, value: CellValue): Position[] {
    const conflicts: Position[] = [];
    const boxIndex = position.getBoxIndex();
    const box = grid.getBox(boxIndex);
    
    box.forEach(cell => {
      if (!cell.position.equals(position) && 
          cell.value.equals(value) && 
          !cell.value.isEmpty()) {
        conflicts.push(cell.position);
      }
    });
    
    return conflicts;
  }

  isGridComplete(grid: SudokuGrid): boolean {
    if (!grid.isFull()) {
      return false;
    }

    return grid.getAllCells().every(cell => {
      if (cell.isEmpty()) return false;
      
      const validation = this.validateMove(grid, cell.position, cell.value);
      return validation.isValid;
    });
  }

  getPossibleValues(grid: SudokuGrid, position: Position): CellValue[] {
    const possibleValues: CellValue[] = [];
    
    for (let value = 1; value <= 9; value++) {
      const cellValue = CellValue.from(value);
      const validation = this.validateMove(grid, position, cellValue);
      
      if (validation.isValid) {
        possibleValues.push(cellValue);
      }
    }
    
    return possibleValues;
  }
}