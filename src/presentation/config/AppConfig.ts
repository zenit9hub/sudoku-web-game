/**
 * Simple application configuration
 */
export const APP_CONFIG = {
  // Timer settings
  TIMER: {
    INITIAL_DELAY: 100,
    RESIZE_DELAY: 100,
    ORIENTATION_CHANGE_DELAY: 200
  },

  // Game settings
  GAME: {
    GRID_SIZE: 9,
    TOTAL_CELLS: 81,
    DEFAULT_DIFFICULTY: 'EASY' as const
  },

  // UI settings
  UI: {
    MESSAGE_DURATION: 3000,
    GAME_COMPLETE_DELAY: 1000,
    CANVAS_ASPECT_RATIO: 1.0
  }
} as const;

// Simple UI colors
export const UI_COLORS = {
  ERROR: '#dc3545',
  INFO: '#6c757d',
  SUCCESS: '#28a745',
  PRIMARY: '#007bff',
  MUTED: '#6c757d'
} as const;

// Simple messages
export const MESSAGES = {
  GAME_COMPLETE: '🎉 축하합니다! 퍼즐을 완성했습니다!',
  SELECT_CELL: '칸을 선택하고 숫자를 입력하세요',
  CELL_FIXED: '고정된 숫자입니다',
  INPUT_NUMBER: '숫자를 입력하세요',
  CELL_SELECTED: (row: number, col: number) => `선택된 셀: (${row + 1}, ${col + 1})`,
  CELL_VALUE: (row: number, col: number, value: string) => `셀 (${row + 1}, ${col + 1}): ${value}`,
  GAME_STATS: (time: string, moves: number, hints: number) =>
    `완료 시간: ${time}\n움직임: ${moves}\n힌트: ${hints}`
} as const;

