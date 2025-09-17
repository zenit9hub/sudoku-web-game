/**
 * Internationalization types and interfaces
 */

export type SupportedLocale = 'ko' | 'en';

/**
 * Translation keys structure
 */
export interface Translations {
  // Game UI
  game: {
    title: string;
    newGame: string;
    reset: string;
    hint: string;
    clear: string;
    numberInput: string;
  };

  // Game states
  messages: {
    selectCell: string;
    inputNumber: string;
    cellFixed: string;
    gameComplete: string;
    congratulations: string;
  };

  // Statistics
  stats: {
    time: string;
    progress: string;
    hints: string;
    moves: string;
  };

  // Dynamic messages
  dynamic: {
    cellSelected: (row: number, col: number) => string;
    cellValue: (row: number, col: number, value: string) => string;
    gameStats: (time: string, moves: number, hints: number) => string;
  };
}

/**
 * Translation function type
 */
export type TranslationFunction = (key: string, params?: any) => string;