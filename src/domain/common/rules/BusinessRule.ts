/**
 * 비즈니스 규칙 엔진
 *
 * 도메인 로직을 규칙 기반으로 표현하고 실행합니다.
 */

export interface BusinessRule<T = any> {
  readonly name: string;
  readonly description: string;
  readonly priority: number;

  /**
   * 규칙 조건 검사
   */
  isSatisfiedBy(context: T): boolean;

  /**
   * 규칙 위반 시 에러 메시지
   */
  getErrorMessage(context: T): string;
}

/**
 * 규칙 결과
 */
export interface RuleResult {
  readonly isValid: boolean;
  readonly violatedRules: ViolatedRule[];
  readonly context: any;
}

export interface ViolatedRule {
  readonly rule: BusinessRule;
  readonly errorMessage: string;
  readonly severity: 'error' | 'warning' | 'info';
}

/**
 * 비즈니스 규칙 엔진
 */
export class BusinessRuleEngine<T = any> {
  private rules: BusinessRule<T>[] = [];

  /**
   * 규칙 추가
   */
  addRule(rule: BusinessRule<T>): void {
    this.rules.push(rule);
    this.sortRulesByPriority();
  }

  /**
   * 다중 규칙 추가
   */
  addRules(rules: BusinessRule<T>[]): void {
    this.rules.push(...rules);
    this.sortRulesByPriority();
  }

  /**
   * 규칙 제거
   */
  removeRule(ruleName: string): void {
    this.rules = this.rules.filter(rule => rule.name !== ruleName);
  }

  /**
   * 모든 규칙 검증
   */
  validate(context: T): RuleResult {
    const violatedRules: ViolatedRule[] = [];

    for (const rule of this.rules) {
      if (!rule.isSatisfiedBy(context)) {
        violatedRules.push({
          rule,
          errorMessage: rule.getErrorMessage(context),
          severity: 'error'
        });
      }
    }

    return {
      isValid: violatedRules.length === 0,
      violatedRules,
      context
    };
  }

  /**
   * 특정 규칙만 검증
   */
  validateRule(ruleName: string, context: T): RuleResult {
    const rule = this.rules.find(r => r.name === ruleName);

    if (!rule) {
      throw new Error(`Rule '${ruleName}' not found`);
    }

    const violatedRules: ViolatedRule[] = [];

    if (!rule.isSatisfiedBy(context)) {
      violatedRules.push({
        rule,
        errorMessage: rule.getErrorMessage(context),
        severity: 'error'
      });
    }

    return {
      isValid: violatedRules.length === 0,
      violatedRules,
      context
    };
  }

  /**
   * 조건부 검증 (특정 조건을 만족하는 규칙만)
   */
  validateIf(predicate: (rule: BusinessRule<T>) => boolean, context: T): RuleResult {
    const applicableRules = this.rules.filter(predicate);
    const violatedRules: ViolatedRule[] = [];

    for (const rule of applicableRules) {
      if (!rule.isSatisfiedBy(context)) {
        violatedRules.push({
          rule,
          errorMessage: rule.getErrorMessage(context),
          severity: 'error'
        });
      }
    }

    return {
      isValid: violatedRules.length === 0,
      violatedRules,
      context
    };
  }

  /**
   * 등록된 규칙 목록 조회
   */
  getRules(): readonly BusinessRule<T>[] {
    return [...this.rules];
  }

  /**
   * 규칙 수 조회
   */
  getRuleCount(): number {
    return this.rules.length;
  }

  /**
   * 모든 규칙 제거
   */
  clearRules(): void {
    this.rules = [];
  }

  private sortRulesByPriority(): void {
    this.rules.sort((a, b) => b.priority - a.priority);
  }
}

/**
 * 복합 비즈니스 규칙 (AND/OR 조건)
 */
export class CompositeRule<T> implements BusinessRule<T> {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly priority: number,
    private readonly rules: BusinessRule<T>[],
    private readonly operator: 'AND' | 'OR' = 'AND'
  ) {}

  isSatisfiedBy(context: T): boolean {
    if (this.operator === 'AND') {
      return this.rules.every(rule => rule.isSatisfiedBy(context));
    } else {
      return this.rules.some(rule => rule.isSatisfiedBy(context));
    }
  }

  getErrorMessage(context: T): string {
    const violatedRules = this.rules.filter(rule => !rule.isSatisfiedBy(context));

    if (violatedRules.length === 0) {
      return '';
    }

    const messages = violatedRules.map(rule => rule.getErrorMessage(context));

    if (this.operator === 'AND') {
      return `All conditions must be met: ${messages.join(', ')}`;
    } else {
      return `At least one condition must be met: ${messages.join(' OR ')}`;
    }
  }
}

/**
 * 조건부 비즈니스 규칙
 */
export class ConditionalRule<T> implements BusinessRule<T> {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly priority: number,
    private readonly condition: (context: T) => boolean,
    private readonly rule: BusinessRule<T>
  ) {}

  isSatisfiedBy(context: T): boolean {
    if (!this.condition(context)) {
      return true; // 조건이 맞지 않으면 규칙을 적용하지 않음
    }

    return this.rule.isSatisfiedBy(context);
  }

  getErrorMessage(context: T): string {
    if (!this.condition(context)) {
      return '';
    }

    return this.rule.getErrorMessage(context);
  }
}

/**
 * 기본 비즈니스 규칙 구현
 */
export abstract class BaseBusinessRule<T> implements BusinessRule<T> {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly priority: number = 0
  ) {}

  abstract isSatisfiedBy(context: T): boolean;
  abstract getErrorMessage(context: T): string;
}

/**
 * 람다 기반 비즈니스 규칙
 */
export class LambdaRule<T> extends BaseBusinessRule<T> {
  constructor(
    name: string,
    description: string,
    priority: number,
    private readonly predicate: (context: T) => boolean,
    private readonly errorMessageFactory: (context: T) => string
  ) {
    super(name, description, priority);
  }

  isSatisfiedBy(context: T): boolean {
    return this.predicate(context);
  }

  getErrorMessage(context: T): string {
    return this.errorMessageFactory(context);
  }
}