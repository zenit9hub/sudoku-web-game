import { GameRepository } from '../interfaces/GameRepository.js';
import { SudokuGame } from '../../domain/models/SudokuGame.js';
import { GameState, GameStatus, Difficulty } from '../../domain/models/GameState.js';
import { SudokuGrid } from '../../domain/models/SudokuGrid.js';
import { Cell } from '../../domain/models/Cell.js';
import { Position } from '../../domain/models/Position.js';
import { CellValue } from '../../domain/models/CellValue.js';

interface SerializedGame {
  id: string;
  grid: SerializedCell[][];
  initialGrid: SerializedCell[][];
  state: SerializedGameState;
}

interface SerializedCell {
  row: number;
  col: number;
  value: number | null;
  isGiven: boolean;
  isHighlighted: boolean;
  hasError: boolean;
}

interface SerializedGameState {
  id: string;
  difficulty: Difficulty;
  status: GameStatus;
  statistics: {
    startTime: string;
    endTime?: string;
    elapsedTime: number;
    moves: number;
    hints: number;
    mistakes: number;
  };
  selectedCell?: { row: number; col: number };
}

export class LocalStorageGameRepository implements GameRepository {
  private readonly STORAGE_PREFIX = 'sudoku_game_';
  private readonly STATE_PREFIX = 'sudoku_state_';
  private readonly GAMES_LIST_KEY = 'sudoku_games_list';

  async save(game: SudokuGame): Promise<void> {
    const serialized = this.serializeGame(game);
    const key = this.STORAGE_PREFIX + game.id;
    
    localStorage.setItem(key, JSON.stringify(serialized));
    
    const gameIds = await this.getAllGameIds();
    if (!gameIds.includes(game.id)) {
      gameIds.push(game.id);
      localStorage.setItem(this.GAMES_LIST_KEY, JSON.stringify(gameIds));
    }
  }

  async load(gameId: string): Promise<SudokuGame | null> {
    const key = this.STORAGE_PREFIX + gameId;
    const data = localStorage.getItem(key);
    
    if (!data) {
      return null;
    }

    try {
      const serialized: SerializedGame = JSON.parse(data);
      return this.deserializeGame(serialized);
    } catch (error) {
      console.error('Failed to deserialize game:', error);
      return null;
    }
  }

  async delete(gameId: string): Promise<void> {
    const gameKey = this.STORAGE_PREFIX + gameId;
    const stateKey = this.STATE_PREFIX + gameId;
    
    localStorage.removeItem(gameKey);
    localStorage.removeItem(stateKey);
    
    const gameIds = await this.getAllGameIds();
    const filteredIds = gameIds.filter(id => id !== gameId);
    localStorage.setItem(this.GAMES_LIST_KEY, JSON.stringify(filteredIds));
  }

  async getAllGameIds(): Promise<string[]> {
    const data = localStorage.getItem(this.GAMES_LIST_KEY);
    return data ? JSON.parse(data) : [];
  }

  async saveGameState(gameId: string, state: GameState): Promise<void> {
    const key = this.STATE_PREFIX + gameId;
    const serialized = this.serializeGameState(state);
    localStorage.setItem(key, JSON.stringify(serialized));
  }

  async loadGameState(gameId: string): Promise<GameState | null> {
    const key = this.STATE_PREFIX + gameId;
    const data = localStorage.getItem(key);
    
    if (!data) {
      return null;
    }

    try {
      const serialized: SerializedGameState = JSON.parse(data);
      return this.deserializeGameState(serialized);
    } catch (error) {
      console.error('Failed to deserialize game state:', error);
      return null;
    }
  }

  private serializeGame(game: SudokuGame): SerializedGame {
    return {
      id: game.id,
      grid: this.serializeGrid(game.grid),
      initialGrid: this.serializeGrid(game.initialGrid),
      state: this.serializeGameState(game.state)
    };
  }

  private serializeGrid(grid: SudokuGrid): SerializedCell[][] {
    return Array.from({ length: 9 }, (_, row) =>
      Array.from({ length: 9 }, (_, col) => {
        const cell = grid.getCell(new Position(row, col));
        return {
          row,
          col,
          value: cell.value.value,
          isGiven: cell.isGiven,
          isHighlighted: cell.isHighlighted,
          hasError: cell.hasError
        };
      })
    );
  }

  private serializeGameState(state: GameState): SerializedGameState {
    return {
      id: state.id,
      difficulty: state.difficulty,
      status: state.status,
      statistics: {
        startTime: state.statistics.startTime.toISOString(),
        endTime: state.statistics.endTime?.toISOString(),
        elapsedTime: state.statistics.elapsedTime,
        moves: state.statistics.moves,
        hints: state.statistics.hints,
        mistakes: state.statistics.mistakes
      },
      selectedCell: state.selectedCell
    };
  }

  private deserializeGame(serialized: SerializedGame): SudokuGame {
    const grid = this.deserializeGrid(serialized.grid);
    const initialGrid = this.deserializeGrid(serialized.initialGrid);
    const state = this.deserializeGameState(serialized.state);
    
    return new SudokuGame(serialized.id, grid, initialGrid, state);
  }

  private deserializeGrid(serializedGrid: SerializedCell[][]): SudokuGrid {
    const cells = serializedGrid.map(row =>
      row.map(serializedCell => {
        const position = new Position(serializedCell.row, serializedCell.col);
        const value = serializedCell.value 
          ? CellValue.from(serializedCell.value) 
          : CellValue.empty();
        
        return new Cell(position, value, {
          isGiven: serializedCell.isGiven,
          isHighlighted: serializedCell.isHighlighted,
          hasError: serializedCell.hasError
        });
      })
    );
    
    return new SudokuGrid(cells);
  }

  private deserializeGameState(serialized: SerializedGameState): GameState {
    return new GameState(
      serialized.id,
      serialized.difficulty,
      serialized.status,
      {
        startTime: new Date(serialized.statistics.startTime),
        endTime: serialized.statistics.endTime 
          ? new Date(serialized.statistics.endTime) 
          : undefined,
        elapsedTime: serialized.statistics.elapsedTime,
        moves: serialized.statistics.moves,
        hints: serialized.statistics.hints,
        mistakes: serialized.statistics.mistakes
      },
      serialized.selectedCell
    );
  }
}