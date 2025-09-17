import { LocalStorageGameRepository } from '../LocalStorageGameRepository';
import { createTestGame } from '../../../__tests__/utils/TestHelpers';
import { Difficulty } from '../../../domain/models/GameState';

describe('LocalStorageGameRepository', () => {
  let repository: LocalStorageGameRepository;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    repository = new LocalStorageGameRepository();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('saveGame', () => {
    it('should save game to localStorage', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      const key = 'test-game';

      await repository.saveGame(key, game);

      const savedData = localStorage.getItem('sudoku_test-game');
      expect(savedData).not.toBeNull();

      const parsedData = JSON.parse(savedData!);
      expect(parsedData).toHaveProperty('grid');
      expect(parsedData).toHaveProperty('state');
    });

    it('should overwrite existing games with same key', async () => {
      const game1 = createTestGame({ difficulty: Difficulty.EASY });
      const game2 = createTestGame({ difficulty: Difficulty.HARD });
      const key = 'overwrite-test';

      await repository.saveGame(key, game1);
      await repository.saveGame(key, game2);

      const loadedGame = await repository.loadGame(key);
      expect(loadedGame).not.toBeNull();
      expect(loadedGame!.state.difficulty).toBe(Difficulty.HARD);
    });

    it('should handle games with different difficulties', async () => {
      const difficulties = [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD, Difficulty.EXPERT];

      for (let i = 0; i < difficulties.length; i++) {
        const game = createTestGame({ difficulty: difficulties[i] });
        const key = `difficulty-test-${i}`;

        await repository.saveGame(key, game);

        const loadedGame = await repository.loadGame(key);
        expect(loadedGame!.state.difficulty).toBe(difficulties[i]);
      }
    });

    it('should preserve game statistics', async () => {
      const game = createTestGame({ difficulty: Difficulty.MEDIUM });
      game.state.statistics.moves = 25;
      game.state.statistics.hints = 3;
      const key = 'stats-test';

      await repository.saveGame(key, game);
      const loadedGame = await repository.loadGame(key);

      expect(loadedGame!.state.statistics.moves).toBe(25);
      expect(loadedGame!.state.statistics.hints).toBe(3);
      expect(loadedGame!.state.statistics.startTime).toEqual(game.state.statistics.startTime);
    });

    it('should preserve grid state accurately', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY, filled: true });
      const key = 'grid-test';

      await repository.saveGame(key, game);
      const loadedGame = await repository.loadGame(key);

      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const originalCell = game.grid.getCell(row, col);
          const loadedCell = loadedGame!.grid.getCell(row, col);

          expect(loadedCell.value.equals(originalCell.value)).toBe(true);
          expect(loadedCell.isGiven).toBe(originalCell.isGiven);
        }
      }
    });
  });

  describe('loadGame', () => {
    it('should load saved game correctly', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      const key = 'load-test';

      await repository.saveGame(key, game);
      const loadedGame = await repository.loadGame(key);

      expect(loadedGame).not.toBeNull();
      expect(loadedGame!.state.difficulty).toBe(game.state.difficulty);
      expect(loadedGame!.state.status).toBe(game.state.status);
    });

    it('should return null for non-existent games', async () => {
      const loadedGame = await repository.loadGame('non-existent');
      expect(loadedGame).toBeNull();
    });

    it('should handle corrupted data gracefully', async () => {
      localStorage.setItem('sudoku_corrupted', 'invalid json data');

      const loadedGame = await repository.loadGame('corrupted');
      expect(loadedGame).toBeNull();
    });

    it('should handle partially corrupted data', async () => {
      const incompleteData = { grid: null };
      localStorage.setItem('sudoku_incomplete', JSON.stringify(incompleteData));

      const loadedGame = await repository.loadGame('incomplete');
      expect(loadedGame).toBeNull();
    });

    it('should handle empty string data', async () => {
      localStorage.setItem('sudoku_empty', '');

      const loadedGame = await repository.loadGame('empty');
      expect(loadedGame).toBeNull();
    });

    it('should preserve selected position when loading', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      game.selectCell(3, 5);
      const key = 'selection-test';

      await repository.saveGame(key, game);
      const loadedGame = await repository.loadGame(key);

      expect(loadedGame!.selectedPosition?.row).toBe(3);
      expect(loadedGame!.selectedPosition?.col).toBe(5);
    });
  });

  describe('deleteGame', () => {
    it('should delete existing game', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      const key = 'delete-test';

      await repository.saveGame(key, game);
      expect(await repository.loadGame(key)).not.toBeNull();

      await repository.deleteGame(key);
      expect(await repository.loadGame(key)).toBeNull();
    });

    it('should handle deletion of non-existent games', async () => {
      expect(async () => {
        await repository.deleteGame('non-existent');
      }).not.toThrow();
    });

    it('should not affect other saved games', async () => {
      const game1 = createTestGame({ difficulty: Difficulty.EASY });
      const game2 = createTestGame({ difficulty: Difficulty.HARD });

      await repository.saveGame('keep', game1);
      await repository.saveGame('delete', game2);

      await repository.deleteGame('delete');

      expect(await repository.loadGame('keep')).not.toBeNull();
      expect(await repository.loadGame('delete')).toBeNull();
    });
  });

  describe('listGames', () => {
    it('should return empty array when no games saved', async () => {
      const games = await repository.listGames();
      expect(games).toEqual([]);
    });

    it('should return list of saved game keys', async () => {
      const keys = ['game1', 'game2', 'game3'];
      const game = createTestGame({ difficulty: Difficulty.EASY });

      for (const key of keys) {
        await repository.saveGame(key, game);
      }

      const savedKeys = await repository.listGames();
      expect(savedKeys.sort()).toEqual(keys.sort());
    });

    it('should not include non-game localStorage items', async () => {
      // Add non-game items to localStorage
      localStorage.setItem('other-app-data', 'some data');
      localStorage.setItem('user-preferences', 'preferences');

      // Add game items
      const game = createTestGame({ difficulty: Difficulty.EASY });
      await repository.saveGame('actual-game', game);

      const gameKeys = await repository.listGames();
      expect(gameKeys).toEqual(['actual-game']);
    });

    it('should handle corrupted entries in list', async () => {
      // Add valid game
      const game = createTestGame({ difficulty: Difficulty.EASY });
      await repository.saveGame('valid-game', game);

      // Add corrupted game entry
      localStorage.setItem('sudoku_corrupted-entry', 'invalid data');

      const gameKeys = await repository.listGames();
      expect(gameKeys).toContain('valid-game');
      expect(gameKeys).toContain('corrupted-entry');
    });

    it('should update list after deletions', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      await repository.saveGame('temp-game', game);

      let gameKeys = await repository.listGames();
      expect(gameKeys).toContain('temp-game');

      await repository.deleteGame('temp-game');

      gameKeys = await repository.listGames();
      expect(gameKeys).not.toContain('temp-game');
    });
  });

  describe('storage prefix handling', () => {
    it('should use consistent prefix for all operations', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      const key = 'prefix-test';

      await repository.saveGame(key, game);

      // Check that the item is stored with the correct prefix
      const rawData = localStorage.getItem('sudoku_prefix-test');
      expect(rawData).not.toBeNull();

      // Ensure the key without prefix is not found
      const withoutPrefix = localStorage.getItem('prefix-test');
      expect(withoutPrefix).toBeNull();
    });

    it('should handle keys with special characters', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      const specialKeys = ['key-with-dashes', 'key_with_underscores', 'key.with.dots'];

      for (const key of specialKeys) {
        await repository.saveGame(key, game);
        const loadedGame = await repository.loadGame(key);
        expect(loadedGame).not.toBeNull();
      }
    });
  });

  describe('error handling', () => {
    it('should handle localStorage quota exceeded', async () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const game = createTestGame({ difficulty: Difficulty.EASY });

      await expect(repository.saveGame('quota-test', game)).rejects.toThrow();

      localStorage.setItem = originalSetItem;
    });

    it('should handle localStorage unavailable', async () => {
      const originalLocalStorage = window.localStorage;
      delete (window as any).localStorage;

      const newRepository = new LocalStorageGameRepository();
      const game = createTestGame({ difficulty: Difficulty.EASY });

      await expect(newRepository.saveGame('no-storage', game)).rejects.toThrow();

      (window as any).localStorage = originalLocalStorage;
    });

    it('should handle malformed JSON in storage', async () => {
      localStorage.setItem('sudoku_malformed', '{"incomplete": json}');

      const loadedGame = await repository.loadGame('malformed');
      expect(loadedGame).toBeNull();
    });

    it('should handle null values in storage', async () => {
      localStorage.setItem('sudoku_null-value', 'null');

      const loadedGame = await repository.loadGame('null-value');
      expect(loadedGame).toBeNull();
    });
  });

  describe('performance', () => {
    it('should save and load games efficiently', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      const numOperations = 10;

      const startTime = performance.now();

      for (let i = 0; i < numOperations; i++) {
        await repository.saveGame(`perf-test-${i}`, game);
        await repository.loadGame(`perf-test-${i}`);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000); // 1 second for 20 operations
    });

    it('should handle large numbers of saved games', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      const numGames = 50;

      for (let i = 0; i < numGames; i++) {
        await repository.saveGame(`bulk-test-${i}`, game);
      }

      const startTime = performance.now();
      const gameKeys = await repository.listGames();
      const endTime = performance.now();

      expect(gameKeys).toHaveLength(numGames);
      expect(endTime - startTime).toBeLessThan(100); // Should list quickly
    });
  });
});