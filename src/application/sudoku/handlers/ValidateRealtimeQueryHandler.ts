import { ValidateRealtimeQuery } from '../queries/ValidateRealtimeQuery.js';
import { ComprehensiveValidationService } from '../../../domain/sudoku/services/ComprehensiveValidationService.js';
import { GameRepository } from '../../../domain/sudoku/repositories/GameRepository.js';
import { GameMapper } from '../mappers/GameMapper.js';

export interface ValidateRealtimeResult {
  success: boolean;
  data: {
    canContinue: boolean;
    possibleValues: number[];
    immediateConflicts: { row: number; col: number }[];
  };
  metadata?: Record<string, any>;
}

export class ValidateRealtimeQueryHandler {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly validationService: ComprehensiveValidationService
  ) {}

  async handle(query: ValidateRealtimeQuery): Promise<ValidateRealtimeResult> {
    try {
      const game = await this.gameRepository.load(query.data.gameId);

      if (!game) {
        return {
          success: false,
          data: {
            canContinue: false,
            possibleValues: [],
            immediateConflicts: []
          },
          metadata: {
            error: 'Game not found'
          }
        };
      }

      const position = GameMapper.positionFromDto(query.data.position);

      const result = await this.validationService.validateRealtime(
        game.grid,
        position,
        query.data.partialValue,
        game.state
      );

      return {
        success: true,
        data: {
          canContinue: result.canContinue,
          possibleValues: result.possibleValues,
          immediateConflicts: result.immediateConflicts.map(pos =>
            GameMapper.positionToDto(pos)
          )
        },
        metadata: {
          gameId: query.data.gameId,
          position: query.data.position,
          partialValue: query.data.partialValue,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          canContinue: false,
          possibleValues: [],
          immediateConflicts: []
        },
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}