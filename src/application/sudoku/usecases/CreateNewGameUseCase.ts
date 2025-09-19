import { SudokuGame } from '../../../domain/sudoku/aggregates/Game';
import { Difficulty, GameState } from '../../../domain/sudoku/entities/GameState';
import { GameRepository } from '../../../domain/sudoku/repositories/GameRepository';
import { SudokuValidationService } from '../../../domain/sudoku/services/GridValidationService';
import { SudokuGeneratorService } from '../../../domain/sudoku/services/PuzzleGenerationService';

export interface CreateNewGameRequest {
  readonly difficulty: Difficulty;
  readonly seed?: number;
}

export interface CreateNewGameResponse {
  readonly gameId: string;
  readonly game: SudokuGame;
  readonly success: boolean;
  readonly error?: string;
}

/**
 * 새 게임 생성 유스케이스
 *
 * 책임:
 * - 새로운 스도쿠 퍼즐 생성
 * - 게임 상태 초기화
 * - 게임 저장
 */
export class CreateNewGameUseCase {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly _validationService: SudokuValidationService
  ) {}

  async execute(request: CreateNewGameRequest): Promise<CreateNewGameResponse> {
    try {
      const gameId = this.generateGameId();
      const grid = await this.generateSudokuGrid(request.difficulty, request.seed);

      const gameState = GameState.create(gameId, difficulty);
      const game = SudokuGame.create(gameId, grid, gameState);
      await this.gameRepository.save(game);

      return {
        gameId,
        game,
        success: true
      };
    } catch (error) {
      return {
        gameId: '',
        game: null as any,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateSudokuGrid(difficulty: Difficulty, seed?: number): Promise<any> {
    console.log(`Generating new ${difficulty} puzzle...`);

    // 새로운 랜덤 시드로 생성기 초기화
    const actualSeed = seed || (Date.now() + Math.random() * 1000000);
    const generator = new SudokuGeneratorService(actualSeed);

    // 난이도에 따른 퍼즐 생성
    const puzzle = generator.generatePuzzle(difficulty, {
      useSymmetricRemoval: difficulty === Difficulty.EASY // Easy는 대칭 제거로 더 예쁘게
    });

    console.log(`Successfully generated ${difficulty} puzzle with seed: ${actualSeed}`);
    return puzzle;
  }
}