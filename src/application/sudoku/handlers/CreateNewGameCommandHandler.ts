import { CommandHandler, CommandResult, CommandResultFactory } from '../../common/Command.js';
import { CreateNewGameCommand, CreateNewGameResponse } from '../commands/CreateNewGameCommand.js';
import { SudokuGame } from '../../../domain/sudoku/aggregates/Game.js';
import { GameRepository } from '../../../domain/sudoku/repositories/GameRepository.js';
import { SudokuGeneratorService } from '../../../domain/sudoku/services/PuzzleGenerationService.js';
import { Difficulty, GameState } from '../../../domain/sudoku/entities/GameState.js';

/**
 * 새 게임 생성 커맨드 핸들러
 */
export class CreateNewGameCommandHandler implements CommandHandler<CreateNewGameCommand, CommandResult<CreateNewGameResponse>> {
  constructor(
    private readonly gameRepository: GameRepository
  ) {}

  async handle(command: CreateNewGameCommand): Promise<CommandResult<CreateNewGameResponse>> {
    try {
      const { difficulty, seed } = command.request;

      const gameId = this.generateGameId();
      const grid = await this.generateSudokuGrid(difficulty, seed);

      const gameState = GameState.create(gameId, difficulty);
      const game = SudokuGame.create(gameId, grid, gameState);
      await this.gameRepository.save(game);

      const response: CreateNewGameResponse = {
        gameId,
        game
      };

      return CommandResultFactory.success(response, {
        difficulty,
        seed: seed || 'auto-generated',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      return CommandResultFactory.failure(
        error instanceof Error ? error.message : 'Unknown error occurred'
      );
    }
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateSudokuGrid(difficulty: Difficulty, seed?: number): Promise<any> {
    console.log(`Generating new ${difficulty} puzzle...`);

    const actualSeed = seed || (Date.now() + Math.random() * 1000000);
    const generator = new SudokuGeneratorService(actualSeed);

    const puzzle = generator.generatePuzzle(difficulty, {
      useSymmetricRemoval: difficulty === Difficulty.EASY
    });

    console.log(`Successfully generated ${difficulty} puzzle with seed: ${actualSeed}`);
    return puzzle;
  }
}