import { EffectSequenceId } from '../value-objects/EffectSequenceId';
import { SequenceState } from '../value-objects/SequenceState';
import { LineCompletionEffect } from '../entities/LineCompletionEffect';
import {
  EffectSequenceStarted,
  EffectDomainEvent
} from '../events/EffectDomainEvent';

export interface EffectSequenceOptions {
  readonly allowConcurrent?: boolean;  // 동시 실행 허용 여부
  readonly autoStart?: boolean;        // 자동 시작 여부
  readonly repeatCount?: number;       // 반복 횟수 (0 = 무한, 1 = 기본값)
  readonly delayBetweenEffects?: number; // 이펙트 간 지연 시간 (ms)
}

export class EffectSequence {
  private readonly effects: LineCompletionEffect[] = [];
  private currentEffectIndex: number = 0;
  private startTime?: number;
  private completedCount: number = 0;
  private readonly domainEvents: EffectDomainEvent[] = [];

  constructor(
    public readonly id: EffectSequenceId,
    public readonly state: SequenceState = SequenceState.PENDING,
    public readonly options: EffectSequenceOptions = {},
    effects: LineCompletionEffect[] = [],
    startTime?: number,
    currentEffectIndex: number = 0,
    completedCount: number = 0
  ) {
    this.effects = [...effects];
    this.startTime = startTime;
    this.currentEffectIndex = currentEffectIndex;
    this.completedCount = completedCount;
  }

  static create(
    effects: LineCompletionEffect[],
    options: EffectSequenceOptions = {}
  ): EffectSequence {
    if (effects.length === 0) {
      throw new Error('EffectSequence must contain at least one effect');
    }

    const id = EffectSequenceId.generate();
    const defaultOptions: EffectSequenceOptions = {
      allowConcurrent: false,
      autoStart: true,
      repeatCount: 1,
      delayBetweenEffects: 0,
      ...options
    };

    return new EffectSequence(
      id,
      SequenceState.PENDING,
      defaultOptions,
      effects
    );
  }

  addEffect(effect: LineCompletionEffect): EffectSequence {
    if (this.state === SequenceState.RUNNING) {
      throw new Error('Cannot add effects to a running sequence');
    }

    const newEffects = [...this.effects, effect];
    return new EffectSequence(
      this.id,
      this.state,
      this.options,
      newEffects,
      this.startTime,
      this.currentEffectIndex,
      this.completedCount
    );
  }

  start(): EffectSequence {
    if (this.state === SequenceState.RUNNING) {
      return this;
    }

    if (this.effects.length === 0) {
      throw new Error('Cannot start sequence with no effects');
    }

    const startTime = Date.now();
    const startedSequence = new EffectSequence(
      this.id,
      SequenceState.RUNNING,
      this.options,
      this.effects.map((effect, index) =>
        index === 0 ? effect.start() : effect
      ),
      startTime,
      0,
      this.completedCount
    );

    // 시작 이벤트 발행
    startedSequence.addDomainEvent(
      new EffectSequenceStarted(this.id, this.effects.length)
    );

    return startedSequence;
  }

  pause(): EffectSequence {
    if (this.state !== SequenceState.RUNNING) {
      return this;
    }

    return new EffectSequence(
      this.id,
      SequenceState.PAUSED,
      this.options,
      this.effects,
      this.startTime,
      this.currentEffectIndex,
      this.completedCount
    );
  }

  resume(): EffectSequence {
    if (this.state !== SequenceState.PAUSED) {
      return this;
    }

    return new EffectSequence(
      this.id,
      SequenceState.RUNNING,
      this.options,
      this.effects,
      this.startTime,
      this.currentEffectIndex,
      this.completedCount
    );
  }

  cancel(): EffectSequence {
    if (this.state === SequenceState.COMPLETED || this.state === SequenceState.CANCELLED) {
      return this;
    }

    return new EffectSequence(
      this.id,
      SequenceState.CANCELLED,
      this.options,
      this.effects,
      this.startTime,
      this.currentEffectIndex,
      this.completedCount
    );
  }

  update(currentTime: number): EffectSequence {
    if (this.state !== SequenceState.RUNNING) {
      return this;
    }

    // 동시 실행 모드
    if (this.options.allowConcurrent) {
      return this.updateConcurrentEffects(currentTime);
    }

    // 순차 실행 모드
    return this.updateSequentialEffects(currentTime);
  }

  private updateConcurrentEffects(currentTime: number): EffectSequence {
    const updatedEffects = this.effects.map(effect =>
      effect.isPlaying() ? effect.updateProgress(currentTime) : effect
    );

    const allCompleted = updatedEffects.every(effect => effect.isCompleted());

    if (allCompleted) {
      return this.handleSequenceCompletion(updatedEffects);
    }

    return new EffectSequence(
      this.id,
      this.state,
      this.options,
      updatedEffects,
      this.startTime,
      this.currentEffectIndex,
      this.completedCount
    );
  }

  private updateSequentialEffects(currentTime: number): EffectSequence {
    if (this.currentEffectIndex >= this.effects.length) {
      return this.handleSequenceCompletion(this.effects);
    }

    const currentEffect = this.effects[this.currentEffectIndex];
    const updatedCurrentEffect = currentEffect.updateProgress(currentTime);

    const updatedEffects = this.effects.map((effect, index) =>
      index === this.currentEffectIndex ? updatedCurrentEffect : effect
    );

    // 현재 이펙트가 완료되면 다음 이펙트로 진행
    if (updatedCurrentEffect.isCompleted()) {
      const nextIndex = this.currentEffectIndex + 1;

      if (nextIndex < this.effects.length) {
        // 다음 이펙트 시작 (딜레이 고려)
        const shouldStartNext = this.shouldStartNextEffect(currentTime);

        if (shouldStartNext) {
          const nextEffect = this.effects[nextIndex].start();
          updatedEffects[nextIndex] = nextEffect;

          return new EffectSequence(
            this.id,
            this.state,
            this.options,
            updatedEffects,
            this.startTime,
            nextIndex,
            this.completedCount
          );
        }
      } else {
        // 모든 이펙트 완료
        return this.handleSequenceCompletion(updatedEffects);
      }
    }

    return new EffectSequence(
      this.id,
      this.state,
      this.options,
      updatedEffects,
      this.startTime,
      this.currentEffectIndex,
      this.completedCount
    );
  }

  private shouldStartNextEffect(_currentTime: number): boolean {
    if (!this.options.delayBetweenEffects || this.options.delayBetweenEffects <= 0) {
      return true;
    }

    const currentEffect = this.effects[this.currentEffectIndex];
    if (!currentEffect.isCompleted()) {
      return false;
    }

    // 딜레이 시간 계산 로직 구현
    // 현재는 단순화하여 즉시 시작
    return true;
  }

  private handleSequenceCompletion(effects: LineCompletionEffect[]): EffectSequence {
    const newCompletedCount = this.completedCount + 1;
    const repeatCount = this.options.repeatCount || 1;

    // 반복 실행 체크
    if (repeatCount === 0 || newCompletedCount < repeatCount) {
      // 시퀀스 재시작
      const resetEffects = effects.map(effect =>
        // 이펙트를 초기 상태로 리셋하는 로직 필요
        effect
      );

      return new EffectSequence(
        this.id,
        SequenceState.PENDING,
        this.options,
        resetEffects,
        undefined,
        0,
        newCompletedCount
      );
    }

    // 완전 완료
    return new EffectSequence(
      this.id,
      SequenceState.COMPLETED,
      this.options,
      effects,
      this.startTime,
      this.currentEffectIndex,
      newCompletedCount
    );
  }

  // 읽기 전용 접근자
  getEffects(): readonly LineCompletionEffect[] {
    return this.effects;
  }

  getCurrentEffect(): LineCompletionEffect | undefined {
    return this.effects[this.currentEffectIndex];
  }

  getActiveEffects(): LineCompletionEffect[] {
    if (this.options.allowConcurrent) {
      return this.effects.filter(effect => effect.isPlaying());
    }

    const current = this.getCurrentEffect();
    return current && current.isPlaying() ? [current] : [];
  }

  getProgress(): number {
    if (this.effects.length === 0) return 1;

    if (this.options.allowConcurrent) {
      const completedEffects = this.effects.filter(effect => effect.isCompleted()).length;
      return completedEffects / this.effects.length;
    }

    return this.currentEffectIndex / this.effects.length;
  }

  isRunning(): boolean {
    return this.state === SequenceState.RUNNING;
  }

  isCompleted(): boolean {
    return this.state === SequenceState.COMPLETED;
  }

  isCancelled(): boolean {
    return this.state === SequenceState.CANCELLED;
  }

  isPaused(): boolean {
    return this.state === SequenceState.PAUSED;
  }

  // 도메인 이벤트 관리
  getDomainEvents(): EffectDomainEvent[] {
    return [...this.domainEvents];
  }

  clearDomainEvents(): EffectSequence {
    return new EffectSequence(
      this.id,
      this.state,
      this.options,
      this.effects,
      this.startTime,
      this.currentEffectIndex,
      this.completedCount
    );
  }

  private addDomainEvent(event: EffectDomainEvent): void {
    this.domainEvents.push(event);
  }
}