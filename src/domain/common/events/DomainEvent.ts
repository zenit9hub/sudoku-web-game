/**
 * 도메인 이벤트 기본 인터페이스
 *
 * 도메인 내에서 발생하는 중요한 비즈니스 이벤트를 표현합니다.
 */

export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly occurredOn: Date;
  readonly version: number;
  readonly data: Record<string, any>;
}

/**
 * 도메인 이벤트 기본 구현
 */
export abstract class BaseDomainEvent implements DomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly version: number = 1;

  constructor(
    public readonly eventType: string,
    public readonly aggregateId: string,
    public readonly aggregateType: string,
    public readonly data: Record<string, any> = {}
  ) {
    this.eventId = this.generateEventId();
    this.occurredOn = new Date();
  }

  private generateEventId(): string {
    return `${this.eventType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 도메인 이벤트 발행자 인터페이스
 */
export interface DomainEventPublisher {
  /**
   * 이벤트 발행
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * 다중 이벤트 발행
   */
  publishAll(events: DomainEvent[]): Promise<void>;

  /**
   * 이벤트 핸들러 등록
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void;

  /**
   * 이벤트 핸들러 제거
   */
  unsubscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void;
}

/**
 * 도메인 이벤트 핸들러 인터페이스
 */
export interface DomainEventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

/**
 * 이벤트 저장소 인터페이스
 */
export interface EventStore {
  /**
   * 이벤트 저장
   */
  saveEvent(event: DomainEvent): Promise<void>;

  /**
   * 다중 이벤트 저장
   */
  saveEvents(events: DomainEvent[]): Promise<void>;

  /**
   * 애그리거트별 이벤트 조회
   */
  getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>;

  /**
   * 이벤트 타입별 조회
   */
  getEventsByType(eventType: string, limit?: number): Promise<DomainEvent[]>;

  /**
   * 날짜 범위별 이벤트 조회
   */
  getEventsByDateRange(startDate: Date, endDate: Date): Promise<DomainEvent[]>;
}

/**
 * 애그리거트 루트 인터페이스
 */
export interface AggregateRoot {
  /**
   * 도메인 이벤트 목록 조회
   */
  getDomainEvents(): DomainEvent[];

  /**
   * 도메인 이벤트 클리어
   */
  clearDomainEvents(): void;

  /**
   * 도메인 이벤트 추가
   */
  addDomainEvent(event: DomainEvent): void;
}