import { SudokuGame } from '../../../domain/sudoku/aggregates/Game';
import { Position } from '../../../domain/sudoku/value-objects/Position';
import { CellValue } from '../../../domain/sudoku/value-objects/CellValue';
import { GameRepository } from '../../../domain/sudoku/repositories/GameRepository';
import { SudokuValidationService } from '../../../domain/sudoku/services/GridValidationService';
import { LineCompletionDetectionService } from '../../../domain/sudoku/services/CompletionDetectionService';

export interface MakeMoveRequest {
  readonly gameId: string;
  readonly position: Position;
  readonly value: CellValue;
}

export interface MakeMoveResponse {
  readonly success: boolean;
  readonly game: SudokuGame;
  readonly isComplete: boolean;
  readonly conflictingPositions: Position[];
  readonly lineCompletions: Array<{
    type: 'row' | 'column';
    index: number;
    completionPosition: Position;
  }>;
  readonly error?: string;
}

/**
 * 숫자 입력 유스케이스
 *
 * 책임:
 * - 유효한 움직임 검증
 * - 게임 상태 업데이트
 * - 라인 완성 감지
 * - 게임 완료 체크
 */
export class MakeMoveUseCase {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly validationService: SudokuValidationService,
    private readonly completionDetectionService: LineCompletionDetectionService
  ) {}

  async execute(request: MakeMoveRequest): Promise<MakeMoveResponse> {
    try {
      const game = await this.gameRepository.load(request.gameId);
      if (!game) {
        return this.createErrorResponse('Game not found');
      }

      const cell = game.grid.getCell(request.position);
      if (cell.isGiven) {
        return this.createErrorResponse('Cannot modify given cells', game);
      }

      // 이동 검증
      const validation = this.validationService.validateMove(
        game.grid,
        request.position,
        request.value
      );

      // 그리드 업데이트
      const newGrid = game.grid.setCell(request.position, request.value);

      // 게임 상태 업데이트
      let newState = game.state.addMove();
      if (!validation.isValid) {
        newState = newState.addMistake();
      }

      const updatedGame = game.updateGrid(newGrid).updateState(newState);

      // 게임 완료 체크
      const isComplete = this.validationService.isGridComplete(newGrid);
      const finalGame = isComplete ? updatedGame.updateState(newState.complete()) : updatedGame;

      // 라인 완성 감지
      let lineCompletions: Array<{ type: 'row' | 'column'; index: number; completionPosition: Position }> = [];
      if (validation.isValid && !request.value.isEmpty()) {
        const completions = this.completionDetectionService.detectCompletions(newGrid, request.position);
        lineCompletions = completions.map(completion => ({
          type: completion.type === 'ROW_COMPLETED' ? 'row' as const : 'column' as const,
          index: completion.lineIndex,
          completionPosition: completion.completionPosition || request.position
        }));
      }

      // 게임 저장
      await this.gameRepository.save(finalGame);

      return {
        success: true,
        game: finalGame,
        isComplete,
        conflictingPositions: validation.conflictingPositions,
        lineCompletions
      };

    } catch (error) {
      return this.createErrorResponse(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  private createErrorResponse(error: string, game?: SudokuGame): MakeMoveResponse {
    return {
      success: false,
      game: game || null as any,
      isComplete: false,
      conflictingPositions: [],
      lineCompletions: [],
      error
    };
  }
}