export enum SequenceState {
  PENDING = 'PENDING',     // 시퀀스가 시작되지 않음
  RUNNING = 'RUNNING',     // 시퀀스가 실행 중
  PAUSED = 'PAUSED',       // 시퀀스가 일시 정지됨
  COMPLETED = 'COMPLETED', // 모든 이펙트가 완료됨
  CANCELLED = 'CANCELLED'  // 시퀀스가 취소됨
}