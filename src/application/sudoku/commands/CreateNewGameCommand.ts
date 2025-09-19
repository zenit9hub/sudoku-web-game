import { Command, CommandResult } from '../../common/Command.js';
import { SudokuGame } from '../../../domain/sudoku/aggregates/Game.js';
import { Difficulty } from '../../../domain/sudoku/entities/GameState.js';

/**
 * 새 게임 생성 커맨드 요청
 */
export interface CreateNewGameRequest {
  readonly difficulty: Difficulty;
  readonly seed?: number;
}

/**
 * 새 게임 생성 커맨드 응답
 */
export interface CreateNewGameResponse {
  readonly gameId: string;
  readonly game: SudokuGame;
}

/**
 * 새 게임 생성 커맨드
 */
export class CreateNewGameCommand implements Command<CreateNewGameRequest> {
  readonly type = 'CREATE_NEW_GAME_COMMAND';

  constructor(
    public readonly request: CreateNewGameRequest
  ) {}
}