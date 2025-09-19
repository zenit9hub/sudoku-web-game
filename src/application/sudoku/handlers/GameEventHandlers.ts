import { DomainEventHandler, DomainEvent } from '../../../domain/common/events/DomainEvent.js';
import {
  GameStarted,
  MoveAttempted,
  ValidMoveCompleted,
  InvalidMoveAttempted,
  GameCompleted,
  HintRequested,
  GamePaused,
  GameResumed,
  GameReset
} from '../../../domain/sudoku/events/SudokuDomainEvents.js';

/**
 * 게임 시작 이벤트 핸들러
 */
export class GameStartedHandler implements DomainEventHandler<GameStarted> {
  async handle(event: GameStarted): Promise<void> {
    console.log(`🎮 Game started: ${event.aggregateId}`, {
      difficulty: event.data.difficulty,
      gridSize: event.data.gridSize,
      clueCount: event.data.clueCount,
      timestamp: event.occurredOn
    });

    // 여기에 게임 시작 시 필요한 로직 추가
    // 예: 통계 기록, 알림 발송, 로깅 등
  }
}

/**
 * 움직임 시도 이벤트 핸들러
 */
export class MoveAttemptedHandler implements DomainEventHandler<MoveAttempted> {
  async handle(event: MoveAttempted): Promise<void> {
    console.log(`📝 Move attempted: ${event.aggregateId}`, {
      position: event.data.position,
      value: event.data.value,
      isValid: event.data.isValid,
      conflictingPositions: event.data.conflictingPositions?.length || 0
    });

    // 움직임 시도 통계 업데이트
    this.updateMoveStatistics(event);
  }

  private updateMoveStatistics(_event: MoveAttempted): void {
    // 통계 로직 구현
    // 예: 정확도 계산, 패턴 분석 등
  }
}

/**
 * 유효한 움직임 완료 이벤트 핸들러
 */
export class ValidMoveCompletedHandler implements DomainEventHandler<ValidMoveCompleted> {
  async handle(event: ValidMoveCompleted): Promise<void> {
    console.log(`✅ Valid move completed: ${event.aggregateId}`, {
      position: event.data.position,
      value: event.data.value,
      moveCount: event.data.moveCount
    });

    // 성공적인 움직임에 대한 처리
    this.recordSuccessfulMove(event);
    this.checkForAchievements(event);
  }

  private recordSuccessfulMove(_event: ValidMoveCompleted): void {
    // 성공적인 움직임 기록
  }

  private checkForAchievements(_event: ValidMoveCompleted): void {
    // 업적 체크 로직
    // 예: 연속 정답, 빠른 해결 등
  }
}

/**
 * 무효한 움직임 시도 이벤트 핸들러
 */
export class InvalidMoveAttemptedHandler implements DomainEventHandler<InvalidMoveAttempted> {
  async handle(event: InvalidMoveAttempted): Promise<void> {
    console.log(`❌ Invalid move attempted: ${event.aggregateId}`, {
      position: event.data.position,
      value: event.data.value,
      conflictingPositions: event.data.conflictingPositions,
      mistakeCount: event.data.mistakeCount
    });

    // 오류 움직임에 대한 처리
    this.recordMistake(event);
    this.provideFeedback(event);
  }

  private recordMistake(_event: InvalidMoveAttempted): void {
    // 실수 패턴 분석 및 기록
  }

  private provideFeedback(_event: InvalidMoveAttempted): void {
    // 사용자 피드백 제공
    // 예: 힌트 제안, 학습 자료 추천 등
  }
}

/**
 * 게임 완료 이벤트 핸들러
 */
export class GameCompletedHandler implements DomainEventHandler<GameCompleted> {
  async handle(event: GameCompleted): Promise<void> {
    console.log(`🎉 Game completed: ${event.aggregateId}`, {
      difficulty: event.data.difficulty,
      elapsedTime: event.data.elapsedTime,
      moveCount: event.data.moveCount,
      mistakeCount: event.data.mistakeCount,
      hintsUsed: event.data.hintsUsed
    });

    // 게임 완료 처리
    this.recordGameCompletion(event);
    this.calculateScore(event);
    this.updatePlayerStats(event);
    this.triggerCelebration(event);
  }

  private recordGameCompletion(event: GameCompleted): void {
    // 게임 완료 기록
    const completionData = {
      gameId: event.aggregateId,
      difficulty: event.data.difficulty,
      stats: {
        elapsedTime: event.data.elapsedTime,
        moveCount: event.data.moveCount,
        mistakeCount: event.data.mistakeCount,
        hintsUsed: event.data.hintsUsed
      },
      completedAt: event.occurredOn
    };

    // 로컬 스토리지나 서버에 저장
    console.log('Recording game completion:', completionData);
  }

  private calculateScore(event: GameCompleted): number {
    // 점수 계산 로직
    const baseScore = 1000;
    const timeBonus = Math.max(0, 300 - Math.floor(event.data.elapsedTime / 1000));
    const mistakePenalty = event.data.mistakeCount * 50;
    const hintPenalty = event.data.hintsUsed * 25;

    const finalScore = baseScore + timeBonus - mistakePenalty - hintPenalty;

    console.log(`Score calculated: ${finalScore}`, {
      baseScore,
      timeBonus,
      mistakePenalty,
      hintPenalty
    });

    return Math.max(0, finalScore);
  }

  private updatePlayerStats(_event: GameCompleted): void {
    // 플레이어 통계 업데이트
    // 예: 평균 완주 시간, 최고 기록, 난이도별 통계 등
  }

  private triggerCelebration(_event: GameCompleted): void {
    // 축하 애니메이션이나 효과 트리거
  }
}

/**
 * 힌트 요청 이벤트 핸들러
 */
export class HintRequestedHandler implements DomainEventHandler<HintRequested> {
  async handle(event: HintRequested): Promise<void> {
    console.log(`💡 Hint requested: ${event.aggregateId}`, {
      position: event.data.position,
      suggestedValue: event.data.suggestedValue,
      hintsUsed: event.data.hintsUsed,
      hintType: event.data.hintType,
      reasoning: event.data.reasoning
    });

    // 힌트 사용 통계 업데이트
    this.trackHintUsage(event);
    this.provideEducationalContent(event);
  }

  private trackHintUsage(_event: HintRequested): void {
    // 힌트 사용 패턴 분석
    // 어떤 상황에서 힌트를 많이 사용하는지 등
  }

  private provideEducationalContent(_event: HintRequested): void {
    // 교육적 콘텐츠 제공
    // 해당 힌트 타입에 대한 설명이나 전략 가이드
  }
}

/**
 * 게임 일시정지 이벤트 핸들러
 */
export class GamePausedHandler implements DomainEventHandler<GamePaused> {
  async handle(event: GamePaused): Promise<void> {
    console.log(`⏸️ Game paused: ${event.aggregateId}`, {
      elapsedTime: event.data.elapsedTime,
      moveCount: event.data.moveCount
    });

    // 일시정지 시 필요한 처리
    this.saveGameState(event);
  }

  private saveGameState(_event: GamePaused): void {
    // 게임 상태 즉시 저장
    // 예상치 못한 종료에 대비
  }
}

/**
 * 게임 재개 이벤트 핸들러
 */
export class GameResumedHandler implements DomainEventHandler<GameResumed> {
  async handle(event: GameResumed): Promise<void> {
    console.log(`▶️ Game resumed: ${event.aggregateId}`, {
      elapsedTime: event.data.elapsedTime,
      moveCount: event.data.moveCount
    });

    // 게임 재개 시 필요한 처리
    this.restoreGameContext(event);
  }

  private restoreGameContext(_event: GameResumed): void {
    // 게임 컨텍스트 복원
    // UI 상태 복원, 타이머 재시작 등
  }
}

/**
 * 게임 리셋 이벤트 핸들러
 */
export class GameResetHandler implements DomainEventHandler<GameReset> {
  async handle(event: GameReset): Promise<void> {
    console.log(`🔄 Game reset: ${event.aggregateId}`, {
      previousStats: event.data.previousStats
    });

    // 게임 리셋 처리
    this.recordResetAction(event);
    this.analyzeResetReason(event);
  }

  private recordResetAction(_event: GameReset): void {
    // 리셋 행동 기록
    // 어떤 상황에서 리셋하는지 분석
  }

  private analyzeResetReason(_event: GameReset): void {
    // 리셋 이유 분석
    // 난이도 조정이나 게임 밸런스에 활용
  }
}

/**
 * 이벤트 핸들러 레지스트리
 */
export class ApplicationEventHandlerRegistry {
  private handlers: Map<string, DomainEventHandler<any>[]> = new Map();

  constructor() {
    this.registerDefaultHandlers();
  }

  private registerDefaultHandlers(): void {
    this.register('GameStarted', new GameStartedHandler());
    this.register('MoveAttempted', new MoveAttemptedHandler());
    this.register('ValidMoveCompleted', new ValidMoveCompletedHandler());
    this.register('InvalidMoveAttempted', new InvalidMoveAttemptedHandler());
    this.register('GameCompleted', new GameCompletedHandler());
    this.register('HintRequested', new HintRequestedHandler());
    this.register('GamePaused', new GamePausedHandler());
    this.register('GameResumed', new GameResumedHandler());
    this.register('GameReset', new GameResetHandler());
  }

  register<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
  }

  getHandlers(eventType: string): DomainEventHandler<any>[] {
    return this.handlers.get(eventType) || [];
  }

  async handleEvent(event: DomainEvent): Promise<void> {
    const handlers = this.getHandlers(event.eventType);

    for (const handler of handlers) {
      try {
        await handler.handle(event);
      } catch (error) {
        console.error(`Error handling event ${event.eventType}:`, error);
        // 에러가 발생해도 다른 핸들러는 계속 실행
      }
    }
  }
}