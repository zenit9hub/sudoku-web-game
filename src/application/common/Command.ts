/**
 * 커맨드 기본 인터페이스
 *
 * 상태를 변경하는 모든 작업에 대한 기본 구조를 정의합니다.
 * 커맨드는 시스템의 상태를 변경하며 결과를 반환할 수 있습니다.
 */
export interface Command<TRequest = any> {
  readonly type: string;
  readonly request: TRequest;
}

/**
 * 커맨드 핸들러 인터페이스
 */
export interface CommandHandler<TCommand extends Command, TResponse> {
  handle(command: TCommand): Promise<TResponse>;
}

/**
 * 커맨드 실행 결과
 */
export interface CommandResult<TData = any> {
  readonly success: boolean;
  readonly data?: TData;
  readonly error?: string;
  readonly metadata?: Record<string, any>;
}

/**
 * 커맨드 결과 팩토리
 */
export class CommandResultFactory {
  static success<T>(data?: T, metadata?: Record<string, any>): CommandResult<T> {
    return {
      success: true,
      data,
      metadata
    };
  }

  static failure<T>(error: string, metadata?: Record<string, any>): CommandResult<T> {
    return {
      success: false,
      error,
      metadata
    };
  }
}