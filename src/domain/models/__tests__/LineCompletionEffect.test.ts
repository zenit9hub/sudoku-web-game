import { LineCompletionEffect, EffectType, EffectState } from '../LineCompletionEffect';
import { Position } from '../Position';

describe('LineCompletionEffect', () => {
  describe('createRowEffect', () => {
    it('should create a row completion effect with correct positions', () => {
      const effect = LineCompletionEffect.createRowEffect('test-1', 0);

      expect(effect.type).toBe(EffectType.ROW_COMPLETION);
      expect(effect.lineIndex).toBe(0);
      expect(effect.state).toBe(EffectState.PENDING);
      expect(effect.cellPositions).toHaveLength(9);

      // Check that all positions are in row 0
      effect.cellPositions.forEach((position, index) => {
        expect(position.row).toBe(0);
        expect(position.col).toBe(index);
      });
    });
  });

  describe('createColumnEffect', () => {
    it('should create a column completion effect with correct positions', () => {
      const effect = LineCompletionEffect.createColumnEffect('test-2', 3);

      expect(effect.type).toBe(EffectType.COLUMN_COMPLETION);
      expect(effect.lineIndex).toBe(3);
      expect(effect.state).toBe(EffectState.PENDING);
      expect(effect.cellPositions).toHaveLength(9);

      // Check that all positions are in column 3
      effect.cellPositions.forEach((position, index) => {
        expect(position.row).toBe(index);
        expect(position.col).toBe(3);
      });
    });
  });

  describe('start', () => {
    it('should transition from PENDING to PLAYING state', () => {
      const effect = LineCompletionEffect.createRowEffect('test-3', 1);
      const startedEffect = effect.start();

      expect(startedEffect.state).toBe(EffectState.PLAYING);
      expect(startedEffect.cellEffects).toHaveLength(9);
      expect(startedEffect.cellEffects[0].startTime).toBeLessThanOrEqual(startedEffect.cellEffects[1].startTime);
    });
  });

  describe('updateProgress', () => {
    it('should update progress correctly during animation', () => {
      const effect = LineCompletionEffect.createRowEffect('test-4', 2).start();
      const currentTime = effect.startTime + 100; // 100ms later

      const updatedEffect = effect.updateProgress(currentTime);

      expect(updatedEffect.state).toBe(EffectState.PLAYING);
      expect(updatedEffect.getActiveCellEffects().length).toBeGreaterThan(0);
    });

    it('should transition to COMPLETED when animation finishes', () => {
      const fixedStartTime = 1000;
      const effect = LineCompletionEffect.createRowEffect('test-5', 4);

      const startedEffect = new (effect.constructor as any)(
        effect.id,
        effect.type,
        effect.lineIndex,
        effect.cellPositions,
        'PLAYING',
        fixedStartTime,
        effect.cellPositions.map((position, index) => ({
          position,
          startTime: fixedStartTime + (index * 50),
          stepIndex: 0,
          isActive: false,
          isCompleted: false
        }))
      );

      const currentTime = fixedStartTime + 600; // Well past completion (500ms total)
      const updatedEffect = startedEffect.updateProgress(currentTime);

      expect(updatedEffect.state).toBe(EffectState.COMPLETED);
      expect(updatedEffect.getActiveCellEffects().length).toBe(0);
    });
  });

  describe('getCellEffectProgress', () => {
    it('should return correct scale and opacity for active cells', () => {
      // Create effect with fixed start time
      const fixedStartTime = 1000;
      const effect = LineCompletionEffect.createRowEffect('test-6', 0);

      // Override startTime and start
      const startedEffect = new (effect.constructor as any)(
        effect.id,
        effect.type,
        effect.lineIndex,
        effect.cellPositions,
        'PLAYING', // EffectState.PLAYING
        fixedStartTime,
        effect.cellPositions.map((position, index) => ({
          position,
          startTime: fixedStartTime + (index * 50), // CELL_DELAY
          stepIndex: 0,
          isActive: false,
          isCompleted: false
        }))
      );

      const testTime = fixedStartTime + 55; // 55ms later
      const updatedEffect = startedEffect.updateProgress(testTime);

      const firstCellPosition = updatedEffect.cellPositions[0];
      const progress = updatedEffect.getCellEffectProgress(firstCellPosition);

      expect(progress).not.toBeNull();
      if (progress) {
        expect(progress.scale).toBeGreaterThan(1.0);
        expect(progress.scale).toBeLessThanOrEqual(1.5);
        expect(progress.opacity).toBeGreaterThanOrEqual(0);
        expect(progress.opacity).toBeLessThanOrEqual(1.0);
      }
    });

    it('should return null for inactive cells', () => {
      const effect = LineCompletionEffect.createRowEffect('test-7', 1);

      const lastCellPosition = effect.cellPositions[8];
      const progress = effect.getCellEffectProgress(lastCellPosition);

      expect(progress).toBeNull();
    });
  });

  describe('state checking methods', () => {
    it('should correctly identify completed state', () => {
      const fixedStartTime = 1000;
      const effect = LineCompletionEffect.createRowEffect('test-8', 2);

      const startedEffect = new (effect.constructor as any)(
        effect.id,
        effect.type,
        effect.lineIndex,
        effect.cellPositions,
        'PLAYING',
        fixedStartTime,
        effect.cellPositions.map((position, index) => ({
          position,
          startTime: fixedStartTime + (index * 50),
          stepIndex: 0,
          isActive: false,
          isCompleted: false
        }))
      );

      const completedEffect = startedEffect.updateProgress(fixedStartTime + 600);

      expect(completedEffect.isCompleted()).toBe(true);
      expect(completedEffect.isPlaying()).toBe(false);
    });

    it('should correctly identify playing state', () => {
      const effect = LineCompletionEffect.createRowEffect('test-9', 3).start();

      expect(effect.isPlaying()).toBe(true);
      expect(effect.isCompleted()).toBe(false);
    });
  });
});