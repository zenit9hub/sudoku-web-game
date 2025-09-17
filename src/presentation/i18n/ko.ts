import { Translations } from './types';

/**
 * Korean translations
 */
export const ko: Translations = {
  game: {
    title: '🧩 Sudoku Game',
    newGame: 'New Game',
    reset: 'Reset',
    hint: 'Hint',
    clear: '지우기',
    numberInput: '숫자 입력'
  },

  messages: {
    selectCell: '칸을 선택하고 숫자를 입력하세요',
    inputNumber: '숫자를 입력하세요',
    cellFixed: '고정된 숫자입니다',
    gameComplete: '🎉 축하합니다! 퍼즐을 완성했습니다!',
    congratulations: '축하합니다!'
  },

  stats: {
    time: 'Time',
    progress: 'Progress',
    hints: 'Hints',
    moves: '이동'
  },

  dynamic: {
    cellSelected: (row: number, col: number) => `선택: (${row + 1}, ${col + 1})`,
    cellValue: (row: number, col: number, value: string) =>
      `선택: (${row + 1}, ${col + 1}) - 현재 값: ${value}`,
    gameStats: (time: string, moves: number, hints: number) =>
      `⏱️ 시간: ${time}\n🎯 이동: ${moves}회\n💡 힌트: ${hints}회`
  }
};