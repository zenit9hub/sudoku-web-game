import { EventManager } from '../EventManager';
import { MockDOMElementManager } from '../../../__tests__/utils/MockClasses';
import { createMockMouseEvent, createMockKeyboardEvent } from '../../../__tests__/utils/TestHelpers';
import { GameController } from '../../controllers/GameController';
import { GameService } from '../../../application/services/GameService';
import { LocalStorageGameRepository } from '../../../infrastructure/repositories/LocalStorageGameRepository';
import { SudokuValidationService } from '../../../domain/services/SudokuValidationService';
import { CanvasGameRenderer } from '../../renderers/CanvasGameRenderer';

// Mock canvas context
const mockContext = {
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  stroke: jest.fn(),
  clearRect: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  measureText: jest.fn(() => ({ width: 10 })),
  canvas: { width: 300, height: 300 },
  fillStyle: '#000000',
  strokeStyle: '#000000',
  lineWidth: 1,
  font: '16px Arial',
  textAlign: 'center' as CanvasTextAlign,
  textBaseline: 'middle' as CanvasTextBaseline
};

describe('EventManager', () => {
  let eventManager: EventManager;
  let mockDOMManager: MockDOMElementManager;
  let gameController: GameController;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    // Create mock canvas
    canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    canvas.id = 'gameCanvas';

    // Mock getContext to return our mock
    jest.spyOn(canvas, 'getContext').mockReturnValue(mockContext as any);

    document.body.appendChild(canvas);

    // Create DOM manager and set up canvas element
    mockDOMManager = new MockDOMElementManager();
    mockDOMManager.setMockElement('gameCanvas', canvas);

    // Create game dependencies
    const repository = new LocalStorageGameRepository();
    const validationService = new SudokuValidationService();
    const gameService = new GameService(repository, validationService);
    const renderer = new CanvasGameRenderer(canvas);

    gameController = new GameController(gameService, renderer);

    // Create event manager
    eventManager = new EventManager(gameController, mockDOMManager);
  });

  afterEach(() => {
    eventManager.removeEventListeners();
    document.body.removeChild(canvas);
    mockDOMManager.reset();
  });

  describe('setupEventListeners', () => {
    it('should setup all event listeners', () => {
      const canvasClickSpy = jest.spyOn(canvas, 'addEventListener');
      const documentKeydownSpy = jest.spyOn(document, 'addEventListener');

      eventManager.setupEventListeners();

      expect(canvasClickSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(documentKeydownSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should setup button event listeners for existing buttons', () => {
      // Create test buttons
      const newGameBtn = document.createElement('button');
      newGameBtn.id = 'new-game-btn';
      const hintBtn = document.createElement('button');
      hintBtn.id = 'hint-btn';
      const resetBtn = document.createElement('button');
      resetBtn.id = 'reset-btn';

      document.body.appendChild(newGameBtn);
      document.body.appendChild(hintBtn);
      document.body.appendChild(resetBtn);

      mockDOMManager.setMockElement('new-game-btn', newGameBtn);
      mockDOMManager.setMockElement('hint-btn', hintBtn);
      mockDOMManager.setMockElement('reset-btn', resetBtn);

      const newGameSpy = jest.spyOn(newGameBtn, 'addEventListener');
      const hintSpy = jest.spyOn(hintBtn, 'addEventListener');
      const resetSpy = jest.spyOn(resetBtn, 'addEventListener');

      eventManager.setupEventListeners();

      expect(newGameSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(hintSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(resetSpy).toHaveBeenCalledWith('click', expect.any(Function));

      // Cleanup
      document.body.removeChild(newGameBtn);
      document.body.removeChild(hintBtn);
      document.body.removeChild(resetBtn);
    });

    it('should handle missing buttons gracefully', () => {
      // Don't create any buttons
      expect(() => {
        eventManager.setupEventListeners();
      }).not.toThrow();
    });
  });

  describe('removeEventListeners', () => {
    it('should remove all event listeners', () => {
      const canvasRemoveSpy = jest.spyOn(canvas, 'removeEventListener');
      const documentRemoveSpy = jest.spyOn(document, 'removeEventListener');

      eventManager.setupEventListeners();
      eventManager.removeEventListeners();

      expect(canvasRemoveSpy).toHaveBeenCalledWith('click', expect.any(Function));
      expect(documentRemoveSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });

    it('should work when called multiple times', () => {
      eventManager.setupEventListeners();

      expect(() => {
        eventManager.removeEventListeners();
        eventManager.removeEventListeners();
      }).not.toThrow();
    });

    it('should work when called before setup', () => {
      expect(() => {
        eventManager.removeEventListeners();
      }).not.toThrow();
    });
  });

  describe('canvas click handling', () => {
    beforeEach(async () => {
      eventManager.setupEventListeners();
      // Initialize game for testing
      const { Difficulty } = await import('../../../domain/models/GameState.js');
      await gameController.newGame(Difficulty.EASY);
    });

    it('should handle canvas click events', () => {
      const selectCellSpy = jest.spyOn(gameController, 'selectCell');

      // Mock getBoundingClientRect to return predictable values
      jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 300,
        height: 300,
        right: 300,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({})
      });

      const clickEvent = createMockMouseEvent({
        clientX: 150, // Middle of canvas
        clientY: 150  // Middle of canvas
      });

      canvas.dispatchEvent(clickEvent);

      expect(selectCellSpy).toHaveBeenCalled();
    });

    it('should calculate correct cell coordinates', () => {
      const selectCellSpy = jest.spyOn(gameController, 'selectCell');

      // Mock getBoundingClientRect for specific cell calculation
      jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 10,
        top: 10,
        width: 270, // 30 pixels per cell (270/9)
        height: 270,
        right: 280,
        bottom: 280,
        x: 10,
        y: 10,
        toJSON: () => ({})
      });

      // Click on cell (2, 3) - third row, fourth column
      const clickEvent = createMockMouseEvent({
        clientX: 10 + (3 * 30) + 15, // left + (col * cellSize) + offset
        clientY: 10 + (2 * 30) + 15  // top + (row * cellSize) + offset
      });

      canvas.dispatchEvent(clickEvent);

      expect(selectCellSpy).toHaveBeenCalledWith(2, 3);
    });

    it('should ignore clicks outside valid cell range', () => {
      const selectCellSpy = jest.spyOn(gameController, 'selectCell');

      jest.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        width: 300,
        height: 300,
        right: 300,
        bottom: 300,
        x: 0,
        y: 0,
        toJSON: () => ({})
      });

      // Click outside canvas bounds
      const clickEvent = createMockMouseEvent({
        clientX: -10,
        clientY: -10
      });

      canvas.dispatchEvent(clickEvent);

      expect(selectCellSpy).not.toHaveBeenCalled();
    });
  });

  describe('keyboard input handling', () => {
    beforeEach(async () => {
      eventManager.setupEventListeners();
      const { Difficulty } = await import('../../../domain/models/GameState.js');
      await gameController.newGame(Difficulty.EASY);
    });

    it('should handle number key input', () => {
      const setCellValueSpy = jest.spyOn(gameController, 'setCellValue');

      const keyEvent = createMockKeyboardEvent('5');
      document.dispatchEvent(keyEvent);

      expect(setCellValueSpy).toHaveBeenCalledWith(5);
    });

    it('should handle all number keys 1-9', () => {
      const setCellValueSpy = jest.spyOn(gameController, 'setCellValue');

      for (let i = 1; i <= 9; i++) {
        setCellValueSpy.mockClear();
        const keyEvent = createMockKeyboardEvent(i.toString());
        document.dispatchEvent(keyEvent);

        expect(setCellValueSpy).toHaveBeenCalledWith(i);
      }
    });

    it('should handle delete/backspace keys', () => {
      const clearCellSpy = jest.spyOn(gameController, 'clearCell');

      const deleteEvent = createMockKeyboardEvent('Delete');
      document.dispatchEvent(deleteEvent);

      expect(clearCellSpy).toHaveBeenCalled();

      clearCellSpy.mockClear();

      const backspaceEvent = createMockKeyboardEvent('Backspace');
      document.dispatchEvent(backspaceEvent);

      expect(clearCellSpy).toHaveBeenCalled();
    });

    it('should handle space key for clear', () => {
      const clearCellSpy = jest.spyOn(gameController, 'clearCell');

      const spaceEvent = createMockKeyboardEvent(' ');
      document.dispatchEvent(spaceEvent);

      expect(clearCellSpy).toHaveBeenCalled();
    });

    it('should ignore non-game keys', () => {
      const setCellValueSpy = jest.spyOn(gameController, 'setCellValue');
      const clearCellSpy = jest.spyOn(gameController, 'clearCell');

      const invalidKeys = ['a', 'Enter', 'Shift', '0', '-', '='];

      invalidKeys.forEach(key => {
        const keyEvent = createMockKeyboardEvent(key);
        document.dispatchEvent(keyEvent);
      });

      expect(setCellValueSpy).not.toHaveBeenCalled();
      expect(clearCellSpy).not.toHaveBeenCalled();
    });

    it('should handle arrow keys for navigation', () => {
      const moveSelectionSpy = jest.spyOn(gameController, 'moveSelection');

      const arrowKeys = [
        { key: 'ArrowUp', direction: 'up' },
        { key: 'ArrowDown', direction: 'down' },
        { key: 'ArrowLeft', direction: 'left' },
        { key: 'ArrowRight', direction: 'right' }
      ];

      arrowKeys.forEach(({ key, direction }) => {
        moveSelectionSpy.mockClear();
        const keyEvent = createMockKeyboardEvent(key);
        document.dispatchEvent(keyEvent);

        expect(moveSelectionSpy).toHaveBeenCalledWith(direction);
      });
    });
  });

  describe('button event handling', () => {
    beforeEach(async () => {
      // Create and setup test buttons
      const newGameBtn = document.createElement('button');
      newGameBtn.id = 'new-game-btn';
      const hintBtn = document.createElement('button');
      hintBtn.id = 'hint-btn';
      const resetBtn = document.createElement('button');
      resetBtn.id = 'reset-btn';

      document.body.appendChild(newGameBtn);
      document.body.appendChild(hintBtn);
      document.body.appendChild(resetBtn);

      mockDOMManager.setMockElement('new-game-btn', newGameBtn);
      mockDOMManager.setMockElement('hint-btn', hintBtn);
      mockDOMManager.setMockElement('reset-btn', resetBtn);

      eventManager.setupEventListeners();

      const { Difficulty } = await import('../../../domain/models/GameState.js');
      await gameController.newGame(Difficulty.EASY);
    });

    afterEach(() => {
      // Clean up test buttons
      const elements = ['new-game-btn', 'hint-btn', 'reset-btn'];
      elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
          document.body.removeChild(element);
        }
      });
    });

    it('should handle new game button click', async () => {
      const newGameSpy = jest.spyOn(gameController, 'newGame');
      const newGameBtn = document.getElementById('new-game-btn')!;

      newGameBtn.click();

      expect(newGameSpy).toHaveBeenCalled();
    });

    it('should handle hint button click', () => {
      const getHintSpy = jest.spyOn(gameController, 'getHint');
      const hintBtn = document.getElementById('hint-btn')!;

      hintBtn.click();

      expect(getHintSpy).toHaveBeenCalled();
    });

    it('should handle reset button click', () => {
      const resetGameSpy = jest.spyOn(gameController, 'resetGame');
      const resetBtn = document.getElementById('reset-btn')!;

      resetBtn.click();

      expect(resetGameSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle controller method errors gracefully', () => {
      const setCellValueSpy = jest.spyOn(gameController, 'setCellValue')
        .mockImplementation(() => {
          throw new Error('Test error');
        });

      eventManager.setupEventListeners();

      expect(() => {
        const keyEvent = createMockKeyboardEvent('5');
        document.dispatchEvent(keyEvent);
      }).not.toThrow();

      setCellValueSpy.mockRestore();
    });

    it('should handle missing canvas gracefully', () => {
      // Remove canvas from DOM
      document.body.removeChild(canvas);

      expect(() => {
        eventManager.setupEventListeners();
      }).not.toThrow();
    });

    it('should handle DOM manager errors gracefully', () => {
      const errorDOMManager = new MockDOMElementManager();
      errorDOMManager.getElement = jest.fn().mockImplementation(() => {
        throw new Error('Element not found');
      });

      const errorEventManager = new EventManager(gameController, errorDOMManager);

      expect(() => {
        errorEventManager.setupEventListeners();
      }).not.toThrow();
    });
  });
});