import { SudokuGrid } from '../aggregates/Grid';
import { Cell } from '../entities/Cell';
import { Position } from '../value-objects/Position';
import { CellValue } from '../value-objects/CellValue';
import { Difficulty } from '../entities/GameState';
import { SudokuValidationService } from './GridValidationService';

export interface GenerationOptions {
  seed?: number;
  useSymmetricRemoval?: boolean;
}

export class SudokuGeneratorService {
  private validationService: SudokuValidationService;
  private random: () => number;

  constructor(seed?: number) {
    this.validationService = new SudokuValidationService();
    
    // 시드가 있으면 deterministic random 사용, 없으면 Math.random
    if (seed !== undefined) {
      this.random = this.createSeededRandom(seed);
    } else {
      this.random = Math.random;
    }
  }

  generatePuzzle(difficulty: Difficulty, options: GenerationOptions = {}): SudokuGrid {
    // 1. 완전한 해답 생성 (백트래킹으로 항상 성공)
    const completeSolution = this.generateCompleteSolution();

    // 2. 간단한 숫자 치환만으로 랜덤화
    const randomizedSolution = this.substituteNumbers(completeSolution);

    // 3. 난이도에 따라 셀 제거하여 퍼즐 생성
    return this.removeCells(randomizedSolution, difficulty, options.useSymmetricRemoval);
  }

  private generateCompleteSolution(): SudokuGrid {
    // 빈 그리드로 시작
    const grid = new SudokuGrid();
    
    // 첫 번째 행을 1-9로 랜덤 배치 (성능 최적화)
    const firstRow = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (let col = 0; col < 9; col++) {
      const position = new Position(0, col);
      const value = CellValue.from(firstRow[col]);
      const cell = new Cell(position, value, { isGiven: false });
      
      const cells = this.getGridCells(grid);
      cells[0][col] = cell;
      const newGrid = new SudokuGrid(cells);
      
      if (!this.validationService.validateMove(newGrid, position, value).isValid) {
        throw new Error('Invalid first row generation');
      }
    }
    
    // 나머지 셀을 백트래킹으로 채움
    const initialGrid = this.setFirstRow(grid, firstRow);
    return this.solveWithBacktracking(initialGrid) || grid;
  }

  private solveWithBacktracking(grid: SudokuGrid): SudokuGrid | null {
    const emptyCells = this.getEmptyCells(grid);
    
    if (emptyCells.length === 0) {
      return grid; // 완성됨
    }

    const position = emptyCells[0];
    const possibleValues = this.validationService.getPossibleValues(grid, position);
    
    // 랜덤 순서로 값 시도
    const shuffledValues = this.shuffleArray(possibleValues);
    
    for (const value of shuffledValues) {
      const newGrid = grid.setCell(position, value);
      
      if (this.validationService.validateMove(newGrid, position, value).isValid) {
        const result = this.solveWithBacktracking(newGrid);
        if (result) {
          return result;
        }
      }
    }
    
    return null; // 백트래킹
  }


  private removeCells(grid: SudokuGrid, difficulty: Difficulty, _symmetric = false): SudokuGrid {
    const cellsToRemove = this.getCellsToRemove(difficulty);
    const positions = this.getAllPositions();
    const shuffledPositions = this.shuffleArray(positions);

    let currentGrid = grid;
    let removedCount = 0;

    for (const position of shuffledPositions) {
      if (removedCount >= cellsToRemove) break;

      const originalCell = currentGrid.getCell(position);
      if (originalCell.isEmpty()) continue;

      // 단순한 셀 제거 (유니크해 검증 없음)
      currentGrid = currentGrid.setCell(position, CellValue.empty());
      removedCount++;
    }

    return this.markGivenCells(currentGrid);
  }

  private getCellsToRemove(difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.EASY: return 38;     // 43개 주어진 숫자
      case Difficulty.MEDIUM: return 44;   // 37개 주어진 숫자
      case Difficulty.HARD: return 50;     // 31개 주어진 숫자
      case Difficulty.EXPERT: return 57;   // 24개 주어진 숫자
      default: return 44;
    }
  }


  // 유틸리티 메서드들
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }


  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  private getEmptyCells(grid: SudokuGrid): Position[] {
    const emptyCells: Position[] = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const position = new Position(row, col);
        if (grid.getCell(position).isEmpty()) {
          emptyCells.push(position);
        }
      }
    }
    return emptyCells;
  }

  private getAllPositions(): Position[] {
    const positions: Position[] = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        positions.push(new Position(row, col));
      }
    }
    return positions;
  }

  private getGridCells(grid: SudokuGrid): Cell[][] {
    const cells: Cell[][] = [];
    for (let row = 0; row < 9; row++) {
      cells[row] = [];
      for (let col = 0; col < 9; col++) {
        cells[row][col] = grid.getCell(new Position(row, col));
      }
    }
    return cells;
  }

  private setFirstRow(grid: SudokuGrid, values: number[]): SudokuGrid {
    const cells = this.getGridCells(grid);
    for (let col = 0; col < 9; col++) {
      const position = new Position(0, col);
      const value = CellValue.from(values[col]);
      cells[0][col] = new Cell(position, value, { isGiven: false });
    }
    return new SudokuGrid(cells);
  }

  private markGivenCells(grid: SudokuGrid): SudokuGrid {
    const cells = this.getGridCells(grid);
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = cells[row][col];
        if (!cell.isEmpty()) {
          cells[row][col] = new Cell(cell.position, cell.value, { isGiven: true });
        }
      }
    }
    return new SudokuGrid(cells);
  }

  private substituteNumbers(grid: SudokuGrid): SudokuGrid {
    const substitution = this.generateNumberSubstitution();
    const cells = this.getGridCells(grid);
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = cells[row][col];
        if (!cell.isEmpty()) {
          const newValue = CellValue.from(substitution[cell.value.value!]);
          cells[row][col] = new Cell(cell.position, newValue, { isGiven: false });
        }
      }
    }
    
    return new SudokuGrid(cells);
  }

  private generateNumberSubstitution(): Record<number, number> {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const shuffled = this.shuffleArray(numbers);
    const substitution: Record<number, number> = {};
    
    for (let i = 0; i < 9; i++) {
      substitution[numbers[i]] = shuffled[i];
    }
    
    return substitution;
  }


}