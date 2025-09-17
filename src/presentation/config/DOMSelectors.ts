/**
 * DOM element selectors used throughout the application
 * Centralized to avoid hardcoded strings and improve maintainability
 */
export const DOM_SELECTORS = {
  // Canvas
  CANVAS: 'gameCanvas',

  // Game statistics
  TIMER: 'timer',
  COMPLETION: 'completion',
  HINTS: 'hints',

  // User interface
  SELECTION_INFO: 'selectionInfo',

  // Control buttons
  NEW_GAME_BTN: 'newGame',
  RESET_GAME_BTN: 'resetGame',
  HINT_BTN: 'hintButton',
  CLEAR_CELL_BTN: 'clearCell',

  // Number input
  NUMBER_BTNS: '.number-btn'
} as const;

/**
 * Type for DOM selector keys
 */
export type DOMSelectorKey = keyof typeof DOM_SELECTORS;