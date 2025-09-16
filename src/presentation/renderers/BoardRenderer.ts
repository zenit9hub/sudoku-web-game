export interface BoardRenderOptions {
  theme: 'light' | 'dark';
  borderColor: string;
  subGridBorderColor: string;
  backgroundColor: string;
}

export class BoardRenderer {
  private borderWidth: number = 1;
  private subGridBorderWidth: number = 2;
  private outerBorderWidth: number = 2;

  constructor(
    private ctx: CanvasRenderingContext2D,
    private cellSize: number,
    private gridSize: number
  ) {}

  render(options: BoardRenderOptions): void {
    this.drawBackground(options.backgroundColor);
    this.drawCellBorders(options.borderColor);
    this.drawSubGridBorders(options.subGridBorderColor);
    this.drawOuterBorder(options.subGridBorderColor);
  }

  updateDimensions(cellSize: number, gridSize: number): void {
    this.cellSize = cellSize;
    this.gridSize = gridSize;
  }

  private drawBackground(backgroundColor: string): void {
    this.ctx.fillStyle = backgroundColor;
    this.ctx.fillRect(0, 0, this.gridSize, this.gridSize);
  }

  private drawCellBorders(borderColor: string): void {
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = this.borderWidth;

    // Draw vertical cell lines
    for (let i = 0; i <= 9; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.cellSize, 0);
      this.ctx.lineTo(i * this.cellSize, this.gridSize);
      this.ctx.stroke();
    }

    // Draw horizontal cell lines
    for (let i = 0; i <= 9; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.cellSize);
      this.ctx.lineTo(this.gridSize, i * this.cellSize);
      this.ctx.stroke();
    }
  }

  private drawSubGridBorders(subGridBorderColor: string): void {
    this.ctx.strokeStyle = subGridBorderColor;
    this.ctx.lineWidth = this.subGridBorderWidth;

    // Draw thick vertical lines for 3x3 sub-grids (내부만, 외곽선 제외)
    for (let i = 3; i <= 6; i += 3) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.cellSize, 0);
      this.ctx.lineTo(i * this.cellSize, this.gridSize);
      this.ctx.stroke();
    }

    // Draw thick horizontal lines for 3x3 sub-grids (내부만, 외곽선 제외)
    for (let i = 3; i <= 6; i += 3) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.cellSize);
      this.ctx.lineTo(this.gridSize, i * this.cellSize);
      this.ctx.stroke();
    }
  }

  private drawOuterBorder(borderColor: string): void {
    this.ctx.strokeStyle = borderColor;
    this.ctx.lineWidth = this.outerBorderWidth;

    // Draw outer border rectangle
    this.ctx.beginPath();
    this.ctx.rect(0, 0, this.gridSize, this.gridSize);
    this.ctx.stroke();
  }
}