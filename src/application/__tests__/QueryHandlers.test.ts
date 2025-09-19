import { ValidateRealtimeQueryHandler } from '../sudoku/handlers/ValidateRealtimeQueryHandler';
import { ValidateBatchQueryHandler } from '../sudoku/handlers/ValidateBatchQueryHandler';
import { ValidateRealtimeQuery } from '../sudoku/queries/ValidateRealtimeQuery';
import { ValidateBatchQuery } from '../sudoku/queries/ValidateBatchQuery';
import { ComprehensiveValidationService } from '../../domain/sudoku/services/ComprehensiveValidationService';
import { GameRepository } from '../../domain/sudoku/repositories/GameRepository';
import { TestDataBuilder } from '../../domain/common/testing/DomainTestUtils';
import { SudokuGame } from '../../domain/sudoku/aggregates/Game';
import { Position } from '../../domain/sudoku/value-objects/Position';

describe('Query Handlers', () => {
  describe('ValidateRealtimeQueryHandler', () => {
    let handler: ValidateRealtimeQueryHandler;
    let mockRepository: jest.Mocked<GameRepository>;
    let mockValidationService: jest.Mocked<ComprehensiveValidationService>;

    beforeEach(() => {
      mockRepository = {
        save: jest.fn(),
        load: jest.fn(),
        delete: jest.fn()
      } as any;

      mockValidationService = {
        validateComprehensively: jest.fn(),
        validateRealtime: jest.fn(),
        validateBatch: jest.fn(),
        setValidationLevel: jest.fn(),
        setDifficulty: jest.fn(),
        clearCache: jest.fn(),
        getPerformanceStats: jest.fn()
      } as any;

      handler = new ValidateRealtimeQueryHandler(
        mockRepository,
        mockValidationService
      );
    });

    it('should handle realtime validation successfully', async () => {
      // Given
      const testGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.load.mockResolvedValue(testGame);

      const mockRealtimeResult = {
        canContinue: true,
        possibleValues: [1, 3, 7],
        immediateConflicts: []
      };

      mockValidationService.validateRealtime.mockResolvedValue(mockRealtimeResult);

      const query = new ValidateRealtimeQuery({
        gameId: 'test-game',
        position: { row: 0, col: 0 },
        partialValue: '5'
      });

      // When
      const result = await handler.handle(query);

      // Then
      expect(result.success).toBe(true);
      expect(result.data.canContinue).toBe(true);
      expect(result.data.possibleValues).toEqual([1, 3, 7]);
      expect(result.data.immediateConflicts).toEqual([]);
      expect(result.metadata?.gameId).toBe('test-game');
      expect(result.metadata?.partialValue).toBe('5');
    });

    it('should handle conflicts in realtime validation', async () => {
      // Given
      const testGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.load.mockResolvedValue(testGame);

      const conflictPositions = [new Position(0, 1), new Position(1, 0)];
      const mockRealtimeResult = {
        canContinue: false,
        possibleValues: [],
        immediateConflicts: conflictPositions
      };

      mockValidationService.validateRealtime.mockResolvedValue(mockRealtimeResult);

      const query = new ValidateRealtimeQuery({
        gameId: 'test-game',
        position: { row: 0, col: 0 },
        partialValue: '9'
      });

      // When
      const result = await handler.handle(query);

      // Then
      expect(result.success).toBe(true);
      expect(result.data.canContinue).toBe(false);
      expect(result.data.possibleValues).toEqual([]);
      expect(result.data.immediateConflicts).toHaveLength(2);
      expect(result.data.immediateConflicts[0]).toEqual({ row: 0, col: 1 });
      expect(result.data.immediateConflicts[1]).toEqual({ row: 1, col: 0 });
    });

    it('should handle game not found', async () => {
      // Given
      mockRepository.load.mockResolvedValue(null);

      const query = new ValidateRealtimeQuery({
        gameId: 'non-existent-game',
        position: { row: 0, col: 0 },
        partialValue: '5'
      });

      // When
      const result = await handler.handle(query);

      // Then
      expect(result.success).toBe(false);
      expect(result.data.canContinue).toBe(false);
      expect(result.data.possibleValues).toEqual([]);
      expect(result.data.immediateConflicts).toEqual([]);
      expect(result.metadata?.error).toBe('Game not found');
    });

    it('should handle validation service errors', async () => {
      // Given
      const testGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.load.mockResolvedValue(testGame);
      mockValidationService.validateRealtime.mockRejectedValue(
        new Error('Realtime validation error')
      );

      const query = new ValidateRealtimeQuery({
        gameId: 'test-game',
        position: { row: 0, col: 0 },
        partialValue: '5'
      });

      // When
      const result = await handler.handle(query);

      // Then
      expect(result.success).toBe(false);
      expect(result.metadata?.error).toBe('Realtime validation error');
    });
  });

  describe('ValidateBatchQueryHandler', () => {
    let handler: ValidateBatchQueryHandler;
    let mockRepository: jest.Mocked<GameRepository>;
    let mockValidationService: jest.Mocked<ComprehensiveValidationService>;

    beforeEach(() => {
      mockRepository = {
        save: jest.fn(),
        load: jest.fn(),
        delete: jest.fn()
      } as any;

      mockValidationService = {
        validateComprehensively: jest.fn(),
        validateRealtime: jest.fn(),
        validateBatch: jest.fn(),
        setValidationLevel: jest.fn(),
        setDifficulty: jest.fn(),
        clearCache: jest.fn(),
        getPerformanceStats: jest.fn()
      } as any;

      handler = new ValidateBatchQueryHandler(
        mockRepository,
        mockValidationService
      );
    });

    it('should handle batch validation successfully', async () => {
      // Given
      const testGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.load.mockResolvedValue(testGame);

      const mockBatchResults = new Map([
        ['0,0', {
          level: 'standard' as any,
          isValid: true,
          conflictingPositions: [],
          errorMessages: [],
          violatedRules: [],
          warnings: [],
          suggestions: [],
          performance: { validationTime: 5, rulesChecked: 3, cacheHits: 0, cacheMisses: 1 }
        }],
        ['1,1', {
          level: 'standard' as any,
          isValid: false,
          conflictingPositions: [new Position(1, 0)],
          errorMessages: ['Conflict in row'],
          violatedRules: ['UniqueInRow'],
          warnings: [{
            type: 'pattern',
            message: 'Common mistake pattern',
            severity: 'medium',
            position: new Position(1, 1)
          }],
          suggestions: [],
          performance: { validationTime: 8, rulesChecked: 3, cacheHits: 0, cacheMisses: 1 }
        }]
      ]);

      mockValidationService.validateBatch.mockResolvedValue(mockBatchResults);

      const query = new ValidateBatchQuery({
        gameId: 'test-game',
        validationLevel: 'standard'
      });

      // When
      const result = await handler.handle(query);

      // Then
      expect(result.success).toBe(true);
      expect(result.data.overallValid).toBe(false);
      expect(result.data.totalConflicts).toBe(1);
      expect(Object.keys(result.data.results)).toHaveLength(2);

      // Valid cell
      expect(result.data.results['0,0'].isValid).toBe(true);
      expect(result.data.results['0,0'].conflictingPositions).toEqual([]);
      expect(result.data.results['0,0'].errorMessages).toEqual([]);

      // Invalid cell
      expect(result.data.results['1,1'].isValid).toBe(false);
      expect(result.data.results['1,1'].conflictingPositions).toEqual([{ row: 1, col: 0 }]);
      expect(result.data.results['1,1'].errorMessages).toEqual(['Conflict in row']);
      expect(result.data.results['1,1'].warnings).toHaveLength(1);
      expect(result.data.results['1,1'].warnings[0].type).toBe('pattern');

      expect(result.metadata?.totalCellsValidated).toBe(2);
    });

    it('should handle all valid cells', async () => {
      // Given
      const testGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.load.mockResolvedValue(testGame);

      const mockBatchResults = new Map([
        ['0,0', {
          level: 'standard' as any,
          isValid: true,
          conflictingPositions: [],
          errorMessages: [],
          violatedRules: [],
          warnings: [],
          suggestions: [],
          performance: { validationTime: 5, rulesChecked: 3, cacheHits: 0, cacheMisses: 1 }
        }],
        ['1,1', {
          level: 'standard' as any,
          isValid: true,
          conflictingPositions: [],
          errorMessages: [],
          violatedRules: [],
          warnings: [],
          suggestions: [],
          performance: { validationTime: 4, rulesChecked: 3, cacheHits: 1, cacheMisses: 0 }
        }]
      ]);

      mockValidationService.validateBatch.mockResolvedValue(mockBatchResults);

      const query = new ValidateBatchQuery({
        gameId: 'test-game',
        validationLevel: 'strict'
      });

      // When
      const result = await handler.handle(query);

      // Then
      expect(result.success).toBe(true);
      expect(result.data.overallValid).toBe(true);
      expect(result.data.totalConflicts).toBe(0);
      expect(result.metadata?.validationLevel).toBe('strict');
    });

    it('should handle game not found', async () => {
      // Given
      mockRepository.load.mockResolvedValue(null);

      const query = new ValidateBatchQuery({
        gameId: 'non-existent-game'
      });

      // When
      const result = await handler.handle(query);

      // Then
      expect(result.success).toBe(false);
      expect(result.data.results).toEqual({});
      expect(result.data.overallValid).toBe(false);
      expect(result.data.totalConflicts).toBe(0);
      expect(result.metadata?.error).toBe('Game not found');
    });

    it('should use default validation level when not provided', async () => {
      // Given
      const testGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.load.mockResolvedValue(testGame);
      mockValidationService.validateBatch.mockResolvedValue(new Map());

      const query = new ValidateBatchQuery({
        gameId: 'test-game'
        // validationLevel 제공하지 않음
      });

      // When
      await handler.handle(query);

      // Then
      expect(mockValidationService.validateBatch).toHaveBeenCalledWith(
        expect.anything(),
        'standard',
        expect.objectContaining({
          includeWarnings: true,
          includeSuggestions: false
        })
      );
    });
  });
});