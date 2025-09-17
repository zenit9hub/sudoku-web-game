/**
 * Timing and animation constants
 * All timing-related values centralized for consistency
 */

// Timer intervals
export const TIMING_INTERVALS = {
  // Game timer
  GAME_TIMER_UPDATE: 1000, // 1 second

  // UI updates
  UI_DEBOUNCE: 150,
  UI_THROTTLE: 100,

  // Animation frames
  ANIMATION_FRAME: 16, // ~60fps

  // Auto-save intervals
  AUTO_SAVE: 30000, // 30 seconds
  STATE_PERSIST: 5000 // 5 seconds
} as const;

// Delay constants
export const TIMING_DELAYS = {
  // Initialization delays
  DOM_READY: 100,
  CANVAS_INIT: 200,
  COMPONENT_MOUNT: 50,

  // Resize delays
  WINDOW_RESIZE: 100,
  ORIENTATION_CHANGE: 300,
  RESPONSIVE_ADJUST: 150,

  // User interaction delays
  CLICK_DEBOUNCE: 200,
  INPUT_DEBOUNCE: 300,
  SEARCH_DEBOUNCE: 500,

  // Feedback delays
  SUCCESS_MESSAGE: 2000,
  ERROR_MESSAGE: 3000,
  INFO_MESSAGE: 1500,
  COMPLETION_DIALOG: 100,

  // Loading states
  LOADING_MIN: 500, // Minimum loading time to prevent flashing
  LOADING_TIMEOUT: 10000, // Maximum loading time before error

  // Game events
  MOVE_ANIMATION: 200,
  HIGHLIGHT_FADE: 300,
  SELECTION_ANIMATION: 150
} as const;

// Transition durations
export const TIMING_TRANSITIONS = {
  // Standard transitions
  FAST: '0.15s',
  NORMAL: '0.3s',
  SLOW: '0.5s',

  // Specific animations
  BUTTON_HOVER: '0.2s',
  COLOR_CHANGE: '0.3s',
  MODAL_FADE: '0.4s',
  PAGE_TRANSITION: '0.6s',

  // Easing functions
  EASE_OUT: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  EASE_IN: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  EASE_IN_OUT: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  BOUNCE: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
} as const;

// Timeout values
export const TIMING_TIMEOUTS = {
  // Network requests
  API_REQUEST: 30000, // 30 seconds
  FILE_LOAD: 10000, // 10 seconds

  // User sessions
  IDLE_WARNING: 1800000, // 30 minutes
  AUTO_LOGOUT: 3600000, // 1 hour

  // Game features
  HINT_COOLDOWN: 5000, // 5 seconds between hints
  UNDO_TIMEOUT: 10000, // 10 seconds to undo

  // Cache expiration
  CACHE_SHORT: 300000, // 5 minutes
  CACHE_MEDIUM: 1800000, // 30 minutes
  CACHE_LONG: 86400000 // 24 hours
} as const;

// Performance thresholds
export const TIMING_PERFORMANCE = {
  // Rendering performance
  TARGET_FPS: 60,
  MIN_FPS: 30,
  FRAME_BUDGET: 16.67, // milliseconds per frame at 60fps

  // Response time targets
  UI_RESPONSE_TARGET: 100, // milliseconds
  UI_RESPONSE_MAX: 300, // milliseconds

  // Memory cleanup intervals
  GARBAGE_COLLECT: 60000, // 1 minute
  MEMORY_CHECK: 30000 // 30 seconds
} as const;