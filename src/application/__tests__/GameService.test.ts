import { GameService, MoveResult, HintResult } from '../services/GameService';
import { SudokuGame } from '../../domain/sudoku/aggregates/Game';
import { SudokuGrid } from '../../domain/sudoku/aggregates/Grid';
import { GameState, Difficulty } from '../../domain/sudoku/entities/GameState';
import { Position } from '../../domain/sudoku/value-objects/Position';
import { CellValue } from '../../domain/sudoku/value-objects/CellValue';
import { SudokuValidationService } from '../../domain/sudoku/services/GridValidationService';
import { GameRepository } from '../../domain/sudoku/repositories/GameRepository';
import { TestEventPublisher, TestDataBuilder } from '../../domain/common/testing/DomainTestUtils';

describe('GameService', () => {
  let gameService: GameService;
  let mockRepository: jest.Mocked<GameRepository>;
  let mockValidationService: jest.Mocked<SudokuValidationService>;
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

    testEventPublisher = new TestEventPublisher();

    gameService = new GameService(
      mockRepository,
      mockValidationService,
      testEventPublisher
    );
  });

  describe('createNewGame', () => {
    it('should create a new game and publish GameStarted event', async () => {
      // Given
      const difficulty = Difficulty.MEDIUM;

      // When
      const game = await gameService.createNewGame(difficulty);

      // Then
      expect(game).toBeInstanceOf(SudokuGame);
      expect(game.state.difficulty).toBe(difficulty);
      expect(mockRepository.save).toHaveBeenCalledWith(game);

      // 이벤트 발행 검증
      expect(testEventPublisher.hasEvent('GameStarted')).toBe(true);

      const gameStartedEvents = testEventPublisher.getEventsByType('GameStarted');
      expect(gameStartedEvents).toHaveLength(1);
      expect(gameStartedEvents[0].data.difficulty).toBe(difficulty);
    });
  });

  describe('makeMove', () => {
    let testGame: SudokuGame;

    beforeEach(() => {
      const grid = TestDataBuilder.createEmptyGrid();
      const state = TestDataBuilder.createGameState();
      testGame = SudokuGame.create('test-game', grid, state);
    });

    it('should make a valid move and publish ValidMoveCompleted event', async () => {
      // Given
      const position = new Position(0, 0);
      const value = new CellValue(5);

      mockValidationService.validateMove.mockReturnValue({
        isValid: true,
        conflictingPositions: [],
        errorMessages: [],
        violatedRules: []
      });

      mockValidationService.isGridComplete.mockReturnValue(false);

      // When
      const result: MoveResult = await gameService.makeMove(testGame, position, value);

      // Then
      expect(result.success).toBe(true);
      expect(result.isComplete).toBe(false);
      expect(mockRepository.save).toHaveBeenCalled();

      // 이벤트 발행 검증
      expect(testEventPublisher.hasEvent('MoveAttempted')).toBe(true);
      expect(testEventPublisher.hasEvent('ValidMoveCompleted')).toBe(true);
    });

    it('should handle invalid move and publish InvalidMoveAttempted event', async () => {
      // Given
      const position = new Position(0, 0);
      const value = new CellValue(5);
      const conflictingPositions = [new Position(0, 1)];

      mockValidationService.validateMove.mockReturnValue({
        isValid: false,
        conflictingPositions,
        errorMessages: ['Number already exists in row'],
        violatedRules: ['UniqueInRow']
      });

      // When
      const result: MoveResult = await gameService.makeMove(testGame, position, value);

      // Then
      expect(result.success).toBe(true); // 서비스 호출은 성공
      expect(result.conflictingPositions).toEqual(conflictingPositions);

      // 이벤트 발행 검증
      expect(testEventPublisher.hasEvent('MoveAttempted')).toBe(true);
      expect(testEventPublisher.hasEvent('InvalidMoveAttempted')).toBe(true);
    });

    it('should complete game and publish GameCompleted event', async () => {
      // Given
      const position = new Position(0, 0);
      const value = new CellValue(5);

      mockValidationService.validateMove.mockReturnValue({
        isValid: true,
        conflictingPositions: [],
        errorMessages: [],
        violatedRules: []
      });

      mockValidationService.isGridComplete.mockReturnValue(true);

      // When
      const result: MoveResult = await gameService.makeMove(testGame, position, value);

      // Then
      expect(result.success).toBe(true);
      expect(result.isComplete).toBe(true);

      // 이벤트 발행 검증
      expect(testEventPublisher.hasEvent('GameCompleted')).toBe(true);

      const gameCompletedEvents = testEventPublisher.getEventsByType('GameCompleted');
      expect(gameCompletedEvents).toHaveLength(1);
      expect(gameCompletedEvents[0].data.difficulty).toBe(testGame.state.difficulty);
    });
  });

  describe('getHint', () => {
    let testGame: SudokuGame;

    beforeEach(() => {
      const grid = TestDataBuilder.createEmptyGrid();
      const state = TestDataBuilder.createGameState();
      testGame = SudokuGame.create('test-game', grid, state);
    });

    it('should provide hint and publish HintRequested event', async () => {
      // Given
      const possibleValues = [new CellValue(7)];
      mockValidationService.getPossibleValues.mockReturnValue(possibleValues);

      // When
      const result: HintResult | null = await gameService.getHint(testGame);

      // Then
      expect(result).not.toBeNull();
      expect(result!.success).toBe(true);
      expect(result!.value).toEqual(possibleValues[0]);

      // 이벤트 발행 검증
      expect(testEventPublisher.hasEvent('HintRequested')).toBe(true);

      const hintEvents = testEventPublisher.getEventsByType('HintRequested');
      expect(hintEvents).toHaveLength(1);
      expect(hintEvents[0].data.hintType).toBe('naked_single');
    });

    it('should return null when no hints available', async () => {
      // Given
      const gridWithNoCells = {
        getEmptyCells: jest.fn().mockReturnValue([])
      };
      const gameWithFullGrid = {
        ...testGame,
        grid: gridWithNoCells
      };

      // When
      const result = await gameService.getHint(gameWithFullGrid as any);

      // Then
      expect(result).toBeNull();
    });
  });

  describe('pauseGame', () => {
    it('should pause game and publish GamePaused event', async () => {
      // Given
      const grid = TestDataBuilder.createEmptyGrid();
      const state = TestDataBuilder.createGameState();
      const testGame = SudokuGame.create('test-game', grid, state);

      // When
      const result = await gameService.pauseGame(testGame);

      // Then
      expect(result.state.isPaused).toBe(true);
      expect(mockRepository.save).toHaveBeenCalledWith(result);

      // 이벤트 발행 검증
      expect(testEventPublisher.hasEvent('GamePaused')).toBe(true);
    });
  });

  describe('resumeGame', () => {
    it('should resume game and publish GameResumed event', async () => {
      // Given
      const grid = TestDataBuilder.createEmptyGrid();
      const state = TestDataBuilder.createGameState({ isPaused: true });
      const testGame = SudokuGame.create('test-game', grid, state);

      // When
      const result = await gameService.resumeGame(testGame);

      // Then
      expect(result.state.isPaused).toBe(false);
      expect(mockRepository.save).toHaveBeenCalledWith(result);

      // 이벤트 발행 검증
      expect(testEventPublisher.hasEvent('GameResumed')).toBe(true);
    });
  });

  describe('resetGame', () => {
    it('should reset game and publish GameReset event', async () => {
      // Given
      const grid = TestDataBuilder.createEmptyGrid();
      const state = TestDataBuilder.createGameState({
        moveCount: 10,
        mistakeCount: 2,
        hintsUsed: 1
      });
      const testGame = SudokuGame.create('test-game', grid, state);

      // When
      const result = await gameService.resetGame(testGame);

      // Then
      expect(result.state.moveCount).toBe(0);
      expect(result.state.mistakeCount).toBe(0);
      expect(result.state.hintsUsed).toBe(0);
      expect(mockRepository.save).toHaveBeenCalledWith(result);

      // 이벤트 발행 검증
      expect(testEventPublisher.hasEvent('GameReset')).toBe(true);

      const resetEvents = testEventPublisher.getEventsByType('GameReset');
      expect(resetEvents).toHaveLength(1);
      expect(resetEvents[0].data.previousStats.moveCount).toBe(10);
      expect(resetEvents[0].data.previousStats.mistakeCount).toBe(2);
    });
  });
});