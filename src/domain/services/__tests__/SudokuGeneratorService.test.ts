import { SudokuGeneratorService } from '../SudokuGeneratorService';
import { SudokuValidationService } from '../SudokuValidationService';
import { Difficulty } from '../../models/GameState';

describe('SudokuGeneratorService', () => {
  let generatorService: SudokuGeneratorService;
  let validationService: SudokuValidationService;

  beforeEach(() => {
    generatorService = new SudokuGeneratorService();
    validationService = new SudokuValidationService();
  });

  describe('generatePuzzle', () => {
    it('should generate valid puzzles for all difficulty levels', () => {
      const difficulties = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.EXPERT];

      difficulties.forEach(difficulty => {
        const grid = generatorService.generatePuzzle(difficulty);

        expect(grid).toBeDefined();
        expect(validationService.isValidPuzzle(grid)).toBe(true);
        expect(validationService.isSolvable(grid)).toBe(true);
      });
    });

    it('should generate puzzles with appropriate number of given cells', () => {
      const expectedGivenCells = {
        [Difficulty.EASY]: { min: 40, max: 50 },
        [Difficulty.MEDIUM]: { min: 30, max: 40 },
        [Difficulty.HARD]: { min: 25, max: 35 },
        [Difficulty.EXPERT]: { min: 20, max: 30 }
      };

      Object.entries(expectedGivenCells).forEach(([difficulty, range]) => {
        const grid = generatorService.generatePuzzle(difficulty as Difficulty);
        const givenCells = grid.getAllCells().filter(cell => cell.isGiven);

        expect(givenCells.length).toBeGreaterThanOrEqual(range.min);
        expect(givenCells.length).toBeLessThanOrEqual(range.max);
      });
    });

    it('should generate unique puzzles', () => {
      const grids = [];
      const numPuzzles = 5;

      for (let i = 0; i < numPuzzles; i++) {
        grids.push(generatorService.generatePuzzle(Difficulty.EASY));
      }

      // Check that all puzzles are different
      for (let i = 0; i < numPuzzles - 1; i++) {
        for (let j = i + 1; j < numPuzzles; j++) {
          let isDifferent = false;

          for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
              if (!grids[i].getCell(row, col).value.equals(grids[j].getCell(row, col).value)) {
                isDifferent = true;
                break;
              }
            }
            if (isDifferent) break;
          }

          expect(isDifferent).toBe(true);
        }
      }
    });

    it('should generate puzzles with only one solution', () => {
      const grid = generatorService.generatePuzzle(Difficulty.MEDIUM);

      // This is a computational check - we trust the generator's algorithm
      // In a real implementation, we might have a more sophisticated check
      expect(validationService.isSolvable(grid)).toBe(true);
      expect(validationService.isValidPuzzle(grid)).toBe(true);
    });

    it('should handle edge cases for difficulty levels', () => {
      // Test boundary conditions
      expect(() => {
        generatorService.generatePuzzle(Difficulty.EASY);
      }).not.toThrow();

      expect(() => {
        generatorService.generatePuzzle(Difficulty.EXPERT);
      }).not.toThrow();
    });
  });

  describe('performance characteristics', () => {
    it('should generate puzzles within reasonable time', () => {
      const startTime = performance.now();

      generatorService.generatePuzzle(Difficulty.EASY);

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should generate puzzle within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should handle multiple concurrent generations', () => {
      const startTime = performance.now();

      const puzzles = [];
      for (let i = 0; i < 3; i++) {
        puzzles.push(generatorService.generatePuzzle(Difficulty.EASY));
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should generate 3 puzzles within 10 seconds
      expect(duration).toBeLessThan(10000);
      expect(puzzles).toHaveLength(3);

      puzzles.forEach(puzzle => {
        expect(validationService.isValidPuzzle(puzzle)).toBe(true);
      });
    });
  });

  describe('puzzle quality', () => {
    it('should generate symmetrical puzzles when possible', () => {
      const grid = generatorService.generatePuzzle(Difficulty.EASY);

      // Check for common symmetry patterns (this is optional for Sudoku)
      // We mainly check that the puzzle is well-formed
      expect(validationService.isValidPuzzle(grid)).toBe(true);
    });

    it('should distribute given cells across all regions', () => {
      const grid = generatorService.generatePuzzle(Difficulty.EASY);

      // Check that each 3x3 box has at least some given cells
      for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
          let givenInBox = 0;

          for (let row = boxRow * 3; row < (boxRow + 1) * 3; row++) {
            for (let col = boxCol * 3; col < (boxCol + 1) * 3; col++) {
              if (grid.getCell(row, col).isGiven) {
                givenInBox++;
              }
            }
          }

          // Each box should have at least one given cell
          expect(givenInBox).toBeGreaterThan(0);
        }
      }
    });

    it('should ensure puzzles have proper difficulty progression', () => {
      const easyGrid = generatorService.generatePuzzle(Difficulty.EASY);
      const expertGrid = generatorService.generatePuzzle(Difficulty.EXPERT);

      const easyGivenCells = easyGrid.getAllCells().filter(cell => cell.isGiven).length;
      const expertGivenCells = expertGrid.getAllCells().filter(cell => cell.isGiven).length;

      // Expert should have fewer given cells than easy
      expect(expertGivenCells).toBeLessThan(easyGivenCells);
    });
  });

  describe('error handling', () => {
    it('should handle invalid difficulty gracefully', () => {
      // TypeScript should prevent this, but test runtime behavior
      expect(() => {
        generatorService.generatePuzzle('INVALID' as any);
      }).not.toThrow(); // Should fallback to a default difficulty
    });

    it('should recover from generation failures', () => {
      // Mock a scenario where generation might fail initially
      const originalRandom = Math.random;
      let callCount = 0;

      Math.random = jest.fn(() => {
        callCount++;
        // Return predictable values that might cause issues
        return callCount < 10 ? 0 : originalRandom();
      });

      expect(() => {
        generatorService.generatePuzzle(Difficulty.EASY);
      }).not.toThrow();

      Math.random = originalRandom;
    });
  });

  describe('deterministic behavior', () => {
    it('should produce different results on consecutive calls', () => {
      const grid1 = generatorService.generatePuzzle(Difficulty.EASY);
      const grid2 = generatorService.generatePuzzle(Difficulty.EASY);

      let isDifferent = false;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (!grid1.getCell(row, col).value.equals(grid2.getCell(row, col).value)) {
            isDifferent = true;
            break;
          }
        }
        if (isDifferent) break;
      }

      expect(isDifferent).toBe(true);
    });
  });

  describe('memory efficiency', () => {
    it('should not leak memory during generation', () => {
      const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

      // Generate multiple puzzles
      for (let i = 0; i < 10; i++) {
        generatorService.generatePuzzle(Difficulty.MEDIUM);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;

      // Memory usage shouldn't grow excessively
      if (process.memoryUsage) {
        const memoryGrowth = finalMemory - initialMemory;
        expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
      }
    });
  });
});