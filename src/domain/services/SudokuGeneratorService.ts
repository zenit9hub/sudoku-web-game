import { SudokuGrid } from '../models/SudokuGrid.js';
import { Cell } from '../models/Cell.js';
import { Position } from '../models/Position.js';
import { CellValue } from '../models/CellValue.js';
import { Difficulty } from '../models/GameState.js';
import { SudokuValidationService } from './SudokuValidationService.js';

export interface GenerationOptions {
  seed?: number;
  maxAttempts?: number;
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
    const maxAttempts = options.maxAttempts || 10;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // 1. 완전한 해답 생성
        const completeSolution = this.generateCompleteSolution();
        
        // 2. 패턴 변형으로 랜덤화
        const randomizedSolution = this.randomizePattern(completeSolution);
        
        // 3. 난이도에 따라 셀 제거
        const puzzle = this.removeCells(randomizedSolution, difficulty, options.useSymmetricRemoval);
        
        // 4. 유효성 검증 (유일한 해답인지 확인)
        if (this.hasUniqueSolution(puzzle)) {
          return puzzle;
        }
      } catch (error) {
        console.warn(`Generation attempt ${attempt + 1} failed:`, error);
      }
    }
    
    // 실패 시 기본 퍼즐 반환
    console.warn('Failed to generate puzzle, returning fallback');
    return this.getFallbackPuzzle(difficulty);
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

  private randomizePattern(grid: SudokuGrid): SudokuGrid {
    let randomizedGrid = grid;
    
    // 1. 숫자 치환
    randomizedGrid = this.substituteNumbers(randomizedGrid);
    
    // 2. 행 교환 (같은 3x3 블록 내에서)
    randomizedGrid = this.swapRows(randomizedGrid);
    
    // 3. 열 교환 (같은 3x3 블록 내에서)
    randomizedGrid = this.swapColumns(randomizedGrid);
    
    // 4. 3x3 블록 교환
    randomizedGrid = this.swapBoxes(randomizedGrid);
    
    return randomizedGrid;
  }

  private removeCells(grid: SudokuGrid, difficulty: Difficulty, symmetric = false): SudokuGrid {
    const cellsToRemove = this.getCellsToRemove(difficulty);
    const positions = this.getAllPositions();
    const shuffledPositions = this.shuffleArray(positions);
    
    let currentGrid = grid;
    let removedCount = 0;
    
    for (const position of shuffledPositions) {
      if (removedCount >= cellsToRemove) break;
      
      const originalCell = currentGrid.getCell(position);
      if (originalCell.isEmpty()) continue;
      
      // 셀 제거 시도
      const testGrid = currentGrid.setCell(position, CellValue.empty());
      
      // 대칭 제거 옵션
      if (symmetric) {
        const symmetricPos = new Position(8 - position.row, 8 - position.col);
        const symmetricGrid = testGrid.setCell(symmetricPos, CellValue.empty());
        
        if (this.hasUniqueSolution(symmetricGrid)) {
          currentGrid = symmetricGrid;
          removedCount += 2;
          continue;
        }
      }
      
      // 일반 제거
      if (this.hasUniqueSolution(testGrid)) {
        currentGrid = testGrid;
        removedCount++;
      }
    }
    
    return this.markGivenCells(currentGrid);
  }

  private getCellsToRemove(difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.EASY: return this.randomRange(35, 40);
      case Difficulty.MEDIUM: return this.randomRange(41, 47);
      case Difficulty.HARD: return this.randomRange(48, 54);
      case Difficulty.EXPERT: return this.randomRange(55, 64);
      default: return 45;
    }
  }

  private hasUniqueSolution(grid: SudokuGrid): boolean {
    // 간단한 유일해 검증 (실제로는 더 복잡한 알고리즘 필요)
    const solutions = this.countSolutions(grid, 2); // 최대 2개까지만 확인
    return solutions === 1;
  }

  private countSolutions(grid: SudokuGrid, maxCount: number): number {
    const emptyCells = this.getEmptyCells(grid);
    
    if (emptyCells.length === 0) {
      return 1; // 완성된 해답
    }

    if (maxCount <= 0) {
      return 0;
    }

    const position = emptyCells[0];
    const possibleValues = this.validationService.getPossibleValues(grid, position);
    
    let solutionCount = 0;
    
    for (const value of possibleValues) {
      const newGrid = grid.setCell(position, value);
      solutionCount += this.countSolutions(newGrid, maxCount - solutionCount);
      
      if (solutionCount >= maxCount) {
        break;
      }
    }
    
    return solutionCount;
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

  private randomRange(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
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

  private swapRows(grid: SudokuGrid): SudokuGrid {
    // 같은 3x3 블록 내에서 행 교환
    const cells = this.getGridCells(grid);
    
    for (let blockRow = 0; blockRow < 3; blockRow++) {
      if (this.random() < 0.5) continue;
      
      const startRow = blockRow * 3;
      const row1 = startRow + Math.floor(this.random() * 3);
      const row2 = startRow + Math.floor(this.random() * 3);
      
      if (row1 !== row2) {
        [cells[row1], cells[row2]] = [cells[row2], cells[row1]];
        
        // Position 업데이트
        for (let col = 0; col < 9; col++) {
          cells[row1][col] = new Cell(new Position(row1, col), cells[row1][col].value, { isGiven: false });
          cells[row2][col] = new Cell(new Position(row2, col), cells[row2][col].value, { isGiven: false });
        }
      }
    }
    
    return new SudokuGrid(cells);
  }

  private swapColumns(grid: SudokuGrid): SudokuGrid {
    // 같은 3x3 블록 내에서 열 교환
    const cells = this.getGridCells(grid);
    
    for (let blockCol = 0; blockCol < 3; blockCol++) {
      if (this.random() < 0.5) continue;
      
      const startCol = blockCol * 3;
      const col1 = startCol + Math.floor(this.random() * 3);
      const col2 = startCol + Math.floor(this.random() * 3);
      
      if (col1 !== col2) {
        for (let row = 0; row < 9; row++) {
          [cells[row][col1], cells[row][col2]] = [cells[row][col2], cells[row][col1]];
          
          // Position 업데이트
          cells[row][col1] = new Cell(new Position(row, col1), cells[row][col1].value, { isGiven: false });
          cells[row][col2] = new Cell(new Position(row, col2), cells[row][col2].value, { isGiven: false });
        }
      }
    }
    
    return new SudokuGrid(cells);
  }

  private swapBoxes(grid: SudokuGrid): SudokuGrid {
    // 3x3 블록 교환
    const cells = this.getGridCells(grid);
    
    // 행 방향 블록 교환
    if (this.random() < 0.3) {
      const block1 = Math.floor(this.random() * 3);
      const block2 = Math.floor(this.random() * 3);
      
      if (block1 !== block2) {
        for (let row = 0; row < 3; row++) {
          [cells[block1 * 3 + row], cells[block2 * 3 + row]] = 
          [cells[block2 * 3 + row], cells[block1 * 3 + row]];
        }
      }
    }
    
    return new SudokuGrid(cells);
  }

  private getFallbackPuzzle(_difficulty: Difficulty): SudokuGrid {
    // 실패 시 기본 퍼즐 반환
    const easyPuzzle = [
      [5, 3, 0, 0, 7, 0, 0, 0, 0],
      [6, 0, 0, 1, 9, 5, 0, 0, 0],
      [0, 9, 8, 0, 0, 0, 0, 6, 0],
      [8, 0, 0, 0, 6, 0, 0, 0, 3],
      [4, 0, 0, 8, 0, 3, 0, 0, 1],
      [7, 0, 0, 0, 2, 0, 0, 0, 6],
      [0, 6, 0, 0, 0, 0, 2, 8, 0],
      [0, 0, 0, 4, 1, 9, 0, 0, 5],
      [0, 0, 0, 0, 8, 0, 0, 7, 9]
    ];

    const cells = Array.from({ length: 9 }, (_, row) =>
      Array.from({ length: 9 }, (_, col) => {
        const position = new Position(row, col);
        const puzzleValue = easyPuzzle[row][col];
        
        if (puzzleValue !== 0) {
          const value = CellValue.from(puzzleValue);
          return new Cell(position, value, { isGiven: true });
        } else {
          return new Cell(position, CellValue.empty(), { isGiven: false });
        }
      })
    );

    return new SudokuGrid(cells);
  }
}