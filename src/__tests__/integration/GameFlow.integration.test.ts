import { GameService } from '../../application/services/GameService';
import { SudokuValidationService } from '../../domain/services/SudokuValidationService';
import { LocalStorageGameRepository } from '../../infrastructure/repositories/LocalStorageGameRepository';
import { CanvasGameRenderer } from '../../presentation/renderers/CanvasGameRenderer';
import { GameController } from '../../presentation/controllers/GameController';
import { DOMElementManager } from '../../presentation/managers/DOMElementManager';
import { EventManager } from '../../presentation/managers/EventManager';
import { UIManager } from '../../presentation/managers/UIManager';
import { TimerManager } from '../../presentation/managers/TimerManager';
import { createTestDOM, nextTick } from '../utils/TestHelpers';
import { Difficulty } from '../../domain/models/GameState';

describe('Game Flow Integration Tests', () => {
  let gameService: GameService;
  let gameController: GameController;
  let domManager: DOMElementManager;
  let eventManager: EventManager;
  let uiManager: UIManager;
  let timerManager: TimerManager;
  let renderer: CanvasGameRenderer;
  let cleanup: () => void;

  beforeEach(() => {
    // Setup test DOM
    const testDOM = createTestDOM();
    cleanup = testDOM.cleanup;

    // Create full HTML structure needed for integration test
    document.body.innerHTML = `
      <div id="app">
        <div id="game-header">
          <h1 id="game-title">Sudoku Game</h1>
          <div id="game-info">
            <span id="difficulty">Easy</span>
            <span id="timer">00:00</span>
          </div>
        </div>
        <div id="game-container">
          <canvas id="gameCanvas" width="300" height="300"></canvas>
          <div id="game-stats">
            <div>Moves: <span id="moves">0</span></div>
            <div>Hints: <span id="hints">0</span></div>
          </div>
        </div>
        <div id="number-pad">
          <button id="num-1" data-number="1">1</button>
          <button id="num-2" data-number="2">2</button>
          <button id="num-3" data-number="3">3</button>
          <button id="num-4" data-number="4">4</button>
          <button id="num-5" data-number="5">5</button>
          <button id="num-6" data-number="6">6</button>
          <button id="num-7" data-number="7">7</button>
          <button id="num-8" data-number="8">8</button>
          <button id="num-9" data-number="9">9</button>
        </div>
        <div id="game-controls">
          <button id="new-game-btn">New Game</button>
          <button id="hint-btn">Hint</button>
          <button id="reset-btn">Reset</button>
        </div>
        <div id="message" style="display: none;"></div>
        <div id="selection-info">Select a cell and enter a number</div>
      </div>
    `;

    // Mock canvas context
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
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
    jest.spyOn(canvas, 'getContext').mockReturnValue(mockContext as any);

    // Initialize services and dependencies
    const repository = new LocalStorageGameRepository();
    const validationService = new SudokuValidationService();
    gameService = new GameService(repository, validationService);
    renderer = new CanvasGameRenderer(canvas);

    // Initialize controllers and managers
    gameController = new GameController(gameService, renderer);
    domManager = new DOMElementManager();
    timerManager = new TimerManager(() => {}); // Empty callback for testing
    uiManager = new UIManager(domManager);
    eventManager = new EventManager(gameController, domManager);

    // Setup event listeners
    eventManager.setupEventListeners();
  });

  afterEach(() => {
    eventManager.removeEventListeners();
    timerManager.destroy();
    domManager.clearCache();
    cleanup();
  });

  describe('Complete Game Workflow', () => {
    it('should complete full game flow from start to finish', async () => {
      // Start new game
      await gameController.newGame(Difficulty.EASY);
      await nextTick();

      let currentGame = gameController.getCurrentGame();
      expect(currentGame).not.toBeNull();
      expect(currentGame!.state.status).toBe('playing');

      // Select a cell
      gameController.selectCell(0, 0);
      currentGame = gameController.getCurrentGame();
      expect(currentGame!.selectedPosition?.row).toBe(0);
      expect(currentGame!.selectedPosition?.col).toBe(0);

      // Set a value if the cell is not given
      const selectedCell = currentGame!.grid.getCell(0, 0);
      if (!selectedCell.isGiven) {
        gameController.setCellValue(5);
        currentGame = gameController.getCurrentGame();
        expect(currentGame!.grid.getCell(0, 0).value.toNumber()).toBe(5);
        expect(currentGame!.state.statistics.moves).toBe(1);
      }

      // Test hint functionality
      const initialHints = currentGame!.state.statistics.hints;
      gameController.getHint();
      currentGame = gameController.getCurrentGame();
      expect(currentGame!.state.statistics.hints).toBe(initialHints + 1);

      // Test reset functionality
      gameController.resetGame();
      currentGame = gameController.getCurrentGame();
      expect(currentGame!.state.statistics.moves).toBe(0);
    });

    it('should handle keyboard navigation and input', async () => {
      await gameController.newGame(Difficulty.EASY);
      await nextTick();

      // Test arrow key navigation
      gameController.selectCell(4, 4); // Start at center
      gameController.moveSelection('up');

      let currentGame = gameController.getCurrentGame();
      expect(currentGame!.selectedPosition?.row).toBe(3);
      expect(currentGame!.selectedPosition?.col).toBe(4);

      gameController.moveSelection('right');
      currentGame = gameController.getCurrentGame();
      expect(currentGame!.selectedPosition?.row).toBe(3);
      expect(currentGame!.selectedPosition?.col).toBe(5);

      // Test keyboard number input
      const selectedCell = currentGame!.grid.getCell(3, 5);
      if (!selectedCell.isGiven) {
        gameController.setCellValue(7);
        currentGame = gameController.getCurrentGame();
        expect(currentGame!.grid.getCell(3, 5).value.toNumber()).toBe(7);
      }

      // Test clear cell
      gameController.clearCell();
      currentGame = gameController.getCurrentGame();
      expect(currentGame!.grid.getCell(3, 5).value.isEmpty()).toBe(true);
    });

    it('should handle edge cases and boundaries', async () => {
      await gameController.newGame(Difficulty.EASY);
      await nextTick();

      // Test boundary navigation
      gameController.selectCell(0, 0); // Top-left corner
      gameController.moveSelection('up'); // Should stay at 0,0
      gameController.moveSelection('left'); // Should stay at 0,0

      let currentGame = gameController.getCurrentGame();
      expect(currentGame!.selectedPosition?.row).toBe(0);
      expect(currentGame!.selectedPosition?.col).toBe(0);

      gameController.selectCell(8, 8); // Bottom-right corner
      gameController.moveSelection('down'); // Should stay at 8,8
      gameController.moveSelection('right'); // Should stay at 8,8

      currentGame = gameController.getCurrentGame();
      expect(currentGame!.selectedPosition?.row).toBe(8);
      expect(currentGame!.selectedPosition?.col).toBe(8);

      // Test invalid cell selection
      expect(() => {
        gameController.selectCell(-1, -1);
      }).toThrow();

      expect(() => {
        gameController.selectCell(9, 9);
      }).toThrow();
    });
  });

  describe('UI Manager Integration', () => {
    it('should update UI elements correctly during gameplay', async () => {
      await gameController.newGame(Difficulty.MEDIUM);
      await nextTick();

      const currentGame = gameController.getCurrentGame()!;

      // Test game info updates
      uiManager.updateGameInfo(currentGame);

      const difficultyElement = document.getElementById('difficulty')!;
      expect(difficultyElement.textContent).toBe('보통');

      const movesElement = document.getElementById('moves')!;
      expect(movesElement.textContent).toBe('0');

      // Simulate a move and update UI
      gameController.selectCell(1, 1);
      const selectedCell = currentGame.grid.getCell(1, 1);
      if (!selectedCell.isGiven) {
        gameController.setCellValue(3);
        const updatedGame = gameController.getCurrentGame()!;
        uiManager.updateGameInfo(updatedGame);
        expect(movesElement.textContent).toBe('1');
      }
    });

    it('should handle selection info updates', async () => {
      await gameController.newGame(Difficulty.EASY);
      await nextTick();

      // Test selection info with no selection
      uiManager.updateSelectionInfo(gameController.getCurrentGame()!);
      const selectionInfo = document.getElementById('selection-info')!;
      expect(selectionInfo.textContent).toBe('칸을 선택하고 숫자를 입력하세요');

      // Test selection info with cell selected
      gameController.selectCell(2, 3);
      uiManager.updateSelectionInfo(gameController.getCurrentGame()!);
      expect(selectionInfo.textContent).toContain('행 3, 열 4');
    });

    it('should display messages correctly', () => {
      // Test info message
      uiManager.showMessage('Test info message', 'INFO');
      const messageElement = document.getElementById('message')!;
      expect(messageElement.textContent).toBe('Test info message');
      expect(messageElement.style.display).toBe('block');

      // Test error message
      uiManager.showMessage('Test error message', 'ERROR');
      expect(messageElement.style.color).toBe('#dc3545');

      // Test success message
      uiManager.showMessage('Test success message', 'SUCCESS');
      expect(messageElement.style.color).toBe('#28a745');
    });
  });

  describe('Timer Manager Integration', () => {
    it('should integrate timer with game flow', async () => {
      jest.useFakeTimers();

      const timeUpdateCallback = jest.fn();
      const testTimerManager = new TimerManager(timeUpdateCallback);

      await gameController.newGame(Difficulty.EASY);
      await nextTick();

      const currentGame = gameController.getCurrentGame()!;

      // Start timer
      testTimerManager.start(currentGame);
      expect(timeUpdateCallback).toHaveBeenCalledWith('00:00');

      // Advance time
      timeUpdateCallback.mockClear();
      jest.advanceTimersByTime(65000); // 1 minute 5 seconds

      expect(timeUpdateCallback).toHaveBeenCalledWith('01:05');

      // Stop timer
      testTimerManager.stop();
      expect(testTimerManager.getElapsedSeconds()).toBe(65);

      testTimerManager.destroy();
      jest.useRealTimers();
    });
  });

  describe('Event Manager Integration', () => {
    it('should handle canvas click events properly', async () => {
      await gameController.newGame(Difficulty.EASY);
      await nextTick();

      const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

      // Mock getBoundingClientRect for predictable calculations
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

      // Simulate click on cell (4, 4) - center cell
      const clickEvent = new MouseEvent('click', {
        clientX: 150, // Middle of 300px canvas
        clientY: 150
      });

      canvas.dispatchEvent(clickEvent);

      const currentGame = gameController.getCurrentGame()!;
      expect(currentGame.selectedPosition?.row).toBe(4);
      expect(currentGame.selectedPosition?.col).toBe(4);
    });

    it('should handle keyboard events properly', async () => {
      await gameController.newGame(Difficulty.EASY);
      await nextTick();

      // Select a cell first
      gameController.selectCell(5, 5);

      const selectedCell = gameController.getCurrentGame()!.grid.getCell(5, 5);
      if (!selectedCell.isGiven) {
        // Simulate number key press
        const keyEvent = new KeyboardEvent('keydown', { key: '8' });
        document.dispatchEvent(keyEvent);

        const currentGame = gameController.getCurrentGame()!;
        expect(currentGame.grid.getCell(5, 5).value.toNumber()).toBe(8);
      }

      // Test clear with delete key
      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      document.dispatchEvent(deleteEvent);

      const finalGame = gameController.getCurrentGame()!;
      expect(finalGame.grid.getCell(5, 5).value.isEmpty()).toBe(true);
    });

    it('should handle button clicks properly', async () => {
      await gameController.newGame(Difficulty.EASY);
      await nextTick();

      const initialGame = gameController.getCurrentGame()!;
      const initialHints = initialGame.state.statistics.hints;

      // Test hint button
      const hintBtn = document.getElementById('hint-btn')!;
      hintBtn.click();

      const afterHintGame = gameController.getCurrentGame()!;
      expect(afterHintGame.state.statistics.hints).toBe(initialHints + 1);

      // Test reset button
      const resetBtn = document.getElementById('reset-btn')!;
      resetBtn.click();

      const afterResetGame = gameController.getCurrentGame()!;
      expect(afterResetGame.state.statistics.moves).toBe(0);
      expect(afterResetGame.state.statistics.hints).toBe(0);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle service errors gracefully', async () => {
      // Mock game service to throw error
      const errorGameService = {
        ...gameService,
        newGame: jest.fn().mockRejectedValue(new Error('Service error'))
      };

      const errorController = new GameController(errorGameService as any, renderer);

      await expect(errorController.newGame(Difficulty.EASY)).rejects.toThrow('Service error');
    });

    it('should handle renderer errors gracefully', async () => {
      // Mock renderer to throw error
      const errorRenderer = {
        ...renderer,
        render: jest.fn().mockImplementation(() => {
          throw new Error('Renderer error');
        })
      };

      const errorController = new GameController(gameService, errorRenderer as any);
      await errorController.newGame(Difficulty.EASY);

      // Should not throw when rendering fails
      expect(() => {
        errorController.selectCell(0, 0);
      }).not.toThrow();
    });
  });

  describe('Performance Integration', () => {
    it('should handle rapid user interactions', async () => {
      await gameController.newGame(Difficulty.EASY);
      await nextTick();

      // Simulate rapid cell selection
      for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
          gameController.selectCell(i, j);
        }
      }

      // Should still have valid game state
      const currentGame = gameController.getCurrentGame()!;
      expect(currentGame.selectedPosition?.row).toBe(8);
      expect(currentGame.selectedPosition?.col).toBe(8);
    });

    it('should handle rapid input changes', async () => {
      await gameController.newGame(Difficulty.EASY);
      await nextTick();

      gameController.selectCell(4, 4);
      const selectedCell = gameController.getCurrentGame()!.grid.getCell(4, 4);

      if (!selectedCell.isGiven) {
        // Rapidly change cell values
        for (let i = 1; i <= 9; i++) {
          gameController.setCellValue(i);
        }

        const finalGame = gameController.getCurrentGame()!;
        expect(finalGame.grid.getCell(4, 4).value.toNumber()).toBe(9);
        expect(finalGame.state.statistics.moves).toBe(9);
      }
    });
  });
});