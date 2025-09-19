import { SudokuGame } from '../aggregates/Game';
import { GameState } from '../entities/GameState';

export interface GameRepository {
  save(game: SudokuGame): Promise<void>;
  load(gameId: string): Promise<SudokuGame | null>;
  delete(gameId: string): Promise<void>;
  getAllGameIds(): Promise<string[]>;
  saveGameState(gameId: string, state: GameState): Promise<void>;
  loadGameState(gameId: string): Promise<GameState | null>;
}