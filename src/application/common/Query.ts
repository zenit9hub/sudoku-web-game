/**
 * 쿼리 기본 인터페이스
 *
 * 데이터를 조회하는 모든 작업에 대한 기본 구조를 정의합니다.
 * 쿼리는 시스템의 상태를 변경하지 않고 데이터만 반환합니다.
 */
export interface Query<TRequest = any> {
  readonly type: string;
  readonly request: TRequest;
}

/**
 * 쿼리 핸들러 인터페이스
 */
export interface QueryHandler<TQuery extends Query, TResponse> {
  handle(query: TQuery): Promise<TResponse>;
}

/**
 * 쿼리 실행 결과
 */
export interface QueryResult<TData = any> {
  readonly data: TData;
  readonly metadata?: Record<string, any>;
}

/**
 * 쿼리 결과 팩토리
 */
export class QueryResultFactory {
  static create<T>(data: T, metadata?: Record<string, any>): QueryResult<T> {
    return {
      data,
      metadata
    };
  }
}