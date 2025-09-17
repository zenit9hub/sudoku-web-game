export class CellValue {
  private static readonly VALID_VALUES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  
  constructor(public readonly value: number | null) {
    this.validateValue(value);
  }

  private validateValue(value: number | null): void {
    if (value !== null && !CellValue.VALID_VALUES.has(value)) {
      throw new Error(`Invalid cell value: ${value}. Must be between 1 and 9 or null.`);
    }
  }

  static empty(): CellValue {
    return new CellValue(null);
  }

  static from(value: number): CellValue {
    return new CellValue(value);
  }

  isEmpty(): boolean {
    return this.value === null;
  }

  equals(other: CellValue): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value?.toString() ?? '';
  }

  toNumber(): number {
    if (this.value === null) {
      throw new Error('Cannot convert empty cell value to number');
    }
    return this.value;
  }
}