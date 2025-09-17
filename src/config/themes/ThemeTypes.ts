/**
 * Theme system type definitions
 * Defines the structure for theme configurations
 */

// Color scheme interface
export interface ColorScheme {
  primary: string;
  primaryHover: string;
  secondary: string;
  secondaryHover: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  background: {
    body: string;
    container: string;
    section: string;
    button: string;
  };
  text: {
    primary: string;
    secondary: string;
    light: string;
    muted: string;
  };
  border: {
    primary: string;
    light: string;
    section: string;
  };
  shadows: {
    container: string;
    canvas: string;
    button: string;
    focus: string;
  };
}

// Typography configuration
export interface Typography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

// Spacing configuration
export interface Spacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
}

// Border radius configuration
export interface BorderRadius {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  circle: string;
}

// Complete theme interface
export interface Theme {
  name: string;
  colors: ColorScheme;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
  zIndex: {
    base: number;
    dropdown: number;
    modal: number;
    tooltip: number;
    overlay: number;
  };
}

// Theme preferences
export interface ThemePreferences {
  mode: 'light' | 'dark' | 'auto';
  highContrast: boolean;
  reducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

// Theme context
export interface ThemeContext {
  currentTheme: Theme;
  preferences: ThemePreferences;
  availableThemes: string[];
  switchTheme: (themeName: string) => void;
  updatePreferences: (preferences: Partial<ThemePreferences>) => void;
}