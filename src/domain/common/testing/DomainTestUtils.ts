/**
 * 도메인 테스트 유틸리티
 *
 * 도메인 레이어 테스트를 위한 공통 유틸리티와 헬퍼 함수들
 */

import { DomainEvent, DomainEventPublisher, DomainEventHandler } from '../events/DomainEvent.js';
import { BusinessRule, BusinessRuleEngine } from '../rules/BusinessRule.js';

/**
 * 테스트용 이벤트 발행자
 */
export class TestEventPublisher implements DomainEventPublisher {
  private publishedEvents: DomainEvent[] = [];
  private handlers = new Map<string, DomainEventHandler<any>[]>();

  async publish(event: DomainEvent): Promise<void> {
    this.publishedEvents.push(event);

    const handlers = this.handlers.get(event.eventType) || [];
    for (const handler of handlers) {
      await handler.handle(event);
    }
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
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
    }
  }

  // 테스트 헬퍼 메소드들
  getPublishedEvents(): DomainEvent[] {
    return [...this.publishedEvents];
  }

  getEventsByType(eventType: string): DomainEvent[] {
    return this.publishedEvents.filter(event => event.eventType === eventType);
  }

  getLastEvent(): DomainEvent | null {
    return this.publishedEvents.length > 0
      ? this.publishedEvents[this.publishedEvents.length - 1]
      : null;
  }

  clear(): void {
    this.publishedEvents = [];
    this.handlers.clear();
  }

  hasEvent(eventType: string): boolean {
    return this.publishedEvents.some(event => event.eventType === eventType);
  }

  getEventCount(): number {
    return this.publishedEvents.length;
  }
}

/**
 * 테스트용 비즈니스 규칙
 */
export class TestBusinessRule<T = any> implements BusinessRule<T> {
  private satisfied: boolean;

  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly priority: number = 0,
    satisfied: boolean = true,
    private errorMessage: string = 'Test rule violation'
  ) {
    this.satisfied = satisfied;
  }

  isSatisfiedBy(_context: T): boolean {
    return this.satisfied;
  }

  getErrorMessage(_context: T): string {
    return this.errorMessage;
  }

  setSatisfied(satisfied: boolean): void {
    this.satisfied = satisfied;
  }

  setErrorMessage(message: string): void {
    this.errorMessage = message;
  }
}

/**
 * 테스트 데이터 빌더
 */
export class TestDataBuilder {
  /**
   * 테스트용 도메인 이벤트 생성
   */
  static createDomainEvent(
    eventType: string = 'TestEvent',
    aggregateId: string = 'test-aggregate-1',
    aggregateType: string = 'TestAggregate',
    data: Record<string, any> = {}
  ): DomainEvent {
    return {
      eventId: `test-event-${Date.now()}`,
      eventType,
      aggregateId,
      aggregateType,
      occurredOn: new Date(),
      version: 1,
      data
    };
  }

  /**
   * 테스트용 비즈니스 규칙 엔진 생성
   */
  static createRuleEngine<T>(): BusinessRuleEngine<T> {
    return new BusinessRuleEngine<T>();
  }

  /**
   * 테스트용 위치 생성 (0-8 범위)
   */
  static createPosition(row: number = 0, col: number = 0) {
    return { row: Math.max(0, Math.min(8, row)), col: Math.max(0, Math.min(8, col)) };
  }

  /**
   * 테스트용 셀 값 생성 (1-9 또는 null)
   */
  static createCellValue(value: number | null = 1) {
    if (value === null || value < 1 || value > 9) {
      return { value: null, isEmpty: () => true, isValid: () => value === null };
    }
    return {
      value,
      isEmpty: () => false,
      isValid: () => true,
      equals: (other: any) => other && other.value === value
    };
  }

  /**
   * 테스트용 빈 그리드 생성
   */
  static createEmptyGrid() {
    return {
      cells: Array(9).fill(null).map(() =>
        Array(9).fill(null).map(() => TestDataBuilder.createCellValue(null))
      ),
      getCell: function(position: any) {
        return this.cells[position.row][position.col];
      },
      setCell: function(position: any, value: any) {
        this.cells[position.row][position.col] = value;
      },
      clone: function() {
        const newGrid = TestDataBuilder.createEmptyGrid();
        for (let row = 0; row < 9; row++) {
          for (let col = 0; col < 9; col++) {
            newGrid.cells[row][col] = this.cells[row][col];
          }
        }
        return newGrid;
      }
    };
  }

  /**
   * 테스트용 게임 상태 생성
   */
  static createGameState(overrides: Partial<any> = {}) {
    return {
      isComplete: false,
      isPaused: false,
      moveCount: 0,
      mistakeCount: 0,
      elapsedTime: 0,
      difficulty: 'MEDIUM',
      startTime: Date.now(),
      ...overrides
    };
  }
}

/**
 * 테스트 어설션 헬퍼
 */
export class TestAssertions {
  /**
   * 이벤트가 발행되었는지 확인
   */
  static assertEventPublished(
    publisher: TestEventPublisher,
    eventType: string,
    expectedData?: Partial<Record<string, any>>
  ): void {
    const events = publisher.getEventsByType(eventType);

    if (events.length === 0) {
      throw new Error(`Expected event '${eventType}' to be published, but no events found`);
    }

    if (expectedData) {
      const matchingEvent = events.find(event => {
        return Object.entries(expectedData).every(([key, value]) => {
          return event.data[key] === value;
        });
      });

      if (!matchingEvent) {
        throw new Error(`Expected event '${eventType}' with data ${JSON.stringify(expectedData)}, but no matching event found`);
      }
    }
  }

  /**
   * 비즈니스 규칙 위반 확인
   */
  static assertRuleViolated<T>(
    engine: BusinessRuleEngine<T>,
    context: T,
    expectedRuleName: string
  ): void {
    const result = engine.validate(context);

    if (result.isValid) {
      throw new Error(`Expected rule '${expectedRuleName}' to be violated, but validation passed`);
    }

    const violatedRule = result.violatedRules.find(vr => vr.rule.name === expectedRuleName);
    if (!violatedRule) {
      const violatedRuleNames = result.violatedRules.map(vr => vr.rule.name);
      throw new Error(
        `Expected rule '${expectedRuleName}' to be violated, but violated rules were: ${violatedRuleNames.join(', ')}`
      );
    }
  }

  /**
   * 비즈니스 규칙 통과 확인
   */
  static assertRulePassed<T>(
    engine: BusinessRuleEngine<T>,
    context: T
  ): void {
    const result = engine.validate(context);

    if (!result.isValid) {
      const errorMessages = result.violatedRules.map(vr => vr.errorMessage);
      throw new Error(`Expected validation to pass, but rules were violated: ${errorMessages.join(', ')}`);
    }
  }

  /**
   * 그리드 상태 확인
   */
  static assertGridState(
    grid: any,
    position: any,
    expectedValue: number | null
  ): void {
    const cell = grid.getCell(position);
    const actualValue = cell.value;

    if (actualValue !== expectedValue) {
      throw new Error(
        `Expected cell at (${position.row}, ${position.col}) to have value ${expectedValue}, but got ${actualValue}`
      );
    }
  }

  /**
   * 배열 포함 확인
   */
  static assertArrayContains<T>(
    array: T[],
    predicate: (item: T) => boolean,
    errorMessage?: string
  ): void {
    const found = array.some(predicate);
    if (!found) {
      throw new Error(errorMessage || 'Expected array to contain matching item');
    }
  }

  /**
   * 성능 어설션
   */
  static assertPerformance(
    actualTime: number,
    maxExpectedTime: number,
    operation: string
  ): void {
    if (actualTime > maxExpectedTime) {
      throw new Error(
        `${operation} took ${actualTime}ms, which exceeds the maximum expected time of ${maxExpectedTime}ms`
      );
    }
  }
}

/**
 * 테스트 시나리오 빌더
 */
export class TestScenarioBuilder {
  private grid: any;
  private gameState: any;
  private moves: Array<{ position: any; value: any }> = [];

  constructor() {
    this.grid = TestDataBuilder.createEmptyGrid();
    this.gameState = TestDataBuilder.createGameState();
  }

  /**
   * 그리드에 값 설정
   */
  withCellValue(row: number, col: number, value: number | null): TestScenarioBuilder {
    const position = TestDataBuilder.createPosition(row, col);
    const cellValue = TestDataBuilder.createCellValue(value);
    this.grid.setCell(position, cellValue);
    return this;
  }

  /**
   * 게임 상태 설정
   */
  withGameState(state: Partial<any>): TestScenarioBuilder {
    this.gameState = { ...this.gameState, ...state };
    return this;
  }

  /**
   * 움직임 추가
   */
  withMove(row: number, col: number, value: number): TestScenarioBuilder {
    this.moves.push({
      position: TestDataBuilder.createPosition(row, col),
      value: TestDataBuilder.createCellValue(value)
    });
    return this;
  }

  /**
   * 여러 셀을 한 번에 설정 (행 단위)
   */
  withRow(rowIndex: number, values: (number | null)[]): TestScenarioBuilder {
    values.forEach((value, colIndex) => {
      if (colIndex < 9) {
        this.withCellValue(rowIndex, colIndex, value);
      }
    });
    return this;
  }

  /**
   * 시나리오 빌드
   */
  build(): { grid: any; gameState: any; moves: Array<{ position: any; value: any }> } {
    return {
      grid: this.grid.clone(),
      gameState: { ...this.gameState },
      moves: [...this.moves]
    };
  }
}

/**
 * 테스트용 모의 객체 팩토리
 */
export class TestMockFactory {
  /**
   * 모의 그리드 검증 서비스 생성
   */
  static createMockValidationService() {
    return {
      validateMove: jest.fn().mockResolvedValue({
        isValid: true,
        conflictingPositions: [],
        errorMessages: [],
        violatedRules: []
      }),
      isGridComplete: jest.fn().mockReturnValue(false),
      validateCompleteGrid: jest.fn().mockReturnValue({
        isValid: true,
        conflictingPositions: [],
        errorMessages: [],
        violatedRules: []
      })
    };
  }

  /**
   * 모의 퍼즐 생성 서비스 생성
   */
  static createMockGenerationService() {
    return {
      generatePuzzle: jest.fn().mockResolvedValue(TestDataBuilder.createEmptyGrid()),
      generateAdvancedPuzzle: jest.fn().mockResolvedValue({
        puzzle: TestDataBuilder.createEmptyGrid(),
        solution: TestDataBuilder.createEmptyGrid(),
        quality: { difficulty: 'MEDIUM', clueCount: 30 },
        generationTime: 100,
        attempts: 1
      })
    };
  }

  /**
   * 모의 게임 저장소 생성
   */
  static createMockGameRepository() {
    return {
      save: jest.fn().mockResolvedValue(undefined),
      load: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(undefined),
      findAll: jest.fn().mockResolvedValue([])
    };
  }
}