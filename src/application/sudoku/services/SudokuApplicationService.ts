import { CreateNewGameCommandHandler } from '../handlers/CreateNewGameCommandHandler.js';
import { MakeMoveCommandHandler } from '../handlers/MakeMoveCommandHandler.js';
import { GetGameQueryHandler } from '../handlers/GetGameQueryHandler.js';
import { GetGameHintQueryHandler } from '../handlers/GetGameHintQueryHandler.js';
import { GameMapper } from '../mappers/GameMapper.js';
import {
  CreateNewGameRequestDto,
  CreateNewGameResponseDto,
  MakeMoveRequestDto,
  MakeMoveResponseDto
} from '../dtos/CommandDtos.js';
import {
  GetGameRequestDto,
  GetGameResponseDto,
  GetGameHintRequestDto,
  GetGameHintResponseDto
} from '../dtos/QueryDtos.js';
import { CreateNewGameCommand } from '../commands/CreateNewGameCommand.js';
import { MakeMoveCommand } from '../commands/MakeMoveCommand.js';
import { GetGameQuery } from '../queries/GetGameQuery.js';
import { GetGameHintQuery } from '../queries/GetGameHintQuery.js';
import { GameRepository } from '../../../domain/sudoku/repositories/GameRepository.js';
import { SudokuValidationService } from '../../../domain/sudoku/services/GridValidationService.js';
import { LineCompletionDetectionService } from '../../../domain/sudoku/services/CompletionDetectionService.js';

/**
 * 스도쿠 애플리케이션 서비스
 *
 * 모든 스도쿠 관련 비즈니스 로직을 조합하고 조율합니다.
 * DTO 기반의 깔끔한 인터페이스를 제공합니다.
 */
export class SudokuApplicationService {
  private readonly createNewGameHandler: CreateNewGameCommandHandler;
  private readonly makeMoveHandler: MakeMoveCommandHandler;
  private readonly getGameHandler: GetGameQueryHandler;
  private readonly getHintHandler: GetGameHintQueryHandler;

  constructor(
    gameRepository: GameRepository,
    validationService: SudokuValidationService,
    completionDetectionService: LineCompletionDetectionService
  ) {
    this.createNewGameHandler = new CreateNewGameCommandHandler(
      gameRepository,
      validationService
    );
    this.makeMoveHandler = new MakeMoveCommandHandler(
      gameRepository,
      validationService,
      completionDetectionService
    );
    this.getGameHandler = new GetGameQueryHandler(gameRepository);
    this.getHintHandler = new GetGameHintQueryHandler(
      gameRepository,
      validationService
    );
  }

  /**
   * 새 게임 생성
   */
  async createNewGame(request: CreateNewGameRequestDto): Promise<CreateNewGameResponseDto> {
    const command = new CreateNewGameCommand({
      difficulty: request.difficulty,
      seed: request.seed
    });

    const result = await this.createNewGameHandler.handle(command);

    if (!result.success || !result.data) {
      return {
        gameId: '',
        game: null as any,
        success: false,
        metadata: {
          difficulty: request.difficulty,
          seed: 'failed',
          timestamp: new Date().toISOString()
        }
      };
    }

    return {
      gameId: result.data.gameId,
      game: GameMapper.toDto(result.data.game),
      success: true,
      metadata: result.metadata as any
    };
  }

  /**
   * 수 입력
   */
  async makeMove(request: MakeMoveRequestDto): Promise<MakeMoveResponseDto> {
    const command = new MakeMoveCommand({
      gameId: request.gameId,
      position: GameMapper.positionFromDto(request.position),
      value: GameMapper.cellValueFromNumber(request.value)
    });

    const result = await this.makeMoveHandler.handle(command);

    if (!result.success || !result.data) {
      return {
        game: null as any,
        isComplete: false,
        conflictingPositions: [],
        lineCompletions: [],
        success: false
      };
    }

    return {
      game: GameMapper.toDto(result.data.game),
      isComplete: result.data.isComplete,
      conflictingPositions: result.data.conflictingPositions.map(pos =>
        GameMapper.positionToDto(pos)
      ),
      lineCompletions: result.data.lineCompletions.map(completion => ({
        type: completion.type,
        index: completion.index,
        completionPosition: GameMapper.positionToDto(completion.completionPosition)
      })),
      success: true,
      metadata: result.metadata as any
    };
  }

  /**
   * 게임 조회
   */
  async getGame(request: GetGameRequestDto): Promise<GetGameResponseDto> {
    const query = new GetGameQuery({
      gameId: request.gameId
    });

    const result = await this.getGameHandler.handle(query);

    return {
      game: result.data.game ? GameMapper.toDto(result.data.game) : null,
      exists: result.data.exists,
      metadata: result.metadata as any
    };
  }

  /**
   * 힌트 조회
   */
  async getGameHint(request: GetGameHintRequestDto): Promise<GetGameHintResponseDto> {
    const query = new GetGameHintQuery({
      gameId: request.gameId,
      maxHints: request.maxHints
    });

    const result = await this.getHintHandler.handle(query);

    return {
      hints: result.data.hints.map(hint => ({
        position: GameMapper.positionToDto(hint.position),
        suggestedValue: GameMapper.cellValueToNumber(hint.suggestedValue),
        reasoning: hint.reasoning,
        difficulty: hint.difficulty
      })),
      availableHints: result.data.availableHints,
      metadata: result.metadata as any
    };
  }
}