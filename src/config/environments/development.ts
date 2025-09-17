import { EnvironmentConfig } from './EnvironmentTypes';
import { TIMING_PERFORMANCE, TIMING_TIMEOUTS, TIMING_INTERVALS } from '../constants/TimingConstants';

/**
 * Development environment configuration
 * Optimized for development with debugging features enabled
 */
export const developmentConfig: EnvironmentConfig = {
  name: 'development',
  version: '1.0.0-dev',
  buildTime: new Date().toISOString(),

  features: {
    // Debug features - all enabled in development
    enableDebugMode: true,
    enablePerformanceLogging: true,
    enableStateLogging: true,
    enableErrorReporting: true,

    // Game features - all enabled for testing
    enableHints: true,
    enableUndo: true,
    enableAutoSave: true,
    enableStatistics: true,

    // UI features - all enabled for testing
    enableThemeSwitcher: true,
    enableLanguageSwitcher: true,
    enableAnimations: true,
    enableSoundEffects: false, // Disabled to avoid annoyance during dev

    // Advanced features - enabled for testing
    enableMultipleDifficulties: true,
    enableCustomPuzzles: true,
    enableOnlineFeatures: false, // Usually disabled in dev
    enableAnalytics: false // Disabled in development
  },

  performance: {
    // Relaxed performance settings for development
    targetFPS: TIMING_PERFORMANCE.TARGET_FPS,
    maxRenderTime: TIMING_PERFORMANCE.FRAME_BUDGET * 2, // More lenient
    enableFrameSkipping: false, // Disabled for consistent debugging

    // Memory management - more verbose
    enableGarbageCollection: true,
    memoryThreshold: 100 * 1024 * 1024, // 100MB
    cacheSize: 50 * 1024 * 1024, // 50MB

    // Network - longer timeouts for debugging
    requestTimeout: TIMING_TIMEOUTS.API_REQUEST * 2,
    retryAttempts: 3,
    enableCaching: false // Disabled for fresh data during development
  },

  logging: {
    level: 'debug', // Most verbose logging
    enableConsole: true,
    enableRemote: false, // Usually disabled in dev
    enableLocalStorage: true,
    maxLogEntries: 1000,
    categories: {
      game: true,
      ui: true,
      performance: true,
      network: true,
      errors: true
    }
  },

  storage: {
    // Local storage - enabled with dev prefix
    enableLocalStorage: true,
    storagePrefix: 'sudoku-dev-',
    maxStorageSize: 10 * 1024 * 1024, // 10MB

    // Session storage - enabled
    enableSessionStorage: true,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours

    // Cleanup - less aggressive in development
    enableAutoCleanup: false,
    cleanupInterval: TIMING_INTERVALS.AUTO_SAVE * 10,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  },

  devTools: {
    enableReactDevTools: true,
    enableReduxDevTools: true,
    enableHotReload: true,
    enableSourceMaps: true,
    enableLinting: true,
    enableTypeChecking: true
  }
};