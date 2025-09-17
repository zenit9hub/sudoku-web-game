import { SudokuValidationService } from '../SudokuValidationService';
import { SudokuGrid } from '../../models/SudokuGrid';
import { Position } from '../../models/Position';
import { CellValue } from '../../models/CellValue';

describe('SudokuValidationService', () => {
  let validationService: SudokuValidationService;
  let grid: SudokuGrid;

  beforeEach(() => {
    validationService = new SudokuValidationService();
    grid = new SudokuGrid();
  });

  describe('validateMove', () => {
    it('should allow empty cell value', () => {
      const position = new Position(0, 0);
      const result = validationService.validateMove(grid, position, CellValue.empty());
      
      expect(result.isValid).toBe(true);
      expect(result.conflictingPositions).toHaveLength(0);
    });

    it('should allow valid move in empty grid', () => {
      const position = new Position(0, 0);
      const value = CellValue.from(5);
      
      const result = validationService.validateMove(grid, position, value);
      
      expect(result.isValid).toBe(true);
      expect(result.conflictingPositions).toHaveLength(0);
    });

    it('should detect row conflict', () => {
      const position1 = new Position(0, 0);
      const position2 = new Position(0, 5);
      const value = CellValue.from(3);
      
      grid = grid.setCell(position1, value);
      
      const result = validationService.validateMove(grid, position2, value);
      
      expect(result.isValid).toBe(false);
      expect(result.conflictingPositions).toContainEqual(position1);
    });

    it('should detect column conflict', () => {
      const position1 = new Position(0, 0);
      const position2 = new Position(5, 0);
      const value = CellValue.from(7);
      
      grid = grid.setCell(position1, value);
      
      const result = validationService.validateMove(grid, position2, value);
      
      expect(result.isValid).toBe(false);
      expect(result.conflictingPositions).toContainEqual(position1);
    });

    it('should detect box conflict', () => {
      const position1 = new Position(0, 0);
      const position2 = new Position(1, 2);
      const value = CellValue.from(9);
      
      grid = grid.setCell(position1, value);
      
      const result = validationService.validateMove(grid, position2, value);
      
      expect(result.isValid).toBe(false);
      expect(result.conflictingPositions).toContainEqual(position1);
    });
  });

  describe('isGridComplete', () => {
    it('should return false for empty grid', () => {
      expect(validationService.isGridComplete(grid)).toBe(false);
    });

    it('should return false for incomplete grid', () => {
      grid = grid.setCell(new Position(0, 0), CellValue.from(1));
      expect(validationService.isGridComplete(grid)).toBe(false);
    });
  });

  describe('getPossibleValues', () => {
    it('should return all values for empty cell in empty grid', () => {
      const position = new Position(4, 4);
      const possibleValues = validationService.getPossibleValues(grid, position);
      
      expect(possibleValues).toHaveLength(9);
      expect(possibleValues.map(v => v.value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('should exclude conflicting values', () => {
      const position = new Position(0, 1);
      grid = grid.setCell(new Position(0, 0), CellValue.from(5));
      
      const possibleValues = validationService.getPossibleValues(grid, position);
      
      expect(possibleValues.map(v => v.value)).not.toContain(5);
      expect(possibleValues).toHaveLength(8);
    });
  });
});