import { GameDto, PositionDto } from './GameDto.js';

/**
 * 게임 조회 요청 DTO
 */
export interface GetGameRequestDto {
  readonly gameId: string;
}

/**
 * 게임 조회 응답 DTO
 */
export interface GetGameResponseDto {
  readonly game: GameDto | null;
  readonly exists: boolean;
  readonly metadata?: {
    readonly gameId: string;
    readonly loadedAt: string;
  };
}

/**
 * 힌트 조회 요청 DTO
 */
export interface GetGameHintRequestDto {
  readonly gameId: string;
  readonly maxHints?: number;
}

/**
 * 힌트 정보 DTO
 */
export interface HintInfoDto {
  readonly position: PositionDto;
  readonly suggestedValue: number;
  readonly reasoning: string;
  readonly difficulty: 'easy' | 'medium' | 'hard';
}

/**
 * 힌트 조회 응답 DTO
 */
export interface GetGameHintResponseDto {
  readonly hints: HintInfoDto[];
  readonly availableHints: number;
  readonly metadata?: {
    readonly gameId: string;
    readonly requestedMaxHints: number;
    readonly generatedAt: string;
  };
}