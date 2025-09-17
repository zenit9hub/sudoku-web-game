import { Theme } from './ThemeTypes';
import { UI_COLORS, UI_TYPOGRAPHY, UI_SPACING, UI_RADIUS, UI_SHADOWS, UI_Z_INDEX } from '../constants/UIConstants';
import { TIMING_TRANSITIONS } from '../constants/TimingConstants';

/**
 * Light theme configuration
 * Default theme with light color scheme
 */
export const lightTheme: Theme = {
  name: 'light',

  colors: {
    primary: UI_COLORS.PRIMARY,
    primaryHover: UI_COLORS.PRIMARY_HOVER,
    secondary: UI_COLORS.SECONDARY,
    secondaryHover: UI_COLORS.SECONDARY_HOVER,
    success: UI_COLORS.SUCCESS,
    danger: UI_COLORS.DANGER,
    warning: UI_COLORS.WARNING,
    info: UI_COLORS.INFO,

    background: {
      body: UI_COLORS.BODY_BG,
      container: UI_COLORS.CONTAINER_BG,
      section: UI_COLORS.SECTION_BG,
      button: UI_COLORS.BUTTON_BG
    },

    text: {
      primary: UI_COLORS.GRAY_DARK,
      secondary: UI_COLORS.GRAY,
      light: UI_COLORS.WHITE,
      muted: UI_COLORS.GRAY_MUTED
    },

    border: {
      primary: UI_COLORS.BORDER_PRIMARY,
      light: UI_COLORS.BORDER_LIGHT,
      section: UI_COLORS.BORDER_SECTION
    },

    shadows: {
      container: UI_SHADOWS.CONTAINER,
      canvas: UI_SHADOWS.CANVAS,
      button: UI_SHADOWS.BUTTON,
      focus: UI_SHADOWS.FOCUS
    }
  },

  typography: {
    fontFamily: UI_TYPOGRAPHY.FONT_FAMILY,
    fontSize: {
      xs: UI_TYPOGRAPHY.FONT_SIZE.XS,
      sm: UI_TYPOGRAPHY.FONT_SIZE.SM,
      base: UI_TYPOGRAPHY.FONT_SIZE.BASE,
      md: UI_TYPOGRAPHY.FONT_SIZE.MD,
      lg: UI_TYPOGRAPHY.FONT_SIZE.LG,
      xl: UI_TYPOGRAPHY.FONT_SIZE.XL
    },
    fontWeight: {
      normal: UI_TYPOGRAPHY.FONT_WEIGHT.NORMAL,
      medium: UI_TYPOGRAPHY.FONT_WEIGHT.MEDIUM,
      semibold: UI_TYPOGRAPHY.FONT_WEIGHT.SEMIBOLD,
      bold: UI_TYPOGRAPHY.FONT_WEIGHT.BOLD
    },
    lineHeight: {
      tight: UI_TYPOGRAPHY.LINE_HEIGHT.TIGHT,
      normal: UI_TYPOGRAPHY.LINE_HEIGHT.NORMAL,
      relaxed: UI_TYPOGRAPHY.LINE_HEIGHT.RELAXED
    }
  },

  spacing: {
    xs: UI_SPACING.XS,
    sm: UI_SPACING.SM,
    md: UI_SPACING.MD,
    lg: UI_SPACING.LG,
    xl: UI_SPACING.XL,
    xxl: UI_SPACING.XXL
  },

  borderRadius: {
    sm: UI_RADIUS.SM,
    md: UI_RADIUS.MD,
    lg: UI_RADIUS.LG,
    xl: UI_RADIUS.XL,
    circle: UI_RADIUS.CIRCLE
  },

  transitions: {
    fast: TIMING_TRANSITIONS.FAST,
    normal: TIMING_TRANSITIONS.NORMAL,
    slow: TIMING_TRANSITIONS.SLOW
  },

  zIndex: {
    base: UI_Z_INDEX.BASE,
    dropdown: UI_Z_INDEX.DROPDOWN,
    modal: UI_Z_INDEX.MODAL,
    tooltip: UI_Z_INDEX.TOOLTIP,
    overlay: UI_Z_INDEX.OVERLAY
  }
};