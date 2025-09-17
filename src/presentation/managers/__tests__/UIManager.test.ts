import { UIManager } from '../UIManager';
import { MockDOMElementManager } from '../../../__tests__/utils/MockClasses';
import { createTestGame } from '../../../__tests__/utils/TestHelpers';
import { Difficulty } from '../../../domain/models/GameState';

describe('UIManager', () => {
  let uiManager: UIManager;
  let mockDOMManager: MockDOMElementManager;

  beforeEach(() => {
    mockDOMManager = new MockDOMElementManager();
    uiManager = new UIManager(mockDOMManager);
  });

  afterEach(() => {
    mockDOMManager.reset();
  });

  describe('updateGameInfo', () => {
    it('should update difficulty display', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      uiManager.updateGameInfo(game);

      const difficultyCall = mockDOMManager.updateTextContentCalls.find(
        call => call.elementId === 'difficulty'
      );
      expect(difficultyCall).toBeDefined();
      expect(difficultyCall?.content).toBe('쉬움');
    });

    it('should update moves counter', () => {
      const game = createTestGame({ difficulty: Difficulty.MEDIUM });
      game.state.statistics.moves = 15;

      uiManager.updateGameInfo(game);

      const movesCall = mockDOMManager.updateTextContentCalls.find(
        call => call.elementId === 'moves'
      );
      expect(movesCall).toBeDefined();
      expect(movesCall?.content).toBe('15');
    });

    it('should update hints counter', () => {
      const game = createTestGame({ difficulty: Difficulty.HARD });
      game.state.statistics.hints = 3;

      uiManager.updateGameInfo(game);

      const hintsCall = mockDOMManager.updateTextContentCalls.find(
        call => call.elementId === 'hints'
      );
      expect(hintsCall).toBeDefined();
      expect(hintsCall?.content).toBe('3');
    });

    it('should include final time when provided', () => {
      const game = createTestGame({ difficulty: Difficulty.EXPERT, completed: true });

      uiManager.updateGameInfo(game, '05:30');

      const timeCall = mockDOMManager.updateTextContentCalls.find(
        call => call.elementId === 'timer'
      );
      expect(timeCall).toBeDefined();
      expect(timeCall?.content).toBe('05:30');
    });

    it('should handle different difficulty levels', () => {
      const difficulties = [
        { level: Difficulty.EASY, expected: '쉬움' },
        { level: Difficulty.MEDIUM, expected: '보통' },
        { level: Difficulty.HARD, expected: '어려움' },
        { level: Difficulty.EXPERT, expected: '전문가' }
      ];

      difficulties.forEach(({ level, expected }) => {
        mockDOMManager.reset();
        const game = createTestGame({ difficulty: level });

        uiManager.updateGameInfo(game);

        const difficultyCall = mockDOMManager.updateTextContentCalls.find(
          call => call.elementId === 'difficulty'
        );
        expect(difficultyCall?.content).toBe(expected);
      });
    });
  });

  describe('updateSelectionInfo', () => {
    it('should update selection info when cell is selected', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      game.selectCell(3, 4);

      uiManager.updateSelectionInfo(game);

      const infoCall = mockDOMManager.updateTextContentCalls.find(
        call => call.elementId === 'selection-info'
      );
      expect(infoCall).toBeDefined();
      expect(infoCall?.content).toContain('행 4, 열 5');
    });

    it('should show empty message when no cell is selected', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      uiManager.updateSelectionInfo(game);

      const infoCall = mockDOMManager.updateTextContentCalls.find(
        call => call.elementId === 'selection-info'
      );
      expect(infoCall).toBeDefined();
      expect(infoCall?.content).toBe('칸을 선택하고 숫자를 입력하세요');
    });

    it('should show cell value when selected cell has value', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY, filled: true });
      game.selectCell(0, 0);

      uiManager.updateSelectionInfo(game);

      const infoCall = mockDOMManager.updateTextContentCalls.find(
        call => call.elementId === 'selection-info'
      );
      expect(infoCall).toBeDefined();
      expect(infoCall?.content).toContain('값: 1');
    });
  });

  describe('updateTimer', () => {
    it('should update timer display', () => {
      uiManager.updateTimer('03:45');

      const timerCall = mockDOMManager.updateTextContentCalls.find(
        call => call.elementId === 'timer'
      );
      expect(timerCall).toBeDefined();
      expect(timerCall?.content).toBe('03:45');
    });

    it('should handle different time formats', () => {
      const timeFormats = ['00:00', '59:59', '10:30', '123:45'];

      timeFormats.forEach(timeFormat => {
        mockDOMManager.reset();

        uiManager.updateTimer(timeFormat);

        const timerCall = mockDOMManager.updateTextContentCalls.find(
          call => call.elementId === 'timer'
        );
        expect(timerCall?.content).toBe(timeFormat);
      });
    });
  });

  describe('showMessage', () => {
    it('should display message with default type', () => {
      uiManager.showMessage('Test message');

      const messageCall = mockDOMManager.updateTextContentCalls.find(
        call => call.elementId === 'message'
      );
      expect(messageCall).toBeDefined();
      expect(messageCall?.content).toBe('Test message');

      const styleCall = mockDOMManager.updateStyleCalls.find(
        call => call.elementId === 'message' && call.property === 'display'
      );
      expect(styleCall?.value).toBe('block');
    });

    it('should apply error styling for ERROR type', () => {
      uiManager.showMessage('Error message', 'ERROR');

      const colorStyleCall = mockDOMManager.updateStyleCalls.find(
        call => call.elementId === 'message' && call.property === 'color'
      );
      expect(colorStyleCall?.value).toBe('#dc3545');
    });

    it('should apply success styling for SUCCESS type', () => {
      uiManager.showMessage('Success message', 'SUCCESS');

      const colorStyleCall = mockDOMManager.updateStyleCalls.find(
        call => call.elementId === 'message' && call.property === 'color'
      );
      expect(colorStyleCall?.value).toBe('#28a745');
    });

    it('should hide message after specified duration', (done) => {
      const duration = 100; // 100ms for testing

      uiManager.showMessage('Test message', 'INFO', duration);

      setTimeout(() => {
        const hideStyleCall = mockDOMManager.updateStyleCalls.find(
          call => call.elementId === 'message' &&
          call.property === 'display' &&
          call.value === 'none'
        );
        expect(hideStyleCall).toBeDefined();
        done();
      }, duration + 10);
    });

    it('should handle multiple messages correctly', () => {
      uiManager.showMessage('First message');
      uiManager.showMessage('Second message');

      const messageCalls = mockDOMManager.updateTextContentCalls.filter(
        call => call.elementId === 'message'
      );
      expect(messageCalls).toHaveLength(2);
      expect(messageCalls[1].content).toBe('Second message');
    });
  });

  describe('showGameComplete', () => {
    it('should display completion message with stats', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY, completed: true });
      game.state.statistics.moves = 50;
      game.state.statistics.hints = 2;

      uiManager.showGameComplete(game, '10:30');

      const messageCall = mockDOMManager.updateTextContentCalls.find(
        call => call.elementId === 'message'
      );
      expect(messageCall).toBeDefined();
      expect(messageCall?.content).toContain('🎉 축하합니다!');
      expect(messageCall?.content).toContain('10:30');
      expect(messageCall?.content).toContain('50번의 이동');
      expect(messageCall?.content).toContain('2개의 힌트');
    });

    it('should apply success styling for completion message', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY, completed: true });

      uiManager.showGameComplete(game, '05:15');

      const colorStyleCall = mockDOMManager.updateStyleCalls.find(
        call => call.elementId === 'message' && call.property === 'color'
      );
      expect(colorStyleCall?.value).toBe('#28a745');
    });

    it('should show completion message for extended duration', (done) => {
      const game = createTestGame({ difficulty: Difficulty.EASY, completed: true });

      uiManager.showGameComplete(game, '08:45');

      // Should still be visible after standard message duration
      setTimeout(() => {
        const hideStyleCall = mockDOMManager.updateStyleCalls.find(
          call => call.elementId === 'message' &&
          call.property === 'display' &&
          call.value === 'none'
        );
        expect(hideStyleCall).toBeUndefined();
        done();
      }, 3000); // Less than the extended duration
    }, 10000);
  });

  describe('hideMessage', () => {
    it('should hide currently displayed message', () => {
      uiManager.showMessage('Test message');
      uiManager.hideMessage();

      const hideStyleCall = mockDOMManager.updateStyleCalls.find(
        call => call.elementId === 'message' &&
        call.property === 'display' &&
        call.value === 'none'
      );
      expect(hideStyleCall).toBeDefined();
    });

    it('should work when no message is displayed', () => {
      expect(() => {
        uiManager.hideMessage();
      }).not.toThrow();
    });
  });

  describe('error handling', () => {
    it('should handle missing DOM elements gracefully', () => {
      // Mock DOM manager to throw errors
      const errorDOMManager = new MockDOMElementManager();
      errorDOMManager.getElement = jest.fn().mockImplementation(() => {
        throw new Error('Element not found');
      });

      const errorUIManager = new UIManager(errorDOMManager);
      const game = createTestGame({ difficulty: Difficulty.EASY });

      expect(() => {
        errorUIManager.updateGameInfo(game);
      }).toThrow('Element not found');
    });

    it('should handle invalid message types', () => {
      expect(() => {
        uiManager.showMessage('Test', 'INVALID' as any);
      }).not.toThrow();

      const colorStyleCall = mockDOMManager.updateStyleCalls.find(
        call => call.elementId === 'message' && call.property === 'color'
      );
      // Should fall back to default color
      expect(colorStyleCall?.value).toBe('#6c757d');
    });
  });
});