import { SudokuGame } from '../../domain/models/SudokuGame.js';
import { Position } from '../../domain/models/Position.js';

export interface RenderOptions {
  highlightErrors: boolean;
  showPossibleValues: boolean;
  theme: 'light' | 'dark';
}

export interface GameRenderer {
  render(game: SudokuGame, options?: Partial<RenderOptions>): void;
  getPositionFromCoords(x: number, y: number): Position | null;
  resize(width: number, height: number): void;
  clear(): void;
}