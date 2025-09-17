import { LocalStorageGameRepository } from '../LocalStorageGameRepository';
import { createTestGame } from '../../../__tests__/utils/TestHelpers';
import { Difficulty } from '../../../domain/models/GameState';

describe('LocalStorageGameRepository', () => {
  let repository: LocalStorageGameRepository;

  beforeEach(() => {
    localStorage.clear();
    repository = new LocalStorageGameRepository();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('save', () => {
    it('should save game to localStorage', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      game.id = 'test-game';

      await repository.save(game);

      const savedData = localStorage.getItem('sudoku_game_test-game');
      expect(savedData).not.toBeNull();

      const parsedData = JSON.parse(savedData!);
      expect(parsedData).toHaveProperty('grid');
      expect(parsedData).toHaveProperty('state');
    });

    it('should update games list', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      game.id = 'list-test';

      await repository.save(game);

      const gameIds = await repository.getAllGameIds();
      expect(gameIds).toContain('list-test');
    });
  });

  describe('load', () => {
    it('should load saved game correctly', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      game.id = 'load-test';

      await repository.save(game);
      const loadedGame = await repository.load('load-test');

      expect(loadedGame).not.toBeNull();
      expect(loadedGame!.state.difficulty).toBe(game.state.difficulty);
      expect(loadedGame!.id).toBe('load-test');
    });

    it('should return null for non-existent games', async () => {
      const loadedGame = await repository.load('non-existent');
      expect(loadedGame).toBeNull();
    });

    it('should handle corrupted data gracefully', async () => {
      localStorage.setItem('sudoku_game_corrupted', 'invalid json data');

      const loadedGame = await repository.load('corrupted');
      expect(loadedGame).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing game', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      game.id = 'delete-test';

      await repository.save(game);
      expect(await repository.load('delete-test')).not.toBeNull();

      await repository.delete('delete-test');
      expect(await repository.load('delete-test')).toBeNull();
    });

    it('should handle deletion of non-existent games', async () => {
      await expect(repository.delete('non-existent')).resolves.not.toThrow();
    });

    it('should update games list after deletion', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      game.id = 'temp-game';

      await repository.save(game);
      let gameIds = await repository.getAllGameIds();
      expect(gameIds).toContain('temp-game');

      await repository.delete('temp-game');
      gameIds = await repository.getAllGameIds();
      expect(gameIds).not.toContain('temp-game');
    });
  });

  describe('getAllGameIds', () => {
    it('should return empty array when no games saved', async () => {
      const gameIds = await repository.getAllGameIds();
      expect(gameIds).toEqual([]);
    });

    it('should return list of saved game IDs', async () => {
      const game1 = createTestGame({ difficulty: Difficulty.EASY });
      const game2 = createTestGame({ difficulty: Difficulty.HARD });
      game1.id = 'game1';
      game2.id = 'game2';

      await repository.save(game1);
      await repository.save(game2);

      const gameIds = await repository.getAllGameIds();
      expect(gameIds).toContain('game1');
      expect(gameIds).toContain('game2');
      expect(gameIds).toHaveLength(2);
    });
  });

  describe('game state management', () => {
    it('should save and load game state separately', async () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      game.id = 'state-test';

      await repository.saveGameState('state-test', game.state);
      const loadedState = await repository.loadGameState('state-test');

      expect(loadedState).not.toBeNull();
      expect(loadedState!.difficulty).toBe(game.state.difficulty);
      expect(loadedState!.id).toBe(game.state.id);
    });

    it('should return null for non-existent game state', async () => {
      const loadedState = await repository.loadGameState('non-existent');
      expect(loadedState).toBeNull();
    });
  });
});