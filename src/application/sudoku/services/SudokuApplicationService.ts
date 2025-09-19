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
import { DomainEventPublisher } from '../../../domain/common/events/DomainEventPublisher.js';
import { EnhancedGridValidationService } from '../../../domain/sudoku/services/EnhancedGridValidationService.js';
import { ComprehensiveValidationService } from '../../../domain/sudoku/services/ComprehensiveValidationService.js';
import { AdvancedPuzzleGenerationService } from '../../../domain/sudoku/services/AdvancedPuzzleGenerationService.js';

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
  private readonly enhancedValidationService: EnhancedGridValidationService;
  private readonly comprehensiveValidationService: ComprehensiveValidationService;
  private readonly advancedGenerationService: AdvancedPuzzleGenerationService;

  constructor(
    gameRepository: GameRepository,
    validationService: SudokuValidationService,
    completionDetectionService: LineCompletionDetectionService,
    eventPublisher?: DomainEventPublisher
  ) {
    // 향상된 도메인 서비스들 초기화
    this.enhancedValidationService = new EnhancedGridValidationService(
      undefined, // 기본 난이도 사용
      eventPublisher
    );
    this.comprehensiveValidationService = new ComprehensiveValidationService(
      undefined, // 기본 난이도 사용
      eventPublisher
    );
    this.advancedGenerationService = new AdvancedPuzzleGenerationService();

    // 기존 핸들러들 초기화 (향상된 서비스 사용)
    this.createNewGameHandler = new CreateNewGameCommandHandler(
      gameRepository,
      this.enhancedValidationService // 향상된 검증 서비스 사용
    );
    this.makeMoveHandler = new MakeMoveCommandHandler(
      gameRepository,
      this.enhancedValidationService, // 향상된 검증 서비스 사용
      completionDetectionService
    );
    this.getGameHandler = new GetGameQueryHandler(gameRepository);
    this.getHintHandler = new GetGameHintQueryHandler(
      gameRepository,
      this.enhancedValidationService // 향상된 검증 서비스 사용
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

  /**
   * 포괄적 움직임 검증 (새로운 기능)
   */
  async validateMoveComprehensively(request: {
    gameId: string;
    position: { row: number; col: number };
    value: number;
    validationLevel?: 'basic' | 'standard' | 'strict' | 'expert';
  }): Promise<{
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
  }> {
    const game = await this.getGameHandler.handle(new GetGameQuery({ gameId: request.gameId }));

    if (!game.data.game) {
      throw new Error('Game not found');
    }

    const position = GameMapper.positionFromDto(request.position);
    const value = GameMapper.cellValueFromNumber(request.value);
    const level = request.validationLevel || 'standard';

    const result = await this.comprehensiveValidationService.validateComprehensively(
      game.data.game.grid,
      position,
      value,
      level as any,
      game.data.game.state,
      {
        includeWarnings: true,
        includeSuggestions: true,
        useCache: true,
        checkPatterns: true,
        analyzeEfficiency: true
      }
    );

    return {
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
    };
  }

  /**
   * 실시간 움직임 검증 (타이핑 중)
   */
  async validateRealtime(request: {
    gameId: string;
    position: { row: number; col: number };
    partialValue: string;
  }): Promise<{
    canContinue: boolean;
    possibleValues: number[];
    immediateConflicts: { row: number; col: number }[];
  }> {
    const game = await this.getGameHandler.handle(new GetGameQuery({ gameId: request.gameId }));

    if (!game.data.game) {
      throw new Error('Game not found');
    }

    const position = GameMapper.positionFromDto(request.position);

    const result = await this.comprehensiveValidationService.validateRealtime(
      game.data.game.grid,
      position,
      request.partialValue,
      game.data.game.state
    );

    return {
      canContinue: result.canContinue,
      possibleValues: result.possibleValues,
      immediateConflicts: result.immediateConflicts.map(pos =>
        GameMapper.positionToDto(pos)
      )
    };
  }

  /**
   * 고급 퍼즐 생성 (새로운 기능)
   */
  async generateAdvancedPuzzle(request: {
    difficulty: string;
    useSymmetry?: boolean;
    targetClueCount?: number;
    maxAttempts?: number;
  }): Promise<{
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
  }> {
    const difficulty = request.difficulty as any;
    const options = {
      useSymmetricRemoval: request.useSymmetry || false,
      targetClueCount: request.targetClueCount,
      maxAttempts: request.maxAttempts || 100,
      validateUniqueness: true,
      optimizeAesthetics: true
    };

    const result = await this.advancedGenerationService.generateAdvancedPuzzle(
      difficulty,
      options
    );

    return {
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
    };
  }

  /**
   * 배치 검증 (그리드 전체)
   */
  async validateBatch(request: {
    gameId: string;
    validationLevel?: 'basic' | 'standard' | 'strict' | 'expert';
  }): Promise<{
    results: Record<string, {
      isValid: boolean;
      conflictingPositions: { row: number; col: number }[];
      errorMessages: string[];
      warnings: Array<{ type: string; message: string; severity: string }>;
    }>;
    overallValid: boolean;
    totalConflicts: number;
  }> {
    const game = await this.getGameHandler.handle(new GetGameQuery({ gameId: request.gameId }));

    if (!game.data.game) {
      throw new Error('Game not found');
    }

    const level = request.validationLevel || 'standard';
    const results = await this.comprehensiveValidationService.validateBatch(
      game.data.game.grid,
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
      results: processedResults,
      overallValid,
      totalConflicts
    };
  }
}