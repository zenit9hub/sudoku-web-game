import { Query, QueryResult } from '../../common/Query.js';
import { SudokuGame } from '../../../domain/sudoku/aggregates/Game.js';

/**
 * 게임 조회 쿼리 요청
 */
export interface GetGameRequest {
  readonly gameId: string;
}

/**
 * 게임 조회 쿼리 응답
 */
export interface GetGameResponse {
  readonly game: SudokuGame | null;
  readonly exists: boolean;
}

/**
 * 게임 조회 쿼리
 */
export class GetGameQuery implements Query<GetGameRequest> {
  readonly type = 'GET_GAME_QUERY';

  constructor(
    public readonly request: GetGameRequest
  ) {}
}