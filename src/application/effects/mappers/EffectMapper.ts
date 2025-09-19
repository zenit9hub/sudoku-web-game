import { EffectSequence } from '../../../domain/effects/aggregates/EffectSequence.js';
import { LineCompletionEffect } from '../../../domain/effects/entities/LineCompletionEffect.js';
import { EffectAnimation } from '../../../domain/effects/value-objects/EffectAnimation.js';
import { EffectType } from '../../../domain/effects/value-objects/EffectType.js';
import { GameMapper } from '../../sudoku/mappers/GameMapper.js';
import {
  EffectDto,
  EffectSequenceDto,
  EffectAnimationDto,
  EffectSequenceOptionsDto
} from '../dtos/EffectDtos.js';

/**
 * 이펙트 도메인 객체와 DTO 간의 변환을 담당하는 매퍼
 */
export class EffectMapper {
  /**
   * 이펙트 시퀀스를 DTO로 변환
   */
  static sequenceToDto(sequence: EffectSequence): EffectSequenceDto {
    return {
      id: sequence.id.toString(),
      state: sequence.state.toString() as any,
      effects: sequence.getEffects().map(effect => this.effectToDto(effect)),
      options: this.sequenceOptionsToDto(sequence.options),
      progress: sequence.getProgress(),
      startTime: sequence['startTime']
    };
  }

  /**
   * 이펙트를 DTO로 변환
   */
  static effectToDto(effect: LineCompletionEffect): EffectDto {
    // 임시로 기본값들을 사용 - 실제 구현 시 LineCompletionEffect 구조에 맞게 수정 필요
    return {
      id: 'temp-id',
      type: 'LINE_COMPLETION',
      position: { row: 0, col: 0 },
      animation: {
        type: 'CASCADE',
        duration: 1000,
        easing: 'ease-out',
        color: '#3B82F6',
        intensity: 0.7
      },
      startTime: Date.now(),
      isPlaying: false,
      isCompleted: false,
      progress: 0
    };
  }

  /**
   * 이펙트 애니메이션을 DTO로 변환
   */
  static animationToDto(animation: EffectAnimation): EffectAnimationDto {
    // 임시로 기본값 반환 - 실제 구현 시 EffectAnimation 구조에 맞게 수정 필요
    return {
      type: 'CASCADE',
      duration: 1000,
      easing: 'ease-out',
      color: '#3B82F6',
      intensity: 0.7
    };
  }

  /**
   * 시퀀스 옵션을 DTO로 변환
   */
  static sequenceOptionsToDto(options: any): EffectSequenceOptionsDto {
    return {
      allowConcurrent: options.allowConcurrent,
      autoStart: options.autoStart,
      repeatCount: options.repeatCount,
      delayBetweenEffects: options.delayBetweenEffects
    };
  }

  /**
   * DTO에서 이펙트 애니메이션으로 변환
   */
  static animationFromDto(dto: EffectAnimationDto): EffectAnimation {
    // 임시로 기본 EffectAnimation 생성 - 실제 구현 시 생성자에 맞게 수정 필요
    return {} as EffectAnimation;
  }

  /**
   * DTO에서 시퀀스 옵션으로 변환
   */
  static sequenceOptionsFromDto(dto: EffectSequenceOptionsDto): any {
    return {
      allowConcurrent: dto.allowConcurrent,
      autoStart: dto.autoStart,
      repeatCount: dto.repeatCount,
      delayBetweenEffects: dto.delayBetweenEffects
    };
  }
}