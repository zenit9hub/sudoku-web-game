import { EffectSequence } from '../aggregates/EffectSequence';
import { EffectSequenceId } from '../value-objects/EffectSequenceId';
import { SequenceState } from '../value-objects/SequenceState';

export interface EffectSequenceFilter {
  readonly states?: SequenceState[];
  readonly createdAfter?: Date;
  readonly createdBefore?: Date;
  readonly includeCompleted?: boolean;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * 이펙트 시퀀스 저장소 인터페이스
 *
 * 미래 확장성을 위한 인터페이스:
 * - 이펙트 설정 저장/로드
 * - 이펙트 통계 수집
 * - 이펙트 플레이백 기능
 */
export interface EffectSequenceRepository {
  /**
   * 이펙트 시퀀스 저장
   */
  save(sequence: EffectSequence): Promise<void>;

  /**
   * ID로 이펙트 시퀀스 조회
   */
  findById(id: EffectSequenceId): Promise<EffectSequence | null>;

  /**
   * 필터 조건으로 이펙트 시퀀스 조회
   */
  findByFilter(filter: EffectSequenceFilter): Promise<EffectSequence[]>;

  /**
   * 활성 상태의 이펙트 시퀀스 조회
   */
  findActiveSequences(): Promise<EffectSequence[]>;

  /**
   * 이펙트 시퀀스 삭제
   */
  delete(id: EffectSequenceId): Promise<void>;

  /**
   * 완료된 시퀀스 정리 (성능 최적화)
   */
  cleanupCompletedSequences(olderThan: Date): Promise<number>;

  /**
   * 이펙트 통계 조회
   */
  getStatistics(): Promise<EffectStatistics>;
}

export interface EffectStatistics {
  readonly totalSequences: number;
  readonly activeSequences: number;
  readonly completedSequences: number;
  readonly cancelledSequences: number;
  readonly averageSequenceDuration: number;
  readonly mostUsedEffectTypes: Array<{ type: string; count: number }>;
  readonly sequencesByDay: Array<{ date: string; count: number }>;
}