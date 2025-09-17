import { SudokuGame } from '../../domain/models/SudokuGame';
import { Position } from '../../domain/models/Position';

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