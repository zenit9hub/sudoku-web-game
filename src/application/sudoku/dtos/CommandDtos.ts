import { Difficulty } from '../../../domain/sudoku/entities/GameState.js';
import { GameDto, PositionDto, LineCompletionDto } from './GameDto.js';

/**
 * 새 게임 생성 요청 DTO
 */
export interface CreateNewGameRequestDto {
  readonly difficulty: Difficulty;
  readonly seed?: number;
}

/**
 * 새 게임 생성 응답 DTO
 */
export interface CreateNewGameResponseDto {
  readonly gameId: string;
  readonly game: GameDto;
  readonly success: boolean;
  readonly metadata?: {
    readonly difficulty: Difficulty;
    readonly seed: string;
    readonly timestamp: string;
  };
}

/**
 * 수 입력 요청 DTO
 */
export interface MakeMoveRequestDto {
  readonly gameId: string;
  readonly position: PositionDto;
  readonly value: number;
}

/**
 * 수 입력 응답 DTO
 */
export interface MakeMoveResponseDto {
  readonly game: GameDto;
  readonly isComplete: boolean;
  readonly conflictingPositions: PositionDto[];
  readonly lineCompletions: LineCompletionDto[];
  readonly success: boolean;
  readonly metadata?: {
    readonly moveCount: number;
    readonly mistakeCount: number;
    readonly hasLineCompletions: boolean;
    readonly timestamp: string;
  };
}