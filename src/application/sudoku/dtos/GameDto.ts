import { Difficulty } from '../../../domain/sudoku/entities/GameState.js';

/**
 * 게임 상태 DTO
 */
export interface GameStateDto {
  readonly isComplete: boolean;
  readonly isPaused: boolean;
  readonly moveCount: number;
  readonly mistakeCount: number;
  readonly elapsedTime: number;
  readonly difficulty: Difficulty;
  readonly startTime: number;
}

/**
 * 셀 DTO
 */
export interface CellDto {
  readonly value: number;
  readonly isEmpty: boolean;
  readonly isGiven: boolean;
  readonly isValid: boolean;
}

/**
 * 포지션 DTO
 */
export interface PositionDto {
  readonly row: number;
  readonly col: number;
}

/**
 * 그리드 DTO
 */
export interface GridDto {
  readonly cells: CellDto[][];
  readonly size: number;
}

/**
 * 게임 DTO
 */
export interface GameDto {
  readonly id: string;
  readonly grid: GridDto;
  readonly state: GameStateDto;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * 라인 완성 DTO
 */
export interface LineCompletionDto {
  readonly type: 'row' | 'column';
  readonly index: number;
  readonly completionPosition: PositionDto;
}