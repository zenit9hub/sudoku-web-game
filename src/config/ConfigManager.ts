import { EnvironmentManager, environmentManager } from './environments/EnvironmentManager';
import { ThemeManager } from './themes/ThemeManager';
import { ConfigValidator, configValidator } from './validation/ConfigValidator';

// Re-export all constants for convenient access
export * from './constants/GameConstants';
export * from './constants/UIConstants';
export * from './constants/TimingConstants';
export * from './constants/MessageConstants';

// Re-export types
export * from './environments/EnvironmentTypes';
export * from './themes/ThemeTypes';

/**
 * Central Configuration Manager
 * Provides unified access to all configuration systems
 */
export class ConfigManager {
  private environmentManager: EnvironmentManager;
  private themeManager: ThemeManager;
  private validator: ConfigValidator;

  constructor() {
    this.environmentManager = environmentManager;
    this.themeManager = new ThemeManager();
    this.validator = configValidator;

    this.initialize();
  }

  /**
   * Initialize configuration systems
   */
  private initialize(): void {
    // Validate current environment configuration
    const envConfig = this.environmentManager.getConfig();
    const envValidation = this.validator.validateEnvironmentConfig(envConfig);

    if (!envValidation.isValid) {
      console.error('❌ Environment configuration validation failed:', envValidation.errors);
    }

    if (envValidation.warnings.length > 0) {
      console.warn('⚠️ Environment configuration warnings:', envValidation.warnings);
    }

    // Validate current theme
    const currentTheme = this.themeManager.getCurrentTheme();
    const themeValidation = this.validator.validateTheme(currentTheme);

    if (!themeValidation.isValid) {
      console.error('❌ Theme validation failed:', themeValidation.errors);
    }

    // Log configuration in development
    if (this.environmentManager.isDevelopment()) {
      this.environmentManager.logConfiguration();
      console.log('🎨 Current theme:', currentTheme.name);
    }
  }

  /**
   * Get environment manager
   */
  getEnvironmentManager(): EnvironmentManager {
    return this.environmentManager;
  }

  /**
   * Get theme manager
   */
  getThemeManager(): ThemeManager {
    return this.themeManager;
  }

  /**
   * Get configuration validator
   */
  getValidator(): ConfigValidator {
    return this.validator;
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature: string): boolean {
    return this.environmentManager.isFeatureEnabled(feature as any);
  }

  /**
   * Get current environment name
   */
  getEnvironment(): string {
    return this.environmentManager.getCurrentEnvironment();
  }

  /**
   * Check if running in development
   */
  isDevelopment(): boolean {
    return this.environmentManager.isDevelopment();
  }

  /**
   * Check if running in production
   */
  isProduction(): boolean {
    return this.environmentManager.isProduction();
  }

  /**
   * Check if debug mode is enabled
   */
  isDebugEnabled(): boolean {
    return this.environmentManager.isDebugEnabled();
  }

  /**
   * Get current theme name
   */
  getCurrentTheme(): string {
    return this.themeManager.getCurrentTheme().name;
  }

  /**
   * Switch theme
   */
  switchTheme(themeName: string): void {
    this.themeManager.switchTheme(themeName);
  }

  /**
   * Get application version
   */
  getVersion(): string {
    return this.environmentManager.getVersion();
  }

  /**
   * Get performance configuration
   */
  getPerformanceConfig() {
    return this.environmentManager.getPerformanceConfig();
  }

  /**
   * Get logging configuration
   */
  getLoggingConfig() {
    return this.environmentManager.getLoggingConfig();
  }

  /**
   * Get storage configuration
   */
  getStorageConfig() {
    return this.environmentManager.getStorageConfig();
  }

  /**
   * Log current configuration state
   */
  logCurrentState(): void {
    if (this.isDebugEnabled()) {
      console.group('📋 Current Configuration State');
      console.log('Environment:', this.getEnvironment());
      console.log('Version:', this.getVersion());
      console.log('Theme:', this.getCurrentTheme());
      console.log('Debug Mode:', this.isDebugEnabled());
      console.log('Performance Config:', this.getPerformanceConfig());
      console.log('Storage Config:', this.getStorageConfig());
      console.groupEnd();
    }
  }

  /**
   * Validate all configurations
   */
  validateAll(): { environment: any; theme: any } {
    const envConfig = this.environmentManager.getConfig();
    const currentTheme = this.themeManager.getCurrentTheme();

    return {
      environment: this.validator.validateEnvironmentConfig(envConfig),
      theme: this.validator.validateTheme(currentTheme)
    };
  }

  /**
   * Reset to default configuration
   */
  resetToDefaults(): void {
    this.environmentManager.clearOverrides();
    this.themeManager.switchTheme('light');
  }

  /**
   * Export current configuration for debugging
   */
  exportConfiguration(): any {
    return {
      environment: {
        name: this.getEnvironment(),
        config: this.environmentManager.getConfig()
      },
      theme: {
        name: this.getCurrentTheme(),
        config: this.themeManager.getCurrentTheme()
      },
      validation: this.validateAll()
    };
  }
}

// Create and export singleton instance
export const configManager = new ConfigManager();