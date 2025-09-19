import { SudokuGame } from '../../domain/models/SudokuGame';
import { SudokuGrid } from '../../domain/models/SudokuGrid';
import { GameState, Difficulty } from '../../domain/models/GameState';
import { Position } from '../../domain/models/Position';
import { CellValue } from '../../domain/models/CellValue';
import { SudokuValidationService } from '../../domain/services/SudokuValidationService';
import { SudokuGeneratorService } from '../../domain/services/SudokuGeneratorService';
import { LineCompletionDetectionService } from '../../domain/services/LineCompletionDetectionService';
import { LineCompletionEffect, EffectAnimation } from '../../domain/models/LineCompletionEffect';
import { GameRepository } from '../../infrastructure/interfaces/GameRepository';

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

  constructor(
    private readonly gameRepository: GameRepository,
    private readonly validationService: SudokuValidationService
  ) {
    this.lineCompletionDetectionService = new LineCompletionDetectionService();
  }

  async createNewGame(difficulty: Difficulty): Promise<SudokuGame> {
    const gameId = this.generateGameId();
    const grid = await this.generateSudokuGrid(difficulty);
    const state = GameState.create(gameId, difficulty);
    
    const game = SudokuGame.create(gameId, grid, state);
    await this.gameRepository.save(game);
    
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

    const validation = this.validationService.validateMove(game.grid, position, value);
    const newGrid = game.grid.setCell(position, value);

    let newState = game.state.addMove();
    if (!validation.isValid) {
      newState = newState.addMistake();
    }

    const updatedGame = game.updateGrid(newGrid).updateState(newState);
    const isComplete = this.validationService.isGridComplete(newGrid);

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
    await this.saveGame(resetGame);
    return resetGame;
  }

  async pauseGame(game: SudokuGame): Promise<SudokuGame> {
    const newState = game.state.pause();
    const updatedGame = game.updateState(newState);
    
    await this.saveGame(updatedGame);
    return updatedGame;
  }

  async resumeGame(game: SudokuGame): Promise<SudokuGame> {
    const newState = game.state.resume();
    const updatedGame = game.updateState(newState);
    
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