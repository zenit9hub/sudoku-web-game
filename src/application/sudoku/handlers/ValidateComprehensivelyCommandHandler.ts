import { ValidateComprehensivelyCommand } from '../commands/ValidateComprehensivelyCommand.js';
import { ComprehensiveValidationService } from '../../../domain/sudoku/services/ComprehensiveValidationService.js';
import { GameRepository } from '../../../domain/sudoku/repositories/GameRepository.js';
import { GameMapper } from '../mappers/GameMapper.js';

export interface ValidateComprehensivelyResult {
  success: boolean;
  data: {
    isValid: boolean;
    conflictingPositions: { row: number; col: number }[];
    errorMessages: string[];
    warnings: Array<{
      type: string;
      message: string;
      severity: string;
    }>;
    suggestions: Array<{
      type: string;
      message: string;
      position: { row: number; col: number };
      reasoning: string;
      confidence: number;
    }>;
    performance: {
      validationTime: number;
      rulesChecked: number;
    };
  };
  metadata?: Record<string, any>;
}

export class ValidateComprehensivelyCommandHandler {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly validationService: ComprehensiveValidationService
  ) {}

  async handle(command: ValidateComprehensivelyCommand): Promise<ValidateComprehensivelyResult> {
    try {
      const game = await this.gameRepository.load(command.data.gameId);

      if (!game) {
        return {
          success: false,
          data: {
            isValid: false,
            conflictingPositions: [],
            errorMessages: ['Game not found'],
            warnings: [],
            suggestions: [],
            performance: { validationTime: 0, rulesChecked: 0 }
          }
        };
      }

      const position = GameMapper.positionFromDto(command.data.position);
      const value = GameMapper.cellValueFromNumber(command.data.value);
      const level = command.data.validationLevel || 'standard';

      const result = await this.validationService.validateComprehensively(
        game.grid,
        position,
        value,
        level as any,
        game.state,
        {
          includeWarnings: true,
          includeSuggestions: true,
          useCache: true,
          checkPatterns: true,
          analyzeEfficiency: true
        }
      );

      return {
        success: true,
        data: {
          isValid: result.isValid,
          conflictingPositions: result.conflictingPositions.map(pos =>
            GameMapper.positionToDto(pos)
          ),
          errorMessages: result.errorMessages,
          warnings: result.warnings.map(warning => ({
            type: warning.type,
            message: warning.message,
            severity: warning.severity
          })),
          suggestions: result.suggestions.map(suggestion => ({
            type: suggestion.type,
            message: suggestion.message,
            position: GameMapper.positionToDto(suggestion.position),
            reasoning: suggestion.reasoning,
            confidence: suggestion.confidence
          })),
          performance: {
            validationTime: result.performance.validationTime,
            rulesChecked: result.performance.rulesChecked
          }
        },
        metadata: {
          validationLevel: level,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: {
          isValid: false,
          conflictingPositions: [],
          errorMessages: [`Validation error: ${error}`],
          warnings: [],
          suggestions: [],
          performance: { validationTime: 0, rulesChecked: 0 }
        }
      };
    }
  }
}