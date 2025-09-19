import {
  GameStartedHandler,
  MoveAttemptedHandler,
  ValidMoveCompletedHandler,
  InvalidMoveAttemptedHandler,
  GameCompletedHandler,
  HintRequestedHandler,
  GamePausedHandler,
  GameResumedHandler,
  GameResetHandler,
  ApplicationEventHandlerRegistry
} from '../sudoku/handlers/GameEventHandlers';
import {
  GameStarted,
  MoveAttempted,
  ValidMoveCompleted,
  InvalidMoveAttempted,
  GameCompleted,
  HintRequested,
  GamePaused,
  GameResumed,
  GameReset
} from '../../domain/sudoku/events/SudokuDomainEvents';
import { Difficulty } from '../../domain/sudoku/entities/GameState';
import { Position } from '../../domain/sudoku/value-objects/Position';
import { CellValue } from '../../domain/sudoku/value-objects/CellValue';

describe('Game Event Handlers', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('GameStartedHandler', () => {
    it('should handle GameStarted event', async () => {
      // Given
      const handler = new GameStartedHandler();
      const event = new GameStarted('game-1', Difficulty.MEDIUM, {
        gridSize: 9,
        clueCount: 30
      });

      // When
      await handler.handle(event);

      // Then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🎮 Game started: game-1'),
        expect.objectContaining({
          difficulty: Difficulty.MEDIUM,
          gridSize: 9,
          clueCount: 30
        })
      );
    });
  });

  describe('MoveAttemptedHandler', () => {
    it('should handle MoveAttempted event', async () => {
      // Given
      const handler = new MoveAttemptedHandler();
      const event = new MoveAttempted(
        'game-1',
        new Position(0, 0),
        new CellValue(5),
        true,
        []
      );

      // When
      await handler.handle(event);

      // Then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('📝 Move attempted: game-1'),
        expect.objectContaining({
          isValid: true,
          conflictingPositions: 0
        })
      );
    });
  });

  describe('ValidMoveCompletedHandler', () => {
    it('should handle ValidMoveCompleted event', async () => {
      // Given
      const handler = new ValidMoveCompletedHandler();
      const event = new ValidMoveCompleted(
        'game-1',
        new Position(0, 0),
        new CellValue(5),
        1
      );

      // When
      await handler.handle(event);

      // Then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('✅ Valid move completed: game-1'),
        expect.objectContaining({
          moveCount: 1
        })
      );
    });
  });

  describe('InvalidMoveAttemptedHandler', () => {
    it('should handle InvalidMoveAttempted event', async () => {
      // Given
      const handler = new InvalidMoveAttemptedHandler();
      const conflictingPositions = [new Position(0, 1)];
      const event = new InvalidMoveAttempted(
        'game-1',
        new Position(0, 0),
        new CellValue(5),
        conflictingPositions,
        1
      );

      // When
      await handler.handle(event);

      // Then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('❌ Invalid move attempted: game-1'),
        expect.objectContaining({
          mistakeCount: 1,
          conflictingPositions
        })
      );
    });
  });

  describe('GameCompletedHandler', () => {
    it('should handle GameCompleted event and calculate score', async () => {
      // Given
      const handler = new GameCompletedHandler();
      const event = new GameCompleted('game-1', Difficulty.MEDIUM, {
        elapsedTime: 120000, // 2 minutes
        moveCount: 50,
        mistakeCount: 2,
        hintsUsed: 1
      });

      // When
      await handler.handle(event);

      // Then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🎉 Game completed: game-1'),
        expect.objectContaining({
          difficulty: Difficulty.medium,
          elapsedTime: 120000,
          moveCount: 50,
          mistakeCount: 2,
          hintsUsed: 1
        })
      );

      // Score calculation should be logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Score calculated:'),
        expect.any(Object)
      );
    });
  });

  describe('HintRequestedHandler', () => {
    it('should handle HintRequested event', async () => {
      // Given
      const handler = new HintRequestedHandler();
      const event = new HintRequested(
        'game-1',
        new Position(0, 0),
        new CellValue(5),
        {
          hintsUsed: 1,
          hintType: 'naked_single',
          reasoning: 'Only value possible'
        }
      );

      // When
      await handler.handle(event);

      // Then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('💡 Hint requested: game-1'),
        expect.objectContaining({
          hintsUsed: 1,
          hintType: 'naked_single',
          reasoning: 'Only value possible'
        })
      );
    });
  });

  describe('GamePausedHandler', () => {
    it('should handle GamePaused event', async () => {
      // Given
      const handler = new GamePausedHandler();
      const event = new GamePaused('game-1', {
        elapsedTime: 60000,
        moveCount: 25
      });

      // When
      await handler.handle(event);

      // Then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('⏸️ Game paused: game-1'),
        expect.objectContaining({
          elapsedTime: 60000,
          moveCount: 25
        })
      );
    });
  });

  describe('GameResumedHandler', () => {
    it('should handle GameResumed event', async () => {
      // Given
      const handler = new GameResumedHandler();
      const event = new GameResumed('game-1', {
        elapsedTime: 90000,
        moveCount: 35
      });

      // When
      await handler.handle(event);

      // Then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('▶️ Game resumed: game-1'),
        expect.objectContaining({
          elapsedTime: 90000,
          moveCount: 35
        })
      );
    });
  });

  describe('GameResetHandler', () => {
    it('should handle GameReset event', async () => {
      // Given
      const handler = new GameResetHandler();
      const event = new GameReset('game-1', {
        previousStats: {
          moveCount: 20,
          mistakeCount: 3,
          hintsUsed: 2,
          elapsedTime: 180000
        }
      });

      // When
      await handler.handle(event);

      // Then
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('🔄 Game reset: game-1'),
        expect.objectContaining({
          previousStats: {
            moveCount: 20,
            mistakeCount: 3,
            hintsUsed: 2,
            elapsedTime: 180000
          }
        })
      );
    });
  });

  describe('ApplicationEventHandlerRegistry', () => {
    let registry: ApplicationEventHandlerRegistry;

    beforeEach(() => {
      registry = new ApplicationEventHandlerRegistry();
    });

    it('should register default handlers', () => {
      // When
      const gameStartedHandlers = registry.getHandlers('GameStarted');
      const moveAttemptedHandlers = registry.getHandlers('MoveAttempted');
      const gameCompletedHandlers = registry.getHandlers('GameCompleted');

      // Then
      expect(gameStartedHandlers).toHaveLength(1);
      expect(moveAttemptedHandlers).toHaveLength(1);
      expect(gameCompletedHandlers).toHaveLength(1);
    });

    it('should handle custom event registration', () => {
      // Given
      const customHandler = new GameStartedHandler();

      // When
      registry.register('CustomEvent', customHandler);
      const handlers = registry.getHandlers('CustomEvent');

      // Then
      expect(handlers).toHaveLength(1);
      expect(handlers[0]).toBe(customHandler);
    });

    it('should handle events and catch errors', async () => {
      // Given
      const errorHandler = {
        handle: jest.fn().mockRejectedValue(new Error('Handler error'))
      };
      registry.register('TestEvent', errorHandler);

      const event = {
        eventId: 'test-1',
        eventType: 'TestEvent',
        aggregateId: 'test-aggregate',
        aggregateType: 'Test',
        occurredOn: new Date(),
        version: 1,
        data: {}
      };

      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      // When
      await registry.handleEvent(event);

      // Then
      expect(errorHandler.handle).toHaveBeenCalledWith(event);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error handling event TestEvent:'),
        expect.any(Error)
      );

      errorSpy.mockRestore();
    });

    it('should return empty array for unknown event types', () => {
      // When
      const handlers = registry.getHandlers('UnknownEvent');

      // Then
      expect(handlers).toEqual([]);
    });
  });
});