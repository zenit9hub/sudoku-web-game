import { GenerateAdvancedPuzzleCommand } from '../commands/GenerateAdvancedPuzzleCommand.js';
import { AdvancedPuzzleGenerationService } from '../../../domain/sudoku/services/AdvancedPuzzleGenerationService.js';
import { GameMapper } from '../mappers/GameMapper.js';

export interface GenerateAdvancedPuzzleResult {
  success: boolean;
  data: {
    puzzle: any;
    solution: any;
    quality: {
      difficulty: string;
      clueCount: number;
      symmetryScore: number;
      aestheticScore: number;
      uniqueness: boolean;
    };
    generationTime: number;
    attempts: number;
  };
  metadata?: Record<string, any>;
}

export class GenerateAdvancedPuzzleCommandHandler {
  constructor(
    private readonly generationService: AdvancedPuzzleGenerationService
  ) {}

  async handle(command: GenerateAdvancedPuzzleCommand): Promise<GenerateAdvancedPuzzleResult> {
    try {
      const difficulty = command.request.difficulty as any;
      const options = {
        useSymmetricRemoval: command.request.useSymmetry || false,
        targetClueCount: command.request.targetClueCount,
        maxAttempts: command.request.maxAttempts || 100,
        validateUniqueness: true,
        optimizeAesthetics: true
      };

      const result = await this.generationService.generateAdvancedPuzzle(
        difficulty,
        options
      );

      return {
        success: true,
        data: {
          puzzle: GameMapper.gridToDto(result.puzzle),
          solution: GameMapper.gridToDto(result.solution),
          quality: {
            difficulty: result.quality.difficulty,
            clueCount: result.quality.clueCount,
            symmetryScore: result.quality.symmetryScore,
            aestheticScore: result.quality.aestheticScore,
            uniqueness: result.quality.uniqueness
          },
          generationTime: result.generationTime,
          attempts: result.attempts
        },
        metadata: {
          requestedDifficulty: command.request.difficulty,
          options,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          puzzle: null,
          solution: null,
          quality: {
            difficulty: 'unknown',
            clueCount: 0,
            symmetryScore: 0,
            aestheticScore: 0,
            uniqueness: false
          },
          generationTime: 0,
          attempts: 0
        },
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}