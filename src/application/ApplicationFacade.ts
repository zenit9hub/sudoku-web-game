import { SudokuApplicationService } from './sudoku/services/SudokuApplicationService.js';
import { EffectApplicationService } from './effects/services/EffectApplicationService.js';
import { GameRepository } from '../domain/sudoku/repositories/GameRepository.js';
import { SudokuValidationService } from '../domain/sudoku/services/GridValidationService.js';
import { LineCompletionDetectionService } from '../domain/sudoku/services/CompletionDetectionService.js';
import { EffectSequenceManager } from '../domain/effects/services/EffectSequenceManager.js';
import { EffectFactory } from '../domain/effects/services/EffectFactory.js';

/**
 * 애플리케이션 파사드
 *
 * 모든 애플리케이션 서비스를 통합하여 단일 진입점을 제공합니다.
 * 클라이언트 코드가 다양한 서비스들과 직접 상호작용하지 않도록
 * 간소화된 인터페이스를 제공합니다.
 */
export class ApplicationFacade {
  public readonly sudoku: SudokuApplicationService;
  public readonly effects: EffectApplicationService;

  constructor(
    gameRepository: GameRepository,
    validationService: SudokuValidationService,
    completionDetectionService: LineCompletionDetectionService,
    effectSequenceManager: EffectSequenceManager,
    effectFactory: EffectFactory
  ) {
    // 스도쿠 애플리케이션 서비스 초기화
    this.sudoku = new SudokuApplicationService(
      gameRepository,
      validationService,
      completionDetectionService
    );

    // 이펙트 애플리케이션 서비스 초기화
    this.effects = new EffectApplicationService(
      effectSequenceManager,
      effectFactory
    );
  }

  /**
   * 팩토리 메서드 - 의존성 주입을 통한 파사드 생성
   */
  static create(
    gameRepository: GameRepository,
    validationService: SudokuValidationService,
    completionDetectionService: LineCompletionDetectionService,
    effectSequenceManager?: EffectSequenceManager,
    effectFactory?: EffectFactory
  ): ApplicationFacade {
    // 기본 이펙트 서비스들 생성
    const defaultEffectSequenceManager = effectSequenceManager || new EffectSequenceManager();
    const defaultEffectFactory = effectFactory || new EffectFactory();

    return new ApplicationFacade(
      gameRepository,
      validationService,
      completionDetectionService,
      defaultEffectSequenceManager,
      defaultEffectFactory
    );
  }

  /**
   * 애플리케이션 종료 시 리소스 정리
   */
  async cleanup(): Promise<void> {
    // 이펙트 시스템 정리
    await this.effects.cancelAllSequences();
    await this.effects.cleanup();

    // 필요시 다른 리소스 정리 작업 추가
  }

  /**
   * 애플리케이션 상태 점검
   */
  async healthCheck(): Promise<{
    sudoku: { available: boolean };
    effects: { available: boolean; statistics: any };
    overall: { healthy: boolean };
  }> {
    try {
      // 스도쿠 서비스 상태 확인
      const sudokuHealthy = true; // 실제로는 더 복잡한 체크 로직

      // 이펙트 서비스 상태 확인
      const effectStatistics = await this.effects.getStatistics();
      const effectsHealthy = true; // 실제로는 더 복잡한 체크 로직

      return {
        sudoku: { available: sudokuHealthy },
        effects: { available: effectsHealthy, statistics: effectStatistics },
        overall: { healthy: sudokuHealthy && effectsHealthy }
      };

    } catch (error) {
      return {
        sudoku: { available: false },
        effects: { available: false, statistics: null },
        overall: { healthy: false }
      };
    }
  }
}