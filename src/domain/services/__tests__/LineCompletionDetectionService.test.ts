import { LineCompletionDetectionService } from '../LineCompletionDetectionService';
import { SudokuGrid } from '../../models/SudokuGrid';
import { Cell } from '../../models/Cell';
import { Position } from '../../models/Position';
import { CellValue } from '../../models/CellValue';

describe('LineCompletionDetectionService', () => {
  let service: LineCompletionDetectionService;

  beforeEach(() => {
    service = new LineCompletionDetectionService();
  });

  describe('detectCompletions', () => {
    it('should detect row completion', () => {
      // Create a 9x9 grid with a completed first row
      const cells: Cell[][] = [];

      // First row - completed with numbers 1-9
      const completedRow = Array.from({ length: 9 }, (_, col) =>
        new Cell(new Position(0, col), CellValue.from(col + 1), false)
      );
      cells.push(completedRow);

      // Rest of the grid - empty cells
      for (let row = 1; row < 9; row++) {
        const emptyRow = Array.from({ length: 9 }, (_, col) =>
          new Cell(new Position(row, col), CellValue.empty(), false)
        );
        cells.push(emptyRow);
      }

      const grid = new SudokuGrid(cells);
      const completions = service.detectCompletions(grid, new Position(0, 8));

      expect(completions).toHaveLength(1);
      expect(completions[0].type).toBe('ROW_COMPLETED');
      expect(completions[0].lineIndex).toBe(0);
    });

    it('should detect column completion', () => {
      // Create a 9x9 grid with a completed first column
      const cells: Cell[][] = [];

      for (let row = 0; row < 9; row++) {
        const rowCells: Cell[] = [];
        for (let col = 0; col < 9; col++) {
          if (col === 0) {
            // First column - completed with numbers 1-9
            rowCells.push(new Cell(new Position(row, col), CellValue.from(row + 1), false));
          } else {
            // Rest of the row - empty cells
            rowCells.push(new Cell(new Position(row, col), CellValue.empty(), false));
          }
        }
        cells.push(rowCells);
      }

      const grid = new SudokuGrid(cells);
      const completions = service.detectCompletions(grid, new Position(8, 0));

      expect(completions).toHaveLength(1);
      expect(completions[0].type).toBe('COLUMN_COMPLETED');
      expect(completions[0].lineIndex).toBe(0);
    });

    it('should detect both row and column completion', () => {
      // Create a 9x9 grid with both first row and first column completed
      const cells: Cell[][] = [];

      for (let row = 0; row < 9; row++) {
        const rowCells: Cell[] = [];
        for (let col = 0; col < 9; col++) {
          let value = CellValue.empty();

          if (row === 0) {
            // First row - completed with numbers 1-9
            value = CellValue.from(col + 1);
          } else if (col === 0) {
            // First column - completed with numbers 1-9
            value = CellValue.from(row + 1);
          }

          rowCells.push(new Cell(new Position(row, col), value, false));
        }
        cells.push(rowCells);
      }

      const grid = new SudokuGrid(cells);
      const completions = service.detectCompletions(grid, new Position(0, 0));

      expect(completions).toHaveLength(2);
      expect(completions.some(c => c.type === 'ROW_COMPLETED')).toBe(true);
      expect(completions.some(c => c.type === 'COLUMN_COMPLETED')).toBe(true);
    });

    it('should not detect incomplete lines', () => {
      // Create 9x9 grid with incomplete first row (missing last number)
      const cells: Cell[][] = [];

      // First row - incomplete (missing last number)
      const incompleteRow = Array.from({ length: 8 }, (_, col) =>
        new Cell(new Position(0, col), CellValue.from(col + 1), false)
      );
      incompleteRow.push(new Cell(new Position(0, 8), CellValue.empty(), false));
      cells.push(incompleteRow);

      // Rest of the grid - empty cells
      for (let row = 1; row < 9; row++) {
        const emptyRow = Array.from({ length: 9 }, (_, col) =>
          new Cell(new Position(row, col), CellValue.empty(), false)
        );
        cells.push(emptyRow);
      }

      const grid = new SudokuGrid(cells);
      const completions = service.detectCompletions(grid, new Position(0, 7));

      expect(completions).toHaveLength(0);
    });

    it('should not detect lines with duplicate values', () => {
      // Create 9x9 grid with row containing duplicate values (invalid completion)
      const cells: Cell[][] = [];

      // First row with duplicate values
      const duplicateRow = [
        new Cell(new Position(0, 0), CellValue.from(1), false),
        new Cell(new Position(0, 1), CellValue.from(2), false),
        new Cell(new Position(0, 2), CellValue.from(3), false),
        new Cell(new Position(0, 3), CellValue.from(4), false),
        new Cell(new Position(0, 4), CellValue.from(5), false),
        new Cell(new Position(0, 5), CellValue.from(6), false),
        new Cell(new Position(0, 6), CellValue.from(7), false),
        new Cell(new Position(0, 7), CellValue.from(8), false),
        new Cell(new Position(0, 8), CellValue.from(1), false), // Duplicate 1
      ];
      cells.push(duplicateRow);

      // Rest of the grid - empty cells
      for (let row = 1; row < 9; row++) {
        const emptyRow = Array.from({ length: 9 }, (_, col) =>
          new Cell(new Position(row, col), CellValue.empty(), false)
        );
        cells.push(emptyRow);
      }

      const grid = new SudokuGrid(cells);
      const completions = service.detectCompletions(grid, new Position(0, 8));

      expect(completions).toHaveLength(0);
    });
  });

  describe('createEffectsFromCompletions', () => {
    it('should create effects from completion events', () => {
      const completions = [
        {
          type: 'ROW_COMPLETED' as const,
          lineIndex: 0,
          positions: Array.from({ length: 9 }, (_, col) => new Position(0, col))
        },
        {
          type: 'COLUMN_COMPLETED' as const,
          lineIndex: 2,
          positions: Array.from({ length: 9 }, (_, row) => new Position(row, 2))
        }
      ];

      const effects = service.createEffectsFromCompletions(completions);

      expect(effects).toHaveLength(2);
      expect(effects[0].type).toBe('ROW_COMPLETION');
      expect(effects[0].lineIndex).toBe(0);
      expect(effects[1].type).toBe('COLUMN_COMPLETION');
      expect(effects[1].lineIndex).toBe(2);
    });
  });
});