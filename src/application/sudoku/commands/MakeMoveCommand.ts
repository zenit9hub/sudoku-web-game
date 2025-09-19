import { Command, CommandResult } from '../../common/Command.js';
import { SudokuGame } from '../../../domain/sudoku/aggregates/Game.js';
import { Position } from '../../../domain/sudoku/value-objects/Position.js';
import { CellValue } from '../../../domain/sudoku/value-objects/CellValue.js';

/**
 * 수 입력 커맨드 요청
 */
export interface MakeMoveRequest {
  readonly gameId: string;
  readonly position: Position;
  readonly value: CellValue;
}

/**
 * 수 입력 커맨드 응답
 */
export interface MakeMoveResponse {
  readonly game: SudokuGame;
  readonly isComplete: boolean;
  readonly conflictingPositions: Position[];
  readonly lineCompletions: Array<{
    type: 'row' | 'column';
    index: number;
    completionPosition: Position;
  }>;
}

/**
 * 수 입력 커맨드
 */
export class MakeMoveCommand implements Command<MakeMoveRequest> {
  readonly type = 'MAKE_MOVE_COMMAND';

  constructor(
    public readonly request: MakeMoveRequest
  ) {}
}