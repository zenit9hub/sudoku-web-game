import { Difficulty } from '../entities/GameState.js';
import { Position } from '../value-objects/Position.js';
import { CellValue } from '../value-objects/CellValue.js';
import { EnhancedGridValidationService } from './EnhancedGridValidationService.js';

/**
 * 고급 퍼즐 생성 서비스
 *
 * 다양한 생성 전략과 난이도 조절 알고리즘을 제공합니다.
 */

export interface PuzzleGenerationOptions {
  readonly useSymmetricRemoval?: boolean;
  readonly ensureUniqueSolution?: boolean;
  readonly minimumClues?: number;
  readonly maximumClues?: number;
  readonly allowedTechniques?: SolvingTechnique[];
  readonly targetSolvingTime?: number; // seconds
  readonly qualityThreshold?: number; // 0-1
}

export enum SolvingTechnique {
  NAKED_SINGLE = 'naked_single',
  HIDDEN_SINGLE = 'hidden_single',
  NAKED_PAIR = 'naked_pair',
  HIDDEN_PAIR = 'hidden_pair',
  POINTING_PAIR = 'pointing_pair',
  BOX_LINE_REDUCTION = 'box_line_reduction',
  X_WING = 'x_wing',
  SWORDFISH = 'swordfish',
  COLORING = 'coloring',
  FORCING_CHAIN = 'forcing_chain'
}

export interface PuzzleQuality {
  readonly difficulty: Difficulty;
  readonly clueCount: number;
  readonly symmetryScore: number; // 0-1
  readonly uniqueness: boolean;
  readonly requiredTechniques: SolvingTechnique[];
  readonly estimatedSolvingTime: number;
  readonly aestheticScore: number; // 0-1
}

export interface GenerationResult {
  readonly puzzle: any; // SudokuGrid
  readonly solution: any; // SudokuGrid
  readonly quality: PuzzleQuality;
  readonly generationTime: number;
  readonly attempts: number;
}

export class AdvancedPuzzleGenerationService {
  private validationService: EnhancedGridValidationService;
  private rng: () => number;

  constructor(seed: number = Date.now()) {
    this.validationService = new EnhancedGridValidationService();
    this.rng = this.createSeededRandom(seed);
  }

  /**
   * 고급 퍼즐 생성
   */
  async generateAdvancedPuzzle(
    difficulty: Difficulty,
    options: PuzzleGenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = performance.now();
    let attempts = 0;
    const maxAttempts = 100;

    const defaultOptions: Required<PuzzleGenerationOptions> = {
      useSymmetricRemoval: true,
      ensureUniqueSolution: true,
      minimumClues: this.getMinimumClues(difficulty),
      maximumClues: this.getMaximumClues(difficulty),
      allowedTechniques: this.getAllowedTechniques(difficulty),
      targetSolvingTime: this.getTargetSolvingTime(difficulty),
      qualityThreshold: 0.7,
      ...options
    };

    while (attempts < maxAttempts) {
      attempts++;

      try {
        // 1. 완전한 해답 그리드 생성
        const solution = await this.generateCompleteGrid();

        // 2. 난이도에 맞는 퍼즐 생성
        const puzzle = await this.createPuzzleFromSolution(solution, difficulty, defaultOptions);

        // 3. 퍼즐 품질 평가
        const quality = await this.evaluatePuzzleQuality(puzzle, solution, difficulty, defaultOptions);

        // 4. 품질 기준 충족 여부 확인
        if (quality.aestheticScore >= defaultOptions.qualityThreshold) {
          const generationTime = performance.now() - startTime;

          return {
            puzzle,
            solution,
            quality,
            generationTime,
            attempts
          };
        }

      } catch (error) {
        console.warn(`Puzzle generation attempt ${attempts} failed:`, error);
      }
    }

    throw new Error(`Failed to generate quality puzzle after ${maxAttempts} attempts`);
  }

  /**
   * 완전한 해답 그리드 생성
   */
  private async generateCompleteGrid(): Promise<any> {
    const grid = this.createEmptyGrid();

    // 백트래킹 알고리즘으로 완전한 그리드 생성
    if (await this.fillGridRecursively(grid, 0, 0)) {
      return grid;
    }

    throw new Error('Failed to generate complete grid');
  }

  /**
   * 재귀적 그리드 채우기 (백트래킹)
   */
  private async fillGridRecursively(grid: any, row: number, col: number): Promise<boolean> {
    // 다음 빈 셀 찾기
    const nextPos = this.findNextEmptyCell(grid, row, col);
    if (!nextPos) {
      return true; // 모든 셀이 채워짐
    }

    const { row: nextRow, col: nextCol } = nextPos;

    // 1-9 숫자를 랜덤 순서로 시도
    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

    for (const num of numbers) {
      const value = new CellValue(num);
      const position = new Position(nextRow, nextCol);

      // 유효성 검사
      const validation = await this.validationService.validateMove(grid, position, value);

      if (validation.isValid) {
        // 셀에 값 설정
        grid.setCell(position, value);

        // 재귀적으로 다음 셀 채우기
        if (await this.fillGridRecursively(grid, nextRow, nextCol)) {
          return true;
        }

        // 백트래킹: 값 제거
        grid.setCell(position, new CellValue(null));
      }
    }

    return false;
  }

  /**
   * 해답으로부터 퍼즐 생성
   */
  private async createPuzzleFromSolution(
    solution: any,
    difficulty: Difficulty,
    options: Required<PuzzleGenerationOptions>
  ): Promise<any> {
    const puzzle = solution.clone();

    if (options.useSymmetricRemoval) {
      return await this.createSymmetricPuzzle(puzzle, difficulty, options);
    } else {
      return await this.createAsymmetricPuzzle(puzzle, difficulty, options);
    }
  }

  /**
   * 대칭적 퍼즐 생성
   */
  private async createSymmetricPuzzle(
    puzzle: any,
    difficulty: Difficulty,
    options: Required<PuzzleGenerationOptions>
  ): Promise<any> {
    const positions = this.generateSymmetricPositions();
    const targetClues = this.getTargetClues(difficulty, options);

    for (const positionPair of positions) {
      if (this.getClueCount(puzzle) <= targetClues) {
        break;
      }

      // 대칭 위치의 값들을 임시로 제거
      const tempValues = positionPair.map(pos => {
        const cell = puzzle.getCell(pos);
        puzzle.setCell(pos, new CellValue(null));
        return cell.value;
      });

      // 유일성 검사
      if (options.ensureUniqueSolution && !await this.hasUniqueSolution(puzzle)) {
        // 값들을 복원
        positionPair.forEach((pos, index) => {
          puzzle.setCell(pos, tempValues[index]);
        });
      }
    }

    return puzzle;
  }

  /**
   * 비대칭적 퍼즐 생성
   */
  private async createAsymmetricPuzzle(
    puzzle: any,
    difficulty: Difficulty,
    options: Required<PuzzleGenerationOptions>
  ): Promise<any> {
    const positions = this.generateRandomPositions();
    const targetClues = this.getTargetClues(difficulty, options);

    for (const position of positions) {
      if (this.getClueCount(puzzle) <= targetClues) {
        break;
      }

      const cell = puzzle.getCell(position);
      const tempValue = cell.value;

      // 값 제거
      puzzle.setCell(position, new CellValue(null));

      // 유일성 검사
      if (options.ensureUniqueSolution && !await this.hasUniqueSolution(puzzle)) {
        // 값 복원
        puzzle.setCell(position, tempValue);
      }
    }

    return puzzle;
  }

  /**
   * 퍼즐 품질 평가
   */
  private async evaluatePuzzleQuality(
    puzzle: any,
    _solution: any,
    difficulty: Difficulty,
    _options: Required<PuzzleGenerationOptions>
  ): Promise<PuzzleQuality> {
    const clueCount = this.getClueCount(puzzle);
    const symmetryScore = this.calculateSymmetryScore(puzzle);
    const uniquenessResult = await this.checkUniqueness(puzzle);
    const uniqueness = uniquenessResult === 'unique';
    const requiredTechniques = await this.analyzeRequiredTechniques(puzzle);
    const estimatedSolvingTime = this.estimateSolvingTime(puzzle, requiredTechniques);
    const aestheticScore = this.calculateAestheticScore(puzzle, symmetryScore, clueCount, difficulty);

    return {
      difficulty,
      clueCount,
      symmetryScore,
      uniqueness,
      requiredTechniques,
      estimatedSolvingTime,
      aestheticScore
    };
  }

  /**
   * 대칭 위치 생성
   */
  private generateSymmetricPositions(): Position[][] {
    const positions: Position[][] = [];
    const used = new Set<string>();

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const key = `${row},${col}`;
        if (used.has(key)) continue;

        const pos1 = new Position(row, col);
        const pos2 = new Position(8 - row, 8 - col);

        if (pos1.equals(pos2)) {
          // 중앙 셀
          positions.push([pos1]);
          used.add(key);
        } else {
          // 대칭 쌍
          positions.push([pos1, pos2]);
          used.add(key);
          used.add(`${8 - row},${8 - col}`);
        }
      }
    }

    return this.shuffleArray(positions);
  }

  /**
   * 랜덤 위치 생성
   */
  private generateRandomPositions(): Position[] {
    const positions: Position[] = [];

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        positions.push(new Position(row, col));
      }
    }

    return this.shuffleArray(positions);
  }

  /**
   * 해의 유일성 검사
   */
  private async hasUniqueSolution(puzzle: any): Promise<boolean> {
    let solutionCount = 0;
    const maxSolutions = 2; // 2개 이상 찾으면 중단

    const countSolutions = (grid: any, row: number, col: number): boolean => {
      if (solutionCount >= maxSolutions) return true;

      const nextPos = this.findNextEmptyCell(grid, row, col);
      if (!nextPos) {
        solutionCount++;
        return solutionCount >= maxSolutions;
      }

      const { row: nextRow, col: nextCol } = nextPos;

      for (let num = 1; num <= 9; num++) {
        const value = new CellValue(num);
        const position = new Position(nextRow, nextCol);

        // 간단한 유효성 검사 (성능을 위해)
        if (this.isValidPlacement(grid, position, value)) {
          grid.setCell(position, value);

          if (countSolutions(grid, nextRow, nextCol)) {
            grid.setCell(position, new CellValue(null));
            return true;
          }

          grid.setCell(position, new CellValue(null));
        }
      }

      return false;
    };

    const testGrid = puzzle.clone();
    countSolutions(testGrid, 0, 0);

    return solutionCount === 1;
  }

  /**
   * 간단한 유효성 검사 (성능 최적화)
   */
  private isValidPlacement(grid: any, position: Position, value: CellValue): boolean {
    // 행 검사
    for (let col = 0; col < 9; col++) {
      if (col !== position.col) {
        const cell = grid.getCell(new Position(position.row, col));
        if (!cell.isEmpty() && cell.value.equals(value)) {
          return false;
        }
      }
    }

    // 열 검사
    for (let row = 0; row < 9; row++) {
      if (row !== position.row) {
        const cell = grid.getCell(new Position(row, position.col));
        if (!cell.isEmpty() && cell.value.equals(value)) {
          return false;
        }
      }
    }

    // 3x3 박스 검사
    const boxStartRow = Math.floor(position.row / 3) * 3;
    const boxStartCol = Math.floor(position.col / 3) * 3;

    for (let row = boxStartRow; row < boxStartRow + 3; row++) {
      for (let col = boxStartCol; col < boxStartCol + 3; col++) {
        if (row !== position.row || col !== position.col) {
          const cell = grid.getCell(new Position(row, col));
          if (!cell.isEmpty() && cell.value.equals(value)) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * 필요한 해결 기법 분석
   */
  private async analyzeRequiredTechniques(puzzle: any): Promise<SolvingTechnique[]> {
    const techniques: SolvingTechnique[] = [];

    // 여기서는 간단화된 분석
    // 실제로는 더 복잡한 분석이 필요

    if (this.requiresNakedSingles(puzzle)) {
      techniques.push(SolvingTechnique.NAKED_SINGLE);
    }

    if (this.requiresHiddenSingles(puzzle)) {
      techniques.push(SolvingTechnique.HIDDEN_SINGLE);
    }

    // 추가 기법들 분석...

    return techniques;
  }

  // 유틸리티 메소드들
  private createEmptyGrid(): any {
    // 빈 그리드 생성 로직
    return {}; // 실제 SudokuGrid 구현 필요
  }

  private findNextEmptyCell(grid: any, startRow: number, startCol: number): { row: number; col: number } | null {
    for (let row = startRow; row < 9; row++) {
      for (let col = (row === startRow ? startCol : 0); col < 9; col++) {
        const cell = grid.getCell(new Position(row, col));
        if (cell.isEmpty()) {
          return { row, col };
        }
      }
    }
    return null;
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private createSeededRandom(seed: number): () => number {
    let currentSeed = seed;
    return () => {
      const x = Math.sin(currentSeed++) * 10000;
      return x - Math.floor(x);
    };
  }

  private getMinimumClues(difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.EASY: return 45;
      case Difficulty.MEDIUM: return 35;
      case Difficulty.HARD: return 28;
      case Difficulty.EXPERT: return 22;
      default: return 35;
    }
  }

  private getMaximumClues(difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.EASY: return 55;
      case Difficulty.MEDIUM: return 45;
      case Difficulty.HARD: return 35;
      case Difficulty.EXPERT: return 30;
      default: return 45;
    }
  }

  private getAllowedTechniques(difficulty: Difficulty): SolvingTechnique[] {
    const techniques = [SolvingTechnique.NAKED_SINGLE, SolvingTechnique.HIDDEN_SINGLE];

    if (difficulty === Difficulty.MEDIUM || difficulty === Difficulty.HARD || difficulty === Difficulty.EXPERT) {
      techniques.push(SolvingTechnique.NAKED_PAIR, SolvingTechnique.HIDDEN_PAIR);
    }

    if (difficulty === Difficulty.HARD || difficulty === Difficulty.EXPERT) {
      techniques.push(SolvingTechnique.POINTING_PAIR, SolvingTechnique.BOX_LINE_REDUCTION);
    }

    if (difficulty === Difficulty.EXPERT) {
      techniques.push(SolvingTechnique.X_WING, SolvingTechnique.SWORDFISH);
    }

    return techniques;
  }

  private getTargetSolvingTime(difficulty: Difficulty): number {
    switch (difficulty) {
      case Difficulty.EASY: return 300; // 5 minutes
      case Difficulty.MEDIUM: return 900; // 15 minutes
      case Difficulty.HARD: return 1800; // 30 minutes
      case Difficulty.EXPERT: return 3600; // 60 minutes
      default: return 900;
    }
  }

  private getTargetClues(_difficulty: Difficulty, options: Required<PuzzleGenerationOptions>): number {
    const min = options.minimumClues;
    const max = options.maximumClues;
    return Math.floor(min + (max - min) * this.rng());
  }

  private getClueCount(grid: any): number {
    let count = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = grid.getCell(new Position(row, col));
        if (!cell.isEmpty()) {
          count++;
        }
      }
    }
    return count;
  }

  private calculateSymmetryScore(grid: any): number {
    let symmetricPairs = 0;
    let totalPairs = 0;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const pos1 = new Position(row, col);
        const pos2 = new Position(8 - row, 8 - col);

        if (!pos1.equals(pos2)) {
          totalPairs++;
          const cell1 = grid.getCell(pos1);
          const cell2 = grid.getCell(pos2);

          if ((cell1.isEmpty() && cell2.isEmpty()) || (!cell1.isEmpty() && !cell2.isEmpty())) {
            symmetricPairs++;
          }
        }
      }
    }

    return totalPairs > 0 ? symmetricPairs / totalPairs : 1;
  }

  private async checkUniqueness(puzzle: any): Promise<'unique' | 'multiple' | 'unsolvable'> {
    if (await this.hasUniqueSolution(puzzle)) {
      return 'unique';
    }
    return 'multiple'; // 간단화된 구현
  }

  private estimateSolvingTime(_puzzle: any, techniques: SolvingTechnique[]): number {
    const baseTime = 180; // 3 minutes base
    const techniqueMultipliers = {
      [SolvingTechnique.NAKED_SINGLE]: 1.0,
      [SolvingTechnique.HIDDEN_SINGLE]: 1.2,
      [SolvingTechnique.NAKED_PAIR]: 1.5,
      [SolvingTechnique.HIDDEN_PAIR]: 1.7,
      [SolvingTechnique.POINTING_PAIR]: 2.0,
      [SolvingTechnique.BOX_LINE_REDUCTION]: 2.2,
      [SolvingTechnique.X_WING]: 3.0,
      [SolvingTechnique.SWORDFISH]: 4.0,
      [SolvingTechnique.COLORING]: 5.0,
      [SolvingTechnique.FORCING_CHAIN]: 8.0
    };

    let multiplier = 1.0;
    for (const technique of techniques) {
      multiplier *= techniqueMultipliers[technique] || 1.0;
    }

    return baseTime * multiplier;
  }

  private calculateAestheticScore(grid: any, symmetryScore: number, clueCount: number, difficulty: Difficulty): number {
    const targetClues = this.getTargetClues(difficulty, {
      minimumClues: this.getMinimumClues(difficulty),
      maximumClues: this.getMaximumClues(difficulty)
    } as any);

    const clueScore = 1 - Math.abs(clueCount - targetClues) / targetClues;
    const distributionScore = this.calculateClueDistribution(grid);

    return (symmetryScore * 0.3 + clueScore * 0.4 + distributionScore * 0.3);
  }

  private calculateClueDistribution(grid: any): number {
    // 3x3 박스별 클루 분포 균등성 계산
    const boxCounts = new Array(9).fill(0);

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = grid.getCell(new Position(row, col));
        if (!cell.isEmpty()) {
          const boxIndex = Math.floor(row / 3) * 3 + Math.floor(col / 3);
          boxCounts[boxIndex]++;
        }
      }
    }

    const avgClues = boxCounts.reduce((sum, count) => sum + count, 0) / 9;
    const variance = boxCounts.reduce((sum, count) => sum + Math.pow(count - avgClues, 2), 0) / 9;

    return Math.max(0, 1 - variance / (avgClues * avgClues));
  }

  private requiresNakedSingles(puzzle: any): boolean {
    // 간단한 체크: 빈 셀이 있으면 naked single이 필요할 가능성이 높음
    return this.getClueCount(puzzle) < 81;
  }

  private requiresHiddenSingles(puzzle: any): boolean {
    // 더 복잡한 분석이 필요하지만 여기서는 간단화
    return this.getClueCount(puzzle) < 50;
  }
}