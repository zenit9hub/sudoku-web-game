/**
 * Environment configuration types
 * Defines different environment settings for development, production, etc.
 */

// Environment names
export type Environment = 'development' | 'production' | 'test' | 'staging';

// Feature flags interface
export interface FeatureFlags {
  // Debug features
  enableDebugMode: boolean;
  enablePerformanceLogging: boolean;
  enableStateLogging: boolean;
  enableErrorReporting: boolean;

  // Game features
  enableHints: boolean;
  enableUndo: boolean;
  enableAutoSave: boolean;
  enableStatistics: boolean;

  // UI features
  enableThemeSwitcher: boolean;
  enableLanguageSwitcher: boolean;
  enableAnimations: boolean;
  enableSoundEffects: boolean;

  // Advanced features
  enableMultipleDifficulties: boolean;
  enableCustomPuzzles: boolean;
  enableOnlineFeatures: boolean;
  enableAnalytics: boolean;
}

// Performance configuration
export interface PerformanceConfig {
  // Rendering
  targetFPS: number;
  maxRenderTime: number;
  enableFrameSkipping: boolean;

  // Memory management
  enableGarbageCollection: boolean;
  memoryThreshold: number;
  cacheSize: number;

  // Network
  requestTimeout: number;
  retryAttempts: number;
  enableCaching: boolean;
}

// Logging configuration
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableConsole: boolean;
  enableRemote: boolean;
  enableLocalStorage: boolean;
  maxLogEntries: number;
  categories: {
    game: boolean;
    ui: boolean;
    performance: boolean;
    network: boolean;
    errors: boolean;
  };
}

// Storage configuration
export interface StorageConfig {
  // Local storage
  enableLocalStorage: boolean;
  storagePrefix: string;
  maxStorageSize: number;

  // Session storage
  enableSessionStorage: boolean;
  sessionTimeout: number;

  // Cleanup
  enableAutoCleanup: boolean;
  cleanupInterval: number;
  maxAge: number;
}

// Development tools configuration
export interface DevToolsConfig {
  enableReactDevTools: boolean;
  enableReduxDevTools: boolean;
  enableHotReload: boolean;
  enableSourceMaps: boolean;
  enableLinting: boolean;
  enableTypeChecking: boolean;
}

// Complete environment configuration
export interface EnvironmentConfig {
  name: Environment;
  apiUrl?: string;
  cdnUrl?: string;
  features: FeatureFlags;
  performance: PerformanceConfig;
  logging: LoggingConfig;
  storage: StorageConfig;
  devTools?: DevToolsConfig;
  version: string;
  buildTime: string;
}