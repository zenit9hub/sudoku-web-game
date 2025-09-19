import { Position } from '../../sudoku/value-objects/Position';
import { LineCompletionEffect, EffectAnimation } from '../entities/LineCompletionEffect';
import { LinearEffect } from '../entities/LinearEffect';
import { RadialEffect } from '../entities/RadialEffect';

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
}