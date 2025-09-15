import { CellValue } from './CellValue.js';
import { Position } from './Position.js';

export interface CellOptions {
  isGiven?: boolean;
  isHighlighted?: boolean;
  hasError?: boolean;
}

export class Cell {
  constructor(
    public readonly position: Position,
    private _value: CellValue = CellValue.empty(),
    private _options: CellOptions = {}
  ) {}

  get value(): CellValue {
    return this._value;
  }

  get isGiven(): boolean {
    return this._options.isGiven ?? false;
  }

  get isHighlighted(): boolean {
    return this._options.isHighlighted ?? false;
  }

  get hasError(): boolean {
    return this._options.hasError ?? false;
  }

  setValue(value: CellValue): Cell {
    if (this.isGiven) {
      throw new Error(`Cannot modify given cell at ${this.position.toString()}`);
    }
    return new Cell(this.position, value, this._options);
  }

  setHighlight(highlighted: boolean): Cell {
    return new Cell(
      this.position,
      this._value,
      { ...this._options, isHighlighted: highlighted }
    );
  }

  setError(hasError: boolean): Cell {
    return new Cell(
      this.position,
      this._value,
      { ...this._options, hasError }
    );
  }

  isEmpty(): boolean {
    return this._value.isEmpty();
  }

  equals(other: Cell): boolean {
    return this.position.equals(other.position) && 
           this._value.equals(other._value);
  }
}