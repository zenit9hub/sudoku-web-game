import { CommandHandler, CommandResult, CommandResultFactory } from '../../common/Command.js';
import { MakeMoveCommand, MakeMoveResponse } from '../commands/MakeMoveCommand.js';
import { GameRepository } from '../../../domain/sudoku/repositories/GameRepository.js';
import { SudokuValidationService } from '../../../domain/sudoku/services/GridValidationService.js';
import { LineCompletionDetectionService } from '../../../domain/sudoku/services/CompletionDetectionService.js';
import { Position } from '../../../domain/sudoku/value-objects/Position.js';

/**
 * 수 입력 커맨드 핸들러
 */
export class MakeMoveCommandHandler implements CommandHandler<MakeMoveCommand, CommandResult<MakeMoveResponse>> {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly validationService: SudokuValidationService,
    private readonly completionDetectionService: LineCompletionDetectionService
  ) {}

  async handle(command: MakeMoveCommand): Promise<CommandResult<MakeMoveResponse>> {
    try {
      const { gameId, position, value } = command.request;

      const game = await this.gameRepository.load(gameId);
      if (!game) {
        return CommandResultFactory.failure('Game not found');
      }

      const cell = game.grid.getCell(position);
      if (cell.isGiven) {
        return CommandResultFactory.failure('Cannot modify given cells');
      }

      // 이동 검증
      const validation = this.validationService.validateMove(
        game.grid,
        position,
        value
      );

      // 그리드 업데이트
      const newGrid = game.grid.setCell(position, value);

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
      if (validation.isValid && !value.isEmpty()) {
        const completions = this.completionDetectionService.detectCompletions(newGrid, position);
        lineCompletions = completions.map(completion => ({
          type: completion.type === 'ROW_COMPLETED' ? 'row' as const : 'column' as const,
          index: completion.lineIndex,
          completionPosition: completion.completionPosition || position
        }));
      }

      // 게임 저장
      await this.gameRepository.save(finalGame);

      const response: MakeMoveResponse = {
        game: finalGame,
        isComplete,
        conflictingPositions: validation.conflictingPositions,
        lineCompletions
      };

      return CommandResultFactory.success(response, {
        moveCount: finalGame.state.moveCount,
        mistakeCount: finalGame.state.mistakeCount,
        hasLineCompletions: lineCompletions.length > 0,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      return CommandResultFactory.failure(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }
}