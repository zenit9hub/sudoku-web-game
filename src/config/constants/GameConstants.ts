/**
 * Game-specific constants
 * Core Sudoku game logic constants
 */
export const GAME_CONSTANTS = {
  // Grid dimensions
  GRID_SIZE: 9,
  BLOCK_SIZE: 3,
  TOTAL_CELLS: 81,

  // Cell values
  MIN_VALUE: 1,
  MAX_VALUE: 9,
  EMPTY_VALUE: 0,

  // Difficulty levels (number of given cells)
  DIFFICULTY: {
    EASY: 45,
    MEDIUM: 35,
    HARD: 25,
    EXPERT: 17
  } as const,

  // Generation constants
  GENERATION: {
    MAX_ATTEMPTS: 1000,
    BACKTRACK_LIMIT: 100,
    RANDOM_SEED_RANGE: 1000000
  } as const,

  // Validation rules
  VALIDATION: {
    CHECK_ROWS: true,
    CHECK_COLUMNS: true,
    CHECK_BLOCKS: true,
    HIGHLIGHT_ERRORS: true
  } as const
} as const;

/**
 * Cell position boundaries
 */
export const POSITION_BOUNDS = {
  MIN_ROW: 0,
  MAX_ROW: GAME_CONSTANTS.GRID_SIZE - 1,
  MIN_COL: 0,
  MAX_COL: GAME_CONSTANTS.GRID_SIZE - 1
} as const;

/**
 * Game state constants
 */
export const GAME_STATE = {
  STATUS: {
    PLAYING: 'playing',
    COMPLETED: 'completed',
    PAUSED: 'paused'
  } as const,

  ACTIONS: {
    PLACE_NUMBER: 'place_number',
    CLEAR_CELL: 'clear_cell',
    USE_HINT: 'use_hint',
    RESET: 'reset',
    NEW_GAME: 'new_game'
  } as const
} as const;