import { Difficulty } from '@/domain/models/GameState';

/**
 * Application configuration constants
 * Centralized configuration to improve maintainability and consistency
 */
export const APP_CONFIG = {
  // Timer settings
  TIMER: {
    UPDATE_INTERVAL: 1000,           // Timer update frequency (ms)
    INITIAL_DELAY: 200,              // Initial setup delay (ms)
    RESIZE_DELAY: 100,               // Canvas resize delay (ms)
    ORIENTATION_CHANGE_DELAY: 300    // Device orientation change delay (ms)
  },

  // Game settings
  GAME: {
    GRID_SIZE: 9,                    // Sudoku grid dimensions
    TOTAL_CELLS: 81,                 // Total cells in grid (9x9)
    DEFAULT_DIFFICULTY: Difficulty.EASY
  },

  // UI settings
  UI: {
    MESSAGE_DURATION: 3000,          // Default message display duration (ms)
    GAME_COMPLETE_DELAY: 100,        // Delay before showing completion dialog (ms)
    CANVAS_ASPECT_RATIO: 1.0         // Canvas width/height ratio
  }
} as const;

/**
 * UI color theme constants
 */
export const UI_COLORS = {
  ERROR: '#dc3545',
  INFO: '#666',
  SUCCESS: '#28a745',
  PRIMARY: '#007bff',
  MUTED: '#6c757d'
} as const;

/**
 * Game completion messages
 */
export const MESSAGES = {
  GAME_COMPLETE: '🎉 축하합니다! 퍼즐을 완성했습니다!',
  SELECT_CELL: '칸을 선택하고 숫자를 입력하세요',
  CELL_FIXED: '고정된 숫자입니다',
  INPUT_NUMBER: '숫자를 입력하세요',

  // Placeholders for dynamic messages
  CELL_SELECTED: (row: number, col: number) => `선택: (${row + 1}, ${col + 1})`,
  CELL_VALUE: (row: number, col: number, value: string) =>
    `선택: (${row + 1}, ${col + 1}) - 현재 값: ${value}`,
  GAME_STATS: (time: string, moves: number, hints: number) =>
    `⏱️ 시간: ${time}\n🎯 이동: ${moves}회\n💡 힌트: ${hints}회`
} as const;