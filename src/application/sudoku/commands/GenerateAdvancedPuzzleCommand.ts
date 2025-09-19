import { Command } from '../../common/Command.js';

export interface GenerateAdvancedPuzzleCommandData {
  difficulty: string;
  useSymmetry?: boolean;
  targetClueCount?: number;
  maxAttempts?: number;
}

export class GenerateAdvancedPuzzleCommand implements Command {
  readonly type = 'GenerateAdvancedPuzzle';

  constructor(public readonly data: GenerateAdvancedPuzzleCommandData) {}
}