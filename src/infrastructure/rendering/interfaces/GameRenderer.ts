import { Vector2D, Size2D, Color } from './RenderingEngine.js';
import { GameDto } from '../../../application/sudoku/dtos/GameDto.js';
import { EffectSequenceDto } from '../../../application/effects/dtos/EffectDtos.js';

/**
 * 게임 렌더링 전용 인터페이스
 */

export interface CellRenderInfo {
  readonly position: Vector2D;
  readonly size: Size2D;
  readonly value: number;
  readonly isGiven: boolean;
  readonly isSelected: boolean;
  readonly isHighlighted: boolean;
  readonly isConflicting: boolean;
  readonly isEmpty: boolean;
}

export interface GridRenderInfo {
  readonly cells: CellRenderInfo[][];
  readonly gridPosition: Vector2D;
  readonly gridSize: Size2D;
  readonly cellSize: Size2D;
  readonly selectedCell?: { row: number; col: number };
  readonly highlightedCells: { row: number; col: number }[];
  readonly conflictingCells: { row: number; col: number }[];
}

export interface EffectRenderInfo {
  readonly sequenceId: string;
  readonly effects: Array<{
    readonly id: string;
    readonly position: Vector2D;
    readonly progress: number;
    readonly color: Color;
    readonly intensity: number;
    readonly type: 'cascade' | 'fade' | 'pulse' | 'slide' | 'radial';
  }>;
}

export interface UIRenderInfo {
  readonly numberButtons: Array<{
    readonly number: number;
    readonly position: Vector2D;
    readonly size: Size2D;
    readonly isSelected: boolean;
    readonly count: number;
    readonly isDisabled: boolean;
  }>;
  readonly controlButtons: Array<{
    readonly type: 'hint' | 'reset' | 'pause';
    readonly position: Vector2D;
    readonly size: Size2D;
    readonly isEnabled: boolean;
  }>;
  readonly gameStats: {
    readonly timer: string;
    readonly moves: number;
    readonly mistakes: number;
    readonly difficulty: string;
  };
}

/**
 * 게임 렌더러 인터페이스
 */
export interface GameRenderer {
  /**
   * 메인 렌더링 메소드
   */
  render(game: GameDto, effects: EffectSequenceDto[], uiState: any): void;

  /**
   * 개별 구성요소 렌더링
   */
  renderGrid(gridInfo: GridRenderInfo): void;
  renderEffects(effectsInfo: EffectRenderInfo[]): void;
  renderUI(uiInfo: UIRenderInfo): void;

  /**
   * 상호작용 지원
   */
  getCellAt(screenPosition: Vector2D): { row: number; col: number } | null;
  getUIElementAt(screenPosition: Vector2D): string | null;

  /**
   * 설정 및 제어
   */
  setTheme(theme: GameTheme): void;
  setViewport(viewport: ViewportInfo): void;
  setAnimationSpeed(speed: number): void;
}

export interface GameTheme {
  readonly name: string;
  readonly colors: {
    readonly background: Color;
    readonly gridLines: Color;
    readonly cellBackground: Color;
    readonly cellBorder: Color;
    readonly givenNumbers: Color;
    readonly playerNumbers: Color;
    readonly selectedCell: Color;
    readonly highlightedCells: Color;
    readonly conflictingCells: Color;
    readonly effectColor: Color;
  };
  readonly fonts: {
    readonly cellNumbers: string;
    readonly uiText: string;
    readonly title: string;
  };
  readonly effects: {
    readonly enableAnimations: boolean;
    readonly animationDuration: number;
    readonly glowIntensity: number;
  };
}

export interface ViewportInfo {
  readonly position: Vector2D;
  readonly size: Size2D;
  readonly scale: number;
  readonly rotation: number;
}

/**
 * 렌더러 팩토리 인터페이스
 */
export interface GameRendererFactory {
  createRenderer(engineType: 'canvas' | 'webgl'): Promise<GameRenderer>;
  getSupportedEngines(): string[];
  getRecommendedEngine(): string;
}