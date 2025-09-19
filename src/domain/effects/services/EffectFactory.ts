import { Position } from '../../sudoku/value-objects/Position';
import { LineCompletionEffect, EffectAnimation } from '../entities/LineCompletionEffect';
import { LinearEffect } from '../entities/LinearEffect';
import { RadialEffect } from '../entities/RadialEffect';
import { EffectSequence, EffectSequenceOptions } from '../aggregates/EffectSequence';

export class EffectFactory {
  private static effectIdCounter = 0;

  private static generateId(): string {
    return `effect_${Date.now()}_${++this.effectIdCounter}`;
  }

  static createRowEffect(
    rowIndex: number,
    animation: EffectAnimation = EffectAnimation.LINEAR,
    completionPosition?: Position
  ): LineCompletionEffect {
    const id = this.generateId();

    switch (animation) {
      case EffectAnimation.LINEAR:
        return LinearEffect.createRowEffect(id, rowIndex);

      case EffectAnimation.RADIAL:
        if (!completionPosition) {
          throw new Error('RadialEffect requires completion position');
        }
        return RadialEffect.createRowEffect(id, rowIndex, completionPosition);

      default:
        throw new Error(`Unsupported animation type: ${animation}`);
    }
  }

  static createColumnEffect(
    colIndex: number,
    animation: EffectAnimation = EffectAnimation.LINEAR,
    completionPosition?: Position
  ): LineCompletionEffect {
    const id = this.generateId();

    switch (animation) {
      case EffectAnimation.LINEAR:
        return LinearEffect.createColumnEffect(id, colIndex);

      case EffectAnimation.RADIAL:
        if (!completionPosition) {
          throw new Error('RadialEffect requires completion position');
        }
        return RadialEffect.createColumnEffect(id, colIndex, completionPosition);

      default:
        throw new Error(`Unsupported animation type: ${animation}`);
    }
  }

  // 시퀀스 생성 메서드들
  static createSimpleSequence(
    effects: LineCompletionEffect[],
    options?: EffectSequenceOptions
  ): EffectSequence {
    return EffectSequence.create(effects, options);
  }

  static createConcurrentSequence(
    effects: LineCompletionEffect[],
    options?: Omit<EffectSequenceOptions, 'allowConcurrent'>
  ): EffectSequence {
    return EffectSequence.create(effects, {
      ...options,
      allowConcurrent: true
    });
  }

  static createDelayedSequence(
    effects: LineCompletionEffect[],
    delayBetweenEffects: number,
    options?: Omit<EffectSequenceOptions, 'delayBetweenEffects'>
  ): EffectSequence {
    return EffectSequence.create(effects, {
      ...options,
      delayBetweenEffects
    });
  }

  static createRepeatingSequence(
    effects: LineCompletionEffect[],
    repeatCount: number,
    options?: Omit<EffectSequenceOptions, 'repeatCount'>
  ): EffectSequence {
    return EffectSequence.create(effects, {
      ...options,
      repeatCount
    });
  }

  // 복합 이펙트 생성 헬퍼 메서드들
  static createMultiLineCompletionSequence(
    completedLines: Array<{ type: 'row' | 'column', index: number, position?: Position }>,
    animation: EffectAnimation = EffectAnimation.RADIAL,
    options?: EffectSequenceOptions
  ): EffectSequence {
    const effects = completedLines.map(line => {
      if (line.type === 'row') {
        return this.createRowEffect(line.index, animation, line.position);
      } else {
        return this.createColumnEffect(line.index, animation, line.position);
      }
    });

    return this.createSimpleSequence(effects, {
      allowConcurrent: true,
      delayBetweenEffects: 100, // 100ms 간격
      ...options
    });
  }

  static createCascadingEffectSequence(
    completedLines: Array<{ type: 'row' | 'column', index: number, position?: Position }>,
    animation: EffectAnimation = EffectAnimation.RADIAL,
    cascadeDelay: number = 200
  ): EffectSequence {
    const effects = completedLines.map(line => {
      if (line.type === 'row') {
        return this.createRowEffect(line.index, animation, line.position);
      } else {
        return this.createColumnEffect(line.index, animation, line.position);
      }
    });

    return this.createDelayedSequence(effects, cascadeDelay, {
      allowConcurrent: false
    });
  }
}