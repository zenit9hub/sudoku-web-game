import { EnvironmentConfig, FeatureFlags, PerformanceConfig, LoggingConfig, StorageConfig } from '../environments/EnvironmentTypes';
import { Theme } from '../themes/ThemeTypes';

/**
 * Configuration validation results
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Configuration Validator
 * Validates configuration objects for correctness and consistency
 */
export class ConfigValidator {
  /**
   * Validate complete environment configuration
   */
  validateEnvironmentConfig(config: EnvironmentConfig): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate basic properties
    this.validateBasicProperties(config, result);

    // Validate feature flags
    this.validateFeatureFlags(config.features, result);

    // Validate performance config
    this.validatePerformanceConfig(config.performance, result);

    // Validate logging config
    this.validateLoggingConfig(config.logging, result);

    // Validate storage config
    this.validateStorageConfig(config.storage, result);

    // Check for logical inconsistencies
    this.validateLogicalConsistency(config, result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate theme configuration
   */
  validateTheme(theme: Theme): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    // Validate theme name
    if (!theme.name || typeof theme.name !== 'string') {
      result.errors.push('Theme name is required and must be a string');
    }

    // Validate color values
    this.validateColors(theme.colors, result);

    // Validate typography
    this.validateTypography(theme.typography, result);

    // Validate spacing values
    this.validateSpacing(theme.spacing, result);

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate configuration value ranges
   */
  validateRanges(config: any, rules: ValidationRules): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    for (const [path, rule] of Object.entries(rules)) {
      const value = this.getNestedValue(config, path);

      if (value !== undefined) {
        if (rule.min !== undefined && value < rule.min) {
          result.errors.push(`${path} must be >= ${rule.min}, got ${value}`);
        }

        if (rule.max !== undefined && value > rule.max) {
          result.errors.push(`${path} must be <= ${rule.max}, got ${value}`);
        }

        if (rule.type && typeof value !== rule.type) {
          result.errors.push(`${path} must be of type ${rule.type}, got ${typeof value}`);
        }

        if (rule.enum && !rule.enum.includes(value)) {
          result.errors.push(`${path} must be one of [${rule.enum.join(', ')}], got ${value}`);
        }
      } else if (rule.required) {
        result.errors.push(`${path} is required but not provided`);
      }
    }

    result.isValid = result.errors.length === 0;
    return result;
  }

  /**
   * Validate basic properties
   */
  private validateBasicProperties(config: EnvironmentConfig, result: ValidationResult): void {
    if (!config.name) {
      result.errors.push('Environment name is required');
    }

    if (!config.version) {
      result.errors.push('Version is required');
    }

    if (!config.buildTime) {
      result.errors.push('Build time is required');
    }

    // Validate version format (semver-like)
    if (config.version && !/^\d+\.\d+\.\d+/.test(config.version)) {
      result.warnings.push('Version should follow semantic versioning format');
    }
  }

  /**
   * Validate feature flags
   */
  private validateFeatureFlags(features: FeatureFlags, result: ValidationResult): void {
    const requiredFeatures = [
      'enableDebugMode',
      'enableHints',
      'enableUndo',
      'enableAutoSave'
    ];

    for (const feature of requiredFeatures) {
      if (!(feature in features)) {
        result.errors.push(`Required feature flag '${feature}' is missing`);
      }

      if (typeof features[feature as keyof FeatureFlags] !== 'boolean') {
        result.errors.push(`Feature flag '${feature}' must be a boolean`);
      }
    }

    // Logical validations
    if (features.enableCustomPuzzles && !features.enableMultipleDifficulties) {
      result.warnings.push('Custom puzzles typically require multiple difficulties to be enabled');
    }

    if (features.enableOnlineFeatures && !features.enableErrorReporting) {
      result.warnings.push('Online features should typically have error reporting enabled');
    }
  }

  /**
   * Validate performance configuration
   */
  private validatePerformanceConfig(performance: PerformanceConfig, result: ValidationResult): void {
    // Validate FPS values
    if (performance.targetFPS < 30 || performance.targetFPS > 120) {
      result.warnings.push('Target FPS should typically be between 30 and 120');
    }

    // Validate render time
    if (performance.maxRenderTime < 8 || performance.maxRenderTime > 33) {
      result.warnings.push('Max render time should typically be between 8ms and 33ms');
    }

    // Validate memory thresholds
    if (performance.memoryThreshold < 10 * 1024 * 1024) { // 10MB
      result.warnings.push('Memory threshold seems very low');
    }

    // Validate cache size
    if (performance.cacheSize > performance.memoryThreshold) {
      result.errors.push('Cache size cannot exceed memory threshold');
    }

    // Validate network timeouts
    if (performance.requestTimeout < 1000) {
      result.warnings.push('Request timeout seems very short');
    }

    if (performance.retryAttempts < 0 || performance.retryAttempts > 5) {
      result.warnings.push('Retry attempts should typically be between 0 and 5');
    }
  }

  /**
   * Validate logging configuration
   */
  private validateLoggingConfig(logging: LoggingConfig, result: ValidationResult): void {
    const validLevels = ['debug', 'info', 'warn', 'error'];
    if (!validLevels.includes(logging.level)) {
      result.errors.push(`Invalid log level '${logging.level}'. Must be one of: ${validLevels.join(', ')}`);
    }

    if (logging.maxLogEntries < 10) {
      result.warnings.push('Max log entries seems very low');
    }

    if (logging.maxLogEntries > 10000) {
      result.warnings.push('Max log entries seems very high and may impact performance');
    }

    // Logical validations
    if (!logging.enableConsole && !logging.enableRemote && !logging.enableLocalStorage) {
      result.warnings.push('All logging outputs are disabled');
    }
  }

  /**
   * Validate storage configuration
   */
  private validateStorageConfig(storage: StorageConfig, result: ValidationResult): void {
    // Validate storage sizes
    if (storage.maxStorageSize < 1024 * 1024) { // 1MB
      result.warnings.push('Max storage size seems very small');
    }

    if (storage.maxStorageSize > 100 * 1024 * 1024) { // 100MB
      result.warnings.push('Max storage size seems very large');
    }

    // Validate timeouts
    if (storage.sessionTimeout < 60 * 1000) { // 1 minute
      result.warnings.push('Session timeout seems very short');
    }

    if (storage.cleanupInterval < 60 * 1000) { // 1 minute
      result.warnings.push('Cleanup interval seems very frequent');
    }

    if (storage.maxAge < 24 * 60 * 60 * 1000) { // 1 day
      result.warnings.push('Max age seems very short');
    }
  }

  /**
   * Validate colors
   */
  private validateColors(colors: any, result: ValidationResult): void {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\(|^rgba\(|^hsl\(|^hsla\(/;

    const validateColorValue = (value: any, path: string) => {
      if (typeof value === 'string') {
        if (!colorRegex.test(value)) {
          result.warnings.push(`Color value at ${path} may not be a valid CSS color`);
        }
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => {
          validateColorValue(val, `${path}.${key}`);
        });
      }
    };

    validateColorValue(colors, 'colors');
  }

  /**
   * Validate typography
   */
  private validateTypography(typography: any, result: ValidationResult): void {
    if (!typography.fontFamily || typeof typography.fontFamily !== 'string') {
      result.errors.push('Font family is required and must be a string');
    }

    // Validate font sizes contain 'rem', 'px', 'em', or '%'
    if (typography.fontSize) {
      Object.entries(typography.fontSize).forEach(([key, value]) => {
        if (typeof value === 'string' && !/\d+(rem|px|em|%|vw|vh)/.test(value)) {
          result.warnings.push(`Font size ${key} should include a valid CSS unit`);
        }
      });
    }
  }

  /**
   * Validate spacing values
   */
  private validateSpacing(spacing: any, result: ValidationResult): void {
    Object.entries(spacing).forEach(([key, value]) => {
      if (typeof value === 'string' && !/\d+(rem|px|em|%|vw|vh)/.test(value)) {
        result.warnings.push(`Spacing ${key} should include a valid CSS unit`);
      }
    });
  }

  /**
   * Validate logical consistency
   */
  private validateLogicalConsistency(config: EnvironmentConfig, result: ValidationResult): void {
    // Production environment checks
    if (config.name === 'production') {
      if (config.features.enableDebugMode) {
        result.warnings.push('Debug mode is enabled in production environment');
      }

      if (config.logging.level === 'debug') {
        result.warnings.push('Debug logging is enabled in production environment');
      }

      if (config.logging.enableConsole) {
        result.warnings.push('Console logging is enabled in production environment');
      }
    }

    // Development environment checks
    if (config.name === 'development') {
      if (!config.features.enableDebugMode) {
        result.warnings.push('Debug mode is disabled in development environment');
      }

      if (!config.logging.enableConsole) {
        result.warnings.push('Console logging is disabled in development environment');
      }
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

/**
 * Validation rules interface
 */
export interface ValidationRules {
  [path: string]: ValidationRule;
}

export interface ValidationRule {
  type?: 'string' | 'number' | 'boolean' | 'object';
  required?: boolean;
  min?: number;
  max?: number;
  enum?: any[];
}

// Export singleton instance
export const configValidator = new ConfigValidator();