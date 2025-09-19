import { Cell } from '../entities/Cell';
import { Position } from '../value-objects/Position';
import { CellValue } from '../value-objects/CellValue';

export class SudokuGrid {
  private static readonly GRID_SIZE = 9;
  private readonly cells: Cell[][];

  constructor(cells?: Cell[][]) {
    if (cells) {
      this.validateGridSize(cells);
      this.cells = cells.map(row => [...row]);
    } else {
      this.cells = this.createEmptyGrid();
    }
  }

  private validateGridSize(cells: Cell[][]): void {
    if (cells.length !== SudokuGrid.GRID_SIZE || 
        cells.some(row => row.length !== SudokuGrid.GRID_SIZE)) {
      throw new Error('Grid must be 9x9');
    }
  }

  private createEmptyGrid(): Cell[][] {
    return Array.from({ length: SudokuGrid.GRID_SIZE }, (_, row) =>
      Array.from({ length: SudokuGrid.GRID_SIZE }, (_, col) =>
        new Cell(new Position(row, col))
      )
    );
  }

  getCell(position: Position): Cell {
    return this.cells[position.row][position.col];
  }

  setCell(position: Position, value: CellValue): SudokuGrid {
    const newCells = this.cells.map(row => [...row]);
    newCells[position.row][position.col] = 
      this.getCell(position).setValue(value);
    return new SudokuGrid(newCells);
  }

  getRow(rowIndex: number): Cell[] {
    return [...this.cells[rowIndex]];
  }

  getColumn(colIndex: number): Cell[] {
    return this.cells.map(row => row[colIndex]);
  }

  getBox(boxIndex: number): Cell[] {
    const startRow = Math.floor(boxIndex / 3) * 3;
    const startCol = (boxIndex % 3) * 3;
    
    const boxCells: Cell[] = [];
    for (let row = startRow; row < startRow + 3; row++) {
      for (let col = startCol; col < startCol + 3; col++) {
        boxCells.push(this.cells[row][col]);
      }
    }
    return boxCells;
  }

  getAllCells(): Cell[] {
    return this.cells.flat();
  }

  clone(): SudokuGrid {
    return new SudokuGrid(this.cells);
  }

  isEmpty(): boolean {
    return this.getAllCells().every(cell => cell.isEmpty());
  }

  isFull(): boolean {
    return this.getAllCells().every(cell => !cell.isEmpty());
  }

  /**
   * Get all empty cells (non-given, non-filled)
   */
  getEmptyCells(): Cell[] {
    return this.getAllCells().filter(cell => cell.isEmpty() && !cell.isGiven);
  }

  /**
   * Get all given cells (pre-filled cells from puzzle)
   */
  getGivenCells(): Cell[] {
    return this.getAllCells().filter(cell => cell.isGiven);
  }

  /**
   * Get all filled cells (have values)
   */
  getFilledCells(): Cell[] {
    return this.getAllCells().filter(cell => !cell.isEmpty());
  }

  /**
   * Get count of filled cells
   */
  getFilledCellCount(): number {
    return this.getFilledCells().length;
  }

  /**
   * Get count of each number (1-9) currently placed in the grid
   */
  getNumberCounts(): Map<number, number> {
    const counts = new Map<number, number>();

    // Initialize counts for numbers 1-9
    for (let i = 1; i <= 9; i++) {
      counts.set(i, 0);
    }

    // Count occurrences of each number
    this.getAllCells().forEach(cell => {
      if (!cell.isEmpty()) {
        const value = cell.value.toNumber();
        counts.set(value, (counts.get(value) || 0) + 1);
      }
    });

    return counts;
  }

  /**
   * Get remaining count for each number (how many more can be placed)
   */
  getRemainingCounts(): Map<number, number> {
    const currentCounts = this.getNumberCounts();
    const remainingCounts = new Map<number, number>();

    for (let i = 1; i <= 9; i++) {
      const used = currentCounts.get(i) || 0;
      remainingCounts.set(i, Math.max(0, 9 - used));
    }

    return remainingCounts;
  }
}