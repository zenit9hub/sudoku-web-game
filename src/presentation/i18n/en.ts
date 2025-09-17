import { Translations } from './types';

/**
 * English translations
 */
export const en: Translations = {
  game: {
    title: '🧩 Sudoku Game',
    newGame: 'New Game',
    reset: 'Reset',
    hint: 'Hint',
    clear: 'Clear',
    numberInput: 'Number Input'
  },

  messages: {
    selectCell: 'Select a cell and enter a number',
    inputNumber: 'Enter a number',
    cellFixed: 'This is a fixed number',
    gameComplete: '🎉 Congratulations! You completed the puzzle!',
    congratulations: 'Congratulations!'
  },

  stats: {
    time: 'Time',
    progress: 'Progress',
    hints: 'Hints',
    moves: 'Moves'
  },

  dynamic: {
    cellSelected: (row: number, col: number) => `Selected: (${row + 1}, ${col + 1})`,
    cellValue: (row: number, col: number, value: string) =>
      `Selected: (${row + 1}, ${col + 1}) - Current value: ${value}`,
    gameStats: (time: string, moves: number, hints: number) =>
      `⏱️ Time: ${time}\n🎯 Moves: ${moves}\n💡 Hints: ${hints}`
  }
};