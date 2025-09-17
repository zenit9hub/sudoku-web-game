import { EnvironmentConfig } from './EnvironmentTypes';
import { TIMING_PERFORMANCE, TIMING_TIMEOUTS, TIMING_INTERVALS } from '../constants/TimingConstants';

/**
 * Production environment configuration
 * Optimized for performance and stability
 */
export const productionConfig: EnvironmentConfig = {
  name: 'production',
  version: '1.0.0',
  buildTime: new Date().toISOString(),

  features: {
    // Debug features - disabled in production
    enableDebugMode: false,
    enablePerformanceLogging: false,
    enableStateLogging: false,
    enableErrorReporting: true, // Keep for error tracking

    // Game features - core features enabled
    enableHints: true,
    enableUndo: true,
    enableAutoSave: true,
    enableStatistics: true,

    // UI features - user-facing features enabled
    enableThemeSwitcher: true,
    enableLanguageSwitcher: true,
    enableAnimations: true,
    enableSoundEffects: true,

    // Advanced features - production ready features
    enableMultipleDifficulties: true,
    enableCustomPuzzles: false, // May be enabled later
    enableOnlineFeatures: false, // Not implemented yet
    enableAnalytics: true // Enabled for user insights
  },

  performance: {
    // Optimized performance settings
    targetFPS: TIMING_PERFORMANCE.TARGET_FPS,
    maxRenderTime: TIMING_PERFORMANCE.FRAME_BUDGET,
    enableFrameSkipping: true, // Enable for smooth performance

    // Memory management - aggressive cleanup
    enableGarbageCollection: true,
    memoryThreshold: 50 * 1024 * 1024, // 50MB
    cacheSize: 20 * 1024 * 1024, // 20MB

    // Network - production timeouts
    requestTimeout: TIMING_TIMEOUTS.API_REQUEST,
    retryAttempts: 2,
    enableCaching: true // Enable for better performance
  },

  logging: {
    level: 'warn', // Only warnings and errors
    enableConsole: false, // Disabled in production
    enableRemote: true, // Enable for error tracking
    enableLocalStorage: false, // Disabled for privacy
    maxLogEntries: 100,
    categories: {
      game: false,
      ui: false,
      performance: false,
      network: false,
      errors: true // Only errors
    }
  },

  storage: {
    // Local storage - production settings
    enableLocalStorage: true,
    storagePrefix: 'sudoku-',
    maxStorageSize: 5 * 1024 * 1024, // 5MB

    // Session storage - enabled with shorter timeout
    enableSessionStorage: true,
    sessionTimeout: 2 * 60 * 60 * 1000, // 2 hours

    // Cleanup - aggressive cleanup in production
    enableAutoCleanup: true,
    cleanupInterval: TIMING_INTERVALS.AUTO_SAVE * 2,
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  }

  // Note: devTools not included in production
};