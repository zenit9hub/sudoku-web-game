import { BusinessRuleEngine, RuleResult } from '../../common/rules/BusinessRule.js';
import { SudokuRuleFactory, SudokuMoveContext } from '../rules/SudokuBusinessRules.js';
import { Position } from '../value-objects/Position.js';
import { CellValue } from '../value-objects/CellValue.js';
import { Difficulty } from '../entities/GameState.js';
import { DomainEventPublisher } from '../../common/events/DomainEventPublisher.js';

/**
 * 포괄적 검증 서비스
 *
 * 다양한 검증 레벨과 상황별 규칙을 제공합니다.
 */

export enum ValidationLevel {
  BASIC = 'basic',           // 기본 스도쿠 규칙만
  STANDARD = 'standard',     // 기본 + 게임 상태 규칙
  STRICT = 'strict',         // 표준 + 난이도별 규칙
  EXPERT = 'expert'          // 모든 규칙 + 고급 전략 검증
}

export interface ComprehensiveValidationResult {
  readonly level: ValidationLevel;
  readonly isValid: boolean;
  readonly conflictingPositions: Position[];
  readonly errorMessages: string[];
  readonly violatedRules: string[];
  readonly warnings: ValidationWarning[];
  readonly suggestions: ValidationSuggestion[];
  readonly performance: ValidationPerformance;
}

export interface ValidationWarning {
  readonly type: 'efficiency' | 'style' | 'difficulty' | 'pattern';
  readonly message: string;
  readonly position?: Position;
  readonly severity: 'low' | 'medium' | 'high';
}

export interface ValidationSuggestion {
  readonly type: 'hint' | 'technique' | 'optimization' | 'alternative';
  readonly message: string;
  readonly position: Position;
  readonly value?: CellValue;
  readonly reasoning: string;
  readonly confidence: number; // 0-1
}

export interface ValidationPerformance {
  readonly validationTime: number;
  readonly rulesChecked: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
}

export interface ValidationContext {
  readonly grid: any;
  readonly position: Position;
  readonly value: CellValue;
  readonly gameState: any;
  readonly level: ValidationLevel;
  readonly options: ValidationOptions;
}

export interface ValidationOptions {
  readonly includeWarnings?: boolean;
  readonly includeSuggestions?: boolean;
  readonly useCache?: boolean;
  readonly checkPatterns?: boolean;
  readonly analyzeEfficiency?: boolean;
  readonly maxSuggestions?: number;
}

export class ComprehensiveValidationService {
  private engines: Map<ValidationLevel, BusinessRuleEngine<SudokuMoveContext>>;
  private eventPublisher?: DomainEventPublisher;
  private validationCache: Map<string, ComprehensiveValidationResult>;
  private performanceMetrics: Map<string, number>;

  constructor(
    difficulty: Difficulty = Difficulty.MEDIUM,
    eventPublisher?: DomainEventPublisher
  ) {
    this.engines = new Map();
    this.validationCache = new Map();
    this.performanceMetrics = new Map();
    this.eventPublisher = eventPublisher;

    this.initializeEngines(difficulty);
  }

  /**
   * 포괄적 검증 실행
   */
  async validateComprehensively(
    grid: any,
    position: Position,
    value: CellValue,
    level: ValidationLevel = ValidationLevel.STANDARD,
    gameState?: any,
    options: ValidationOptions = {}
  ): Promise<ComprehensiveValidationResult> {
    const startTime = performance.now();

    const defaultOptions: Required<ValidationOptions> = {
      includeWarnings: true,
      includeSuggestions: true,
      useCache: true,
      checkPatterns: true,
      analyzeEfficiency: true,
      maxSuggestions: 5,
      ...options
    };

    const context: ValidationContext = {
      grid,
      position,
      value,
      gameState: gameState || this.createDefaultGameState(),
      level,
      options: defaultOptions
    };

    // 캐시 확인
    const cacheKey = this.generateCacheKey(context);
    if (defaultOptions.useCache && this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey)!;
      this.updatePerformanceMetrics('cacheHits', 1);
      return cached;
    }

    this.updatePerformanceMetrics('cacheMisses', 1);

    // 기본 검증
    const basicResult = await this.performBasicValidation(context);

    // 경고 분석
    const warnings = defaultOptions.includeWarnings
      ? await this.analyzeWarnings(context, basicResult)
      : [];

    // 제안사항 생성
    const suggestions = defaultOptions.includeSuggestions
      ? await this.generateSuggestions(context, basicResult)
      : [];

    // 성능 메트릭 계산
    const validationTime = performance.now() - startTime;
    const performance: ValidationPerformance = {
      validationTime,
      rulesChecked: this.getEngineRuleCount(level),
      cacheHits: this.performanceMetrics.get('cacheHits') || 0,
      cacheMisses: this.performanceMetrics.get('cacheMisses') || 0
    };

    const result: ComprehensiveValidationResult = {
      level,
      isValid: basicResult.isValid,
      conflictingPositions: this.extractConflictingPositions(grid, position, value),
      errorMessages: basicResult.violatedRules.map(vr => vr.errorMessage),
      violatedRules: basicResult.violatedRules.map(vr => vr.rule.name),
      warnings,
      suggestions: suggestions.slice(0, defaultOptions.maxSuggestions),
      performance
    };

    // 캐시에 저장
    if (defaultOptions.useCache) {
      this.validationCache.set(cacheKey, result);
    }

    return result;
  }

  /**
   * 배치 검증 (그리드 전체)
   */
  async validateBatch(
    grid: any,
    level: ValidationLevel = ValidationLevel.STANDARD,
    options: ValidationOptions = {}
  ): Promise<Map<string, ComprehensiveValidationResult>> {
    const results = new Map<string, ComprehensiveValidationResult>();

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const position = new Position(row, col);
        const cell = grid.getCell(position);

        if (!cell.isEmpty()) {
          const positionKey = `${row},${col}`;
          const result = await this.validateComprehensively(
            grid, position, cell.value, level, undefined, options
          );
          results.set(positionKey, result);
        }
      }
    }

    return results;
  }

  /**
   * 실시간 검증 (타이핑 중)
   */
  async validateRealtime(
    grid: any,
    position: Position,
    partialValue: string,
    gameState?: any
  ): Promise<{
    canContinue: boolean;
    possibleValues: number[];
    immediateConflicts: Position[];
  }> {
    const possibleValues: number[] = [];
    const immediateConflicts: Position[] = [];

    // 부분 입력에 대한 즉시 피드백
    if (partialValue === '') {
      // 빈 입력: 모든 가능한 값 반환
      for (let num = 1; num <= 9; num++) {
        const testValue = new CellValue(num);
        const result = await this.validateComprehensively(
          grid, position, testValue, ValidationLevel.BASIC, gameState,
          { includeWarnings: false, includeSuggestions: false, useCache: true }
        );

        if (result.isValid) {
          possibleValues.push(num);
        }
      }

      return {
        canContinue: true,
        possibleValues,
        immediateConflicts: []
      };
    }

    const numValue = parseInt(partialValue);
    if (isNaN(numValue) || numValue < 1 || numValue > 9) {
      return {
        canContinue: false,
        possibleValues: [],
        immediateConflicts: []
      };
    }

    const testValue = new CellValue(numValue);
    const result = await this.validateComprehensively(
      grid, position, testValue, ValidationLevel.BASIC, gameState,
      { includeWarnings: false, includeSuggestions: false, useCache: true }
    );

    return {
      canContinue: result.isValid,
      possibleValues: result.isValid ? [numValue] : [],
      immediateConflicts: result.conflictingPositions
    };
  }

  /**
   * 검증 레벨 변경
   */
  setValidationLevel(level: ValidationLevel): void {
    // 필요시 엔진 재초기화
  }

  /**
   * 난이도 변경
   */
  setDifficulty(difficulty: Difficulty): void {
    this.initializeEngines(difficulty);
    this.clearCache();
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.validationCache.clear();
    this.performanceMetrics.clear();
  }

  /**
   * 성능 통계 조회
   */
  getPerformanceStats(): Record<string, number> {
    return {
      cacheSize: this.validationCache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      averageValidationTime: this.calculateAverageValidationTime(),
      ...Object.fromEntries(this.performanceMetrics)
    };
  }

  // Private 메소드들

  private initializeEngines(difficulty: Difficulty): void {
    this.engines.set(ValidationLevel.BASIC, SudokuRuleFactory.createMoveValidationEngine());
    this.engines.set(ValidationLevel.STANDARD, SudokuRuleFactory.createMoveValidationEngine());
    this.engines.set(ValidationLevel.STRICT, SudokuRuleFactory.createDifficultySpecificEngine(difficulty));
    this.engines.set(ValidationLevel.EXPERT, SudokuRuleFactory.createDifficultySpecificEngine(difficulty));
  }

  private async performBasicValidation(context: ValidationContext): Promise<RuleResult> {
    const engine = this.engines.get(context.level);
    if (!engine) {
      throw new Error(`No validation engine for level: ${context.level}`);
    }

    const moveContext: SudokuMoveContext = {
      grid: context.grid,
      position: context.position,
      value: context.value,
      gameState: context.gameState
    };

    return engine.validate(moveContext);
  }

  private async analyzeWarnings(
    context: ValidationContext,
    basicResult: RuleResult
  ): Promise<ValidationWarning[]> {
    const warnings: ValidationWarning[] = [];

    if (context.options.analyzeEfficiency && basicResult.isValid) {
      // 효율성 경고
      const efficiencyWarning = await this.checkEfficiency(context);
      if (efficiencyWarning) {
        warnings.push(efficiencyWarning);
      }
    }

    if (context.options.checkPatterns) {
      // 패턴 경고
      const patternWarnings = await this.checkPatterns(context);
      warnings.push(...patternWarnings);
    }

    return warnings;
  }

  private async generateSuggestions(
    context: ValidationContext,
    basicResult: RuleResult
  ): Promise<ValidationSuggestion[]> {
    const suggestions: ValidationSuggestion[] = [];

    if (!basicResult.isValid) {
      // 오류 수정 제안
      const correctionSuggestions = await this.generateCorrectionSuggestions(context);
      suggestions.push(...correctionSuggestions);
    } else {
      // 최적화 제안
      const optimizationSuggestions = await this.generateOptimizationSuggestions(context);
      suggestions.push(...optimizationSuggestions);
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private async checkEfficiency(context: ValidationContext): Promise<ValidationWarning | null> {
    // 더 효율적인 움직임이 있는지 확인
    const betterMoves = await this.findBetterMoves(context);

    if (betterMoves.length > 0) {
      return {
        type: 'efficiency',
        message: 'There might be more efficient moves available',
        position: context.position,
        severity: 'low'
      };
    }

    return null;
  }

  private async checkPatterns(context: ValidationContext): Promise<ValidationWarning[]> {
    const warnings: ValidationWarning[] = [];

    // 일반적인 실수 패턴 검사
    if (await this.isCommonMistakePattern(context)) {
      warnings.push({
        type: 'pattern',
        message: 'This move follows a common mistake pattern',
        position: context.position,
        severity: 'medium'
      });
    }

    return warnings;
  }

  private async generateCorrectionSuggestions(context: ValidationContext): Promise<ValidationSuggestion[]> {
    const suggestions: ValidationSuggestion[] = [];

    // 가능한 값들 찾기
    for (let num = 1; num <= 9; num++) {
      const testValue = new CellValue(num);
      const testResult = await this.performBasicValidation({
        ...context,
        value: testValue
      });

      if (testResult.isValid) {
        suggestions.push({
          type: 'alternative',
          message: `Try ${num} instead`,
          position: context.position,
          value: testValue,
          reasoning: `${num} is a valid choice for this position`,
          confidence: 0.8
        });
      }
    }

    return suggestions;
  }

  private async generateOptimizationSuggestions(context: ValidationContext): Promise<ValidationSuggestion[]> {
    const suggestions: ValidationSuggestion[] = [];

    // 전략적 힌트 생성
    const strategicMoves = await this.findStrategicMoves(context);

    for (const move of strategicMoves) {
      suggestions.push({
        type: 'technique',
        message: move.description,
        position: move.position,
        value: move.value,
        reasoning: move.reasoning,
        confidence: move.confidence
      });
    }

    return suggestions;
  }

  private extractConflictingPositions(grid: any, position: Position, value: CellValue): Position[] {
    const conflicts: Position[] = [];

    if (value.isEmpty()) return conflicts;

    // 기존 로직 재사용
    // ... (이전 구현과 동일)

    return conflicts;
  }

  private generateCacheKey(context: ValidationContext): string {
    return `${context.level}_${context.position.row}_${context.position.col}_${context.value.value}_${context.gameState?.moveCount || 0}`;
  }

  private createDefaultGameState(): any {
    return {
      isComplete: false,
      isPaused: false,
      mistakeCount: 0,
      moveCount: 0
    };
  }

  private getEngineRuleCount(level: ValidationLevel): number {
    const engine = this.engines.get(level);
    return engine ? engine.getRuleCount() : 0;
  }

  private updatePerformanceMetrics(key: string, increment: number): void {
    const current = this.performanceMetrics.get(key) || 0;
    this.performanceMetrics.set(key, current + increment);
  }

  private calculateCacheHitRate(): number {
    const hits = this.performanceMetrics.get('cacheHits') || 0;
    const misses = this.performanceMetrics.get('cacheMisses') || 0;
    const total = hits + misses;
    return total > 0 ? hits / total : 0;
  }

  private calculateAverageValidationTime(): number {
    // 구현 필요
    return 0;
  }

  private async findBetterMoves(context: ValidationContext): Promise<any[]> {
    // 더 나은 움직임 찾기 로직
    return [];
  }

  private async isCommonMistakePattern(context: ValidationContext): Promise<boolean> {
    // 일반적인 실수 패턴 검사 로직
    return false;
  }

  private async findStrategicMoves(context: ValidationContext): Promise<any[]> {
    // 전략적 움직임 찾기 로직
    return [];
  }
}