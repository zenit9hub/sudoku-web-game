import { BaseBusinessRule, BusinessRuleEngine } from '../../common/rules/BusinessRule.js';
import { Position } from '../value-objects/Position.js';
import { CellValue } from '../value-objects/CellValue.js';
import { Difficulty } from '../entities/GameState.js';

/**
 * 스도쿠 비즈니스 규칙 컨텍스트
 */
export interface SudokuMoveContext {
  readonly grid: any; // SudokuGrid 타입
  readonly position: Position;
  readonly value: CellValue;
  readonly gameState: any; // GameState 타입
}

export interface SudokuGameContext {
  readonly game: any; // SudokuGame 타입
  readonly action: string;
  readonly metadata?: Record<string, any>;
}

/**
 * 스도쿠 기본 규칙들
 */

/**
 * 주어진 셀 수정 금지 규칙
 */
export class CannotModifyGivenCellRule extends BaseBusinessRule<SudokuMoveContext> {
  constructor() {
    super(
      'CannotModifyGivenCell',
      'Given cells cannot be modified',
      100 // 높은 우선순위
    );
  }

  isSatisfiedBy(context: SudokuMoveContext): boolean {
    const cell = context.grid.getCell(context.position);
    return !cell.isGiven;
  }

  getErrorMessage(context: SudokuMoveContext): string {
    return `Cannot modify given cell at (${context.position.row}, ${context.position.col})`;
  }
}

/**
 * 행 중복 금지 규칙
 */
export class UniqueInRowRule extends BaseBusinessRule<SudokuMoveContext> {
  constructor() {
    super(
      'UniqueInRow',
      'Numbers must be unique within each row',
      90
    );
  }

  isSatisfiedBy(context: SudokuMoveContext): boolean {
    if (context.value.isEmpty()) return true;

    for (let col = 0; col < 9; col++) {
      if (col === context.position.col) continue;

      const cell = context.grid.getCell(new Position(context.position.row, col));
      if (!cell.isEmpty() && cell.value.equals(context.value)) {
        return false;
      }
    }
    return true;
  }

  getErrorMessage(context: SudokuMoveContext): string {
    return `Number ${context.value.value} already exists in row ${context.position.row + 1}`;
  }
}

/**
 * 열 중복 금지 규칙
 */
export class UniqueInColumnRule extends BaseBusinessRule<SudokuMoveContext> {
  constructor() {
    super(
      'UniqueInColumn',
      'Numbers must be unique within each column',
      90
    );
  }

  isSatisfiedBy(context: SudokuMoveContext): boolean {
    if (context.value.isEmpty()) return true;

    for (let row = 0; row < 9; row++) {
      if (row === context.position.row) continue;

      const cell = context.grid.getCell(new Position(row, context.position.col));
      if (!cell.isEmpty() && cell.value.equals(context.value)) {
        return false;
      }
    }
    return true;
  }

  getErrorMessage(context: SudokuMoveContext): string {
    return `Number ${context.value.value} already exists in column ${context.position.col + 1}`;
  }
}

/**
 * 3x3 박스 중복 금지 규칙
 */
export class UniqueInBoxRule extends BaseBusinessRule<SudokuMoveContext> {
  constructor() {
    super(
      'UniqueInBox',
      'Numbers must be unique within each 3x3 box',
      90
    );
  }

  isSatisfiedBy(context: SudokuMoveContext): boolean {
    if (context.value.isEmpty()) return true;

    const boxStartRow = Math.floor(context.position.row / 3) * 3;
    const boxStartCol = Math.floor(context.position.col / 3) * 3;

    for (let row = boxStartRow; row < boxStartRow + 3; row++) {
      for (let col = boxStartCol; col < boxStartCol + 3; col++) {
        if (row === context.position.row && col === context.position.col) continue;

        const cell = context.grid.getCell(new Position(row, col));
        if (!cell.isEmpty() && cell.value.equals(context.value)) {
          return false;
        }
      }
    }
    return true;
  }

  getErrorMessage(context: SudokuMoveContext): string {
    const boxRow = Math.floor(context.position.row / 3) + 1;
    const boxCol = Math.floor(context.position.col / 3) + 1;
    return `Number ${context.value.value} already exists in box (${boxRow}, ${boxCol})`;
  }
}

/**
 * 유효한 셀 값 규칙
 */
export class ValidCellValueRule extends BaseBusinessRule<SudokuMoveContext> {
  constructor() {
    super(
      'ValidCellValue',
      'Cell value must be between 1-9 or empty',
      80
    );
  }

  isSatisfiedBy(context: SudokuMoveContext): boolean {
    return context.value.isValid();
  }

  getErrorMessage(context: SudokuMoveContext): string {
    return `Invalid cell value: ${context.value.value}. Must be between 1-9 or empty.`;
  }
}

/**
 * 유효한 위치 규칙
 */
export class ValidPositionRule extends BaseBusinessRule<SudokuMoveContext> {
  constructor() {
    super(
      'ValidPosition',
      'Position must be within grid bounds',
      70
    );
  }

  isSatisfiedBy(context: SudokuMoveContext): boolean {
    return context.position.isValid();
  }

  getErrorMessage(context: SudokuMoveContext): string {
    return `Invalid position: (${context.position.row}, ${context.position.col}). Must be within 0-8 range.`;
  }
}

/**
 * 게임 진행 가능 규칙
 */
export class GameInProgressRule extends BaseBusinessRule<SudokuMoveContext> {
  constructor() {
    super(
      'GameInProgress',
      'Game must be in progress to make moves',
      60
    );
  }

  isSatisfiedBy(context: SudokuMoveContext): boolean {
    return !context.gameState.isComplete && !context.gameState.isPaused;
  }

  getErrorMessage(context: SudokuMoveContext): string {
    if (context.gameState.isComplete) {
      return 'Cannot make moves in completed game';
    }
    if (context.gameState.isPaused) {
      return 'Cannot make moves while game is paused';
    }
    return 'Game is not in progress';
  }
}

/**
 * 최대 실수 횟수 규칙
 */
export class MaxMistakesRule extends BaseBusinessRule<SudokuMoveContext> {
  private readonly maxMistakes: number;

  constructor(maxMistakes: number = 3) {
    super(
      'MaxMistakes',
      `Maximum ${maxMistakes} mistakes allowed`,
      50
    );
    this.maxMistakes = maxMistakes;
  }

  isSatisfiedBy(context: SudokuMoveContext): boolean {
    return context.gameState.mistakeCount < this.maxMistakes;
  }

  getErrorMessage(_context: SudokuMoveContext): string {
    return `Maximum mistakes (${this.maxMistakes}) reached. Game over.`;
  }
}

/**
 * 스도쿠 비즈니스 규칙 팩토리
 */
export class SudokuRuleFactory {
  /**
   * 기본 움직임 규칙 엔진 생성
   */
  static createMoveValidationEngine(): BusinessRuleEngine<SudokuMoveContext> {
    const engine = new BusinessRuleEngine<SudokuMoveContext>();

    engine.addRules([
      new ValidPositionRule(),
      new ValidCellValueRule(),
      new CannotModifyGivenCellRule(),
      new GameInProgressRule(),
      new UniqueInRowRule(),
      new UniqueInColumnRule(),
      new UniqueInBoxRule()
    ]);

    return engine;
  }

  /**
   * 난이도별 규칙 엔진 생성
   */
  static createDifficultySpecificEngine(difficulty: Difficulty): BusinessRuleEngine<SudokuMoveContext> {
    const engine = this.createMoveValidationEngine();

    switch (difficulty) {
      case Difficulty.EASY:
        // Easy 모드는 무제한 실수 허용
        break;

      case Difficulty.MEDIUM:
        engine.addRule(new MaxMistakesRule(5));
        break;

      case Difficulty.HARD:
        engine.addRule(new MaxMistakesRule(3));
        break;

      case Difficulty.EXPERT:
        engine.addRule(new MaxMistakesRule(1));
        break;
    }

    return engine;
  }

  /**
   * 게임 상태 검증 규칙 엔진 생성
   */
  static createGameStateEngine(): BusinessRuleEngine<SudokuGameContext> {
    const engine = new BusinessRuleEngine<SudokuGameContext>();

    // 게임 상태 관련 규칙들 추가
    // 예: 일시정지 중인 게임에 대한 액션 제한 등

    return engine;
  }
}

/**
 * 고급 스도쿠 규칙들 (솔빙 전략 기반)
 */

/**
 * Naked Single 규칙
 */
export class NakedSingleRule extends BaseBusinessRule<SudokuMoveContext> {
  constructor() {
    super(
      'NakedSingle',
      'If a cell has only one possible value, it must be that value',
      40
    );
  }

  isSatisfiedBy(context: SudokuMoveContext): boolean {
    if (context.value.isEmpty()) return true;

    const possibleValues = this.getPossibleValues(context.grid, context.position);
    return possibleValues.length === 1 && possibleValues[0] === context.value.value;
  }

  getErrorMessage(context: SudokuMoveContext): string {
    const possibleValues = this.getPossibleValues(context.grid, context.position);
    if (possibleValues.length === 1) {
      return `Cell must contain ${possibleValues[0]} (naked single)`;
    }
    return `Invalid move for naked single constraint`;
  }

  private getPossibleValues(grid: any, position: Position): number[] {
    const possible: number[] = [];

    for (let num = 1; num <= 9; num++) {
      const testValue = new CellValue(num);
      const context = { grid, position, value: testValue, gameState: null };

      const rowRule = new UniqueInRowRule();
      const colRule = new UniqueInColumnRule();
      const boxRule = new UniqueInBoxRule();

      if (rowRule.isSatisfiedBy(context) &&
          colRule.isSatisfiedBy(context) &&
          boxRule.isSatisfiedBy(context)) {
        possible.push(num);
      }
    }

    return possible;
  }
}

/**
 * Hidden Single 규칙
 */
export class HiddenSingleRule extends BaseBusinessRule<SudokuMoveContext> {
  constructor() {
    super(
      'HiddenSingle',
      'If a value can only go in one cell in a unit, it must go there',
      30
    );
  }

  isSatisfiedBy(context: SudokuMoveContext): boolean {
    if (context.value.isEmpty()) return true;

    // 행, 열, 박스에서 해당 값이 들어갈 수 있는 유일한 위치인지 확인
    return this.isHiddenSingleInRow(context) ||
           this.isHiddenSingleInColumn(context) ||
           this.isHiddenSingleInBox(context);
  }

  getErrorMessage(context: SudokuMoveContext): string {
    return `Value ${context.value.value} must be placed at this position (hidden single)`;
  }

  private isHiddenSingleInRow(context: SudokuMoveContext): boolean {
    let possiblePositions = 0;

    for (let col = 0; col < 9; col++) {
      const pos = new Position(context.position.row, col);
      const cell = context.grid.getCell(pos);

      if (cell.isEmpty()) {
        const testContext = { ...context, position: pos };
        const colRule = new UniqueInColumnRule();
        const boxRule = new UniqueInBoxRule();

        if (colRule.isSatisfiedBy(testContext) && boxRule.isSatisfiedBy(testContext)) {
          possiblePositions++;
        }
      }
    }

    return possiblePositions === 1;
  }

  private isHiddenSingleInColumn(context: SudokuMoveContext): boolean {
    let possiblePositions = 0;

    for (let row = 0; row < 9; row++) {
      const pos = new Position(row, context.position.col);
      const cell = context.grid.getCell(pos);

      if (cell.isEmpty()) {
        const testContext = { ...context, position: pos };
        const rowRule = new UniqueInRowRule();
        const boxRule = new UniqueInBoxRule();

        if (rowRule.isSatisfiedBy(testContext) && boxRule.isSatisfiedBy(testContext)) {
          possiblePositions++;
        }
      }
    }

    return possiblePositions === 1;
  }

  private isHiddenSingleInBox(context: SudokuMoveContext): boolean {
    let possiblePositions = 0;
    const boxStartRow = Math.floor(context.position.row / 3) * 3;
    const boxStartCol = Math.floor(context.position.col / 3) * 3;

    for (let row = boxStartRow; row < boxStartRow + 3; row++) {
      for (let col = boxStartCol; col < boxStartCol + 3; col++) {
        const pos = new Position(row, col);
        const cell = context.grid.getCell(pos);

        if (cell.isEmpty()) {
          const testContext = { ...context, position: pos };
          const rowRule = new UniqueInRowRule();
          const colRule = new UniqueInColumnRule();

          if (rowRule.isSatisfiedBy(testContext) && colRule.isSatisfiedBy(testContext)) {
            possiblePositions++;
          }
        }
      }
    }

    return possiblePositions === 1;
  }
}