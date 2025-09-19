import { EffectSequence, EffectSequenceOptions } from '../aggregates/EffectSequence';
import { EffectSequenceId } from '../value-objects/EffectSequenceId';
import { LineCompletionEffect } from '../entities/LineCompletionEffect';

export interface SequenceManagerOptions {
  readonly maxConcurrentSequences?: number;
  readonly defaultSequenceOptions?: EffectSequenceOptions;
}

/**
 * 여러 EffectSequence의 생명주기를 관리하는 도메인 서비스
 *
 * 책임:
 * - 시퀀스 생성, 시작, 정지, 취소
 * - 동시 실행 시퀀스 관리
 * - 시퀀스 우선순위 처리
 * - 리소스 제한 관리
 */
export class EffectSequenceManager {
  private readonly activeSequences: Map<string, EffectSequence> = new Map();
  private readonly completedSequences: Map<string, EffectSequence> = new Map();

  constructor(
    private readonly options: SequenceManagerOptions = {}
  ) {}

  createSequence(
    effects: LineCompletionEffect[],
    sequenceOptions?: EffectSequenceOptions
  ): EffectSequence {
    const mergedOptions = {
      ...this.options.defaultSequenceOptions,
      ...sequenceOptions
    };

    const sequence = EffectSequence.create(effects, mergedOptions);

    // 자동 시작 옵션이 켜져있으면 즉시 시작
    if (mergedOptions.autoStart !== false) {
      return this.startSequence(sequence);
    }

    return sequence;
  }

  startSequence(sequence: EffectSequence): EffectSequence {
    // 동시 실행 제한 체크
    if (this.shouldLimitConcurrentSequences()) {
      throw new Error('Maximum concurrent sequences limit reached');
    }

    const startedSequence = sequence.start();
    this.activeSequences.set(startedSequence.id.toString(), startedSequence);

    return startedSequence;
  }

  pauseSequence(sequenceId: EffectSequenceId): EffectSequence | undefined {
    const sequence = this.activeSequences.get(sequenceId.toString());
    if (!sequence) {
      return undefined;
    }

    const pausedSequence = sequence.pause();
    this.activeSequences.set(sequenceId.toString(), pausedSequence);

    return pausedSequence;
  }

  resumeSequence(sequenceId: EffectSequenceId): EffectSequence | undefined {
    const sequence = this.activeSequences.get(sequenceId.toString());
    if (!sequence) {
      return undefined;
    }

    const resumedSequence = sequence.resume();
    this.activeSequences.set(sequenceId.toString(), resumedSequence);

    return resumedSequence;
  }

  cancelSequence(sequenceId: EffectSequenceId): EffectSequence | undefined {
    const sequence = this.activeSequences.get(sequenceId.toString());
    if (!sequence) {
      return undefined;
    }

    const cancelledSequence = sequence.cancel();
    this.activeSequences.delete(sequenceId.toString());
    this.completedSequences.set(sequenceId.toString(), cancelledSequence);

    return cancelledSequence;
  }

  updateSequences(currentTime: number): EffectSequence[] {
    const updatedSequences: EffectSequence[] = [];
    const sequencesToComplete: EffectSequenceId[] = [];

    // 모든 활성 시퀀스 업데이트
    for (const [id, sequence] of this.activeSequences) {
      const updatedSequence = sequence.update(currentTime);
      updatedSequences.push(updatedSequence);

      // 완료되거나 취소된 시퀀스 체크
      if (updatedSequence.isCompleted() || updatedSequence.isCancelled()) {
        sequencesToComplete.push(EffectSequenceId.fromString(id));
        this.completedSequences.set(id, updatedSequence);
      } else {
        this.activeSequences.set(id, updatedSequence);
      }
    }

    // 완료된 시퀀스들을 활성 목록에서 제거
    sequencesToComplete.forEach(sequenceId => {
      this.activeSequences.delete(sequenceId.toString());
    });

    return updatedSequences;
  }

  getActiveSequences(): EffectSequence[] {
    return Array.from(this.activeSequences.values());
  }

  getSequence(sequenceId: EffectSequenceId): EffectSequence | undefined {
    return this.activeSequences.get(sequenceId.toString()) ||
           this.completedSequences.get(sequenceId.toString());
  }

  getAllActiveEffects(): LineCompletionEffect[] {
    const allEffects: LineCompletionEffect[] = [];

    for (const sequence of this.activeSequences.values()) {
      if (sequence.isRunning()) {
        allEffects.push(...sequence.getActiveEffects());
      }
    }

    return allEffects;
  }

  pauseAllSequences(): void {
    for (const [id, sequence] of this.activeSequences) {
      if (sequence.isRunning()) {
        const pausedSequence = sequence.pause();
        this.activeSequences.set(id, pausedSequence);
      }
    }
  }

  resumeAllSequences(): void {
    for (const [id, sequence] of this.activeSequences) {
      if (sequence.isPaused()) {
        const resumedSequence = sequence.resume();
        this.activeSequences.set(id, resumedSequence);
      }
    }
  }

  cancelAllSequences(): void {
    const sequenceIds = Array.from(this.activeSequences.keys());

    sequenceIds.forEach(id => {
      const sequenceId = EffectSequenceId.fromString(id);
      this.cancelSequence(sequenceId);
    });
  }

  clearCompletedSequences(): void {
    this.completedSequences.clear();
  }

  getStatistics() {
    return {
      activeSequences: this.activeSequences.size,
      completedSequences: this.completedSequences.size,
      totalActiveEffects: this.getAllActiveEffects().length,
      runningSequences: Array.from(this.activeSequences.values())
        .filter(seq => seq.isRunning()).length,
      pausedSequences: Array.from(this.activeSequences.values())
        .filter(seq => seq.isPaused()).length
    };
  }

  private shouldLimitConcurrentSequences(): boolean {
    const maxConcurrent = this.options.maxConcurrentSequences;
    return maxConcurrent !== undefined &&
           this.activeSequences.size >= maxConcurrent;
  }

  // 시퀀스 우선순위 관리 (미래 확장용)
  setSequencePriority(_sequenceId: EffectSequenceId, _priority: number): void {
    // 우선순위 기반 시퀀스 관리 로직
    // 현재는 단순화하여 구현하지 않음
  }

  // 메모리 정리 (완료된 시퀀스 자동 정리)
  cleanup(maxCompletedSequences: number = 100): void {
    if (this.completedSequences.size > maxCompletedSequences) {
      // 가장 오래된 완료 시퀀스들 제거
      const entries = Array.from(this.completedSequences.entries());
      const toRemove = entries.slice(0, entries.length - maxCompletedSequences);

      toRemove.forEach(([id]) => {
        this.completedSequences.delete(id);
      });
    }
  }
}