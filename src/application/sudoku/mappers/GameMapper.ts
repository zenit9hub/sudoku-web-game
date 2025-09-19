import { SudokuGame } from '../../../domain/sudoku/aggregates/Game.js';
import { Position } from '../../../domain/sudoku/value-objects/Position.js';
import { CellValue } from '../../../domain/sudoku/value-objects/CellValue.js';
import { GameDto, GameStateDto, GridDto, CellDto, PositionDto } from '../dtos/GameDto.js';

/**
 * 도메인 객체와 DTO 간의 변환을 담당하는 매퍼
 */
export class GameMapper {
  /**
   * 도메인 게임 객체를 DTO로 변환
   */
  static toDto(game: SudokuGame): GameDto {
    return {
      id: game.id,
      grid: this.gridToDto(game.grid),
      state: this.gameStateToDto(game.state),
      createdAt: game.createdAt.toISOString(),
      updatedAt: game.updatedAt.toISOString()
    };
  }

  /**
   * 게임 상태를 DTO로 변환
   */
  static gameStateToDto(state: any): GameStateDto {
    return {
      isComplete: state.isComplete,
      isPaused: state.isPaused,
      moveCount: state.moveCount,
      mistakeCount: state.mistakeCount,
      elapsedTime: state.elapsedTime,
      difficulty: state.difficulty,
      startTime: state.startTime
    };
  }

  /**
   * 그리드를 DTO로 변환
   */
  static gridToDto(grid: any): GridDto {
    const cells: CellDto[][] = [];

    for (let row = 0; row < 9; row++) {
      cells[row] = [];
      for (let col = 0; col < 9; col++) {
        const position = new Position(row, col);
        const cell = grid.getCell(position);
        cells[row][col] = this.cellToDto(cell);
      }
    }

    return {
      cells,
      size: 9
    };
  }

  /**
   * 셀을 DTO로 변환
   */
  static cellToDto(cell: any): CellDto {
    return {
      value: cell.value.value,
      isEmpty: cell.isEmpty(),
      isGiven: cell.isGiven,
      isValid: true // 유효성은 별도 서비스에서 판단
    };
  }

  /**
   * 포지션을 DTO로 변환
   */
  static positionToDto(position: Position): PositionDto {
    return {
      row: position.row,
      col: position.col
    };
  }

  /**
   * DTO 포지션을 도메인 포지션으로 변환
   */
  static positionFromDto(dto: PositionDto): Position {
    return new Position(dto.row, dto.col);
  }

  /**
   * 숫자를 CellValue로 변환
   */
  static cellValueFromNumber(value: number): CellValue {
    return new CellValue(value);
  }

  /**
   * CellValue를 숫자로 변환
   */
  static cellValueToNumber(cellValue: CellValue): number {
    return cellValue.value || 0;
  }
}