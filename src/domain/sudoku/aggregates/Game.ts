import { SudokuGrid } from './Grid';
import { GameState } from '../entities/GameState';

export class SudokuGame {
  public readonly createdAt: Date;
  public readonly updatedAt: Date;

  constructor(
    public readonly id: string,
    private readonly _grid: SudokuGrid,
    private readonly _initialGrid: SudokuGrid,
    private readonly _state: GameState,
    createdAt?: Date,
    updatedAt?: Date
  ) {
    this.createdAt = createdAt || new Date();
    this.updatedAt = updatedAt || new Date();
  }

  static create(id: string, grid: SudokuGrid, state?: GameState): SudokuGame {
    const defaultState = state || GameState.createNew();
    return new SudokuGame(id, grid, grid.clone(), defaultState);
  }

  get grid(): SudokuGrid {
    return this._grid;
  }

  get initialGrid(): SudokuGrid {
    return this._initialGrid;
  }

  get state(): GameState {
    return this._state;
  }

  updateGrid(grid: SudokuGrid): SudokuGame {
    return new SudokuGame(
      this.id,
      grid,
      this._initialGrid,
      this._state,
      this.createdAt,
      new Date()
    );
  }

  updateState(state: GameState): SudokuGame {
    return new SudokuGame(
      this.id,
      this._grid,
      this._initialGrid,
      state,
      this.createdAt,
      new Date()
    );
  }

  reset(): SudokuGame {
    return new SudokuGame(
      this.id,
      this._initialGrid.clone(),
      this._initialGrid,
      GameState.create(this.id, this._state.difficulty),
      this.createdAt,
      new Date()
    );
  }

  clone(): SudokuGame {
    return new SudokuGame(
      this.id,
      this._grid.clone(),
      this._initialGrid.clone(),
      this._state,
      this.createdAt,
      this.updatedAt
    );
  }
}