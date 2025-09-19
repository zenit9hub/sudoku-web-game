import { PositionDto } from '../../sudoku/dtos/GameDto.js';

/**
 * 이펙트 애니메이션 DTO
 */
export interface EffectAnimationDto {
  readonly type: 'CASCADE' | 'FADE' | 'PULSE' | 'SLIDE' | 'RADIAL';
  readonly duration: number;
  readonly easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  readonly color: string;
  readonly intensity: number;
}

/**
 * 이펙트 DTO
 */
export interface EffectDto {
  readonly id: string;
  readonly type: 'LINE_COMPLETION';
  readonly position: PositionDto;
  readonly animation: EffectAnimationDto;
  readonly startTime?: number;
  readonly isPlaying: boolean;
  readonly isCompleted: boolean;
  readonly progress: number;
}

/**
 * 이펙트 시퀀스 옵션 DTO
 */
export interface EffectSequenceOptionsDto {
  readonly allowConcurrent?: boolean;
  readonly autoStart?: boolean;
  readonly repeatCount?: number;
  readonly delayBetweenEffects?: number;
}

/**
 * 이펙트 시퀀스 DTO
 */
export interface EffectSequenceDto {
  readonly id: string;
  readonly state: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  readonly effects: EffectDto[];
  readonly options: EffectSequenceOptionsDto;
  readonly progress: number;
  readonly startTime?: number;
}

/**
 * 라인 완성 이펙트 생성 요청 DTO
 */
export interface CreateLineCompletionEffectRequestDto {
  readonly lineType: 'row' | 'column';
  readonly lineIndex: number;
  readonly completionPosition: PositionDto;
  readonly animation?: EffectAnimationDto;
  readonly sequenceOptions?: EffectSequenceOptionsDto;
}

/**
 * 이펙트 시퀀스 생성 응답 DTO
 */
export interface CreateEffectSequenceResponseDto {
  readonly sequence: EffectSequenceDto;
  readonly success: boolean;
  readonly error?: string;
}

/**
 * 이펙트 시퀀스 업데이트 요청 DTO
 */
export interface UpdateEffectSequenceRequestDto {
  readonly sequenceId: string;
  readonly currentTime: number;
}

/**
 * 이펙트 시퀀스 업데이트 응답 DTO
 */
export interface UpdateEffectSequenceResponseDto {
  readonly updatedSequences: EffectSequenceDto[];
  readonly completedSequences: string[];
  readonly success: boolean;
}