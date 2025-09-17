import { TimerManager } from '../TimerManager';
import { createTestGame } from '../../../__tests__/utils/TestHelpers';
import { Difficulty } from '../../../domain/models/GameState';

describe('TimerManager', () => {
  let timerManager: TimerManager;
  let timeUpdateCallback: jest.Mock;

  beforeEach(() => {
    timeUpdateCallback = jest.fn();
    timerManager = new TimerManager(timeUpdateCallback);

    // Mock Date.now for consistent testing
    jest.useFakeTimers();
  });

  afterEach(() => {
    timerManager.destroy();
    jest.useRealTimers();
  });

  describe('start', () => {
    it('should start timer and call update callback', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      timerManager.start(game);

      // Should call callback immediately with initial time
      expect(timeUpdateCallback).toHaveBeenCalledWith('00:00');
    });

    it('should update timer every second', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      timerManager.start(game);
      timeUpdateCallback.mockClear();

      // Advance time by 1 second
      jest.advanceTimersByTime(1000);

      expect(timeUpdateCallback).toHaveBeenCalledWith('00:01');
    });

    it('should update timer correctly after multiple seconds', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      timerManager.start(game);
      timeUpdateCallback.mockClear();

      // Advance time by 65 seconds
      jest.advanceTimersByTime(65000);

      expect(timeUpdateCallback).toHaveBeenCalledWith('01:05');
    });

    it('should restart timer when called multiple times', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      timerManager.start(game);
      jest.advanceTimersByTime(30000); // 30 seconds

      timeUpdateCallback.mockClear();
      timerManager.start(game); // Restart

      // Should reset to 00:00
      expect(timeUpdateCallback).toHaveBeenCalledWith('00:00');
    });

    it('should use game start time when available', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      const pastTime = new Date(Date.now() - 120000); // 2 minutes ago
      game.state.statistics.startTime = pastTime;

      timerManager.start(game);

      // Should show elapsed time since game start
      expect(timeUpdateCallback).toHaveBeenCalledWith('02:00');
    });
  });

  describe('stop', () => {
    it('should stop timer updates', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      timerManager.start(game);
      timerManager.stop();

      timeUpdateCallback.mockClear();
      jest.advanceTimersByTime(5000);

      // Should not call callback after stopping
      expect(timeUpdateCallback).not.toHaveBeenCalled();
    });

    it('should work when timer is not running', () => {
      expect(() => {
        timerManager.stop();
      }).not.toThrow();
    });

    it('should preserve elapsed time after stopping', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      timerManager.start(game);
      jest.advanceTimersByTime(45000); // 45 seconds
      timerManager.stop();

      expect(timerManager.getElapsedSeconds()).toBe(45);
    });
  });

  describe('getElapsedSeconds', () => {
    it('should return 0 when timer has not started', () => {
      expect(timerManager.getElapsedSeconds()).toBe(0);
    });

    it('should return correct elapsed time while running', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      timerManager.start(game);
      jest.advanceTimersByTime(90000); // 90 seconds

      expect(timerManager.getElapsedSeconds()).toBe(90);
    });

    it('should return elapsed time including game history', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      const pastTime = new Date(Date.now() - 60000); // 1 minute ago
      game.state.statistics.startTime = pastTime;

      timerManager.start(game);
      jest.advanceTimersByTime(30000); // Additional 30 seconds

      expect(timerManager.getElapsedSeconds()).toBe(90); // 60 + 30
    });
  });

  describe('getFormattedElapsedTime', () => {
    it('should format time correctly for seconds', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      timerManager.start(game);
      jest.advanceTimersByTime(45000); // 45 seconds

      expect(timerManager.getFormattedElapsedTime()).toBe('00:45');
    });

    it('should format time correctly for minutes and seconds', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      timerManager.start(game);
      jest.advanceTimersByTime(125000); // 2 minutes 5 seconds

      expect(timerManager.getFormattedElapsedTime()).toBe('02:05');
    });

    it('should handle times over an hour', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      timerManager.start(game);
      jest.advanceTimersByTime(3665000); // 61 minutes 5 seconds

      expect(timerManager.getFormattedElapsedTime()).toBe('61:05');
    });

    it('should return 00:00 when timer has not started', () => {
      expect(timerManager.getFormattedElapsedTime()).toBe('00:00');
    });
  });

  describe('formatTime', () => {
    it('should format zero seconds', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      timerManager.start(game);

      expect(timerManager.formatTime(0)).toBe('00:00');
    });

    it('should format single digit seconds', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      timerManager.start(game);

      expect(timerManager.formatTime(5)).toBe('00:05');
    });

    it('should format double digit seconds', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      timerManager.start(game);

      expect(timerManager.formatTime(45)).toBe('00:45');
    });

    it('should format minutes and seconds', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      timerManager.start(game);

      expect(timerManager.formatTime(185)).toBe('03:05');
    });

    it('should format large time values', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      timerManager.start(game);

      expect(timerManager.formatTime(3661)).toBe('61:01');
    });
  });

  describe('destroy', () => {
    it('should stop timer and clean up resources', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      timerManager.start(game);
      timerManager.destroy();

      timeUpdateCallback.mockClear();
      jest.advanceTimersByTime(5000);

      // Should not call callback after destroying
      expect(timeUpdateCallback).not.toHaveBeenCalled();
    });

    it('should work when called multiple times', () => {
      expect(() => {
        timerManager.destroy();
        timerManager.destroy();
      }).not.toThrow();
    });

    it('should work when timer was never started', () => {
      expect(() => {
        timerManager.destroy();
      }).not.toThrow();
    });
  });

  describe('callback integration', () => {
    it('should call callback with correct frequency', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      timerManager.start(game);
      timeUpdateCallback.mockClear();

      // Advance time by 5 seconds
      jest.advanceTimersByTime(5000);

      // Should have been called 5 times (once per second)
      expect(timeUpdateCallback).toHaveBeenCalledTimes(5);
    });

    it('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn().mockImplementation(() => {
        throw new Error('Callback error');
      });

      const errorTimerManager = new TimerManager(errorCallback);
      const game = createTestGame({ difficulty: Difficulty.EASY });

      expect(() => {
        errorTimerManager.start(game);
        jest.advanceTimersByTime(1000);
      }).not.toThrow();

      errorTimerManager.destroy();
    });
  });

  describe('edge cases', () => {
    it('should handle rapid start/stop calls', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      for (let i = 0; i < 10; i++) {
        timerManager.start(game);
        timerManager.stop();
      }

      expect(() => {
        jest.advanceTimersByTime(1000);
      }).not.toThrow();
    });

    it('should handle negative elapsed time gracefully', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      const futureTime = new Date(Date.now() + 60000); // 1 minute in future
      game.state.statistics.startTime = futureTime;

      timerManager.start(game);

      // Should handle negative time gracefully
      expect(timerManager.getElapsedSeconds()).toBeGreaterThanOrEqual(0);
      expect(timerManager.getFormattedElapsedTime()).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});