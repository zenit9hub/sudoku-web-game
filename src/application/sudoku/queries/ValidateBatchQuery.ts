import { Query } from '../../common/Query.js';

export interface ValidateBatchQueryData {
  gameId: string;
  validationLevel?: 'basic' | 'standard' | 'strict' | 'expert';
}

export class ValidateBatchQuery implements Query<ValidateBatchQueryData> {
  readonly type = 'ValidateBatch';

  constructor(public readonly request: ValidateBatchQueryData) {}
}