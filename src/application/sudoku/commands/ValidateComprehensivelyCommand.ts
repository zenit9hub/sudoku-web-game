import { Command } from '../../common/Command.js';

export interface ValidateComprehensivelyCommandData {
  gameId: string;
  position: { row: number; col: number };
  value: number;
  validationLevel?: 'basic' | 'standard' | 'strict' | 'expert';
}

export class ValidateComprehensivelyCommand implements Command<ValidateComprehensivelyCommandData> {
  readonly type = 'ValidateComprehensively';

  constructor(public readonly request: ValidateComprehensivelyCommandData) {}
}