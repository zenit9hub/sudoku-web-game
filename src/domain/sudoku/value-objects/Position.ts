export class Position {
  constructor(
    public readonly row: number,
    public readonly col: number
  ) {
    this.validatePosition(row, col);
  }

  private validatePosition(row: number, col: number): void {
    if (row < 0 || row > 8 || col < 0 || col > 8) {
      throw new Error(`Invalid position: (${row}, ${col}). Must be between 0 and 8.`);
    }
  }

  equals(other: Position): boolean {
    return this.row === other.row && this.col === other.col;
  }

  toString(): string {
    return `(${this.row}, ${this.col})`;
  }

  getBoxIndex(): number {
    return Math.floor(this.row / 3) * 3 + Math.floor(this.col / 3);
  }

  isValid(): boolean {
    return this.row >= 0 && this.row <= 8 && this.col >= 0 && this.col <= 8;
  }
}