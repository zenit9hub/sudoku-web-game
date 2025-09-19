export class EffectSequenceId {
  constructor(private readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('EffectSequenceId cannot be empty');
    }
  }

  static generate(): EffectSequenceId {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return new EffectSequenceId(`sequence_${timestamp}_${random}`);
  }

  static fromString(value: string): EffectSequenceId {
    return new EffectSequenceId(value);
  }

  toString(): string {
    return this.value;
  }

  equals(other: EffectSequenceId): boolean {
    return this.value === other.value;
  }
}