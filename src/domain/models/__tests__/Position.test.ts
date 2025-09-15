import { Position } from '../Position.js';

describe('Position', () => {
  describe('constructor', () => {
    it('should create valid position', () => {
      const position = new Position(4, 5);
      expect(position.row).toBe(4);
      expect(position.col).toBe(5);
    });

    it('should throw error for invalid row', () => {
      expect(() => new Position(-1, 5)).toThrow('Invalid position');
      expect(() => new Position(9, 5)).toThrow('Invalid position');
    });

    it('should throw error for invalid column', () => {
      expect(() => new Position(4, -1)).toThrow('Invalid position');
      expect(() => new Position(4, 9)).toThrow('Invalid position');
    });
  });

  describe('equals', () => {
    it('should return true for same positions', () => {
      const pos1 = new Position(3, 4);
      const pos2 = new Position(3, 4);
      expect(pos1.equals(pos2)).toBe(true);
    });

    it('should return false for different positions', () => {
      const pos1 = new Position(3, 4);
      const pos2 = new Position(3, 5);
      expect(pos1.equals(pos2)).toBe(false);
    });
  });

  describe('getBoxIndex', () => {
    it('should return correct box index for top-left corner', () => {
      expect(new Position(0, 0).getBoxIndex()).toBe(0);
      expect(new Position(1, 2).getBoxIndex()).toBe(0);
      expect(new Position(2, 1).getBoxIndex()).toBe(0);
    });

    it('should return correct box index for center', () => {
      expect(new Position(3, 3).getBoxIndex()).toBe(4);
      expect(new Position(4, 5).getBoxIndex()).toBe(4);
      expect(new Position(5, 4).getBoxIndex()).toBe(4);
    });

    it('should return correct box index for bottom-right corner', () => {
      expect(new Position(6, 6).getBoxIndex()).toBe(8);
      expect(new Position(7, 8).getBoxIndex()).toBe(8);
      expect(new Position(8, 7).getBoxIndex()).toBe(8);
    });
  });

  describe('toString', () => {
    it('should return formatted string', () => {
      const position = new Position(3, 4);
      expect(position.toString()).toBe('(3, 4)');
    });
  });
});