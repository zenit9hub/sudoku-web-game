import { BusinessRuleEngine } from '../../common/rules/BusinessRule.js';
import { SudokuRuleFactory, SudokuMoveContext } from '../rules/SudokuBusinessRules.js';
import { Position } from '../value-objects/Position.js';
import { CellValue } from '../value-objects/CellValue.js';
import { Difficulty } from '../entities/GameState.js';
import { DomainEventPublisher } from '../../common/events/DomainEventPublisher.js';
import { MoveAttempted, ValidMoveCompleted, InvalidMoveAttempted } from '../events/SudokuDomainEvents.js';

/**
 * 향상된 그리드 검증 서비스
 *
 * 비즈니스 규칙 엔진을 사용하여 스도쿠 규칙을 검증합니다.
 */

export interface ValidationResult {
  readonly isValid: boolean;
  readonly conflictingPositions: Position[];
  readonly errorMessages: string[];
  readonly violatedRules: string[];
  readonly suggestions?: ValidationSuggestion[];
}

export interface ValidationSuggestion {
  readonly type: 'naked_single' | 'hidden_single' | 'elimination';
  readonly position: Position;
  readonly value: CellValue;
  readonly reasoning: string;
}

export class EnhancedGridValidationService {
  private moveValidationEngine: BusinessRuleEngine<SudokuMoveContext>;
  private eventPublisher?: DomainEventPublisher;

  constructor(
    difficulty: Difficulty = Difficulty.MEDIUM,
    eventPublisher?: DomainEventPublisher
  ) {
    this.moveValidationEngine = SudokuRuleFactory.createDifficultySpecificEngine(difficulty);
    this.eventPublisher = eventPublisher;
  }

  /**
   * 수 입력 검증 (향상된 버전)
   */
  async validateMove(
    grid: any,
    position: Position,
    value: CellValue,
    gameState?: any
  ): Promise<ValidationResult> {
    const context: SudokuMoveContext = {
      grid,
      position,
      value,
      gameState: gameState || { isComplete: false, isPaused: false, mistakeCount: 0 }
    };

    const ruleResult = this.moveValidationEngine.validate(context);

    const conflictingPositions = this.getConflictingPositions(grid, position, value);
    const suggestions = await this.generateSuggestions(grid, position, value);

    const validationResult: ValidationResult = {
      isValid: ruleResult.isValid,
      conflictingPositions,
      errorMessages: ruleResult.violatedRules.map(vr => vr.errorMessage),
      violatedRules: ruleResult.violatedRules.map(vr => vr.rule.name),
      suggestions: ruleResult.isValid ? undefined : suggestions
    };

    // 도메인 이벤트 발행
    if (this.eventPublisher && gameState) {
      const gameId = gameState.id || 'unknown';

      await this.eventPublisher.publish(
        new MoveAttempted(gameId, position, value, ruleResult.isValid, conflictingPositions)
      );

      if (ruleResult.isValid) {
        await this.eventPublisher.publish(
          new ValidMoveCompleted(gameId, position, value, gameState.moveCount + 1)
        );
      } else {
        await this.eventPublisher.publish(
          new InvalidMoveAttempted(gameId, position, value, conflictingPositions, gameState.mistakeCount + 1)
        );
      }
    }

    return validationResult;
  }

  /**
   * 그리드 완료 여부 검사
   */
  isGridComplete(grid: any): boolean {
    console.log('Checking if grid is complete...');

    // 1. 모든 셀이 채워져 있는지 확인
    let filledCells = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = grid.getCell(new Position(row, col));
        if (cell.isEmpty()) {
          console.log(`Empty cell found at (${row}, ${col}), grid not complete`);
          return false;
        }
        filledCells++;
      }
    }

    console.log(`All ${filledCells} cells are filled. Checking for conflicts...`);

    // 2. 간단한 스도쿠 규칙 검사 (중복 값 확인)
    // 행 검사
    for (let row = 0; row < 9; row++) {
      const seen = new Set();
      for (let col = 0; col < 9; col++) {
        const cell = grid.getCell(new Position(row, col));
        const value = cell.value.toString();
        if (seen.has(value)) {
          console.log(`Duplicate value ${value} in row ${row}`);
          return false;
        }
        seen.add(value);
      }
    }

    // 열 검사
    for (let col = 0; col < 9; col++) {
      const seen = new Set();
      for (let row = 0; row < 9; row++) {
        const cell = grid.getCell(new Position(row, col));
        const value = cell.value.toString();
        if (seen.has(value)) {
          console.log(`Duplicate value ${value} in column ${col}`);
          return false;
        }
        seen.add(value);
      }
    }

    // 3x3 박스 검사
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const seen = new Set();
        for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
          for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
            const cell = grid.getCell(new Position(row, col));
            const value = cell.value.toString();
            if (seen.has(value)) {
              console.log(`Duplicate value ${value} in box (${boxRow}, ${boxCol})`);
              return false;
            }
            seen.add(value);
          }
        }
      }
    }

    console.log('🎉 Grid is complete and valid!');
    return true;
  }

  /**
   * 그리드 유효성 전체 검사
   */
  validateCompleteGrid(grid: any): ValidationResult {
    const allErrors: string[] = [];
    const allViolatedRules: string[] = [];
    const allConflictingPositions: Position[] = [];

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const position = new Position(row, col);
        const cell = grid.getCell(position);

        if (!cell.isEmpty()) {
          const context: SudokuMoveContext = {
            grid,
            position,
            value: cell.value,
            gameState: { isComplete: false, isPaused: false, mistakeCount: 0 }
          };

          const result = this.moveValidationEngine.validate(context);
          if (!result.isValid) {
            allErrors.push(...result.violatedRules.map(vr => vr.errorMessage));
            allViolatedRules.push(...result.violatedRules.map(vr => vr.rule.name));
            allConflictingPositions.push(...this.getConflictingPositions(grid, position, cell.value));
          }
        }
      }
    }

    return {
      isValid: allErrors.length === 0,
      conflictingPositions: this.removeDuplicatePositions(allConflictingPositions),
      errorMessages: [...new Set(allErrors)],
      violatedRules: [...new Set(allViolatedRules)]
    };
  }

  /**
   * 충돌하는 위치들 찾기
   */
  private getConflictingPositions(grid: any, position: Position, value: CellValue): Position[] {
    if (value.isEmpty()) return [];

    const conflicts: Position[] = [];

    // 같은 행에서 충돌 찾기
    for (let col = 0; col < 9; col++) {
      if (col !== position.col) {
        const cell = grid.getCell(new Position(position.row, col));
        if (!cell.isEmpty() && cell.value.equals(value)) {
          conflicts.push(new Position(position.row, col));
        }
      }
    }

    // 같은 열에서 충돌 찾기
    for (let row = 0; row < 9; row++) {
      if (row !== position.row) {
        const cell = grid.getCell(new Position(row, position.col));
        if (!cell.isEmpty() && cell.value.equals(value)) {
          conflicts.push(new Position(row, position.col));
        }
      }
    }

    // 같은 3x3 박스에서 충돌 찾기
    const boxStartRow = Math.floor(position.row / 3) * 3;
    const boxStartCol = Math.floor(position.col / 3) * 3;

    for (let row = boxStartRow; row < boxStartRow + 3; row++) {
      for (let col = boxStartCol; col < boxStartCol + 3; col++) {
        if (row !== position.row || col !== position.col) {
          const cell = grid.getCell(new Position(row, col));
          if (!cell.isEmpty() && cell.value.equals(value)) {
            conflicts.push(new Position(row, col));
          }
        }
      }
    }

    return conflicts;
  }

  /**
   * 검증 제안사항 생성
   */
  private async generateSuggestions(
    grid: any,
    position: Position,
    value: CellValue
  ): Promise<ValidationSuggestion[]> {
    const suggestions: ValidationSuggestion[] = [];

    // 해당 위치에 가능한 값들 찾기
    const possibleValues = await this.getPossibleValues(grid, position);

    if (possibleValues.length === 1) {
      suggestions.push({
        type: 'naked_single',
        position,
        value: new CellValue(possibleValues[0]),
        reasoning: `Only ${possibleValues[0]} is possible in this cell`
      });
    } else if (possibleValues.length > 1) {
      // 제거법 제안
      const invalidReasons = this.getInvalidReasons(grid, position, value);
      if (invalidReasons.length > 0) {
        suggestions.push({
          type: 'elimination',
          position,
          value,
          reasoning: `Cannot place ${value.value}: ${invalidReasons.join(', ')}`
        });
      }
    }

    // Hidden single 검사
    for (const num of possibleValues) {
      if (await this.isHiddenSingle(grid, position, new CellValue(num))) {
        suggestions.push({
          type: 'hidden_single',
          position,
          value: new CellValue(num),
          reasoning: `${num} can only go in this position within its unit`
        });
      }
    }

    return suggestions;
  }

  /**
   * 가능한 값들 조회
   */
  private async getPossibleValues(grid: any, position: Position): Promise<number[]> {
    const possible: number[] = [];

    for (let num = 1; num <= 9; num++) {
      const testValue = new CellValue(num);
      const context: SudokuMoveContext = {
        grid,
        position,
        value: testValue,
        gameState: { isComplete: false, isPaused: false, mistakeCount: 0 }
      };

      // 기본 유효성 규칙만 체크 (given cell, game state 등 제외)
      const basicEngine = new BusinessRuleEngine<SudokuMoveContext>();
      basicEngine.addRules([
        new (await import('../rules/SudokuBusinessRules.js')).UniqueInRowRule(),
        new (await import('../rules/SudokuBusinessRules.js')).UniqueInColumnRule(),
        new (await import('../rules/SudokuBusinessRules.js')).UniqueInBoxRule()
      ]);

      const result = basicEngine.validate(context);
      if (result.isValid) {
        possible.push(num);
      }
    }

    return possible;
  }

  /**
   * 무효한 이유들 조회
   */
  private getInvalidReasons(grid: any, position: Position, value: CellValue): string[] {
    const reasons: string[] = [];

    // 행 충돌 검사
    for (let col = 0; col < 9; col++) {
      if (col !== position.col) {
        const cell = grid.getCell(new Position(position.row, col));
        if (!cell.isEmpty() && cell.value.equals(value)) {
          reasons.push(`conflicts with row ${position.row + 1}`);
          break;
        }
      }
    }

    // 열 충돌 검사
    for (let row = 0; row < 9; row++) {
      if (row !== position.row) {
        const cell = grid.getCell(new Position(row, position.col));
        if (!cell.isEmpty() && cell.value.equals(value)) {
          reasons.push(`conflicts with column ${position.col + 1}`);
          break;
        }
      }
    }

    // 박스 충돌 검사
    const boxStartRow = Math.floor(position.row / 3) * 3;
    const boxStartCol = Math.floor(position.col / 3) * 3;

    for (let row = boxStartRow; row < boxStartRow + 3; row++) {
      for (let col = boxStartCol; col < boxStartCol + 3; col++) {
        if (row !== position.row || col !== position.col) {
          const cell = grid.getCell(new Position(row, col));
          if (!cell.isEmpty() && cell.value.equals(value)) {
            const boxNum = Math.floor(position.row / 3) * 3 + Math.floor(position.col / 3) + 1;
            reasons.push(`conflicts with box ${boxNum}`);
            break;
          }
        }
      }
    }

    return reasons;
  }

  /**
   * Hidden single 여부 확인
   */
  private async isHiddenSingle(grid: any, position: Position, value: CellValue): Promise<boolean> {
    // 행에서 유일한 위치인지 확인
    let possibleInRow = 0;
    for (let col = 0; col < 9; col++) {
      const pos = new Position(position.row, col);
      if (await this.canPlaceValue(grid, pos, value)) {
        possibleInRow++;
      }
    }

    if (possibleInRow === 1) return true;

    // 열에서 유일한 위치인지 확인
    let possibleInCol = 0;
    for (let row = 0; row < 9; row++) {
      const pos = new Position(row, position.col);
      if (await this.canPlaceValue(grid, pos, value)) {
        possibleInCol++;
      }
    }

    if (possibleInCol === 1) return true;

    // 박스에서 유일한 위치인지 확인
    const boxStartRow = Math.floor(position.row / 3) * 3;
    const boxStartCol = Math.floor(position.col / 3) * 3;
    let possibleInBox = 0;

    for (let row = boxStartRow; row < boxStartRow + 3; row++) {
      for (let col = boxStartCol; col < boxStartCol + 3; col++) {
        const pos = new Position(row, col);
        if (await this.canPlaceValue(grid, pos, value)) {
          possibleInBox++;
        }
      }
    }

    return possibleInBox === 1;
  }

  /**
   * 특정 위치에 값을 놓을 수 있는지 확인
   */
  private async canPlaceValue(grid: any, position: Position, value: CellValue): Promise<boolean> {
    const cell = grid.getCell(position);
    if (!cell.isEmpty()) return false;

    const possibleValues = await this.getPossibleValues(grid, position);
    return possibleValues.includes(value.value || 0);
  }

  /**
   * 중복 위치 제거
   */
  private removeDuplicatePositions(positions: Position[]): Position[] {
    const unique: Position[] = [];
    const seen = new Set<string>();

    for (const pos of positions) {
      const key = `${pos.row},${pos.col}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(pos);
      }
    }

    return unique;
  }

  /**
   * 난이도 변경
   */
  setDifficulty(difficulty: Difficulty): void {
    this.moveValidationEngine = SudokuRuleFactory.createDifficultySpecificEngine(difficulty);
  }

  /**
   * 이벤트 발행자 설정
   */
  setEventPublisher(eventPublisher: DomainEventPublisher): void {
    this.eventPublisher = eventPublisher;
  }
}