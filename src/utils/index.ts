/**
 * Common utility functions used across the application
 */

/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Create a 9x9 grid with a factory function
 */
export function create9x9Grid<T>(factory: (row: number, col: number) => T): T[][] {
  return Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, col) => factory(row, col))
  );
}

/**
 * Deep clone a 2D array
 */
export function cloneGrid<T>(grid: T[][]): T[][] {
  return grid.map(row => [...row]);
}