/**
 * UI-specific constants
 * Visual elements, spacing, colors, and layout constants
 */

// Color palette
export const UI_COLORS = {
  // Primary colors
  PRIMARY: '#007bff',
  PRIMARY_HOVER: '#0056b3',
  SECONDARY: '#6c757d',
  SECONDARY_HOVER: '#545b62',

  // Status colors
  SUCCESS: '#28a745',
  DANGER: '#dc3545',
  WARNING: '#ffc107',
  INFO: '#17a2b8',

  // Neutral colors
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY_LIGHT: '#f8f9fa',
  GRAY: '#666666',
  GRAY_DARK: '#333333',
  GRAY_MUTED: '#6c757d',

  // Background colors
  BODY_BG: '#f0f2f5',
  CONTAINER_BG: '#ffffff',
  SECTION_BG: '#f8f9fa',
  BUTTON_BG: '#f9f9f9',

  // Border colors
  BORDER_PRIMARY: '#333333',
  BORDER_LIGHT: '#dddddd',
  BORDER_SECTION: '#e9ecef',

  // Gradient
  HEADER_GRADIENT: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
} as const;

// Typography
export const UI_TYPOGRAPHY = {
  FONT_FAMILY: "'Arial', sans-serif",

  // Font sizes (responsive)
  FONT_SIZE: {
    XS: 'min(1.94vw, 0.7rem)',
    SM: 'min(2.22vw, 0.8rem)',
    BASE: 'min(2.36vw, 0.85rem)',
    MD: 'min(2.5vw, 0.9rem)',
    LG: 'min(2.78vw, 1rem)',
    XL: 'min(3.3vw, 1.2rem)'
  } as const,

  FONT_WEIGHT: {
    NORMAL: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700
  } as const,

  LINE_HEIGHT: {
    TIGHT: 1.2,
    NORMAL: 1.5,
    RELAXED: 1.8
  } as const
} as const;

// Spacing system
export const UI_SPACING = {
  XS: 'min(0.83vw, 3px)',
  SM: 'min(1.67vw, 6px)',
  MD: 'min(2.22vw, 8px)',
  LG: 'min(2.78vw, 10px)',
  XL: 'min(2.8vw, 20px)',
  XXL: 'min(3.33vw, 24px)'
} as const;

// Border radius
export const UI_RADIUS = {
  SM: 'min(1.11vw, 4px)',
  MD: 'min(1.67vw, 6px)',
  LG: 'min(1.7vw, 12px)',
  XL: 'min(2.22vw, 16px)',
  CIRCLE: '50%'
} as const;

// Shadows
export const UI_SHADOWS = {
  CONTAINER: '0 4px 20px rgba(0, 0, 0, 0.1)',
  CANVAS: '0 2px 10px rgba(0, 0, 0, 0.15)',
  BUTTON: '0 2px 4px rgba(0, 0, 0, 0.1)',
  FOCUS: '0 0 0 3px rgba(0, 123, 255, 0.25)'
} as const;

// Layout dimensions
export const UI_LAYOUT = {
  // Aspect ratios
  GAME_ASPECT_RATIO: 0.514, // 360/700
  GAME_INVERSE_RATIO: 1.944, // 700/360

  // Container sizes
  CONTAINER_MAX_WIDTH: '450px',
  CONTAINER_MAX_HEIGHT: '875px',
  CONTAINER_MIN_WIDTH: '320px',
  CONTAINER_MIN_HEIGHT: '622px',

  // Section heights (percentages)
  HEADER_HEIGHT: '7.35%',
  MAIN_HEIGHT: '50%',
  CONTROLS_HEIGHT: '8.82%',
  INPUT_HEIGHT: '23.53%',
  STATS_HEIGHT: '8.82%',

  // Canvas sizing
  CANVAS_SIZE_RATIO: 0.88, // 88% of container

  // Grid layout
  NUMBER_GRID_COLUMNS: 9,
  STATS_GRID_COLUMNS: 3
} as const;

// Z-index layers
export const UI_Z_INDEX = {
  BASE: 1,
  DROPDOWN: 100,
  MODAL: 1000,
  TOOLTIP: 1500,
  OVERLAY: 2000
} as const;

// Border widths
export const UI_BORDERS = {
  THIN: 'max(1px, 0.28vw)',
  NORMAL: 'max(1px, 0.56vw)',
  THICK: 'max(2px, 0.83vw)'
} as const;