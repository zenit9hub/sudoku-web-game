import { GameService } from '../../application/services/GameService';
import { SudokuValidationService } from '../../domain/services/SudokuValidationService';
import { LocalStorageGameRepository } from '../../infrastructure/repositories/LocalStorageGameRepository';
import { Difficulty } from '../../domain/models/GameState';
import { Position } from '../../domain/models/Position';
import { CellValue } from '../../domain/models/CellValue';

describe('Application Layer Integration Tests', () => {
  let gameService: GameService;
  let repository: LocalStorageGameRepository;
  let validationService: SudokuValidationService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Initialize services
    repository = new LocalStorageGameRepository();
    validationService = new SudokuValidationService();
    gameService = new GameService(repository, validationService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Game Creation and Validation Integration', () => {
    it('should create valid games across all difficulty levels', async () => {
      const difficulties = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.EXPERT];

      for (const difficulty of difficulties) {
        const game = await gameService.newGame(difficulty);

        expect(game).toBeDefined();
        expect(game.state.difficulty).toBe(difficulty);
        expect(game.state.status).toBe('playing');

        // Validate the generated puzzle
        const isValid = validationService.isValidPuzzle(game.grid);
        expect(isValid).toBe(true);

        // Check that the puzzle has the correct number of given cells
        const givenCells = game.grid.getAllCells().filter(cell => cell.isGiven);
        expect(givenCells.length).toBeGreaterThan(0);

        // Verify puzzle is solvable
        const isSolvable = validationService.isSolvable(game.grid);
        expect(isSolvable).toBe(true);
      }
    });

    it('should generate unique puzzles', async () => {
      const games = [];
      const numGames = 5;

      // Generate multiple games of the same difficulty
      for (let i = 0; i < numGames; i++) {
        const game = await gameService.newGame(Difficulty.EASY);
        games.push(game);
      }

      // Check that games are different
      for (let i = 0; i < numGames - 1; i++) {
        for (let j = i + 1; j < numGames; j++) {
          const grid1 = games[i].grid;
          const grid2 = games[j].grid;

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
        }
      }
    });

    it('should validate move legality correctly', async () => {
      const game = await gameService.newGame(Difficulty.EASY);

      // Find an empty cell
      let emptyPosition: Position | null = null;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const cell = game.grid.getCell(row, col);
          if (!cell.isGiven && cell.value.isEmpty()) {
            emptyPosition = new Position(row, col);
            break;
          }
        }
        if (emptyPosition) break;
      }

      if (emptyPosition) {
        // Test valid move
        const validValue = findValidValueForPosition(game, emptyPosition);
        if (validValue) {
          const isValidMove = validationService.isValidMove(
            game.grid,
            emptyPosition,
            new CellValue(validValue)
          );
          expect(isValidMove).toBe(true);

          // Make the move
          const updatedGame = await gameService.makeMove(game, emptyPosition, new CellValue(validValue));
          expect(updatedGame.grid.getCell(emptyPosition.row, emptyPosition.col).value.toNumber()).toBe(validValue);
          expect(updatedGame.state.statistics.moves).toBe(game.state.statistics.moves + 1);
        }

        // Test invalid move (duplicate in row/column/box)
        const invalidValue = findInvalidValueForPosition(game, emptyPosition);
        if (invalidValue) {
          const isInvalidMove = validationService.isValidMove(
            game.grid,
            emptyPosition,
            new CellValue(invalidValue)
          );
          expect(isInvalidMove).toBe(false);
        }
      }
    });
  });

  describe('Game Persistence Integration', () => {
    it('should save and load games correctly', async () => {
      const originalGame = await gameService.newGame(Difficulty.MEDIUM);

      // Make some moves
      const emptyPositions = findEmptyPositions(originalGame);
      if (emptyPositions.length > 0) {
        const position = emptyPositions[0];
        const validValue = findValidValueForPosition(originalGame, position);
        if (validValue) {
          const gameAfterMove = await gameService.makeMove(
            originalGame,
            position,
            new CellValue(validValue)
          );

          // Save the game
          await gameService.saveGame('test-game', gameAfterMove);

          // Load the game
          const loadedGame = await gameService.loadGame('test-game');

          expect(loadedGame).not.toBeNull();
          expect(loadedGame!.state.difficulty).toBe(Difficulty.MEDIUM);
          expect(loadedGame!.state.statistics.moves).toBe(gameAfterMove.state.statistics.moves);

          // Verify grid state is preserved
          for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
              const originalCell = gameAfterMove.grid.getCell(row, col);
              const loadedCell = loadedGame!.grid.getCell(row, col);
              expect(loadedCell.value.equals(originalCell.value)).toBe(true);
              expect(loadedCell.isGiven).toBe(originalCell.isGiven);
            }
          }
        }
      }
    });

    it('should handle multiple saved games', async () => {
      const games = [];
      const gameKeys = ['game1', 'game2', 'game3'];

      // Create and save multiple games
      for (const key of gameKeys) {
        const game = await gameService.newGame(Difficulty.EASY);
        await gameService.saveGame(key, game);
        games.push(game);
      }

      // Load and verify each game
      for (let i = 0; i < gameKeys.length; i++) {
        const loadedGame = await gameService.loadGame(gameKeys[i]);
        expect(loadedGame).not.toBeNull();
        expect(loadedGame!.state.difficulty).toBe(Difficulty.EASY);
      }

      // List all saved games
      const savedGameKeys = await repository.listGames();
      expect(savedGameKeys).toHaveLength(3);
      expect(savedGameKeys.sort()).toEqual(gameKeys.sort());
    });

    it('should handle game deletion', async () => {
      const game = await gameService.newGame(Difficulty.HARD);
      const gameKey = 'delete-test-game';

      // Save the game
      await gameService.saveGame(gameKey, game);

      // Verify it was saved
      const loadedGame = await gameService.loadGame(gameKey);
      expect(loadedGame).not.toBeNull();

      // Delete the game
      await repository.deleteGame(gameKey);

      // Verify it was deleted
      const deletedGame = await gameService.loadGame(gameKey);
      expect(deletedGame).toBeNull();
    });
  });

  describe('Game Completion Integration', () => {
    it('should detect game completion correctly', async () => {
      const game = await gameService.newGame(Difficulty.EASY);

      // Complete the puzzle by filling all empty cells with valid values
      let currentGame = game;
      let completionAttempts = 0;
      const maxAttempts = 100; // Prevent infinite loops

      while (currentGame.state.status !== 'completed' && completionAttempts < maxAttempts) {
        const emptyPositions = findEmptyPositions(currentGame);
        if (emptyPositions.length === 0) break;

        const position = emptyPositions[0];
        const validValue = findValidValueForPosition(currentGame, position);
        if (validValue) {
          currentGame = await gameService.makeMove(
            currentGame,
            position,
            new CellValue(validValue)
          );
        } else {
          // If no valid value found, try next position
          break;
        }
        completionAttempts++;
      }

      // Check if game is completed
      const isCompleted = validationService.isComplete(currentGame.grid);
      if (isCompleted) {
        expect(currentGame.state.status).toBe('completed');
      }
    });

    it('should maintain game statistics during completion', async () => {
      const game = await gameService.newGame(Difficulty.EASY);
      let currentGame = game;

      const initialMoves = currentGame.state.statistics.moves;
      const initialHints = currentGame.state.statistics.hints;
      const startTime = currentGame.state.statistics.startTime;

      // Make a few moves
      const emptyPositions = findEmptyPositions(currentGame).slice(0, 3);
      for (const position of emptyPositions) {
        const validValue = findValidValueForPosition(currentGame, position);
        if (validValue) {
          currentGame = await gameService.makeMove(
            currentGame,
            position,
            new CellValue(validValue)
          );
        }
      }

      // Use a hint
      const hintResult = await gameService.getHint(currentGame);
      if (hintResult) {
        currentGame = hintResult;
      }

      // Verify statistics are updated
      expect(currentGame.state.statistics.moves).toBeGreaterThan(initialMoves);
      expect(currentGame.state.statistics.hints).toBeGreaterThanOrEqual(initialHints);
      expect(currentGame.state.statistics.startTime).toEqual(startTime);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle invalid moves gracefully', async () => {
      const game = await gameService.newGame(Difficulty.EASY);

      // Try to make a move on a given cell
      let givenPosition: Position | null = null;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (game.grid.getCell(row, col).isGiven) {
            givenPosition = new Position(row, col);
            break;
          }
        }
        if (givenPosition) break;
      }

      if (givenPosition) {
        await expect(
          gameService.makeMove(game, givenPosition, new CellValue(5))
        ).rejects.toThrow();
      }
    });

    it('should handle storage errors gracefully', async () => {
      // Mock localStorage to throw an error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const game = await gameService.newGame(Difficulty.EASY);

      await expect(
        gameService.saveGame('error-test', game)
      ).rejects.toThrow();

      // Restore original localStorage
      localStorage.setItem = originalSetItem;
    });

    it('should handle corrupted save data', async () => {
      // Save corrupted data
      localStorage.setItem('sudoku_corrupted-game', 'invalid json data');

      const loadedGame = await gameService.loadGame('corrupted-game');
      expect(loadedGame).toBeNull();
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid moves efficiently', async () => {
      const game = await gameService.newGame(Difficulty.EASY);
      let currentGame = game;

      const startTime = performance.now();
      const emptyPositions = findEmptyPositions(currentGame).slice(0, 10);

      // Make multiple moves rapidly
      for (const position of emptyPositions) {
        const validValue = findValidValueForPosition(currentGame, position);
        if (validValue) {
          currentGame = await gameService.makeMove(
            currentGame,
            position,
            new CellValue(validValue)
          );
        }
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (1 second for 10 moves)
      expect(duration).toBeLessThan(1000);
      expect(currentGame.state.statistics.moves).toBeGreaterThan(game.state.statistics.moves);
    });

    it('should handle multiple concurrent games', async () => {
      const games = [];
      const numGames = 5;

      const startTime = performance.now();

      // Create multiple games concurrently
      const gamePromises = [];
      for (let i = 0; i < numGames; i++) {
        gamePromises.push(gameService.newGame(Difficulty.EASY));
      }

      const createdGames = await Promise.all(gamePromises);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should create all games efficiently
      expect(createdGames).toHaveLength(numGames);
      expect(duration).toBeLessThan(5000); // 5 seconds for 5 games

      // Verify all games are valid and unique
      for (let i = 0; i < numGames; i++) {
        expect(createdGames[i]).toBeDefined();
        expect(createdGames[i].state.status).toBe('playing');
      }
    });
  });
});

// Helper functions
function findEmptyPositions(game: any): Position[] {
  const positions = [];
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const cell = game.grid.getCell(row, col);
      if (!cell.isGiven && cell.value.isEmpty()) {
        positions.push(new Position(row, col));
      }
    }
  }
  return positions;
}

function findValidValueForPosition(game: any, position: Position): number | null {
  for (let value = 1; value <= 9; value++) {
    if (game.grid.isValidMove(position.row, position.col, value)) {
      return value;
    }
  }
  return null;
}

function findInvalidValueForPosition(game: any, position: Position): number | null {
  // Look for a value that already exists in the same row, column, or box
  const row = position.row;
  const col = position.col;

  // Check row for existing values
  for (let c = 0; c < 9; c++) {
    if (c !== col) {
      const cellValue = game.grid.getCell(row, c).value;
      if (!cellValue.isEmpty()) {
        return cellValue.toNumber();
      }
    }
  }

  // Check column for existing values
  for (let r = 0; r < 9; r++) {
    if (r !== row) {
      const cellValue = game.grid.getCell(r, col).value;
      if (!cellValue.isEmpty()) {
        return cellValue.toNumber();
      }
    }
  }

  // Check 3x3 box for existing values
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;

  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (r !== row || c !== col) {
        const cellValue = game.grid.getCell(r, c).value;
        if (!cellValue.isEmpty()) {
          return cellValue.toNumber();
        }
      }
    }
  }

  return null;
}