import {
  DomainEvent,
  DomainEventPublisher,
  DomainEventHandler,
  EventStore
} from './DomainEvent.js';

/**
 * 인메모리 도메인 이벤트 발행자 구현
 */
export class InMemoryDomainEventPublisher implements DomainEventPublisher {
  private handlers = new Map<string, DomainEventHandler<any>[]>();
  private eventStore?: EventStore;

  constructor(eventStore?: EventStore) {
    this.eventStore = eventStore;
  }

  async publish(event: DomainEvent): Promise<void> {
    // 이벤트 저장 (옵션)
    if (this.eventStore) {
      await this.eventStore.saveEvent(event);
    }

    // 핸들러 실행
    const handlers = this.handlers.get(event.eventType) || [];

    // 순차 실행
    for (const handler of handlers) {
      try {
        await handler.handle(event);
      } catch (error) {
        console.error(`Error handling event ${event.eventType}:`, error);
        // 에러 처리 정책에 따라 다르게 처리 가능
        // - 계속 진행
        // - 이벤트 재시도
        // - 데드레터 큐로 이동
      }
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    // 이벤트들을 일괄 저장
    if (this.eventStore && events.length > 0) {
      await this.eventStore.saveEvents(events);
    }

    // 각 이벤트 발행 (저장은 생략)
    for (const event of events) {
      const handlers = this.handlers.get(event.eventType) || [];

      for (const handler of handlers) {
        try {
          await handler.handle(event);
        } catch (error) {
          console.error(`Error handling event ${event.eventType}:`, error);
        }
      }
    }
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push(handler);
  }

  unsubscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index >= 0) {
        handlers.splice(index, 1);
      }

      if (handlers.length === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  /**
   * 등록된 핸들러 수 조회
   */
  getHandlerCount(eventType?: string): number {
    if (eventType) {
      return this.handlers.get(eventType)?.length || 0;
    }

    let total = 0;
    for (const handlers of this.handlers.values()) {
      total += handlers.length;
    }
    return total;
  }

  /**
   * 등록된 이벤트 타입들 조회
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * 모든 핸들러 제거
   */
  clear(): void {
    this.handlers.clear();
  }
}

/**
 * 비동기 도메인 이벤트 발행자
 */
export class AsyncDomainEventPublisher implements DomainEventPublisher {
  private syncPublisher: InMemoryDomainEventPublisher;
  private eventQueue: DomainEvent[] = [];
  private isProcessing = false;
  private processingInterval: number = 100; // ms

  constructor(eventStore?: EventStore) {
    this.syncPublisher = new InMemoryDomainEventPublisher(eventStore);
    this.startProcessing();
  }

  async publish(event: DomainEvent): Promise<void> {
    this.eventQueue.push(event);
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    this.eventQueue.push(...events);
  }

  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void {
    this.syncPublisher.subscribe(eventType, handler);
  }

  unsubscribe<T extends DomainEvent>(
    eventType: string,
    handler: DomainEventHandler<T>
  ): void {
    this.syncPublisher.unsubscribe(eventType, handler);
  }

  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    const processEvents = async () => {
      if (this.eventQueue.length > 0) {
        const eventsToProcess = [...this.eventQueue];
        this.eventQueue = [];

        try {
          await this.syncPublisher.publishAll(eventsToProcess);
        } catch (error) {
          console.error('Error processing event queue:', error);
          // 실패한 이벤트들을 다시 큐에 추가할 수도 있음
        }
      }

      if (this.isProcessing) {
        setTimeout(processEvents, this.processingInterval);
      }
    };

    processEvents();
  }

  /**
   * 이벤트 처리 중단
   */
  stop(): void {
    this.isProcessing = false;
  }

  /**
   * 큐에 남은 이벤트 수
   */
  getQueueLength(): number {
    return this.eventQueue.length;
  }

  /**
   * 처리 간격 설정
   */
  setProcessingInterval(intervalMs: number): void {
    this.processingInterval = Math.max(10, intervalMs);
  }
}

/**
 * 도메인 이벤트 발행자 팩토리
 */
export class DomainEventPublisherFactory {
  private static instance?: DomainEventPublisher;

  static getInstance(eventStore?: EventStore): DomainEventPublisher {
    if (!this.instance) {
      this.instance = new InMemoryDomainEventPublisher(eventStore);
    }
    return this.instance;
  }

  static createAsync(eventStore?: EventStore): AsyncDomainEventPublisher {
    return new AsyncDomainEventPublisher(eventStore);
  }

  static createSync(eventStore?: EventStore): InMemoryDomainEventPublisher {
    return new InMemoryDomainEventPublisher(eventStore);
  }

  static reset(): void {
    this.instance = undefined;
  }
}