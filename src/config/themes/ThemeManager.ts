import { Theme, ThemePreferences, ThemeContext } from './ThemeTypes';
import { lightTheme } from './LightTheme';
import { darkTheme } from './DarkTheme';

/**
 * Theme Manager
 * Handles theme switching, preferences, and CSS variable generation
 */
export class ThemeManager {
  private themes: Map<string, Theme> = new Map();
  private currentTheme: Theme;
  private preferences: ThemePreferences;
  private listeners: Set<(theme: Theme) => void> = new Set();

  constructor() {
    // Register built-in themes
    this.registerTheme(lightTheme);
    this.registerTheme(darkTheme);

    // Initialize with default preferences
    this.preferences = {
      mode: 'auto',
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium'
    };

    // Set initial theme
    this.currentTheme = this.detectInitialTheme();
    this.applyTheme();
  }

  /**
   * Register a new theme
   */
  registerTheme(theme: Theme): void {
    this.themes.set(theme.name, theme);
  }

  /**
   * Get available theme names
   */
  getAvailableThemes(): string[] {
    return Array.from(this.themes.keys());
  }

  /**
   * Switch to a specific theme
   */
  switchTheme(themeName: string): void {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.warn(`Theme '${themeName}' not found`);
      return;
    }

    this.currentTheme = theme;
    this.applyTheme();
    this.notifyListeners();
    this.savePreferences();
  }

  /**
   * Get current theme
   */
  getCurrentTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Update theme preferences
   */
  updatePreferences(newPreferences: Partial<ThemePreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };

    // Apply mode change
    if (newPreferences.mode !== undefined) {
      const themeName = this.resolveThemeFromMode(newPreferences.mode);
      if (themeName) {
        this.switchTheme(themeName);
      }
    }

    // Apply other preference changes
    this.applyPreferences();
    this.savePreferences();
  }

  /**
   * Get current preferences
   */
  getPreferences(): ThemePreferences {
    return { ...this.preferences };
  }

  /**
   * Add theme change listener
   */
  addThemeListener(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Apply theme by setting CSS custom properties
   */
  private applyTheme(): void {
    const root = document.documentElement;
    const theme = this.currentTheme;

    // Apply color variables
    root.style.setProperty('--color-primary', theme.colors.primary);
    root.style.setProperty('--color-primary-hover', theme.colors.primaryHover);
    root.style.setProperty('--color-secondary', theme.colors.secondary);
    root.style.setProperty('--color-secondary-hover', theme.colors.secondaryHover);
    root.style.setProperty('--color-success', theme.colors.success);
    root.style.setProperty('--color-danger', theme.colors.danger);
    root.style.setProperty('--color-warning', theme.colors.warning);
    root.style.setProperty('--color-info', theme.colors.info);

    // Apply background variables
    root.style.setProperty('--bg-body', theme.colors.background.body);
    root.style.setProperty('--bg-container', theme.colors.background.container);
    root.style.setProperty('--bg-section', theme.colors.background.section);
    root.style.setProperty('--bg-button', theme.colors.background.button);

    // Apply text variables
    root.style.setProperty('--text-primary', theme.colors.text.primary);
    root.style.setProperty('--text-secondary', theme.colors.text.secondary);
    root.style.setProperty('--text-light', theme.colors.text.light);
    root.style.setProperty('--text-muted', theme.colors.text.muted);

    // Apply border variables
    root.style.setProperty('--border-primary', theme.colors.border.primary);
    root.style.setProperty('--border-light', theme.colors.border.light);
    root.style.setProperty('--border-section', theme.colors.border.section);

    // Apply shadow variables
    root.style.setProperty('--shadow-container', theme.colors.shadows.container);
    root.style.setProperty('--shadow-canvas', theme.colors.shadows.canvas);
    root.style.setProperty('--shadow-button', theme.colors.shadows.button);
    root.style.setProperty('--shadow-focus', theme.colors.shadows.focus);

    // Apply typography variables
    root.style.setProperty('--font-family', theme.typography.fontFamily);

    // Apply spacing variables
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Apply border radius variables
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--radius-${key}`, value);
    });

    // Apply transition variables
    Object.entries(theme.transitions).forEach(([key, value]) => {
      root.style.setProperty(`--transition-${key}`, value);
    });

    // Set theme class on body
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .concat(` theme-${theme.name}`)
      .trim();
  }

  /**
   * Apply preference-based modifications
   */
  private applyPreferences(): void {
    const root = document.documentElement;

    // High contrast mode
    if (this.preferences.highContrast) {
      root.style.setProperty('--contrast-multiplier', '1.2');
    } else {
      root.style.setProperty('--contrast-multiplier', '1');
    }

    // Reduced motion
    if (this.preferences.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01s');
      root.style.setProperty('--transition-duration', '0.01s');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--transition-duration');
    }

    // Font size scaling
    const fontSizeScale = {
      small: '0.9',
      medium: '1',
      large: '1.1'
    };
    root.style.setProperty('--font-scale', fontSizeScale[this.preferences.fontSize]);
  }

  /**
   * Detect initial theme based on preferences and system
   */
  private detectInitialTheme(): Theme {
    // Try to load saved preferences
    this.loadPreferences();

    const themeName = this.resolveThemeFromMode(this.preferences.mode);
    return this.themes.get(themeName) || lightTheme;
  }

  /**
   * Resolve theme name from mode setting
   */
  private resolveThemeFromMode(mode: 'light' | 'dark' | 'auto'): string {
    if (mode === 'auto') {
      // Detect system preference
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return mode;
  }

  /**
   * Notify all listeners of theme change
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.currentTheme);
      } catch (error) {
        console.error('Error in theme listener:', error);
      }
    });
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem('sudoku-theme-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save theme preferences:', error);
    }
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem('sudoku-theme-preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.preferences = { ...this.preferences, ...parsed };
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
    }
  }

  /**
   * Get theme context for use in components
   */
  getThemeContext(): ThemeContext {
    return {
      currentTheme: this.currentTheme,
      preferences: this.preferences,
      availableThemes: this.getAvailableThemes(),
      switchTheme: (themeName: string) => this.switchTheme(themeName),
      updatePreferences: (preferences: Partial<ThemePreferences>) => this.updatePreferences(preferences)
    };
  }
}