import { Theme } from './ThemeTypes';
import { lightTheme } from './LightTheme';

/**
 * Dark theme configuration
 * Dark color scheme variant
 */
export const darkTheme: Theme = {
  ...lightTheme,
  name: 'dark',

  colors: {
    ...lightTheme.colors,

    // Primary colors remain the same for consistency
    primary: '#4a9eff',
    primaryHover: '#357abd',

    // Inverted backgrounds
    background: {
      body: '#121212',
      container: '#1e1e1e',
      section: '#2a2a2a',
      button: '#333333'
    },

    // Inverted text colors
    text: {
      primary: '#ffffff',
      secondary: '#b3b3b3',
      light: '#ffffff',
      muted: '#888888'
    },

    // Adjusted borders for dark theme
    border: {
      primary: '#555555',
      light: '#444444',
      section: '#333333'
    },

    // Enhanced shadows for dark theme
    shadows: {
      container: '0 4px 20px rgba(0, 0, 0, 0.3)',
      canvas: '0 2px 10px rgba(0, 0, 0, 0.4)',
      button: '0 2px 4px rgba(0, 0, 0, 0.2)',
      focus: '0 0 0 3px rgba(74, 158, 255, 0.4)'
    }
  }
};