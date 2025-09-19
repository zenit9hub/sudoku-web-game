import { EffectDomainEvent } from '../events/EffectDomainEvent';

export interface EffectEventHandler {
  handle(event: EffectDomainEvent): void | Promise<void>;
}

export interface EffectEventSubscription {
  unsubscribe(): void;
}

/**
 * 이펙트 도메인 이벤트를 관리하는 퍼블리셔
 *
 * 책임:
 * - 이벤트 발행
 * - 이벤트 핸들러 등록/해제
 * - 이벤트 히스토리 관리
 */
export class EffectEventPublisher {
  private readonly handlers: Map<string, Set<EffectEventHandler>> = new Map();
  private readonly eventHistory: EffectDomainEvent[] = [];
  private readonly maxHistorySize: number;

  constructor(maxHistorySize: number = 1000) {
    this.maxHistorySize = maxHistorySize;
  }

  publish(event: EffectDomainEvent): void {
    // 이벤트 히스토리에 추가
    this.addToHistory(event);

    // 특정 이벤트 타입 핸들러 실행
    const specificHandlers = this.handlers.get(event.eventType);
    if (specificHandlers) {
      this.executeHandlers(specificHandlers, event);
    }

    // 모든 이벤트 핸들러 실행 ('*' 타입)
    const allEventHandlers = this.handlers.get('*');
    if (allEventHandlers) {
      this.executeHandlers(allEventHandlers, event);
    }
  }

  subscribe(eventType: string, handler: EffectEventHandler): EffectEventSubscription {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);

    return {
      unsubscribe: () => {
        const handlers = this.handlers.get(eventType);
        if (handlers) {
          handlers.delete(handler);
          if (handlers.size === 0) {
            this.handlers.delete(eventType);
          }
        }
      }
    };
  }

  subscribeToAll(handler: EffectEventHandler): EffectEventSubscription {
    return this.subscribe('*', handler);
  }

  getEventHistory(eventType?: string): EffectDomainEvent[] {
    if (!eventType) {
      return [...this.eventHistory];
    }

    return this.eventHistory.filter(event => event.eventType === eventType);
  }

  getRecentEvents(count: number): EffectDomainEvent[] {
    return this.eventHistory.slice(-count);
  }

  clearHistory(): void {
    this.eventHistory.length = 0;
  }

  getStatistics() {
    const eventTypeCounts = new Map<string, number>();

    this.eventHistory.forEach(event => {
      const count = eventTypeCounts.get(event.eventType) || 0;
      eventTypeCounts.set(event.eventType, count + 1);
    });

    return {
      totalEvents: this.eventHistory.length,
      eventTypeCounts: Object.fromEntries(eventTypeCounts),
      activeSubscriptions: Array.from(this.handlers.entries()).map(([type, handlers]) => ({
        eventType: type,
        handlerCount: handlers.size
      }))
    };
  }

  private addToHistory(event: EffectDomainEvent): void {
    this.eventHistory.push(event);

    // 히스토리 크기 제한
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  private executeHandlers(handlers: Set<EffectEventHandler>, event: EffectDomainEvent): void {
    handlers.forEach(handler => {
      try {
        const result = handler.handle(event);

        // Promise를 반환하는 핸들러 처리
        if (result instanceof Promise) {
          result.catch(error => {
            console.error('Error in async event handler:', error);
          });
        }
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    });
  }
}

// 싱글톤 인스턴스 (애플리케이션 전역에서 사용)
export const effectEventPublisher = new EffectEventPublisher();