import { ValidateComprehensivelyCommandHandler } from '../sudoku/handlers/ValidateComprehensivelyCommandHandler';
import { GenerateAdvancedPuzzleCommandHandler } from '../sudoku/handlers/GenerateAdvancedPuzzleCommandHandler';
import { ValidateComprehensivelyCommand } from '../sudoku/commands/ValidateComprehensivelyCommand';
import { GenerateAdvancedPuzzleCommand } from '../sudoku/commands/GenerateAdvancedPuzzleCommand';
import { ComprehensiveValidationService } from '../../domain/sudoku/services/ComprehensiveValidationService';
import { AdvancedPuzzleGenerationService } from '../../domain/sudoku/services/AdvancedPuzzleGenerationService';
import { GameRepository } from '../../domain/sudoku/repositories/GameRepository';
import { TestDataBuilder } from '../../domain/common/testing/DomainTestUtils';
import { SudokuGame } from '../../domain/sudoku/aggregates/Game';
import { Difficulty } from '../../domain/sudoku/entities/GameState';

describe('Command Handlers', () => {
  describe('ValidateComprehensivelyCommandHandler', () => {
    let handler: ValidateComprehensivelyCommandHandler;
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

      handler = new ValidateComprehensivelyCommandHandler(
        mockRepository,
        mockValidationService
      );
    });

    it('should handle comprehensive validation successfully', async () => {
      // Given
      const testGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.load.mockResolvedValue(testGame);

      const mockValidationResult = {
        level: 'standard' as any,
        isValid: true,
        conflictingPositions: [],
        errorMessages: [],
        violatedRules: [],
        warnings: [],
        suggestions: [],
        performance: {
          validationTime: 10,
          rulesChecked: 5,
          cacheHits: 0,
          cacheMisses: 1
        }
      };

      mockValidationService.validateComprehensively.mockResolvedValue(mockValidationResult);

      const command = new ValidateComprehensivelyCommand({
        gameId: 'test-game',
        position: { row: 0, col: 0 },
        value: 5,
        validationLevel: 'standard'
      });

      // When
      const result = await handler.handle(command);

      // Then
      expect(result.success).toBe(true);
      expect(result.data.isValid).toBe(true);
      expect(result.data.performance.validationTime).toBe(10);
      expect(result.data.performance.rulesChecked).toBe(5);
      expect(result.metadata?.validationLevel).toBe('standard');
    });

    it('should handle game not found', async () => {
      // Given
      mockRepository.load.mockResolvedValue(null);

      const command = new ValidateComprehensivelyCommand({
        gameId: 'non-existent-game',
        position: { row: 0, col: 0 },
        value: 5
      });

      // When
      const result = await handler.handle(command);

      // Then
      expect(result.success).toBe(false);
      expect(result.data.errorMessages).toContain('Game not found');
    });

    it('should handle validation service errors', async () => {
      // Given
      const testGame = SudokuGame.create(
        'test-game',
        TestDataBuilder.createEmptyGrid(),
        TestDataBuilder.createGameState()
      );

      mockRepository.load.mockResolvedValue(testGame);
      mockValidationService.validateComprehensively.mockRejectedValue(
        new Error('Validation service error')
      );

      const command = new ValidateComprehensivelyCommand({
        gameId: 'test-game',
        position: { row: 0, col: 0 },
        value: 5
      });

      // When
      const result = await handler.handle(command);

      // Then
      expect(result.success).toBe(false);
      expect(result.data.errorMessages[0]).toContain('Validation error:');
    });
  });

  describe('GenerateAdvancedPuzzleCommandHandler', () => {
    let handler: GenerateAdvancedPuzzleCommandHandler;
    let mockGenerationService: jest.Mocked<AdvancedPuzzleGenerationService>;

    beforeEach(() => {
      mockGenerationService = {
        generateAdvancedPuzzle: jest.fn(),
        generateStandardPuzzle: jest.fn(),
        setDifficulty: jest.fn(),
        clearCache: jest.fn(),
        getGenerationStats: jest.fn()
      } as any;

      handler = new GenerateAdvancedPuzzleCommandHandler(mockGenerationService);
    });

    it('should handle puzzle generation successfully', async () => {
      // Given
      const mockGenerationResult = {
        puzzle: TestDataBuilder.createEmptyGrid(),
        solution: TestDataBuilder.createEmptyGrid(),
        quality: {
          difficulty: 'MEDIUM',
          clueCount: 30,
          symmetryScore: 0.8,
          aestheticScore: 0.7,
          uniqueness: true
        },
        generationTime: 150,
        attempts: 3
      };

      mockGenerationService.generateAdvancedPuzzle.mockResolvedValue(mockGenerationResult);

      const command = new GenerateAdvancedPuzzleCommand({
        difficulty: 'MEDIUM',
        useSymmetry: true,
        targetClueCount: 30,
        maxAttempts: 100
      });

      // When
      const result = await handler.handle(command);

      // Then
      expect(result.success).toBe(true);
      expect(result.data.quality.difficulty).toBe('MEDIUM');
      expect(result.data.quality.clueCount).toBe(30);
      expect(result.data.quality.symmetryScore).toBe(0.8);
      expect(result.data.quality.aestheticScore).toBe(0.7);
      expect(result.data.quality.uniqueness).toBe(true);
      expect(result.data.generationTime).toBe(150);
      expect(result.data.attempts).toBe(3);
      expect(result.metadata?.requestedDifficulty).toBe('MEDIUM');
    });

    it('should handle generation service errors', async () => {
      // Given
      mockGenerationService.generateAdvancedPuzzle.mockRejectedValue(
        new Error('Generation failed')
      );

      const command = new GenerateAdvancedPuzzleCommand({
        difficulty: 'HARD',
        useSymmetry: false
      });

      // When
      const result = await handler.handle(command);

      // Then
      expect(result.success).toBe(false);
      expect(result.data.puzzle).toBeNull();
      expect(result.data.solution).toBeNull();
      expect(result.data.quality.difficulty).toBe('unknown');
      expect(result.metadata?.error).toBe('Generation failed');
    });

    it('should use default options when not provided', async () => {
      // Given
      const mockGenerationResult = {
        puzzle: TestDataBuilder.createEmptyGrid(),
        solution: TestDataBuilder.createEmptyGrid(),
        quality: {
          difficulty: 'EASY',
          clueCount: 40,
          symmetryScore: 1.0,
          aestheticScore: 0.9,
          uniqueness: true
        },
        generationTime: 80,
        attempts: 1
      };

      mockGenerationService.generateAdvancedPuzzle.mockResolvedValue(mockGenerationResult);

      const command = new GenerateAdvancedPuzzleCommand({
        difficulty: 'EASY'
        // 다른 옵션들은 제공하지 않음
      });

      // When
      await handler.handle(command);

      // Then
      expect(mockGenerationService.generateAdvancedPuzzle).toHaveBeenCalledWith(
        'EASY',
        expect.objectContaining({
          useSymmetricRemoval: false,
          targetClueCount: undefined,
          maxAttempts: 100,
          validateUniqueness: true,
          optimizeAesthetics: true
        })
      );
    });
  });
});