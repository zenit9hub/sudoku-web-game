/**
 * Message and text constants
 * All user-facing messages and system messages
 */

// User interface messages
export const UI_MESSAGES = {
  // Game actions
  GAME: {
    NEW_GAME: 'New Game',
    RESET: 'Reset',
    HINT: 'Hint',
    CLEAR: 'Clear',
    UNDO: 'Undo',
    REDO: 'Redo',
    PAUSE: 'Pause',
    RESUME: 'Resume'
  },

  // Game states
  STATES: {
    SELECT_CELL: 'Select a cell and enter a number',
    INPUT_NUMBER: 'Enter a number',
    CELL_FIXED: 'This is a fixed number',
    INVALID_MOVE: 'Invalid move',
    GAME_COMPLETE: 'Congratulations! You completed the puzzle!',
    GAME_PAUSED: 'Game paused',
    GENERATING_PUZZLE: 'Generating new puzzle...'
  },

  // Statistics labels
  STATS: {
    TIME: 'Time',
    PROGRESS: 'Progress',
    HINTS: 'Hints',
    MOVES: 'Moves',
    DIFFICULTY: 'Difficulty',
    SCORE: 'Score'
  },

  // Validation messages
  VALIDATION: {
    DUPLICATE_ROW: 'Number already exists in this row',
    DUPLICATE_COLUMN: 'Number already exists in this column',
    DUPLICATE_BLOCK: 'Number already exists in this block',
    INVALID_VALUE: 'Invalid value',
    CELL_READONLY: 'Cannot modify given numbers'
  }
} as const;

// Error messages
export const ERROR_MESSAGES = {
  // System errors
  SYSTEM: {
    CANVAS_NOT_FOUND: 'Game canvas not found',
    ELEMENT_NOT_FOUND: 'Required element not found',
    INITIALIZATION_FAILED: 'Failed to initialize game',
    SAVE_FAILED: 'Failed to save game state',
    LOAD_FAILED: 'Failed to load game state'
  },

  // Game logic errors
  GAME: {
    INVALID_POSITION: 'Invalid cell position',
    INVALID_VALUE: 'Invalid cell value',
    PUZZLE_GENERATION_FAILED: 'Failed to generate puzzle',
    PUZZLE_VALIDATION_FAILED: 'Puzzle validation failed',
    NO_SOLUTION: 'No solution exists for this puzzle'
  },

  // Network errors
  NETWORK: {
    CONNECTION_FAILED: 'Connection failed',
    TIMEOUT: 'Request timed out',
    SERVER_ERROR: 'Server error occurred'
  }
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  GAME: {
    PUZZLE_GENERATED: 'New puzzle generated successfully',
    GAME_SAVED: 'Game saved successfully',
    GAME_LOADED: 'Game loaded successfully',
    SETTINGS_UPDATED: 'Settings updated successfully'
  },

  USER: {
    CORRECT_MOVE: 'Correct!',
    HINT_USED: 'Hint applied',
    PUZZLE_COMPLETED: 'Puzzle completed!'
  }
} as const;

// Warning messages
export const WARNING_MESSAGES = {
  GAME: {
    OVERWRITE_PROGRESS: 'This will overwrite your current progress. Continue?',
    RESET_GAME: 'This will reset the current game. Continue?',
    NO_HINTS_LEFT: 'No more hints available',
    UNSAVED_CHANGES: 'You have unsaved changes'
  },

  SYSTEM: {
    BROWSER_COMPATIBILITY: 'Your browser may not support all features',
    PERFORMANCE_WARNING: 'Performance may be affected',
    STORAGE_FULL: 'Local storage is full'
  }
} as const;

// Dynamic message templates
export const MESSAGE_TEMPLATES = {
  // Cell selection
  CELL_SELECTED: (row: number, col: number) =>
    `Selected: (${row + 1}, ${col + 1})`,

  CELL_VALUE: (row: number, col: number, value: string) =>
    `Selected: (${row + 1}, ${col + 1}) - Current value: ${value}`,

  // Game completion
  COMPLETION_STATS: (time: string, moves: number, hints: number) =>
    `⏱️ Time: ${time}\n🎯 Moves: ${moves}\n💡 Hints: ${hints}`,

  // Progress indicators
  PROGRESS: (filled: number, total: number) =>
    `${filled}/${total}`,

  PERCENTAGE: (percentage: number) =>
    `${Math.round(percentage)}%`,

  // Time formatting
  TIME_FORMAT: (minutes: number, seconds: number) =>
    `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,

  // Difficulty descriptions
  DIFFICULTY_DESC: (difficulty: string, clues: number) =>
    `${difficulty} (${clues} clues)`,

  // Hint messages
  HINTS_REMAINING: (count: number) =>
    count === 1 ? '1 hint remaining' : `${count} hints remaining`,

  // Error context
  ERROR_CONTEXT: (action: string, error: string) =>
    `Failed to ${action}: ${error}`
} as const;

// Accessibility messages
export const A11Y_MESSAGES = {
  ARIA_LABELS: {
    GAME_BOARD: 'Sudoku game board',
    NUMBER_BUTTON: (num: number) => `Enter number ${num}`,
    CLEAR_BUTTON: 'Clear selected cell',
    HINT_BUTTON: 'Get hint for selected cell',
    NEW_GAME_BUTTON: 'Start new game',
    RESET_BUTTON: 'Reset current game',
    CELL: (row: number, col: number, value?: number) =>
      `Cell ${row + 1}, ${col + 1}${value ? `, value ${value}` : ', empty'}`,
    TIMER: 'Game timer',
    PROGRESS: 'Game progress',
    HINTS_COUNT: 'Hints used'
  },

  LIVE_REGIONS: {
    GAME_STATUS: 'Game status updates',
    CELL_STATUS: 'Cell selection updates',
    ERROR_ANNOUNCEMENTS: 'Error messages',
    SUCCESS_ANNOUNCEMENTS: 'Success messages'
  }
} as const;