import {
  GameRenderer,
  GameTheme,
  ViewportInfo,
  GridRenderInfo,
  EffectRenderInfo,
  UIRenderInfo,
  CellRenderInfo
} from '../interfaces/GameRenderer.js';
import { RenderingEngine, Vector2D, Size2D, Color } from '../interfaces/RenderingEngine.js';
import { GameDto } from '../../../application/sudoku/dtos/GameDto.js';
import { EffectSequenceDto } from '../../../application/effects/dtos/EffectDtos.js';

/**
 * Canvas 기반 게임 렌더러 구현
 */
export class CanvasGameRenderer implements GameRenderer {
  private theme: GameTheme;
  private viewport: ViewportInfo;
  private _animationSpeed: number = 1.0;

  constructor(
    private readonly renderingEngine: RenderingEngine
  ) {
    // 기본 테마 설정
    this.theme = this.createDefaultTheme();
    this.viewport = {
      position: { x: 0, y: 0 },
      size: { width: 800, height: 600 },
      scale: 1.0,
      rotation: 0
    };
  }

  render(game: GameDto, effects: EffectSequenceDto[], uiState: any): void {
    const ctx = this.renderingEngine.getContext();

    this.renderingEngine.beginFrame();

    // 배경 클리어
    ctx.clear(this.theme.colors.background);

    // 그리드 렌더링
    const gridInfo = this.createGridRenderInfo(game);
    this.renderGrid(gridInfo);

    // 이펙트 렌더링
    const effectsInfo = this.createEffectsRenderInfo(effects);
    this.renderEffects(effectsInfo);

    // UI 렌더링
    const uiInfo = this.createUIRenderInfo(game, uiState);
    this.renderUI(uiInfo);

    this.renderingEngine.endFrame();
  }

  renderGrid(gridInfo: GridRenderInfo): void {
    const ctx = this.renderingEngine.getContext();

    // 그리드 배경
    ctx.drawRect(
      gridInfo.gridPosition,
      gridInfo.gridSize,
      {
        fillColor: this.theme.colors.cellBackground,
        strokeColor: this.theme.colors.gridLines,
        lineWidth: 2
      }
    );

    // 셀 렌더링
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const cell = gridInfo.cells[row][col];
        this.renderCell(cell, row, col);
      }
    }

    // 그리드 라인 (3x3 박스 강조)
    this.renderGridLines(gridInfo);
  }

  renderEffects(effectsInfo: EffectRenderInfo[]): void {
    const ctx = this.renderingEngine.getContext();

    effectsInfo.forEach(effectSequence => {
      effectSequence.effects.forEach(effect => {
        this.renderSingleEffect(effect, ctx);
      });
    });
  }

  renderUI(uiInfo: UIRenderInfo): void {
    const ctx = this.renderingEngine.getContext();

    // 숫자 버튼들
    uiInfo.numberButtons.forEach(button => {
      this.renderNumberButton(button, ctx);
    });

    // 컨트롤 버튼들
    uiInfo.controlButtons.forEach(button => {
      this.renderControlButton(button, ctx);
    });

    // 게임 통계
    this.renderGameStats(uiInfo.gameStats, ctx);
  }

  getCellAt(screenPosition: Vector2D): { row: number; col: number } | null {
    // 뷰포트 변환 적용
    const localPos = this.screenToLocal(screenPosition);

    // 그리드 영역 내인지 확인
    const gridBounds = this.calculateGridBounds();
    if (!this.isPointInBounds(localPos, gridBounds)) {
      return null;
    }

    // 셀 좌표 계산
    const cellSize = this.calculateCellSize();
    const col = Math.floor((localPos.x - gridBounds.position.x) / cellSize.width);
    const row = Math.floor((localPos.y - gridBounds.position.y) / cellSize.height);

    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      return { row, col };
    }

    return null;
  }

  getUIElementAt(screenPosition: Vector2D): string | null {
    const localPos = this.screenToLocal(screenPosition);

    // 숫자 버튼 영역 검사
    for (let i = 1; i <= 9; i++) {
      const buttonBounds = this.calculateNumberButtonBounds(i);
      if (this.isPointInBounds(localPos, buttonBounds)) {
        return `number-${i}`;
      }
    }

    // 컨트롤 버튼 영역 검사
    const controlButtons = ['hint', 'reset', 'pause'];
    for (const buttonType of controlButtons) {
      const buttonBounds = this.calculateControlButtonBounds(buttonType);
      if (this.isPointInBounds(localPos, buttonBounds)) {
        return buttonType;
      }
    }

    return null;
  }

  setTheme(theme: GameTheme): void {
    this.theme = theme;
  }

  setViewport(viewport: ViewportInfo): void {
    this.viewport = viewport;
  }

  setAnimationSpeed(speed: number): void {
    this._animationSpeed = Math.max(0.1, Math.min(3.0, speed));
  }

  private renderCell(cell: CellRenderInfo, _row: number, _col: number): void {
    const ctx = this.renderingEngine.getContext();

    // 셀 배경 색상 결정
    let fillColor = this.theme.colors.cellBackground;
    if (cell.isSelected) {
      fillColor = this.theme.colors.selectedCell;
    } else if (cell.isHighlighted) {
      fillColor = this.theme.colors.highlightedCells;
    } else if (cell.isConflicting) {
      fillColor = this.theme.colors.conflictingCells;
    }

    // 셀 배경
    ctx.drawRect(cell.position, cell.size, {
      fillColor,
      strokeColor: this.theme.colors.cellBorder,
      lineWidth: 1
    });

    // 숫자 렌더링
    if (!cell.isEmpty) {
      const textColor = cell.isGiven
        ? this.theme.colors.givenNumbers
        : this.theme.colors.playerNumbers;

      const textPosition: Vector2D = {
        x: cell.position.x + cell.size.width / 2,
        y: cell.position.y + cell.size.height / 2
      };

      ctx.drawText(cell.value.toString(), textPosition, {
        fillColor: textColor,
        font: this.theme.fonts.cellNumbers,
        textAlign: 'center'
      });
    }
  }

  private renderGridLines(gridInfo: GridRenderInfo): void {
    const ctx = this.renderingEngine.getContext();
    const cellSize = gridInfo.cellSize;

    // 3x3 박스 강조 라인
    for (let i = 0; i <= 3; i++) {
      const x = gridInfo.gridPosition.x + i * cellSize.width * 3;
      const y = gridInfo.gridPosition.y + i * cellSize.height * 3;

      // 세로 라인
      ctx.drawLine(
        { x, y: gridInfo.gridPosition.y },
        { x, y: gridInfo.gridPosition.y + gridInfo.gridSize.height },
        { strokeColor: this.theme.colors.gridLines, lineWidth: 3 }
      );

      // 가로 라인
      ctx.drawLine(
        { x: gridInfo.gridPosition.x, y },
        { x: gridInfo.gridPosition.x + gridInfo.gridSize.width, y },
        { strokeColor: this.theme.colors.gridLines, lineWidth: 3 }
      );
    }
  }

  private renderSingleEffect(effect: any, ctx: any): void {
    const progress = effect.progress;
    const alpha = effect.intensity * (1 - progress);

    switch (effect.type) {
      case 'cascade':
        this.renderCascadeEffect(effect, ctx, alpha);
        break;
      case 'radial':
        this.renderRadialEffect(effect, ctx, alpha);
        break;
      case 'pulse':
        this.renderPulseEffect(effect, ctx, alpha);
        break;
    }
  }

  private renderCascadeEffect(effect: any, ctx: any, alpha: number): void {
    const color: Color = { ...effect.color, a: alpha };

    ctx.drawRect(
      effect.position,
      { width: 50, height: 50 }, // 기본 크기
      { fillColor: color }
    );
  }

  private renderRadialEffect(effect: any, ctx: any, alpha: number): void {
    const color: Color = { ...effect.color, a: alpha };
    const radius = 25 * (1 + effect.progress);

    ctx.drawCircle(effect.position, radius, { fillColor: color });
  }

  private renderPulseEffect(effect: any, ctx: any, alpha: number): void {
    const color: Color = { ...effect.color, a: alpha };
    const scale = 1 + 0.3 * Math.sin(effect.progress * Math.PI * 4);

    ctx.save();
    ctx.translate(effect.position);
    ctx.scale({ x: scale, y: scale });
    ctx.drawRect(
      { x: -25, y: -25 },
      { width: 50, height: 50 },
      { fillColor: color }
    );
    ctx.restore();
  }

  private renderNumberButton(button: any, ctx: any): void {
    const fillColor = button.isSelected
      ? this.theme.colors.selectedCell
      : this.theme.colors.cellBackground;

    ctx.drawRoundedRect(button.position, button.size, 8, {
      fillColor,
      strokeColor: this.theme.colors.cellBorder,
      lineWidth: 2
    });

    // 숫자 텍스트
    const textPos: Vector2D = {
      x: button.position.x + button.size.width / 2,
      y: button.position.y + button.size.height / 2
    };

    ctx.drawText(button.number.toString(), textPos, {
      fillColor: this.theme.colors.playerNumbers,
      font: this.theme.fonts.uiText,
      textAlign: 'center'
    });

    // 카운트 표시
    if (button.count > 0) {
      const countPos: Vector2D = {
        x: button.position.x + button.size.width - 8,
        y: button.position.y + 12
      };

      ctx.drawText(button.count.toString(), countPos, {
        fillColor: this.theme.colors.givenNumbers,
        font: '12px Arial',
        textAlign: 'center'
      });
    }
  }

  private renderControlButton(button: any, ctx: any): void {
    const fillColor = button.isEnabled
      ? this.theme.colors.cellBackground
      : { r: 0.8, g: 0.8, b: 0.8, a: 1 };

    ctx.drawRoundedRect(button.position, button.size, 8, {
      fillColor,
      strokeColor: this.theme.colors.cellBorder,
      lineWidth: 2
    });

    const textPos: Vector2D = {
      x: button.position.x + button.size.width / 2,
      y: button.position.y + button.size.height / 2
    };

    ctx.drawText(button.type, textPos, {
      fillColor: this.theme.colors.playerNumbers,
      font: this.theme.fonts.uiText,
      textAlign: 'center'
    });
  }

  private renderGameStats(stats: any, ctx: any): void {
    const statsText = [
      `Time: ${stats.timer}`,
      `Moves: ${stats.moves}`,
      `Mistakes: ${stats.mistakes}`,
      `Difficulty: ${stats.difficulty}`
    ];

    statsText.forEach((text, index) => {
      ctx.drawText(text, { x: 20, y: 30 + index * 25 }, {
        fillColor: this.theme.colors.playerNumbers,
        font: this.theme.fonts.uiText,
        textAlign: 'left'
      });
    });
  }

  // 유틸리티 메소드들
  private createGridRenderInfo(game: GameDto): GridRenderInfo {
    const cells: CellRenderInfo[][] = [];
    const cellSize = this.calculateCellSize();
    const gridPosition = this.calculateGridPosition();

    for (let row = 0; row < 9; row++) {
      cells[row] = [];
      for (let col = 0; col < 9; col++) {
        const cell = game.grid.cells[row][col];
        cells[row][col] = {
          position: {
            x: gridPosition.x + col * cellSize.width,
            y: gridPosition.y + row * cellSize.height
          },
          size: cellSize,
          value: cell.value,
          isGiven: cell.isGiven,
          isSelected: false, // 선택 상태는 별도로 관리
          isHighlighted: false,
          isConflicting: false,
          isEmpty: cell.isEmpty
        };
      }
    }

    return {
      cells,
      gridPosition,
      gridSize: {
        width: cellSize.width * 9,
        height: cellSize.height * 9
      },
      cellSize,
      selectedCell: undefined,
      highlightedCells: [],
      conflictingCells: []
    };
  }

  private createEffectsRenderInfo(effects: EffectSequenceDto[]): EffectRenderInfo[] {
    return effects.map(sequence => ({
      sequenceId: sequence.id,
      effects: sequence.effects.map(effect => ({
        id: effect.id,
        position: { x: effect.position.row * 50, y: effect.position.col * 50 },
        progress: effect.progress,
        color: { r: 0.2, g: 0.5, b: 1.0, a: 0.7 },
        intensity: effect.animation.intensity,
        type: effect.animation.type.toLowerCase() as any
      }))
    }));
  }

  private createUIRenderInfo(game: GameDto, _uiState: any): UIRenderInfo {
    return {
      numberButtons: Array.from({ length: 9 }, (_, i) => ({
        number: i + 1,
        position: { x: 50 + i * 70, y: 550 },
        size: { width: 60, height: 60 },
        isSelected: false,
        count: 0,
        isDisabled: false
      })),
      controlButtons: [
        { type: 'hint', position: { x: 700, y: 100 }, size: { width: 80, height: 40 }, isEnabled: true },
        { type: 'reset', position: { x: 700, y: 150 }, size: { width: 80, height: 40 }, isEnabled: true },
        { type: 'pause', position: { x: 700, y: 200 }, size: { width: 80, height: 40 }, isEnabled: true }
      ],
      gameStats: {
        timer: '00:00',
        moves: game.state.moveCount,
        mistakes: game.state.mistakeCount,
        difficulty: game.state.difficulty
      }
    };
  }

  private calculateCellSize(): Size2D {
    return { width: 50, height: 50 };
  }

  private calculateGridPosition(): Vector2D {
    return { x: 100, y: 100 };
  }

  private calculateGridBounds(): { position: Vector2D; size: Size2D } {
    const gridPosition = this.calculateGridPosition();
    const cellSize = this.calculateCellSize();
    return {
      position: gridPosition,
      size: { width: cellSize.width * 9, height: cellSize.height * 9 }
    };
  }

  private calculateNumberButtonBounds(number: number): { position: Vector2D; size: Size2D } {
    return {
      position: { x: 50 + (number - 1) * 70, y: 550 },
      size: { width: 60, height: 60 }
    };
  }

  private calculateControlButtonBounds(type: string): { position: Vector2D; size: Size2D } {
    const positions: { [key: string]: Vector2D } = {
      hint: { x: 700, y: 100 },
      reset: { x: 700, y: 150 },
      pause: { x: 700, y: 200 }
    };

    return {
      position: positions[type] || { x: 0, y: 0 },
      size: { width: 80, height: 40 }
    };
  }

  private screenToLocal(screenPosition: Vector2D): Vector2D {
    return {
      x: (screenPosition.x - this.viewport.position.x) / this.viewport.scale,
      y: (screenPosition.y - this.viewport.position.y) / this.viewport.scale
    };
  }

  private isPointInBounds(point: Vector2D, bounds: { position: Vector2D; size: Size2D }): boolean {
    return point.x >= bounds.position.x &&
           point.x <= bounds.position.x + bounds.size.width &&
           point.y >= bounds.position.y &&
           point.y <= bounds.position.y + bounds.size.height;
  }

  private createDefaultTheme(): GameTheme {
    return {
      name: 'Default',
      colors: {
        background: { r: 0.95, g: 0.95, b: 0.95, a: 1 },
        gridLines: { r: 0.2, g: 0.2, b: 0.2, a: 1 },
        cellBackground: { r: 1, g: 1, b: 1, a: 1 },
        cellBorder: { r: 0.7, g: 0.7, b: 0.7, a: 1 },
        givenNumbers: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
        playerNumbers: { r: 0.2, g: 0.4, b: 0.8, a: 1 },
        selectedCell: { r: 0.8, g: 0.9, b: 1, a: 1 },
        highlightedCells: { r: 0.9, g: 0.95, b: 1, a: 1 },
        conflictingCells: { r: 1, g: 0.8, b: 0.8, a: 1 },
        effectColor: { r: 0.2, g: 0.5, b: 1, a: 0.7 }
      },
      fonts: {
        cellNumbers: '24px Arial',
        uiText: '16px Arial',
        title: '32px Arial'
      },
      effects: {
        enableAnimations: true,
        animationDuration: 1000,
        glowIntensity: 0.5
      }
    };
  }
}