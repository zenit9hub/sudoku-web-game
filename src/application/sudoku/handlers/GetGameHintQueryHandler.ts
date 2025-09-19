import { QueryHandler, QueryResult, QueryResultFactory } from '../../common/Query.js';
import { GetGameHintQuery, GetGameHintResponse, HintInfo } from '../queries/GetGameHintQuery.js';
import { GameRepository } from '../../../domain/sudoku/repositories/GameRepository.js';
import { SudokuValidationService } from '../../../domain/sudoku/services/GridValidationService.js';
import { Position } from '../../../domain/sudoku/value-objects/Position.js';
import { CellValue } from '../../../domain/sudoku/value-objects/CellValue.js';

/**
 * 힌트 조회 쿼리 핸들러
 */
export class GetGameHintQueryHandler implements QueryHandler<GetGameHintQuery, QueryResult<GetGameHintResponse>> {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly validationService: SudokuValidationService
  ) {}

  async handle(query: GetGameHintQuery): Promise<QueryResult<GetGameHintResponse>> {
    const { gameId, maxHints = 1 } = query.request;

    const game = await this.gameRepository.load(gameId);
    if (!game) {
      const response: GetGameHintResponse = {
        hints: [],
        availableHints: 0
      };
      return QueryResultFactory.create(response);
    }

    const hints = this.generateHints(game.grid, maxHints);

    const response: GetGameHintResponse = {
      hints,
      availableHints: hints.length
    };

    return QueryResultFactory.create(response, {
      gameId,
      requestedMaxHints: maxHints,
      generatedAt: new Date().toISOString()
    });
  }

  private generateHints(grid: any, maxHints: number): HintInfo[] {
    const hints: HintInfo[] = [];
    const emptyCells: Position[] = [];

    // 빈 셀들 찾기
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const position = new Position(row, col);
        const cell = grid.getCell(position);
        if (cell.isEmpty()) {
          emptyCells.push(position);
        }
      }
    }

    // 각 빈 셀에 대해 가능한 값들 확인
    for (const position of emptyCells) {
      if (hints.length >= maxHints) break;

      for (let value = 1; value <= 9; value++) {
        const cellValue = new CellValue(value);
        const validation = this.validationService.validateMove(grid, position, cellValue);

        if (validation.isValid) {
          // 해당 위치에 유일한 가능한 값인지 확인
          const isOnlySolution = this.isOnlySolution(grid, position, cellValue);

          hints.push({
            position,
            suggestedValue: cellValue,
            reasoning: isOnlySolution ? 'Only possible value for this cell' : 'Valid move',
            difficulty: isOnlySolution ? 'easy' : 'medium'
          });
          break; // 첫 번째 유효한 값만 힌트로 제공
        }
      }
    }

    return hints.slice(0, maxHints);
  }

  private isOnlySolution(grid: any, position: Position, _value: CellValue): boolean {
    let validMoveCount = 0;

    for (let testValue = 1; testValue <= 9; testValue++) {
      const testCellValue = new CellValue(testValue);
      const validation = this.validationService.validateMove(grid, position, testCellValue);

      if (validation.isValid) {
        validMoveCount++;
        if (validMoveCount > 1) {
          return false;
        }
      }
    }

    return validMoveCount === 1;
  }
}