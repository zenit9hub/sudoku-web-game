import { SudokuGame } from '../../domain/sudoku/aggregates/Game';
import { SudokuGrid } from '../../domain/sudoku/aggregates/Grid';
import { GameState, Difficulty } from '../../domain/sudoku/entities/GameState';
import { Position } from '../../domain/sudoku/value-objects/Position';
import { CellValue } from '../../domain/sudoku/value-objects/CellValue';
import { SudokuValidationService } from '../../domain/sudoku/services/GridValidationService';
import { SudokuGeneratorService } from '../../domain/sudoku/services/PuzzleGenerationService';
import { LineCompletionDetectionService } from '../../domain/sudoku/services/CompletionDetectionService';
import { LineCompletionEffect, EffectAnimation } from '../../domain/effects/entities/LineCompletionEffect';
import { GameRepository } from '../../domain/sudoku/repositories/GameRepository';
import { DomainEventPublisher } from '../../domain/common/events/DomainEventPublisher.js';
import {
  GameStarted,
  GameCompleted,
  HintRequested,
  GamePaused,
  GameResumed,
  GameReset
} from '../../domain/sudoku/events/SudokuDomainEvents.js';
import { EnhancedGridValidationService } from '../../domain/sudoku/services/EnhancedGridValidationService.js';

export interface MoveResult {
  success: boolean;
  game: SudokuGame;
  isComplete: boolean;
  conflictingPositions: Position[];
  lineCompletionEffects: LineCompletionEffect[];
}

export interface HintResult {
  success: boolean;
  game: SudokuGame;
  position: Position;
  value: CellValue;
}

export class GameService {
  private readonly lineCompletionDetectionService: LineCompletionDetectionService;
  private readonly enhancedValidationService: EnhancedGridValidationService;

  constructor(
    private readonly gameRepository: GameRepository,
    private readonly validationService: SudokuValidationService,
    private readonly eventPublisher?: DomainEventPublisher
  ) {
    this.lineCompletionDetectionService = new LineCompletionDetectionService();
    this.enhancedValidationService = new EnhancedGridValidationService(
      Difficulty.MEDIUM,
      this.eventPublisher
    );
  }

  async createNewGame(difficulty: Difficulty): Promise<SudokuGame> {
    const gameId = this.generateGameId();
    const grid = await this.generateSudokuGrid(difficulty);
    const state = GameState.create(gameId, difficulty);

    const game = SudokuGame.create(gameId, grid, state);
    await this.gameRepository.save(game);

    // 게임 시작 이벤트 발행
    if (this.eventPublisher) {
      await this.eventPublisher.publish(
        new GameStarted(gameId, difficulty, {
          gridSize: 9,
          clueCount: grid.getFilledCellCount()
        })
      );
    }

    return game;
  }

  async loadGame(gameId: string): Promise<SudokuGame | null> {
    return await this.gameRepository.load(gameId);
  }

  async saveGame(game: SudokuGame): Promise<void> {
    await this.gameRepository.save(game);
  }

  async deleteGame(gameId: string): Promise<void> {
    await this.gameRepository.delete(gameId);
  }

  async makeMove(game: SudokuGame, position: Position, value: CellValue): Promise<MoveResult> {
    const cell = game.grid.getCell(position);

    if (cell.isGiven) {
      return this.createMoveResult(false, game, false, [], []);
    }

    // 향상된 검증 서비스 사용 (도메인 이벤트 포함)
    const validation = await this.enhancedValidationService.validateMove(
      game.grid,
      position,
      value,
      game.state
    );

    const newGrid = game.grid.setCell(position, value);

    let newState = game.state.addMove();
    if (!validation.isValid) {
      newState = newState.addMistake();
    }

    const updatedGame = game.updateGrid(newGrid).updateState(newState);
    const isComplete = this.enhancedValidationService.isGridComplete(newGrid);

    // Detect line completions only for valid moves
    let lineCompletionEffects: LineCompletionEffect[] = [];
    if (validation.isValid && !value.isEmpty()) {
      const completions = this.lineCompletionDetectionService.detectCompletions(newGrid, position);
      // 기본적으로 RADIAL 이펙트 사용 (중심에서 퍼지는 효과)
      lineCompletionEffects = this.lineCompletionDetectionService.createEffectsFromCompletions(
        completions,
        EffectAnimation.RADIAL
      );
    }

    const finalGame = isComplete ? updatedGame.updateState(newState.complete()) : updatedGame;

    // 게임 완료 이벤트 발행
    if (isComplete && this.eventPublisher) {
      await this.eventPublisher.publish(
        new GameCompleted(game.state.gameId, game.state.difficulty, {
          elapsedTime: finalGame.state.elapsedTime,
          moveCount: finalGame.state.moveCount,
          mistakeCount: finalGame.state.mistakeCount,
          hintsUsed: finalGame.state.hintsUsed
        })
      );
    }

    await this.saveGame(finalGame);

    return this.createMoveResult(true, finalGame, isComplete, validation.conflictingPositions, lineCompletionEffects);
  }

  private createMoveResult(success: boolean, game: SudokuGame, isComplete: boolean, conflictingPositions: Position[], lineCompletionEffects: LineCompletionEffect[]): MoveResult {
    return { success, game, isComplete, conflictingPositions, lineCompletionEffects };
  }

  async getHint(game: SudokuGame): Promise<HintResult | null> {
    const emptyCells = game.grid.getEmptyCells();

    if (emptyCells.length === 0) {
      return null;
    }

    for (const cell of emptyCells) {
      const possibleValues = this.validationService.getPossibleValues(game.grid, cell.position);

      if (possibleValues.length === 1) {
        const hintValue = possibleValues[0];
        const newState = game.state.addHint();
        const updatedGame = game.updateState(newState);

        // 힌트 요청 이벤트 발행
        if (this.eventPublisher) {
          await this.eventPublisher.publish(
            new HintRequested(game.state.gameId, cell.position, hintValue, {
              hintsUsed: updatedGame.state.hintsUsed,
              hintType: 'naked_single',
              reasoning: `Only ${hintValue.value} is possible at this position`
            })
          );
        }

        await this.saveGame(updatedGame);

        return {
          success: true,
          game: updatedGame,
          position: cell.position,
          value: hintValue
        };
      }
    }

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const possibleValues = this.validationService.getPossibleValues(game.grid, randomCell.position);

    if (possibleValues.length > 0) {
      const hintValue = possibleValues[0];
      const newState = game.state.addHint();
      const updatedGame = game.updateState(newState);

      // 힌트 요청 이벤트 발행
      if (this.eventPublisher) {
        await this.eventPublisher.publish(
          new HintRequested(game.state.gameId, randomCell.position, hintValue, {
            hintsUsed: updatedGame.state.hintsUsed,
            hintType: 'random',
            reasoning: `One of ${possibleValues.length} possible values`
          })
        );
      }

      await this.saveGame(updatedGame);

      return {
        success: true,
        game: updatedGame,
        position: randomCell.position,
        value: hintValue
      };
    }

    return null;
  }

  async selectCell(game: SudokuGame, position: Position): Promise<SudokuGame> {
    const newState = game.state.selectCell(position.row, position.col);
    const updatedGame = game.updateState(newState);
    
    await this.saveGame(updatedGame);
    return updatedGame;
  }

  async clearSelection(game: SudokuGame): Promise<SudokuGame> {
    const newState = game.state.clearSelection();
    const updatedGame = game.updateState(newState);
    
    await this.saveGame(updatedGame);
    return updatedGame;
  }

  async resetGame(game: SudokuGame): Promise<SudokuGame> {
    const resetGame = game.reset();

    // 게임 리셋 이벤트 발행
    if (this.eventPublisher) {
      await this.eventPublisher.publish(
        new GameReset(game.state.gameId, {
          previousStats: {
            moveCount: game.state.moveCount,
            mistakeCount: game.state.mistakeCount,
            hintsUsed: game.state.hintsUsed,
            elapsedTime: game.state.elapsedTime
          }
        })
      );
    }

    await this.saveGame(resetGame);
    return resetGame;
  }

  async pauseGame(game: SudokuGame): Promise<SudokuGame> {
    const newState = game.state.pause();
    const updatedGame = game.updateState(newState);

    // 게임 일시정지 이벤트 발행
    if (this.eventPublisher) {
      await this.eventPublisher.publish(
        new GamePaused(game.state.gameId, {
          elapsedTime: updatedGame.state.elapsedTime,
          moveCount: updatedGame.state.moveCount
        })
      );
    }

    await this.saveGame(updatedGame);
    return updatedGame;
  }

  async resumeGame(game: SudokuGame): Promise<SudokuGame> {
    const newState = game.state.resume();
    const updatedGame = game.updateState(newState);

    // 게임 재개 이벤트 발행
    if (this.eventPublisher) {
      await this.eventPublisher.publish(
        new GameResumed(game.state.gameId, {
          elapsedTime: updatedGame.state.elapsedTime,
          moveCount: updatedGame.state.moveCount
        })
      );
    }

    await this.saveGame(updatedGame);
    return updatedGame;
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateSudokuGrid(difficulty: Difficulty): Promise<SudokuGrid> {
    console.log(`Generating new ${difficulty} puzzle...`);

    // 새로운 랜덤 시드로 생성기 초기화
    const seed = Date.now() + Math.random() * 1000000;
    const generator = new SudokuGeneratorService(seed);

    // 난이도에 따른 퍼즐 생성
    const puzzle = generator.generatePuzzle(difficulty, {
      useSymmetricRemoval: difficulty === Difficulty.EASY // Easy는 대칭 제거로 더 예쁘게
    });

    console.log(`Successfully generated ${difficulty} puzzle with seed: ${seed}`);
    return puzzle;
  }

}