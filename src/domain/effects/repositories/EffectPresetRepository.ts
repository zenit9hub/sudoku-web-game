import { EffectSequenceOptions } from '../aggregates/EffectSequence';
import { EffectAnimation } from '../value-objects/EffectAnimation';

export interface EffectPreset {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly animation: EffectAnimation;
  readonly sequenceOptions: EffectSequenceOptions;
  readonly isDefault: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * 이펙트 프리셋 저장소 인터페이스
 *
 * 사용자 정의 이펙트 설정을 저장하고 관리합니다.
 * 미래에 사용자가 자신만의 이펙트 스타일을 저장할 수 있는 기능을 위한 인터페이스입니다.
 */
export interface EffectPresetRepository {
  /**
   * 프리셋 저장
   */
  save(preset: EffectPreset): Promise<void>;

  /**
   * ID로 프리셋 조회
   */
  findById(id: string): Promise<EffectPreset | null>;

  /**
   * 모든 프리셋 조회
   */
  findAll(): Promise<EffectPreset[]>;

  /**
   * 기본 프리셋 조회
   */
  findDefault(): Promise<EffectPreset | null>;

  /**
   * 프리셋 삭제
   */
  delete(id: string): Promise<void>;

  /**
   * 프리셋을 기본값으로 설정
   */
  setAsDefault(id: string): Promise<void>;
}