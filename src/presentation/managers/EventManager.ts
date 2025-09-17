import { GameController } from '@/presentation/controllers/GameController';
import { DOMElementManager } from './DOMElementManager';
import { DOM_SELECTORS } from '../config/DOMSelectors';

/**
 * Manages all event listeners for the Sudoku application
 * Centralizes event handling logic for better maintainability
 */
export class EventManager {
  private canvasEventHandler: CanvasEventHandler;
  private keyboardEventHandler: KeyboardEventHandler;
  private buttonEventHandler: ButtonEventHandler;

  constructor(
    gameController: GameController,
    private domManager: DOMElementManager
  ) {
    const canvas = this.domManager.getElement<HTMLCanvasElement>(DOM_SELECTORS.CANVAS);

    this.canvasEventHandler = new CanvasEventHandler(canvas, gameController);
    this.keyboardEventHandler = new KeyboardEventHandler(gameController);
    this.buttonEventHandler = new ButtonEventHandler(gameController, this.domManager);
  }

  /**
   * Initialize all event listeners
   */
  setupEventListeners(): void {
    this.canvasEventHandler.attachEvents();
    this.keyboardEventHandler.attachEvents();
    this.buttonEventHandler.attachEvents();
  }

  /**
   * Remove all event listeners
   */
  removeEventListeners(): void {
    this.canvasEventHandler.detachEvents();
    this.keyboardEventHandler.detachEvents();
    this.buttonEventHandler.detachEvents();
  }
}

/**
 * Handles canvas click events and coordinate calculation
 */
class CanvasEventHandler {
  constructor(
    private canvas: HTMLCanvasElement,
    private gameController: GameController
  ) {}

  private calculateCanvasCoordinates(event: MouseEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * this.canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * this.canvas.height
    };
  }

  private handleCanvasClick = (event: MouseEvent): void => {
    const { x, y } = this.calculateCanvasCoordinates(event);

    console.log('Click event:', {
      clientX: event.clientX,
      clientY: event.clientY,
      rect: this.canvas.getBoundingClientRect(),
      canvas: { width: this.canvas.width, height: this.canvas.height },
      calculated: { x, y }
    });

    this.gameController.handleCellClick(x, y);
  };

  attachEvents(): void {
    this.canvas.addEventListener('click', this.handleCanvasClick);
  }

  detachEvents(): void {
    this.canvas.removeEventListener('click', this.handleCanvasClick);
  }
}

/**
 * Handles keyboard input events
 */
class KeyboardEventHandler {
  constructor(private gameController: GameController) {}

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (this.isNumberKey(event.key)) {
      this.gameController.handleNumberInput(parseInt(event.key));
    } else if (this.isClearKey(event.key)) {
      this.gameController.handleClearCell();
    }
  };

  private isNumberKey(key: string): boolean {
    return key >= '1' && key <= '9';
  }

  private isClearKey(key: string): boolean {
    return key === 'Delete' || key === 'Backspace';
  }

  attachEvents(): void {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  detachEvents(): void {
    document.removeEventListener('keydown', this.handleKeyDown);
  }
}

/**
 * Handles button click events
 */
class ButtonEventHandler {
  private eventHandlers: Map<string, () => void> = new Map();

  constructor(
    private gameController: GameController,
    private domManager: DOMElementManager
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.eventHandlers.set(DOM_SELECTORS.NEW_GAME_BTN, () => this.handleNewGame());
    this.eventHandlers.set(DOM_SELECTORS.RESET_GAME_BTN, () => this.gameController.handleReset());
    this.eventHandlers.set(DOM_SELECTORS.HINT_BTN, () => this.gameController.handleHint());
    this.eventHandlers.set(DOM_SELECTORS.CLEAR_CELL_BTN, () => this.gameController.handleClearCell());
  }

  private async handleNewGame(): Promise<void> {
    // Import Difficulty here to avoid circular dependencies
    const { Difficulty } = await import('@/domain/models/GameState.js');
    await this.gameController.newGame(Difficulty.EASY);
  }

  private handleNumberButtonClick = (event: Event): void => {
    const target = event.target as HTMLButtonElement;
    const number = parseInt(target.dataset.number || '0');
    if (number >= 1 && number <= 9) {
      this.gameController.handleNumberInput(number);
    }
  };

  attachEvents(): void {
    // Attach control button events
    this.eventHandlers.forEach((handler, elementId) => {
      const element = this.domManager.getElement(elementId);
      element.addEventListener('click', handler);
    });

    // Attach number button events
    const numberButtons = this.domManager.getElements(DOM_SELECTORS.NUMBER_BTNS);
    numberButtons.forEach(button => {
      button.addEventListener('click', this.handleNumberButtonClick);
    });
  }

  detachEvents(): void {
    // Detach control button events
    this.eventHandlers.forEach((handler, elementId) => {
      if (this.domManager.elementExists(elementId)) {
        const element = this.domManager.getElement(elementId);
        element.removeEventListener('click', handler);
      }
    });

    // Detach number button events
    const numberButtons = this.domManager.getElements(DOM_SELECTORS.NUMBER_BTNS);
    numberButtons.forEach(button => {
      button.removeEventListener('click', this.handleNumberButtonClick);
    });
  }
}