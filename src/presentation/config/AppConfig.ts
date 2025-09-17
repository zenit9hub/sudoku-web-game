import { configManager, GAME_CONSTANTS, TIMING_DELAYS, TIMING_INTERVALS, UI_COLORS as UI_COLORS_CONST, MESSAGE_TEMPLATES } from '../../config/ConfigManager';

/**
 * Updated Application configuration using centralized config system
 * This replaces the old AppConfig.ts with the new centralized system
 */

// Re-export commonly used constants with backward compatibility
export const APP_CONFIG = {
  // Timer settings - now using centralized timing constants
  TIMER: {
    UPDATE_INTERVAL: TIMING_INTERVALS.GAME_TIMER_UPDATE,
    INITIAL_DELAY: TIMING_DELAYS.CANVAS_INIT,
    RESIZE_DELAY: TIMING_DELAYS.WINDOW_RESIZE,
    ORIENTATION_CHANGE_DELAY: TIMING_DELAYS.ORIENTATION_CHANGE
  },

  // Game settings - now using centralized game constants
  GAME: {
    GRID_SIZE: GAME_CONSTANTS.GRID_SIZE,
    TOTAL_CELLS: GAME_CONSTANTS.TOTAL_CELLS,
    DEFAULT_DIFFICULTY: (() => {
      // Import difficulty dynamically to avoid circular dependencies
      // This will be resolved by the game service
      return 'EASY' as const;
    })()
  },

  // UI settings - now using environment-based configuration
  UI: {
    MESSAGE_DURATION: TIMING_DELAYS.ERROR_MESSAGE,
    GAME_COMPLETE_DELAY: TIMING_DELAYS.COMPLETION_DIALOG,
    CANVAS_ASPECT_RATIO: 1.0 // This could be moved to UI constants
  }
} as const;

// Re-export UI colors with backward compatibility
export const UI_COLORS = {
  ERROR: UI_COLORS_CONST.DANGER,
  INFO: UI_COLORS_CONST.GRAY,
  SUCCESS: UI_COLORS_CONST.SUCCESS,
  PRIMARY: UI_COLORS_CONST.PRIMARY,
  MUTED: UI_COLORS_CONST.GRAY_MUTED
} as const;

// Re-export messages with backward compatibility
export const MESSAGES = {
  GAME_COMPLETE: configManager.isFeatureEnabled('enableAnimations')
    ? '🎉 축하합니다! 퍼즐을 완성했습니다!'
    : '축하합니다! 퍼즐을 완성했습니다!',
  SELECT_CELL: '칸을 선택하고 숫자를 입력하세요',
  CELL_FIXED: '고정된 숫자입니다',
  INPUT_NUMBER: '숫자를 입력하세요',

  // Dynamic message generators - now using centralized templates
  CELL_SELECTED: MESSAGE_TEMPLATES.CELL_SELECTED,
  CELL_VALUE: MESSAGE_TEMPLATES.CELL_VALUE,
  GAME_STATS: MESSAGE_TEMPLATES.COMPLETION_STATS
} as const;

/**
 * Get runtime configuration values
 * These are computed at runtime based on current environment/theme
 */
export function getRuntimeConfig() {
  const performanceConfig = configManager.getPerformanceConfig();
  const storageConfig = configManager.getStorageConfig();

  return {
    // Performance-based settings
    ANIMATION_ENABLED: configManager.isFeatureEnabled('enableAnimations'),
    DEBUG_ENABLED: configManager.isDebugEnabled(),
    AUTO_SAVE_ENABLED: configManager.isFeatureEnabled('enableAutoSave'),

    // Timing adjustments based on performance config
    TIMING: {
      RENDER_BUDGET: performanceConfig.maxRenderTime,
      TARGET_FPS: performanceConfig.targetFPS,
      CACHE_SIZE: performanceConfig.cacheSize
    },

    // Storage settings
    STORAGE: {
      PREFIX: storageConfig.storagePrefix,
      MAX_SIZE: storageConfig.maxStorageSize,
      AUTO_CLEANUP: storageConfig.enableAutoCleanup
    },

    // Feature flags
    FEATURES: {
      HINTS_ENABLED: configManager.isFeatureEnabled('enableHints'),
      UNDO_ENABLED: configManager.isFeatureEnabled('enableUndo'),
      STATISTICS_ENABLED: configManager.isFeatureEnabled('enableStatistics'),
      THEME_SWITCHER_ENABLED: configManager.isFeatureEnabled('enableThemeSwitcher'),
      LANGUAGE_SWITCHER_ENABLED: configManager.isFeatureEnabled('enableLanguageSwitcher')
    }
  };
}

/**
 * Get theme-aware colors
 * Colors that adapt to the current theme
 */
export function getThemeColors() {
  const theme = configManager.getThemeManager().getCurrentTheme();

  return {
    ERROR: theme.colors.danger,
    INFO: theme.colors.text.secondary,
    SUCCESS: theme.colors.success,
    PRIMARY: theme.colors.primary,
    MUTED: theme.colors.text.muted,
    BACKGROUND: theme.colors.background.body,
    CONTAINER: theme.colors.background.container,
    BORDER: theme.colors.border.primary
  };
}

/**
 * Get environment-specific messages
 * Messages that may vary based on environment (development vs production)
 */
export function getEnvironmentMessages() {
  const isDev = configManager.isDevelopment();

  return {
    ERROR_PREFIX: isDev ? '[DEV] ' : '',
    CONSOLE_ENABLED: configManager.getLoggingConfig().enableConsole,
    DEBUG_INFO_ENABLED: configManager.isFeatureEnabled('enableStateLogging')
  };
}