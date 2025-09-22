import { GameRenderer, RenderOptions } from '../../infrastructure/rendering/GameRenderer';
import { SudokuGame } from '../../domain/sudoku/aggregates/Game';
import { Position } from '../../domain/sudoku/value-objects/Position';
import { Cell } from '../../domain/sudoku/entities/Cell';
import { BoardRenderer, BoardRenderOptions } from './BoardRenderer';
import { SelectionEffectsRenderer, SelectionRenderOptions } from './SelectionEffectsRenderer';
import { LineCompletionEffectsRenderer, EffectRenderOptions } from './LineCompletionEffectsRenderer';
import { LineCompletionEffect } from '../../domain/effects/entities/LineCompletionEffect';

export class CanvasGameRenderer implements GameRenderer {
  private ctx: CanvasRenderingContext2D;
  private cellSize: number = 0;
  private gridSize: number = 0;

  private boardRenderer: BoardRenderer;
  private selectionRenderer: SelectionEffectsRenderer;
  private effectsRenderer: LineCompletionEffectsRenderer;
  private activeEffects: LineCompletionEffect[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private defaultOptions: RenderOptions = {
      highlightErrors: true,
      showPossibleValues: false,
      theme: 'light'
    }
  ) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas 2D context');
    }
    this.ctx = context;
    this.calculateDimensions();

    // Initialize specialized renderers
    this.boardRenderer = new BoardRenderer(this.ctx, this.cellSize, this.gridSize);
    this.selectionRenderer = new SelectionEffectsRenderer(this.ctx, this.cellSize);
    this.effectsRenderer = new LineCompletionEffectsRenderer(this.ctx, this.cellSize);
  }

  render(game: SudokuGame, options: Partial<RenderOptions> = {}): void {
    const renderOptions = { ...this.defaultOptions, ...options };

    // Update effects progress
    this.updateEffects();

    this.clear();
    this.renderBoard(renderOptions);
    this.renderCells(game, renderOptions);
    this.renderEffects(renderOptions);
    this.renderSelection(game, renderOptions);
  }

  getPositionFromCoords(x: number, y: number): Position | null {
    console.log('Canvas dimensions:', this.canvas.width, this.canvas.height);
    console.log('Cell size:', this.cellSize);
    console.log('Input coordinates:', x, y);
    
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    
    console.log('Calculated row/col:', row, col);
    
    if (row >= 0 && row < 9 && col >= 0 && col < 9) {
      try {
        return new Position(row, col);
      } catch (error) {
        console.error('Position creation error:', error);
        return null;
      }
    }
    
    console.log('Position out of bounds');
    return null;
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.calculateDimensions();
    
    // Update dimensions in specialized renderers
    this.boardRenderer.updateDimensions(this.cellSize, this.gridSize);
    this.selectionRenderer.updateDimensions(this.cellSize);
    this.effectsRenderer.updateDimensions(this.cellSize);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private calculateDimensions(): void {
    this.gridSize = Math.min(this.canvas.width, this.canvas.height);
    this.cellSize = this.gridSize / 9;
    console.log('Canvas dimensions calculated:', {
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      gridSize: this.gridSize,
      cellSize: this.cellSize
    });
  }

  private renderBoard(options: RenderOptions): void {
    const boardOptions: BoardRenderOptions = {
      theme: options.theme,
      borderColor: options.theme === 'dark' ? '#555555' : '#e0e0e0',
      subGridBorderColor: options.theme === 'dark' ? '#ffffff' : '#333333',
      backgroundColor: options.theme === 'dark' ? '#2a2a2a' : '#ffffff'
    };

    this.boardRenderer.render(boardOptions);
  }

  private renderCells(game: SudokuGame, options: RenderOptions): void {
    const selectedValue = this.getSelectedCellValue(game);
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const position = new Position(row, col);
        const cell = game.grid.getCell(position);
        
        const shouldHighlightNumber = selectedValue !== null && 
                                    !cell.isEmpty() && 
                                    cell.value.value === selectedValue;
        
        this.renderCell(cell, options, shouldHighlightNumber);
      }
    }
  }

  private getSelectedCellValue(game: SudokuGame): number | null {
    if (!game.state.selectedCell) {
      return null;
    }
    
    const { row, col } = game.state.selectedCell;
    const selectedCell = game.grid.getCell(new Position(row, col));
    
    return selectedCell.isEmpty() ? null : selectedCell.value.value!;
  }

  private renderCell(cell: Cell, options: RenderOptions, isHighlighted = false): void {
    const x = cell.position.col * this.cellSize;
    const y = cell.position.row * this.cellSize;

    // Draw cell background
    this.renderCellBackground(x, y, cell, options);

    // Draw cell value
    if (!cell.isEmpty()) {
      this.renderCellValue(x, y, cell, options, isHighlighted);
    }
  }

  private renderCellBackground(x: number, y: number, cell: Cell, options: RenderOptions): void {
    let backgroundColor = options.theme === 'dark' ? '#2a2a2a' : '#ffffff';

    if (cell.isGiven) {
      backgroundColor = options.theme === 'dark' ? '#3a3a3a' : '#f0f0f0';
    } else if (cell.hasError && options.highlightErrors) {
      backgroundColor = options.theme === 'dark' ? '#4a2222' : '#ffe6e6';
    }

    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
  }

  private renderCellValue(x: number, y: number, cell: Cell, options: RenderOptions, isHighlighted = false): void {
    this.ctx.font = `${Math.floor(this.cellSize * 0.6)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    let textColor = options.theme === 'dark' ? '#ffffff' : '#000000';
    
    if (cell.isGiven) {
      textColor = options.theme === 'dark' ? '#cccccc' : '#333333';
    } else if (cell.hasError && options.highlightErrors) {
      textColor = options.theme === 'dark' ? '#ff6666' : '#cc0000';
    }

    // 하이라이트된 숫자는 특별한 색상 사용
    if (isHighlighted) {
      textColor = options.theme === 'dark' ? '#40E0D0' : '#FF8C00'; // 시안/오렌지
      this.ctx.font = `bold ${Math.floor(this.cellSize * 0.6)}px Arial`; // 굵게
      
      // 글로우 효과 추가
      this.ctx.shadowColor = textColor;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowOffsetX = 0;
      this.ctx.shadowOffsetY = 0;
    }

    this.ctx.fillStyle = textColor;
    this.ctx.fillText(
      cell.value.toString(),
      x + this.cellSize / 2,
      y + this.cellSize / 2
    );

    // 그림자 효과 리셋
    if (isHighlighted) {
      this.ctx.shadowBlur = 0;
    }
  }

  private renderSelection(game: SudokuGame, options: RenderOptions): void {
    if (!game.state.selectedCell) {
      return;
    }

    const { row, col } = game.state.selectedCell;
    const selectedCell = game.grid.getCell(new Position(row, col));

    // Define selection effects based on theme
    const selectionOptions: SelectionRenderOptions = {
      selectedCellEffect: {
        type: 'border',
        color: options.theme === 'dark' ? '#4da6ff' : '#007bff',
        opacity: 0.8,
        intensity: 2
      },
      relatedCellsEffect: {
        type: 'highlight',
        color: options.theme === 'dark' ? 'rgba(77, 166, 255, 0.2)' : 'rgba(0, 123, 255, 0.15)',
        opacity: 0.4,
        intensity: 0
      },
      numberHighlightEffect: {
        type: 'highlight',
        // 미묘한 배경 하이라이트
        color: options.theme === 'dark' ? 'rgba(64, 224, 208, 0.15)' : 'rgba(255, 140, 0, 0.2)',
        opacity: 0.5,
        intensity: 1
      },
      animationEnabled: true,
      theme: options.theme
    };

    // Render related cells first (background)
    this.selectionRenderer.renderRelatedCells(row, col, selectionOptions);
    
    // Render number highlights if selected cell has a number
    if (!selectedCell.isEmpty()) {
      const selectedValue = selectedCell.value.value!;
      const allCellsWithNumbers = this.getAllCellsWithNumbers(game);
      this.selectionRenderer.renderNumberHighlights(selectedValue, allCellsWithNumbers, selectionOptions);
    }
    
    // Render selected cell (foreground)
    this.selectionRenderer.renderSelection(row, col, selectionOptions);
  }

  private getAllCellsWithNumbers(game: SudokuGame): Array<{row: number, col: number, value: number}> {
    const cellsWithNumbers: Array<{row: number, col: number, value: number}> = [];
    
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const position = new Position(row, col);
        const cell = game.grid.getCell(position);
        
        if (!cell.isEmpty()) {
          cellsWithNumbers.push({
            row,
            col,
            value: cell.value.value!
          });
        }
      }
    }
    
    return cellsWithNumbers;
  }

  // Effect management methods
  addEffects(effects: LineCompletionEffect[]): void {
    const startedEffects = effects.map(effect => effect.start());
    this.activeEffects.push(...startedEffects);
  }

  hasActiveEffects(): boolean {
    return this.effectsRenderer.hasActiveEffects(this.activeEffects);
  }

  private updateEffects(): void {
    const currentTime = Date.now();
    this.activeEffects = this.effectsRenderer.updateEffects(this.activeEffects, currentTime);
  }

  private renderEffects(options: RenderOptions): void {
    if (this.activeEffects.length === 0) {
      return;
    }

    const effectOptions: EffectRenderOptions = {
      theme: options.theme,
      highlightColor: options.theme === 'dark' ? 'rgba(255, 215, 0, 0.2)' : 'rgba(255, 140, 0, 0.25)',
      glowColor: options.theme === 'dark' ? '#FFD700' : '#FF8C00',
      animationDuration: 1500
    };

    this.effectsRenderer.renderEffects(this.activeEffects, effectOptions);
  }
}