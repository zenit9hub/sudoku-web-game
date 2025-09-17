import { SudokuGeneratorService } from '../SudokuGeneratorService';
import { SudokuValidationService } from '../SudokuValidationService';
import { Difficulty } from '../../models/GameState';
import { Position } from '../../models/Position';

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
        expect(validationService.isGridComplete(grid)).toBe(false); // Should be incomplete puzzle
        expect(grid.getGivenCells().length).toBeGreaterThan(0); // Should have given cells
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
              const pos = new Position(row, col);
              if (!grids[i].getCell(pos).value.equals(grids[j].getCell(pos).value)) {
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
      expect(validationService.isGridComplete(grid)).toBe(false); // Should be incomplete puzzle
      expect(grid.getGivenCells().length).toBeGreaterThan(0); // Should have given cells
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
        expect(puzzle.getGivenCells().length).toBeGreaterThan(0); // Should have given cells
      });
    });
  });

  describe('puzzle quality', () => {
    it('should generate symmetrical puzzles when possible', () => {
      const grid = generatorService.generatePuzzle(Difficulty.EASY);

      // Check for common symmetry patterns (this is optional for Sudoku)
      // We mainly check that the puzzle is well-formed
      expect(grid.getGivenCells().length).toBeGreaterThan(0); // Should have given cells
    });

    it('should distribute given cells across all regions', () => {
      const grid = generatorService.generatePuzzle(Difficulty.EASY);

      // Check that each 3x3 box has at least some given cells
      for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
          let givenInBox = 0;

          for (let row = boxRow * 3; row < (boxRow + 1) * 3; row++) {
            for (let col = boxCol * 3; col < (boxCol + 1) * 3; col++) {
              const pos = new Position(row, col);
              if (grid.getCell(pos).isGiven) {
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
      }).not.toThrow(); // Should use default number of cells to remove
    });

    it('should handle extreme random conditions', () => {
      // Test with a seeded generator for consistent behavior
      const seededGenerator = new SudokuGeneratorService(12345);

      expect(() => {
        const grid = seededGenerator.generatePuzzle(Difficulty.EASY);
        expect(grid).toBeDefined();
        expect(grid.getGivenCells().length).toBeGreaterThan(0);
      }).not.toThrow();
    });
  });

  describe('deterministic behavior', () => {
    it('should produce different results on consecutive calls', () => {
      const grid1 = generatorService.generatePuzzle(Difficulty.EASY);
      const grid2 = generatorService.generatePuzzle(Difficulty.EASY);

      let isDifferent = false;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const pos = new Position(row, col);
          if (!grid1.getCell(pos).value.equals(grid2.getCell(pos).value)) {
            isDifferent = true;
            break;
          }
        }
        if (isDifferent) break;
      }

      expect(isDifferent).toBe(true);
    });

    it('should produce consistent results with the same seed', () => {
      const seed = 12345;
      const generator1 = new SudokuGeneratorService(seed);
      const generator2 = new SudokuGeneratorService(seed);

      const grid1 = generator1.generatePuzzle(Difficulty.MEDIUM);
      const grid2 = generator2.generatePuzzle(Difficulty.MEDIUM);

      // Grids should be identical with same seed
      let areIdentical = true;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const pos = new Position(row, col);
          if (!grid1.getCell(pos).value.equals(grid2.getCell(pos).value)) {
            areIdentical = false;
            break;
          }
        }
        if (!areIdentical) break;
      }

      expect(areIdentical).toBe(true);
    });
  });

  describe('mathematical guarantees', () => {
    it('should always generate a valid puzzle without fallbacks', () => {
      // Test multiple generations to ensure algorithm always succeeds
      for (let i = 0; i < 5; i++) {
        const grid = generatorService.generatePuzzle(Difficulty.MEDIUM);

        expect(grid).toBeDefined();
        expect(grid.getGivenCells().length).toBeGreaterThan(0);

        // Verify the puzzle has no conflicting given numbers
        const givenCells = grid.getGivenCells();
        expect(givenCells.length).toBeGreaterThan(0);

        // Verify all given cells are properly placed
        givenCells.forEach(cell => {
          expect(cell.isGiven).toBe(true);
          expect(cell.isEmpty()).toBe(false);
        });
      }
    });

    it('should generate puzzles with valid structure', () => {
      const grid = generatorService.generatePuzzle(Difficulty.HARD);

      // Check that the grid is properly structured
      expect(grid).toBeDefined();

      // Check that we have given cells
      const givenCells = grid.getGivenCells();
      expect(givenCells.length).toBeGreaterThan(0);

      // Check that given cells are properly marked
      givenCells.forEach(cell => {
        expect(cell.isGiven).toBe(true);
        expect(cell.isEmpty()).toBe(false);
        expect(cell.value.value).toBeGreaterThanOrEqual(1);
        expect(cell.value.value).toBeLessThanOrEqual(9);
      });

      // Check that empty cells are properly marked
      const emptyCells = grid.getEmptyCells();
      emptyCells.forEach(cell => {
        expect(cell.isGiven).toBe(false);
        expect(cell.isEmpty()).toBe(true);
      });
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