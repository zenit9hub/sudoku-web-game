import { EffectSequenceId } from '../value-objects/EffectSequenceId';

export interface DomainEvent {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly occurredAt: Date;
  readonly version: number;
}

export abstract class EffectDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly occurredAt: Date;
  public readonly version: number = 1;

  constructor(
    public readonly aggregateId: string,
    public readonly eventType: string
  ) {
    this.eventId = `${eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.occurredAt = new Date();
  }
}

// 시퀀스 생명주기 이벤트들
export class EffectSequenceStarted extends EffectDomainEvent {
  constructor(
    public readonly sequenceId: EffectSequenceId,
    public readonly effectCount: number
  ) {
    super(sequenceId.toString(), 'EffectSequenceStarted');
  }
}

export class EffectSequenceCompleted extends EffectDomainEvent {
  constructor(
    public readonly sequenceId: EffectSequenceId,
    public readonly duration: number
  ) {
    super(sequenceId.toString(), 'EffectSequenceCompleted');
  }
}

export class EffectSequenceCancelled extends EffectDomainEvent {
  constructor(
    public readonly sequenceId: EffectSequenceId,
    public readonly reason: string
  ) {
    super(sequenceId.toString(), 'EffectSequenceCancelled');
  }
}

export class EffectSequencePaused extends EffectDomainEvent {
  constructor(
    public readonly sequenceId: EffectSequenceId
  ) {
    super(sequenceId.toString(), 'EffectSequencePaused');
  }
}

export class EffectSequenceResumed extends EffectDomainEvent {
  constructor(
    public readonly sequenceId: EffectSequenceId
  ) {
    super(sequenceId.toString(), 'EffectSequenceResumed');
  }
}

// 개별 이펙트 이벤트들
export class LineCompletionEffectStarted extends EffectDomainEvent {
  constructor(
    public readonly effectId: string,
    public readonly sequenceId: EffectSequenceId,
    public readonly effectType: string
  ) {
    super(effectId, 'LineCompletionEffectStarted');
  }
}

export class LineCompletionEffectCompleted extends EffectDomainEvent {
  constructor(
    public readonly effectId: string,
    public readonly sequenceId: EffectSequenceId,
    public readonly duration: number
  ) {
    super(effectId, 'LineCompletionEffectCompleted');
  }
}

// 이펙트 진행 상황 이벤트
export class EffectProgressUpdated extends EffectDomainEvent {
  constructor(
    public readonly sequenceId: EffectSequenceId,
    public readonly progress: number,
    public readonly activeEffectCount: number
  ) {
    super(sequenceId.toString(), 'EffectProgressUpdated');
  }
}