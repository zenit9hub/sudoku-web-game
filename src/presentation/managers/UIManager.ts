import { SudokuGame } from '@/domain/models/SudokuGame';
import { Position } from '@/domain/models/Position';
import { DOMElementManager } from './DOMElementManager';
import { DOM_SELECTORS } from '../config/DOMSelectors';
import { APP_CONFIG, UI_COLORS, MESSAGES } from '../config/AppConfig';

/**
 * Interface for UI update operations
 */
interface UIUpdate {
  elementId: string;
  content: string;
  style?: Partial<CSSStyleDeclaration>;
}

/**
 * Manages all UI updates and display logic
 * Centralizes DOM manipulation for game state visualization
 */
export class UIManager {
  constructor(private domManager: DOMElementManager) {}

  /**
   * Update game statistics display
   */
  updateGameInfo(game: SudokuGame, currentElapsedTime?: string): void {
    const stats = game.state.statistics;
    const filledCells = this.getFilledCellsCount(game);

    const updates: UIUpdate[] = [
      {
        elementId: DOM_SELECTORS.COMPLETION,
        content: `${filledCells}/${APP_CONFIG.GAME.TOTAL_CELLS}`
      },
      {
        elementId: DOM_SELECTORS.HINTS,
        content: stats.hints.toString()
      }
    ];

    // Update timer if provided
    if (currentElapsedTime) {
      updates.push({
        elementId: DOM_SELECTORS.TIMER,
        content: currentElapsedTime
      });
    }

    this.batchUpdate(updates);
  }

  /**
   * Update selection information display
   */
  updateSelectionInfo(game: SudokuGame): void {
    const selectionInfo = game.state.selectedCell;
    let message: string;
    let color: string;

    if (!selectionInfo) {
      message = MESSAGES.SELECT_CELL;
      color = UI_COLORS.INFO;
    } else {
      const { row, col } = selectionInfo;
      const cell = game.grid.getCell(new Position(row, col));

      if (cell.isGiven) {
        message = `${MESSAGES.CELL_SELECTED(row, col)} - ${MESSAGES.CELL_FIXED}`;
        color = UI_COLORS.MUTED;
      } else if (!cell.isEmpty()) {
        message = MESSAGES.CELL_VALUE(row, col, cell.value.toString());
        color = UI_COLORS.PRIMARY;
      } else {
        message = `${MESSAGES.CELL_SELECTED(row, col)} - ${MESSAGES.INPUT_NUMBER}`;
        color = UI_COLORS.SUCCESS;
      }
    }

    this.batchUpdate([{
      elementId: DOM_SELECTORS.SELECTION_INFO,
      content: message,
      style: { color }
    }]);
  }

  /**
   * Show a temporary message with optional auto-clear
   */
  showMessage(
    message: string,
    type: keyof typeof UI_COLORS = 'INFO',
    duration: number = 0
  ): void {
    const color = UI_COLORS[type];

    this.batchUpdate([{
      elementId: DOM_SELECTORS.SELECTION_INFO,
      content: message,
      style: { color }
    }]);

    if (duration > 0) {
      setTimeout(() => {
        // This would need access to current game state to restore selection info
        // For now, just reset to default message
        this.batchUpdate([{
          elementId: DOM_SELECTORS.SELECTION_INFO,
          content: MESSAGES.SELECT_CELL,
          style: { color: UI_COLORS.INFO }
        }]);
      }, duration);
    }
  }

  /**
   * Show game completion dialog
   */
  showGameComplete(game: SudokuGame, finalTime: string): void {
    const stats = game.state.statistics;
    const message = `${MESSAGES.GAME_COMPLETE}\n\n${MESSAGES.GAME_STATS(finalTime, stats.moves, stats.hints)}`;

    setTimeout(() => {
      alert(message);
    }, APP_CONFIG.UI.GAME_COMPLETE_DELAY);
  }

  /**
   * Perform multiple UI updates in a batch
   */
  private batchUpdate(updates: UIUpdate[]): void {
    updates.forEach(update => {
      try {
        this.domManager.updateTextContent(update.elementId, update.content);

        if (update.style) {
          this.domManager.updateStyles(update.elementId, update.style);
        }
      } catch (error) {
        console.warn(`Failed to update element ${update.elementId}:`, error);
      }
    });
  }

  /**
   * Count filled cells in the current game
   */
  private getFilledCellsCount(game: SudokuGame): number {
    let count = 0;
    for (let row = 0; row < APP_CONFIG.GAME.GRID_SIZE; row++) {
      for (let col = 0; col < APP_CONFIG.GAME.GRID_SIZE; col++) {
        const position = new Position(row, col);
        const cell = game.grid.getCell(position);
        if (!cell.isEmpty()) {
          count++;
        }
      }
    }
    return count;
  }

  /**
   * Update timer display
   */
  updateTimer(formattedTime: string): void {
    this.domManager.updateTextContent(DOM_SELECTORS.TIMER, formattedTime);
  }

  /**
   * Reset all UI to initial state
   */
  resetUI(): void {
    this.batchUpdate([
      {
        elementId: DOM_SELECTORS.TIMER,
        content: '00:00'
      },
      {
        elementId: DOM_SELECTORS.COMPLETION,
        content: `0/${APP_CONFIG.GAME.TOTAL_CELLS}`
      },
      {
        elementId: DOM_SELECTORS.HINTS,
        content: '0'
      },
      {
        elementId: DOM_SELECTORS.SELECTION_INFO,
        content: MESSAGES.SELECT_CELL,
        style: { color: UI_COLORS.INFO }
      }
    ]);
  }
}