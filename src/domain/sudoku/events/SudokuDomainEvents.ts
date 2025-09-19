import { BaseDomainEvent } from '../../common/events/DomainEvent.js';
import { Position } from '../value-objects/Position.js';
import { CellValue } from '../value-objects/CellValue.js';
import { Difficulty } from '../entities/GameState.js';

/**
 * 스도쿠 도메인 이벤트들
 */

/**
 * 게임 생성 이벤트
 */
export class GameCreated extends BaseDomainEvent {
  constructor(
    gameId: string,
    difficulty: Difficulty,
    seed?: number
  ) {
    super(
      'GameCreated',
      gameId,
      'SudokuGame',
      {
        difficulty,
        seed,
        gridSize: 9
      }
    );
  }
}

/**
 * 수 입력 이벤트
 */
export class MoveAttempted extends BaseDomainEvent {
  constructor(
    gameId: string,
    position: Position,
    value: CellValue,
    isValid: boolean,
    conflictingPositions: Position[] = []
  ) {
    super(
      'MoveAttempted',
      gameId,
      'SudokuGame',
      {
        position: { row: position.row, col: position.col },
        value: value.value,
        isValid,
        conflictingPositions: conflictingPositions.map(pos => ({ row: pos.row, col: pos.col }))
      }
    );
  }
}

/**
 * 유효한 수 입력 이벤트
 */
export class ValidMoveCompleted extends BaseDomainEvent {
  constructor(
    gameId: string,
    position: Position,
    value: CellValue,
    moveCount: number
  ) {
    super(
      'ValidMoveCompleted',
      gameId,
      'SudokuGame',
      {
        position: { row: position.row, col: position.col },
        value: value.value,
        moveCount
      }
    );
  }
}

/**
 * 무효한 수 입력 이벤트
 */
export class InvalidMoveAttempted extends BaseDomainEvent {
  constructor(
    gameId: string,
    position: Position,
    value: CellValue,
    conflictingPositions: Position[],
    mistakeCount: number
  ) {
    super(
      'InvalidMoveAttempted',
      gameId,
      'SudokuGame',
      {
        position: { row: position.row, col: position.col },
        value: value.value,
        conflictingPositions: conflictingPositions.map(pos => ({ row: pos.row, col: pos.col })),
        mistakeCount
      }
    );
  }
}

/**
 * 라인 완성 이벤트
 */
export class LineCompleted extends BaseDomainEvent {
  constructor(
    gameId: string,
    lineType: 'row' | 'column' | 'box',
    lineIndex: number,
    completionPosition: Position
  ) {
    super(
      'LineCompleted',
      gameId,
      'SudokuGame',
      {
        lineType,
        lineIndex,
        completionPosition: { row: completionPosition.row, col: completionPosition.col }
      }
    );
  }
}

/**
 * 게임 완료 이벤트
 */
export class GameCompleted extends BaseDomainEvent {
  constructor(
    gameId: string,
    difficulty: Difficulty,
    finalStats: {
      elapsedTime: number;
      moveCount: number;
      mistakeCount: number;
      hintsUsed: number;
    }
  ) {
    super(
      'GameCompleted',
      gameId,
      'SudokuGame',
      {
        difficulty,
        ...finalStats,
        completedAt: new Date().toISOString()
      }
    );
  }
}

/**
 * 게임 일시정지 이벤트
 */
export class GamePaused extends BaseDomainEvent {
  constructor(
    gameId: string,
    elapsedTime: number
  ) {
    super(
      'GamePaused',
      gameId,
      'SudokuGame',
      {
        elapsedTime,
        pausedAt: new Date().toISOString()
      }
    );
  }
}

/**
 * 게임 재개 이벤트
 */
export class GameResumed extends BaseDomainEvent {
  constructor(
    gameId: string,
    pauseDuration: number
  ) {
    super(
      'GameResumed',
      gameId,
      'SudokuGame',
      {
        pauseDuration,
        resumedAt: new Date().toISOString()
      }
    );
  }
}

/**
 * 힌트 사용 이벤트
 */
export class HintUsed extends BaseDomainEvent {
  constructor(
    gameId: string,
    hintPosition: Position,
    suggestedValue: CellValue,
    hintType: 'simple' | 'advanced' | 'strategy',
    hintsUsedCount: number
  ) {
    super(
      'HintUsed',
      gameId,
      'SudokuGame',
      {
        hintPosition: { row: hintPosition.row, col: hintPosition.col },
        suggestedValue: suggestedValue.value,
        hintType,
        hintsUsedCount
      }
    );
  }
}

/**
 * 게임 리셋 이벤트
 */
export class GameReset extends BaseDomainEvent {
  constructor(
    gameId: string,
    resetStats: {
      previousMoveCount: number;
      previousMistakeCount: number;
      previousElapsedTime: number;
    }
  ) {
    super(
      'GameReset',
      gameId,
      'SudokuGame',
      {
        ...resetStats,
        resetAt: new Date().toISOString()
      }
    );
  }
}

/**
 * 셀 선택 이벤트
 */
export class CellSelected extends BaseDomainEvent {
  constructor(
    gameId: string,
    position: Position,
    previousPosition?: Position
  ) {
    super(
      'CellSelected',
      gameId,
      'SudokuGame',
      {
        position: { row: position.row, col: position.col },
        previousPosition: previousPosition ? { row: previousPosition.row, col: previousPosition.col } : null
      }
    );
  }
}

/**
 * 숫자 하이라이트 이벤트
 */
export class NumberHighlighted extends BaseDomainEvent {
  constructor(
    gameId: string,
    number: number,
    highlightedCells: Position[]
  ) {
    super(
      'NumberHighlighted',
      gameId,
      'SudokuGame',
      {
        number,
        highlightedCells: highlightedCells.map(pos => ({ row: pos.row, col: pos.col })),
        highlightCount: highlightedCells.length
      }
    );
  }
}