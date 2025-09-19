import { EffectSequenceManager } from '../../../domain/effects/services/EffectSequenceManager.js';
import { EffectFactory } from '../../../domain/effects/services/EffectFactory.js';
import { EffectMapper } from '../mappers/EffectMapper.js';
import { GameMapper } from '../../sudoku/mappers/GameMapper.js';
import {
  CreateLineCompletionEffectRequestDto,
  CreateEffectSequenceResponseDto,
  UpdateEffectSequenceRequestDto,
  UpdateEffectSequenceResponseDto,
  EffectSequenceDto
} from '../dtos/EffectDtos.js';

/**
 * 이펙트 애플리케이션 서비스
 *
 * 이펙트 시스템의 모든 비즈니스 로직을 조합하고 조율합니다.
 * DTO 기반의 깔끔한 인터페이스를 제공합니다.
 */
export class EffectApplicationService {
  constructor(
    private readonly effectSequenceManager: EffectSequenceManager,
    private readonly effectFactory: EffectFactory
  ) {}

  /**
   * 라인 완성 이펙트 시퀀스 생성
   */
  async createLineCompletionEffect(
    request: CreateLineCompletionEffectRequestDto
  ): Promise<CreateEffectSequenceResponseDto> {
    try {
      const position = GameMapper.positionFromDto(request.completionPosition);
      const animation = request.animation ?
        EffectMapper.animationFromDto(request.animation) : undefined;
      const sequenceOptions = request.sequenceOptions ?
        EffectMapper.sequenceOptionsFromDto(request.sequenceOptions) : undefined;

      const sequence = this.effectFactory.createLineCompletionSequence(
        request.lineType,
        request.lineIndex,
        position,
        animation,
        sequenceOptions
      );

      return {
        sequence: EffectMapper.sequenceToDto(sequence),
        success: true
      };

    } catch (error) {
      return {
        sequence: null as any,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * 모든 활성 이펙트 시퀀스 업데이트
   */
  async updateAllSequences(
    request: UpdateEffectSequenceRequestDto
  ): Promise<UpdateEffectSequenceResponseDto> {
    try {
      const updatedSequences = this.effectSequenceManager.updateSequences(request.currentTime);
      const completedSequenceIds: string[] = [];

      // 완료된 시퀀스 ID 수집
      updatedSequences.forEach(sequence => {
        if (sequence.isCompleted() || sequence.isCancelled()) {
          completedSequenceIds.push(sequence.id.toString());
        }
      });

      return {
        updatedSequences: updatedSequences.map(seq => EffectMapper.sequenceToDto(seq)),
        completedSequences: completedSequenceIds,
        success: true
      };

    } catch (error) {
      return {
        updatedSequences: [],
        completedSequences: [],
        success: false
      };
    }
  }

  /**
   * 시퀀스 시작
   */
  async startSequence(sequenceId: string): Promise<EffectSequenceDto | null> {
    try {
      const sequenceIdObject = { toString: () => sequenceId } as any;
      const sequence = this.effectSequenceManager.getSequence(sequenceIdObject);

      if (!sequence) {
        return null;
      }

      const startedSequence = this.effectSequenceManager.startSequence(sequence);
      return EffectMapper.sequenceToDto(startedSequence);

    } catch (error) {
      return null;
    }
  }

  /**
   * 시퀀스 일시정지
   */
  async pauseSequence(sequenceId: string): Promise<EffectSequenceDto | null> {
    try {
      const sequenceIdObject = { toString: () => sequenceId } as any;
      const sequence = this.effectSequenceManager.pauseSequence(sequenceIdObject);

      return sequence ? EffectMapper.sequenceToDto(sequence) : null;

    } catch (error) {
      return null;
    }
  }

  /**
   * 시퀀스 재개
   */
  async resumeSequence(sequenceId: string): Promise<EffectSequenceDto | null> {
    try {
      const sequenceIdObject = { toString: () => sequenceId } as any;
      const sequence = this.effectSequenceManager.resumeSequence(sequenceIdObject);

      return sequence ? EffectMapper.sequenceToDto(sequence) : null;

    } catch (error) {
      return null;
    }
  }

  /**
   * 시퀀스 취소
   */
  async cancelSequence(sequenceId: string): Promise<EffectSequenceDto | null> {
    try {
      const sequenceIdObject = { toString: () => sequenceId } as any;
      const sequence = this.effectSequenceManager.cancelSequence(sequenceIdObject);

      return sequence ? EffectMapper.sequenceToDto(sequence) : null;

    } catch (error) {
      return null;
    }
  }

  /**
   * 모든 시퀀스 일시정지
   */
  async pauseAllSequences(): Promise<void> {
    this.effectSequenceManager.pauseAllSequences();
  }

  /**
   * 모든 시퀀스 재개
   */
  async resumeAllSequences(): Promise<void> {
    this.effectSequenceManager.resumeAllSequences();
  }

  /**
   * 모든 시퀀스 취소
   */
  async cancelAllSequences(): Promise<void> {
    this.effectSequenceManager.cancelAllSequences();
  }

  /**
   * 활성 시퀀스 목록 조회
   */
  async getActiveSequences(): Promise<EffectSequenceDto[]> {
    const activeSequences = this.effectSequenceManager.getActiveSequences();
    return activeSequences.map(seq => EffectMapper.sequenceToDto(seq));
  }

  /**
   * 시퀀스 통계 조회
   */
  async getStatistics(): Promise<any> {
    return this.effectSequenceManager.getStatistics();
  }

  /**
   * 메모리 정리
   */
  async cleanup(maxCompletedSequences: number = 100): Promise<void> {
    this.effectSequenceManager.cleanup(maxCompletedSequences);
  }
}