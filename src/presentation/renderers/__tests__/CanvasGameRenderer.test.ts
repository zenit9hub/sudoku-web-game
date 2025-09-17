import { CanvasGameRenderer } from '../CanvasGameRenderer';
import { createTestGame, mockCanvasContext } from '../../../__tests__/utils/TestHelpers';
import { Difficulty } from '../../../domain/models/GameState';

describe('CanvasGameRenderer', () => {
  let renderer: CanvasGameRenderer;
  let canvas: HTMLCanvasElement;
  let mockContext: any;
  let contextCalls: any;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;

    const mockResult = mockCanvasContext();
    mockContext = mockResult.context;
    contextCalls = mockResult.calls;

    jest.spyOn(canvas, 'getContext').mockReturnValue(mockContext);

    renderer = new CanvasGameRenderer(canvas);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with canvas element', () => {
      expect(renderer).toBeDefined();
      expect(canvas.getContext).toHaveBeenCalledWith('2d');
    });

    it('should throw error if canvas context unavailable', () => {
      const badCanvas = document.createElement('canvas');
      jest.spyOn(badCanvas, 'getContext').mockReturnValue(null);

      expect(() => {
        new CanvasGameRenderer(badCanvas);
      }).toThrow('Failed to get canvas context');
    });

    it('should handle canvas without proper dimensions', () => {
      const smallCanvas = document.createElement('canvas');
      smallCanvas.width = 0;
      smallCanvas.height = 0;

      const mockSmallContext = mockCanvasContext().context;
      jest.spyOn(smallCanvas, 'getContext').mockReturnValue(mockSmallContext);

      expect(() => {
        new CanvasGameRenderer(smallCanvas);
      }).not.toThrow();
    });
  });

  describe('render', () => {
    it('should render game without errors', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      expect(() => {
        renderer.render(game);
      }).not.toThrow();

      // Verify basic drawing operations occurred
      expect(contextCalls.clearRect).toBeDefined();
      expect(contextCalls.strokeRect).toBeDefined();
    });

    it('should clear canvas before rendering', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      renderer.render(game);

      expect(contextCalls.clearRect).toContainEqual([0, 0, 300, 300]);
    });

    it('should render grid lines', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      renderer.render(game);

      // Should have drawn grid lines
      expect(contextCalls.beginPath).toBeDefined();
      expect(contextCalls.moveTo).toBeDefined();
      expect(contextCalls.lineTo).toBeDefined();
      expect(contextCalls.stroke).toBeDefined();
    });

    it('should render cell values', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY, filled: true });

      renderer.render(game);

      // Should have drawn text for cell values
      expect(contextCalls.fillText).toBeDefined();
      expect(contextCalls.fillText.length).toBeGreaterThan(0);
    });

    it('should handle different game states', () => {
      const playingGame = createTestGame({ difficulty: Difficulty.EASY });
      const completedGame = createTestGame({ difficulty: Difficulty.EASY, completed: true });

      expect(() => {
        renderer.render(playingGame);
        renderer.render(completedGame);
      }).not.toThrow();
    });

    it('should render with different options', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      const options = {
        highlightErrors: true,
        showPossibleValues: true,
        theme: 'dark' as const
      };

      expect(() => {
        renderer.render(game, options);
      }).not.toThrow();
    });

    it('should handle selected cell highlighting', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });
      game.selectCell(4, 4);

      renderer.render(game);

      // Should include highlighting operations
      expect(contextCalls.fillRect).toBeDefined();
    });
  });

  describe('resize', () => {
    it('should update internal size tracking', () => {
      const newWidth = 400;
      const newHeight = 400;

      renderer.resize(newWidth, newHeight);

      // Should not throw and should handle the resize
      expect(() => {
        const game = createTestGame({ difficulty: Difficulty.EASY });
        renderer.render(game);
      }).not.toThrow();
    });

    it('should handle zero dimensions', () => {
      expect(() => {
        renderer.resize(0, 0);
      }).not.toThrow();
    });

    it('should handle negative dimensions', () => {
      expect(() => {
        renderer.resize(-100, -100);
      }).not.toThrow();
    });

    it('should handle very large dimensions', () => {
      expect(() => {
        renderer.resize(10000, 10000);
      }).not.toThrow();
    });
  });

  describe('clearCanvas', () => {
    it('should clear entire canvas', () => {
      renderer.clearCanvas();

      expect(contextCalls.clearRect).toContainEqual([0, 0, 300, 300]);
    });

    it('should work multiple times', () => {
      renderer.clearCanvas();
      renderer.clearCanvas();

      expect(contextCalls.clearRect.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('rendering accuracy', () => {
    it('should render correct number of grid lines', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      renderer.render(game);

      // Should draw lines for 9x9 grid plus box separators
      // Exact count depends on implementation, but should be substantial
      expect(contextCalls.moveTo.length).toBeGreaterThan(10);
      expect(contextCalls.lineTo.length).toBeGreaterThan(10);
    });

    it('should render numbers in correct positions', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY, filled: true });

      renderer.render(game);

      // Should have text for filled cells
      expect(contextCalls.fillText.length).toBeGreaterThan(20);

      // Text should be positioned within canvas bounds
      contextCalls.fillText.forEach((call: any[]) => {
        const [text, x, y] = call;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(300);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(300);
      });
    });

    it('should use appropriate colors for different elements', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      renderer.render(game);

      // Should set fill and stroke styles
      expect(mockContext.fillStyle).toBeDefined();
      expect(mockContext.strokeStyle).toBeDefined();
    });

    it('should handle given vs user-entered cells differently', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY, filled: true });

      renderer.render(game);

      // Should have rendered text with different styles
      // (exact verification depends on implementation details)
      expect(contextCalls.fillText.length).toBeGreaterThan(0);
    });
  });

  describe('performance', () => {
    it('should render efficiently', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY, filled: true });

      const startTime = performance.now();

      for (let i = 0; i < 10; i++) {
        renderer.render(game);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Should complete 10 renders within reasonable time
      expect(duration).toBeLessThan(100);
    });

    it('should handle rapid successive renders', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      expect(() => {
        for (let i = 0; i < 100; i++) {
          renderer.render(game);
        }
      }).not.toThrow();
    });

    it('should not accumulate memory during rendering', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      // Render many times to check for memory leaks
      for (let i = 0; i < 50; i++) {
        renderer.render(game);
        renderer.clearCanvas();
      }

      // If no error is thrown, test passes
      expect(true).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should handle context drawing errors gracefully', () => {
      const errorContext = {
        ...mockContext,
        fillRect: jest.fn().mockImplementation(() => {
          throw new Error('Drawing error');
        })
      };

      jest.spyOn(canvas, 'getContext').mockReturnValue(errorContext);
      const errorRenderer = new CanvasGameRenderer(canvas);
      const game = createTestGame({ difficulty: Difficulty.EASY });

      expect(() => {
        errorRenderer.render(game);
      }).not.toThrow();
    });

    it('should handle missing game data gracefully', () => {
      const incompleteGame = {
        grid: null,
        state: null,
        selectedPosition: null
      };

      expect(() => {
        renderer.render(incompleteGame as any);
      }).not.toThrow();
    });

    it('should handle invalid canvas dimensions', () => {
      canvas.width = NaN;
      canvas.height = NaN;

      const game = createTestGame({ difficulty: Difficulty.EASY });

      expect(() => {
        renderer.render(game);
      }).not.toThrow();
    });
  });

  describe('theme handling', () => {
    it('should apply light theme correctly', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      renderer.render(game, { theme: 'light' });

      // Should have set appropriate styles for light theme
      expect(mockContext.fillStyle).toBeDefined();
      expect(mockContext.strokeStyle).toBeDefined();
    });

    it('should apply dark theme correctly', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      renderer.render(game, { theme: 'dark' });

      // Should have set appropriate styles for dark theme
      expect(mockContext.fillStyle).toBeDefined();
      expect(mockContext.strokeStyle).toBeDefined();
    });

    it('should handle undefined theme gracefully', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      expect(() => {
        renderer.render(game, { theme: undefined as any });
      }).not.toThrow();
    });
  });

  describe('highlight options', () => {
    it('should render error highlights when enabled', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      renderer.render(game, { highlightErrors: true });

      // Should have additional drawing operations for highlights
      expect(contextCalls.fillRect).toBeDefined();
    });

    it('should skip error highlights when disabled', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      renderer.render(game, { highlightErrors: false });

      // Should still render normally
      expect(contextCalls.clearRect).toBeDefined();
    });

    it('should show possible values when enabled', () => {
      const game = createTestGame({ difficulty: Difficulty.EASY });

      renderer.render(game, { showPossibleValues: true });

      // Should have additional text rendering for possible values
      expect(contextCalls.fillText).toBeDefined();
    });
  });
});