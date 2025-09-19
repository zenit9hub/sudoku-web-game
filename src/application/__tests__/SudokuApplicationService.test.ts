import { SudokuApplicationService } from '../sudoku/services/SudokuApplicationService';
import { GameRepository } from '../../domain/sudoku/repositories/GameRepository';
import { SudokuValidationService } from '../../domain/sudoku/services/GridValidationService';
import { LineCompletionDetectionService } from '../../domain/sudoku/services/CompletionDetectionService';
import { TestEventPublisher, TestDataBuilder } from '../../domain/common/testing/DomainTestUtils';
import { SudokuGame } from '../../domain/sudoku/aggregates/Game';
import { Difficulty } from '../../domain/sudoku/entities/GameState';

describe('SudokuApplicationService', () => {
  let service: SudokuApplicationService;
  let mockRepository: jest.Mocked<GameRepository>;
  let mockValidationService: jest.Mocked<SudokuValidationService>;
  let mockCompletionService: jest.Mocked<LineCompletionDetectionService>;
  let testEventPublisher: TestEventPublisher;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      load: jest.fn(),
      delete: jest.fn()
    } as any;

    mockValidationService = {
      validateMove: jest.fn(),
      isGridComplete: jest.fn(),
      getPossibleValues: jest.fn()
    } as any;

    mockCompletionService = {
      detectCompletions: jest.fn(),
      createEffectsFromCompletions: jest.fn()
    } as any;

    testEventPublisher = new TestEventPublisher();

    service = new SudokuApplicationService(
      mockRepository,
      mockValidationService,
      mockCompletionService,
      testEventPublisher
    );
  });

  describe('createNewGame', () => {
    it('should create new game successfully', async () => {
      // Given
      const request = {
        difficulty: 'MEDIUM',
        seed: 'test-seed'
      };

      const mockGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.save.mockResolvedValue(undefined);

      // When
      const result = await service.createNewGame(request);

      // Then
      expect(result.success).toBe(true);
      expect(result.gameId).toBeDefined();
      expect(result.game).toBeDefined();
      expect(result.metadata.difficulty).toBe('MEDIUM');
    });
  });

  describe('makeMove', () => {
    it('should process valid move successfully', async () => {
      // Given
      const testGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.load.mockResolvedValue(testGame);

      const request = {
        gameId: 'test-game',
        position: { row: 0, col: 0 },
        value: 5
      };

      // When
      const result = await service.makeMove(request);

      // Then
      expect(result.success).toBe(true);
      expect(result.game).toBeDefined();
    });
  });

  describe('validateMoveComprehensively', () => {
    it('should perform comprehensive validation', async () => {
      // Given
      const testGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.load.mockResolvedValue(testGame);

      const request = {
        gameId: 'test-game',
        position: { row: 0, col: 0 },
        value: 5,
        validationLevel: 'standard' as const
      };

      // When
      const result = await service.validateMoveComprehensively(request);

      // Then
      expect(result.isValid).toBeDefined();
      expect(result.conflictingPositions).toBeDefined();
      expect(result.errorMessages).toBeDefined();
      expect(result.warnings).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.performance).toBeDefined();
      expect(typeof result.performance.validationTime).toBe('number');
      expect(typeof result.performance.rulesChecked).toBe('number');
    });

    it('should handle game not found', async () => {
      // Given
      mockRepository.load.mockResolvedValue(null);

      const request = {
        gameId: 'non-existent-game',
        position: { row: 0, col: 0 },
        value: 5
      };

      // When & Then
      await expect(service.validateMoveComprehensively(request))
        .rejects.toThrow('Game not found');
    });
  });

  describe('validateRealtime', () => {
    it('should perform realtime validation', async () => {
      // Given
      const testGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.load.mockResolvedValue(testGame);

      const request = {
        gameId: 'test-game',
        position: { row: 0, col: 0 },
        partialValue: '5'
      };

      // When
      const result = await service.validateRealtime(request);

      // Then
      expect(result.canContinue).toBeDefined();
      expect(Array.isArray(result.possibleValues)).toBe(true);
      expect(Array.isArray(result.immediateConflicts)).toBe(true);
    });
  });

  describe('generateAdvancedPuzzle', () => {
    it('should generate advanced puzzle', async () => {
      // Given
      const request = {
        difficulty: 'MEDIUM',
        useSymmetry: true,
        targetClueCount: 30,
        maxAttempts: 50
      };

      // When
      const result = await service.generateAdvancedPuzzle(request);

      // Then
      expect(result.puzzle).toBeDefined();
      expect(result.solution).toBeDefined();
      expect(result.quality).toBeDefined();
      expect(result.quality.difficulty).toBeDefined();
      expect(typeof result.quality.clueCount).toBe('number');
      expect(typeof result.quality.symmetryScore).toBe('number');
      expect(typeof result.quality.aestheticScore).toBe('number');
      expect(typeof result.quality.uniqueness).toBe('boolean');
      expect(typeof result.generationTime).toBe('number');
      expect(typeof result.attempts).toBe('number');
    });
  });

  describe('validateBatch', () => {
    it('should perform batch validation', async () => {
      // Given
      const testGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.load.mockResolvedValue(testGame);

      const request = {
        gameId: 'test-game',
        validationLevel: 'standard' as const
      };

      // When
      const result = await service.validateBatch(request);

      // Then
      expect(result.results).toBeDefined();
      expect(typeof result.overallValid).toBe('boolean');
      expect(typeof result.totalConflicts).toBe('number');
    });
  });

  describe('getGame', () => {
    it('should retrieve game successfully', async () => {
      // Given
      const testGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.load.mockResolvedValue(testGame);

      const request = {
        gameId: 'test-game'
      };

      // When
      const result = await service.getGame(request);

      // Then
      expect(result.game).toBeDefined();
      expect(result.exists).toBe(true);
    });

    it('should handle game not found', async () => {
      // Given
      mockRepository.load.mockResolvedValue(null);

      const request = {
        gameId: 'non-existent-game'
      };

      // When
      const result = await service.getGame(request);

      // Then
      expect(result.game).toBeNull();
      expect(result.exists).toBe(false);
    });
  });
});