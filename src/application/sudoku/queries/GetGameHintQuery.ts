import { Query } from '../../common/Query.js';
import { Position } from '../../../domain/sudoku/value-objects/Position.js';
import { CellValue } from '../../../domain/sudoku/value-objects/CellValue.js';

/**
 * 힌트 조회 쿼리 요청
 */
export interface GetGameHintRequest {
  readonly gameId: string;
  readonly maxHints?: number;
}

/**
 * 힌트 정보
 */
export interface HintInfo {
  readonly position: Position;
  readonly suggestedValue: CellValue;
  readonly reasoning: string;
  readonly difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * 힌트 조회 쿼리 응답
 */
export interface GetGameHintResponse {
  readonly hints: HintInfo[];
  readonly availableHints: number;
}

/**
 * 힌트 조회 쿼리
 */
export class GetGameHintQuery implements Query<GetGameHintRequest> {
  readonly type = 'GET_GAME_HINT_QUERY';

  constructor(
    public readonly request: GetGameHintRequest
  ) {}
}