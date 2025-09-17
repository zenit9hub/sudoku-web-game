import { Environment, EnvironmentConfig } from './EnvironmentTypes';
import { developmentConfig } from './development';
import { productionConfig } from './production';

/**
 * Environment Manager
 * Handles environment detection and configuration management
 */
export class EnvironmentManager {
  private currentEnvironment: Environment;
  private currentConfig: EnvironmentConfig;
  private configOverrides: Partial<EnvironmentConfig> = {};

  constructor() {
    this.currentEnvironment = this.detectEnvironment();
    this.currentConfig = this.loadConfiguration();
    this.applyOverrides();
  }

  /**
   * Get current environment name
   */
  getCurrentEnvironment(): Environment {
    return this.currentEnvironment;
  }

  /**
   * Get current configuration
   */
  getConfig(): EnvironmentConfig {
    return { ...this.currentConfig, ...this.configOverrides };
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: keyof EnvironmentConfig['features']): boolean {
    const config = this.getConfig();
    return config.features[feature];
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig(): EnvironmentConfig['performance'] {
    return this.getConfig().performance;
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig(): EnvironmentConfig['logging'] {
    return this.getConfig().logging;
  }

  /**
   * Get storage configuration
   */
  getStorageConfig(): EnvironmentConfig['storage'] {
    return this.getConfig().storage;
  }

  /**
   * Override configuration values
   */
  override(overrides: Partial<EnvironmentConfig>): void {
    this.configOverrides = { ...this.configOverrides, ...overrides };
  }

  /**
   * Clear configuration overrides
   */
  clearOverrides(): void {
    this.configOverrides = {};
  }

  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    return this.currentEnvironment === 'development';
  }

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    return this.currentEnvironment === 'production';
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled(): boolean {
    return this.isFeatureEnabled('enableDebugMode');
  }

  /**
   * Get API URL (if configured)
   */
  getApiUrl(): string | undefined {
    return this.getConfig().apiUrl;
  }

  /**
   * Get CDN URL (if configured)
   */
  getCdnUrl(): string | undefined {
    return this.getConfig().cdnUrl;
  }

  /**
   * Get application version
   */
  getVersion(): string {
    return this.getConfig().version;
  }

  /**
   * Get build time
   */
  getBuildTime(): string {
    return this.getConfig().buildTime;
  }

  /**
   * Log configuration information (if logging is enabled)
   */
  logConfiguration(): void {
    if (this.isFeatureEnabled('enableStateLogging')) {
      console.group('🔧 Environment Configuration');
      console.log('Environment:', this.currentEnvironment);
      console.log('Version:', this.getVersion());
      console.log('Build Time:', this.getBuildTime());
      console.log('Debug Mode:', this.isDebugEnabled());
      console.log('Features:', this.getConfig().features);
      console.groupEnd();
    }
  }

  /**
   * Detect current environment
   */
  private detectEnvironment(): Environment {
    // Check for explicit environment variable
    if (typeof process !== 'undefined' && process.env) {
      const nodeEnv = process.env.NODE_ENV;
      if (nodeEnv === 'production') return 'production';
      if (nodeEnv === 'test') return 'test';
      if (nodeEnv === 'staging') return 'staging';
    }

    // Check for Vite environment variables
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      const mode = (import.meta as any).env.MODE;
      if (mode === 'production') return 'production';
      if (mode === 'test') return 'test';
      if (mode === 'staging') return 'staging';
    }

    // Check URL patterns for web deployment
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;

      // Production patterns
      if (hostname === 'sudoku.example.com' || hostname.endsWith('.vercel.app')) {
        return 'production';
      }

      // Staging patterns
      if (hostname.includes('staging') || hostname.includes('preview')) {
        return 'staging';
      }

      // Development patterns
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('dev')) {
        return 'development';
      }
    }

    // Default to development
    return 'development';
  }

  /**
   * Load configuration for current environment
   */
  private loadConfiguration(): EnvironmentConfig {
    switch (this.currentEnvironment) {
      case 'production':
      case 'staging': // Use production config for staging with potential overrides
        return productionConfig;

      case 'test':
      case 'development':
      default:
        return developmentConfig;
    }
  }

  /**
   * Apply environment-specific overrides
   */
  private applyOverrides(): void {
    // Staging-specific overrides
    if (this.currentEnvironment === 'staging') {
      this.override({
        features: {
          ...this.currentConfig.features,
          enableAnalytics: false, // Disable analytics in staging
          enableErrorReporting: true // Enable error reporting for testing
        },
        logging: {
          ...this.currentConfig.logging,
          level: 'info', // More verbose logging in staging
          enableConsole: true
        }
      });
    }

    // Test-specific overrides
    if (this.currentEnvironment === 'test') {
      this.override({
        features: {
          ...this.currentConfig.features,
          enableAutoSave: false, // Disable auto-save in tests
          enableAnimations: false, // Disable animations for faster tests
          enableErrorReporting: false
        },
        performance: {
          ...this.currentConfig.performance,
          enableFrameSkipping: false // Consistent behavior in tests
        }
      });
    }
  }
}

// Create singleton instance
export const environmentManager = new EnvironmentManager();