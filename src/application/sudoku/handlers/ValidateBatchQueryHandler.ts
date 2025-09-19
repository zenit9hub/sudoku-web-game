import { ValidateBatchQuery } from '../queries/ValidateBatchQuery.js';
import { ComprehensiveValidationService } from '../../../domain/sudoku/services/ComprehensiveValidationService.js';
import { GameRepository } from '../../../domain/sudoku/repositories/GameRepository.js';
import { GameMapper } from '../mappers/GameMapper.js';

export interface ValidateBatchResult {
  success: boolean;
  data: {
    results: Record<string, {
      isValid: boolean;
      conflictingPositions: { row: number; col: number }[];
      errorMessages: string[];
      warnings: Array<{ type: string; message: string; severity: string }>;
    }>;
    overallValid: boolean;
    totalConflicts: number;
  };
  metadata?: Record<string, any>;
}

export class ValidateBatchQueryHandler {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly validationService: ComprehensiveValidationService
  ) {}

  async handle(query: ValidateBatchQuery): Promise<ValidateBatchResult> {
    try {
      const game = await this.gameRepository.load(query.data.gameId);

      if (!game) {
        return {
          success: false,
          data: {
            results: {},
            overallValid: false,
            totalConflicts: 0
          },
          metadata: {
            error: 'Game not found'
          }
        };
      }

      const level = query.data.validationLevel || 'standard';
      const results = await this.validationService.validateBatch(
        game.grid,
        level as any,
        { includeWarnings: true, includeSuggestions: false }
      );

      const processedResults: Record<string, any> = {};
      let totalConflicts = 0;
      let overallValid = true;

      for (const [key, result] of results.entries()) {
        processedResults[key] = {
          isValid: result.isValid,
          conflictingPositions: result.conflictingPositions.map(pos =>
            GameMapper.positionToDto(pos)
          ),
          errorMessages: result.errorMessages,
          warnings: result.warnings.map(warning => ({
            type: warning.type,
            message: warning.message,
            severity: warning.severity
          }))
        };

        if (!result.isValid) {
          overallValid = false;
          totalConflicts += result.conflictingPositions.length;
        }
      }

      return {
        success: true,
        data: {
          results: processedResults,
          overallValid,
          totalConflicts
        },
        metadata: {
          gameId: query.data.gameId,
          validationLevel: level,
          totalCellsValidated: results.size,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          results: {},
          overallValid: false,
          totalConflicts: 0
        },
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}