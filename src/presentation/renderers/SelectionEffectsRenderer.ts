export interface SelectionEffect {
  type: 'border' | 'highlight' | 'glow' | 'pulse';
  color: string;
  opacity: number;
  intensity: number;
}

export interface SelectionRenderOptions {
  selectedCellEffect: SelectionEffect;
  relatedCellsEffect: SelectionEffect;
  numberHighlightEffect: SelectionEffect;
  animationEnabled: boolean;
  theme: 'light' | 'dark';
}

export class SelectionEffectsRenderer {
  private animationFrame: number | null = null;
  private pulseTime: number = 0;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private cellSize: number
  ) {}

  renderSelection(
    selectedRow: number, 
    selectedCol: number, 
    options: SelectionRenderOptions
  ): void {
    if (options.animationEnabled) {
      this.renderAnimatedSelection(selectedRow, selectedCol, options);
    } else {
      this.renderStaticSelection(selectedRow, selectedCol, options);
    }
  }

  renderRelatedCells(
    selectedRow: number, 
    selectedCol: number, 
    options: SelectionRenderOptions
  ): void {
    this.highlightRow(selectedRow, selectedCol, options.relatedCellsEffect);
    this.highlightColumn(selectedRow, selectedCol, options.relatedCellsEffect);
    // 3x3 박스 하이라이트 제거됨
  }

  renderNumberHighlights(
    selectedValue: number,
    allCellsWithNumbers: Array<{row: number, col: number, value: number}>,
    options: SelectionRenderOptions
  ): void {
    const matchingCells = allCellsWithNumbers.filter(cell => cell.value === selectedValue);
    
    for (const cell of matchingCells) {
      this.highlightNumber(cell.row, cell.col, options.numberHighlightEffect);
    }
  }

  updateDimensions(cellSize: number): void {
    this.cellSize = cellSize;
  }

  startAnimation(): void {
    this.pulseTime = Date.now();
  }

  stopAnimation(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  private renderStaticSelection(
    selectedRow: number, 
    selectedCol: number, 
    options: SelectionRenderOptions
  ): void {
    const x = selectedCol * this.cellSize;
    const y = selectedRow * this.cellSize;

    switch (options.selectedCellEffect.type) {
      case 'border':
        this.drawSelectionBorder(x, y, options.selectedCellEffect);
        break;
      case 'highlight':
        this.drawSelectionHighlight(x, y, options.selectedCellEffect);
        break;
      case 'glow':
        this.drawSelectionGlow(x, y, options.selectedCellEffect);
        break;
    }
  }

  private renderAnimatedSelection(
    selectedRow: number, 
    selectedCol: number, 
    options: SelectionRenderOptions
  ): void {
    const x = selectedCol * this.cellSize;
    const y = selectedRow * this.cellSize;

    if (options.selectedCellEffect.type === 'pulse') {
      this.drawPulsingSelection(x, y, options.selectedCellEffect);
    } else {
      this.renderStaticSelection(selectedRow, selectedCol, options);
    }
  }

  private drawSelectionBorder(x: number, y: number, effect: SelectionEffect): void {
    this.ctx.strokeStyle = effect.color;
    this.ctx.lineWidth = 3 + effect.intensity;
    this.ctx.globalAlpha = effect.opacity;
    
    this.ctx.strokeRect(
      x + 2, 
      y + 2, 
      this.cellSize - 4, 
      this.cellSize - 4
    );
    
    this.ctx.globalAlpha = 1.0;
  }

  private drawSelectionHighlight(x: number, y: number, effect: SelectionEffect): void {
    this.ctx.fillStyle = effect.color;
    this.ctx.globalAlpha = effect.opacity;
    
    this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
    
    this.ctx.globalAlpha = 1.0;
  }

  private drawSelectionGlow(x: number, y: number, effect: SelectionEffect): void {
    const gradient = this.ctx.createRadialGradient(
      x + this.cellSize / 2, 
      y + this.cellSize / 2, 
      0,
      x + this.cellSize / 2, 
      y + this.cellSize / 2, 
      this.cellSize / 2 + effect.intensity
    );
    
    gradient.addColorStop(0, effect.color);
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = gradient;
    this.ctx.globalAlpha = effect.opacity;
    
    this.ctx.fillRect(
      x - effect.intensity, 
      y - effect.intensity, 
      this.cellSize + 2 * effect.intensity, 
      this.cellSize + 2 * effect.intensity
    );
    
    this.ctx.globalAlpha = 1.0;
  }

  private drawPulsingSelection(x: number, y: number, effect: SelectionEffect): void {
    const elapsed = (Date.now() - this.pulseTime) / 1000;
    const pulseValue = (Math.sin(elapsed * 3) + 1) / 2; // 0 to 1
    
    const dynamicOpacity = effect.opacity * (0.3 + pulseValue * 0.7);
    const dynamicIntensity = effect.intensity * (0.8 + pulseValue * 0.4);
    
    const pulseEffect: SelectionEffect = {
      ...effect,
      opacity: dynamicOpacity,
      intensity: dynamicIntensity
    };
    
    this.drawSelectionBorder(x, y, pulseEffect);
  }

  private highlightRow(selectedRow: number, selectedCol: number, effect: SelectionEffect): void {
    this.ctx.fillStyle = effect.color;
    this.ctx.globalAlpha = effect.opacity;

    for (let col = 0; col < 9; col++) {
      if (col !== selectedCol) {
        const x = col * this.cellSize;
        const y = selectedRow * this.cellSize;
        this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
      }
    }

    this.ctx.globalAlpha = 1.0;
  }

  private highlightColumn(selectedRow: number, selectedCol: number, effect: SelectionEffect): void {
    this.ctx.fillStyle = effect.color;
    this.ctx.globalAlpha = effect.opacity;

    for (let row = 0; row < 9; row++) {
      if (row !== selectedRow) {
        const x = selectedCol * this.cellSize;
        const y = row * this.cellSize;
        this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
      }
    }

    this.ctx.globalAlpha = 1.0;
  }

  private highlightNumber(row: number, col: number, effect: SelectionEffect): void {
    const x = col * this.cellSize;
    const y = row * this.cellSize;

    switch (effect.type) {
      case 'highlight':
        this.drawNumberHighlight(x, y, effect);
        break;
      case 'glow':
        this.drawNumberGlow(x, y, effect);
        break;
      case 'border':
        this.drawNumberBorder(x, y, effect);
        break;
    }
  }

  private drawNumberHighlight(x: number, y: number, effect: SelectionEffect): void {
    // 셀 배경에 미묘한 색상 오버레이
    this.ctx.fillStyle = effect.color;
    this.ctx.globalAlpha = effect.opacity;
    
    this.ctx.fillRect(x + 2, y + 2, this.cellSize - 4, this.cellSize - 4);
    
    this.ctx.globalAlpha = 1.0;
  }

  private drawNumberGlow(x: number, y: number, effect: SelectionEffect): void {
    // 숫자 주변에 글로우 효과
    const gradient = this.ctx.createRadialGradient(
      x + this.cellSize / 2, 
      y + this.cellSize / 2, 
      this.cellSize * 0.1,
      x + this.cellSize / 2, 
      y + this.cellSize / 2, 
      this.cellSize * 0.4
    );
    
    gradient.addColorStop(0, effect.color);
    gradient.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = gradient;
    this.ctx.globalAlpha = effect.opacity;
    
    this.ctx.fillRect(x, y, this.cellSize, this.cellSize);
    
    this.ctx.globalAlpha = 1.0;
  }

  private drawNumberBorder(x: number, y: number, effect: SelectionEffect): void {
    // 숫자 셀 주위에 테두리
    this.ctx.strokeStyle = effect.color;
    this.ctx.lineWidth = 2;
    this.ctx.globalAlpha = effect.opacity;
    
    this.ctx.strokeRect(x + 3, y + 3, this.cellSize - 6, this.cellSize - 6);
    
    this.ctx.globalAlpha = 1.0;
  }

  // 3x3 박스 하이라이트 메서드 - 현재 사용되지 않음
  // private highlightSubGrid(selectedRow: number, selectedCol: number, effect: SelectionEffect): void {
  //   this.ctx.fillStyle = effect.color;
  //   this.ctx.globalAlpha = effect.opacity;

  //   const boxStartRow = Math.floor(selectedRow / 3) * 3;
  //   const boxStartCol = Math.floor(selectedCol / 3) * 3;

  //   for (let row = boxStartRow; row < boxStartRow + 3; row++) {
  //     for (let col = boxStartCol; col < boxStartCol + 3; col++) {
  //       if (row !== selectedRow && col !== selectedCol) {
  //         const x = col * this.cellSize;
  //         const y = row * this.cellSize;
  //         this.ctx.fillRect(x + 1, y + 1, this.cellSize - 2, this.cellSize - 2);
  //       }
  //     }
  //   }

  //   this.ctx.globalAlpha = 1.0;
  // }
}