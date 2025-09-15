export enum GameStatus {
  INITIAL = 'initial',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  PAUSED = 'paused'
}

export enum Difficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
  EXPERT = 'expert'
}

export interface GameStatistics {
  startTime: Date;
  endTime?: Date;
  elapsedTime: number;
  moves: number;
  hints: number;
  mistakes: number;
}

export class GameState {
  constructor(
    public readonly id: string,
    public readonly difficulty: Difficulty,
    public readonly status: GameStatus,
    public readonly statistics: GameStatistics,
    public readonly selectedCell?: { row: number; col: number }
  ) {}

  static create(id: string, difficulty: Difficulty): GameState {
    return new GameState(
      id,
      difficulty,
      GameStatus.INITIAL,
      {
        startTime: new Date(),
        elapsedTime: 0,
        moves: 0,
        hints: 0,
        mistakes: 0
      }
    );
  }

  start(): GameState {
    return new GameState(
      this.id,
      this.difficulty,
      GameStatus.IN_PROGRESS,
      { ...this.statistics, startTime: new Date() },
      this.selectedCell
    );
  }

  complete(): GameState {
    return new GameState(
      this.id,
      this.difficulty,
      GameStatus.COMPLETED,
      { ...this.statistics, endTime: new Date() },
      this.selectedCell
    );
  }

  pause(): GameState {
    return new GameState(
      this.id,
      this.difficulty,
      GameStatus.PAUSED,
      this.statistics,
      this.selectedCell
    );
  }

  resume(): GameState {
    return new GameState(
      this.id,
      this.difficulty,
      GameStatus.IN_PROGRESS,
      this.statistics,
      this.selectedCell
    );
  }

  addMove(): GameState {
    return new GameState(
      this.id,
      this.difficulty,
      this.status,
      { ...this.statistics, moves: this.statistics.moves + 1 },
      this.selectedCell
    );
  }

  addHint(): GameState {
    return new GameState(
      this.id,
      this.difficulty,
      this.status,
      { ...this.statistics, hints: this.statistics.hints + 1 },
      this.selectedCell
    );
  }

  addMistake(): GameState {
    return new GameState(
      this.id,
      this.difficulty,
      this.status,
      { ...this.statistics, mistakes: this.statistics.mistakes + 1 },
      this.selectedCell
    );
  }

  selectCell(row: number, col: number): GameState {
    return new GameState(
      this.id,
      this.difficulty,
      this.status,
      this.statistics,
      { row, col }
    );
  }

  clearSelection(): GameState {
    return new GameState(
      this.id,
      this.difficulty,
      this.status,
      this.statistics,
      undefined
    );
  }
}