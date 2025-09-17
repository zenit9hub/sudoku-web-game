/**
 * Test utilities and helpers
 * Common testing utilities for all test types
 */

import { SudokuGame } from '../../domain/models/SudokuGame';
import { SudokuGrid } from '../../domain/models/SudokuGrid';
import { Position } from '../../domain/models/Position';
import { CellValue } from '../../domain/models/CellValue';
import { Cell } from '../../domain/models/Cell';
import { GameState, Difficulty } from '../../domain/models/GameState';

/**
 * Create a test game instance with predefined state
 */
export function createTestGame(options: {
  difficulty?: Difficulty;
  filled?: boolean;
  completed?: boolean;
}): SudokuGame {
  const { difficulty = Difficulty.EASY, filled = false, completed = false } = options;

  // Create a simple test grid
  const cells: Cell[][] = [];
  for (let row = 0; row < 9; row++) {
    cells[row] = [];
    for (let col = 0; col < 9; col++) {
      const value = filled || completed ? new CellValue((row * 9 + col) % 9 + 1) : CellValue.empty();
      const isGiven = row < 3; // First 3 rows are given
      cells[row][col] = new Cell(value, isGiven);
    }
  }

  const grid = new SudokuGrid(cells);
  const state = new GameState(
    grid,
    difficulty,
    { moves: 0, hints: 0, startTime: new Date() },
    completed ? 'completed' : 'playing'
  );

  return new SudokuGame(grid, state);
}

/**
 * Create a test position
 */
export function createTestPosition(row: number, col: number): Position {
  return new Position(row, col);
}

/**
 * Create test DOM elements
 */
export function createTestDOM(): {
  canvas: HTMLCanvasElement;
  container: HTMLDivElement;
  cleanup: () => void;
} {
  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';
  canvas.width = 300;
  canvas.height = 300;

  // Create container
  const container = document.createElement('div');
  container.appendChild(canvas);
  document.body.appendChild(container);

  const cleanup = () => {
    document.body.removeChild(container);
  };

  return { canvas, container, cleanup };
}

/**
 * Mock canvas context for testing
 */
export function mockCanvasContext(): {
  context: CanvasRenderingContext2D;
  calls: { [key: string]: any[] };
} {
  const calls: { [key: string]: any[] } = {};

  const mockContext = {
    fillRect: jest.fn((...args) => calls.fillRect = [...(calls.fillRect || []), args]),
    strokeRect: jest.fn((...args) => calls.strokeRect = [...(calls.strokeRect || []), args]),
    fillText: jest.fn((...args) => calls.fillText = [...(calls.fillText || []), args]),
    beginPath: jest.fn(() => calls.beginPath = [...(calls.beginPath || []), []]),
    moveTo: jest.fn((...args) => calls.moveTo = [...(calls.moveTo || []), args]),
    lineTo: jest.fn((...args) => calls.lineTo = [...(calls.lineTo || []), args]),
    stroke: jest.fn(() => calls.stroke = [...(calls.stroke || []), []]),
    fill: jest.fn(() => calls.fill = [...(calls.fill || []), []]),
    clearRect: jest.fn((...args) => calls.clearRect = [...(calls.clearRect || []), args]),
    save: jest.fn(() => calls.save = [...(calls.save || []), []]),
    restore: jest.fn(() => calls.restore = [...(calls.restore || []), []]),
    translate: jest.fn((...args) => calls.translate = [...(calls.translate || []), args]),
    scale: jest.fn((...args) => calls.scale = [...(calls.scale || []), args]),
    measureText: jest.fn(() => ({ width: 10 })),
    canvas: { width: 300, height: 300 },
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '16px Arial',
    textAlign: 'center',
    textBaseline: 'middle'
  } as unknown as CanvasRenderingContext2D;

  return { context: mockContext, calls };
}

/**
 * Wait for next tick (useful for async operations)
 */
export function nextTick(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Wait for specific duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create mock event objects
 */
export function createMockEvent(type: string, properties: any = {}): Event {
  const event = new Event(type);
  return Object.assign(event, properties);
}

/**
 * Create mock mouse event
 */
export function createMockMouseEvent(properties: {
  clientX?: number;
  clientY?: number;
  button?: number;
}): MouseEvent {
  const { clientX = 0, clientY = 0, button = 0 } = properties;

  const event = new MouseEvent('click', {
    clientX,
    clientY,
    button
  });

  return event;
}

/**
 * Create mock keyboard event
 */
export function createMockKeyboardEvent(key: string, properties: any = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    key,
    ...properties
  });

  return event;
}

/**
 * Assertion helpers
 */
export const testAssertions = {
  /**
   * Assert that a position is valid
   */
  expectValidPosition(position: Position): void {
    expect(position.row).toBeGreaterThanOrEqual(0);
    expect(position.row).toBeLessThan(9);
    expect(position.col).toBeGreaterThanOrEqual(0);
    expect(position.col).toBeLessThan(9);
  },

  /**
   * Assert that a cell value is valid
   */
  expectValidCellValue(value: CellValue): void {
    if (!value.isEmpty()) {
      expect(value.toNumber()).toBeGreaterThanOrEqual(1);
      expect(value.toNumber()).toBeLessThanOrEqual(9);
    }
  },

  /**
   * Assert that a game is in valid state
   */
  expectValidGameState(game: SudokuGame): void {
    expect(game).toBeDefined();
    expect(game.grid).toBeDefined();
    expect(game.state).toBeDefined();
    expect(game.state.statistics).toBeDefined();
    expect(game.state.statistics.startTime).toBeInstanceOf(Date);
  }
};

/**
 * Performance testing helpers
 */
export const performanceHelpers = {
  /**
   * Measure execution time of a function
   */
  async measureTime<T>(fn: () => T | Promise<T>): Promise<{ result: T; timeMs: number }> {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, timeMs: end - start };
  },

  /**
   * Run function multiple times and get average time
   */
  async measureAverageTime<T>(
    fn: () => T | Promise<T>,
    iterations: number = 10
  ): Promise<{ result: T; averageTimeMs: number; totalTimeMs: number }> {
    const times: number[] = [];
    let lastResult: T;

    for (let i = 0; i < iterations; i++) {
      const { result, timeMs } = await this.measureTime(fn);
      times.push(timeMs);
      lastResult = result;
    }

    const totalTimeMs = times.reduce((sum, time) => sum + time, 0);
    const averageTimeMs = totalTimeMs / iterations;

    return { result: lastResult!, averageTimeMs, totalTimeMs };
  }
};

/**
 * Memory testing helpers
 */
export const memoryHelpers = {
  /**
   * Force garbage collection (if available)
   */
  forceGC(): void {
    if (global.gc) {
      global.gc();
    }
  },

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): any {
    if (process.memoryUsage) {
      return process.memoryUsage();
    }
    return null;
  }
};