import { SudokuGame } from '../../domain/models/SudokuGame';
import { GameState } from '../../domain/models/GameState';

export interface GameRepository {
  save(game: SudokuGame): Promise<void>;
  load(gameId: string): Promise<SudokuGame | null>;
  delete(gameId: string): Promise<void>;
  getAllGameIds(): Promise<string[]>;
  saveGameState(gameId: string, state: GameState): Promise<void>;
  loadGameState(gameId: string): Promise<GameState | null>;
}