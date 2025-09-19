import { Query } from '../../common/Query.js';

export interface ValidateRealtimeQueryData {
  gameId: string;
  position: { row: number; col: number };
  partialValue: string;
}

export class ValidateRealtimeQuery implements Query {
  readonly type = 'ValidateRealtime';

  constructor(public readonly data: ValidateRealtimeQueryData) {}
}