/**
 * 이벤트 시스템 추상화 인터페이스
 *
 * 다양한 입력 장치와 상호작용 방식을 통합 관리합니다.
 */

export interface Point2D {
  readonly x: number;
  readonly y: number;
}

export interface InputModifiers {
  readonly shift: boolean;
  readonly ctrl: boolean;
  readonly alt: boolean;
  readonly meta: boolean;
}

/**
 * 기본 이벤트 인터페이스
 */
export interface GameEvent {
  readonly type: string;
  readonly timestamp: number;
  readonly target?: HTMLElement;
  readonly cancelable: boolean;
  preventDefault(): void;
  stopPropagation(): void;
}

/**
 * 마우스 이벤트
 */
export interface MouseEvent extends GameEvent {
  readonly type: 'mousedown' | 'mouseup' | 'mousemove' | 'click' | 'dblclick' | 'wheel';
  readonly position: Point2D;
  readonly button: 'left' | 'middle' | 'right';
  readonly buttons: number;
  readonly modifiers: InputModifiers;
  readonly wheelDelta?: { x: number; y: number };
}

/**
 * 터치 이벤트
 */
export interface TouchEvent extends GameEvent {
  readonly type: 'touchstart' | 'touchmove' | 'touchend' | 'touchcancel';
  readonly touches: TouchPoint[];
  readonly changedTouches: TouchPoint[];
  readonly modifiers: InputModifiers;
}

export interface TouchPoint {
  readonly id: number;
  readonly position: Point2D;
  readonly pressure: number;
  readonly radiusX: number;
  readonly radiusY: number;
}

/**
 * 키보드 이벤트
 */
export interface KeyboardEvent extends GameEvent {
  readonly type: 'keydown' | 'keyup' | 'keypress';
  readonly key: string;
  readonly code: string;
  readonly repeat: boolean;
  readonly modifiers: InputModifiers;
}

/**
 * 게임패드 이벤트
 */
export interface GamepadEvent extends GameEvent {
  readonly type: 'gamepadconnected' | 'gamepaddisconnected' | 'gamepadbutton' | 'gamepadaxis';
  readonly gamepadId: number;
  readonly button?: number;
  readonly axis?: number;
  readonly value: number;
}

/**
 * 이벤트 리스너 타입
 */
export type EventListener<T extends GameEvent> = (event: T) => void | boolean;

/**
 * 이벤트 매니저 인터페이스
 */
export interface EventManager {
  /**
   * 이벤트 리스너 등록
   */
  addEventListener<T extends GameEvent>(
    eventType: string,
    listener: EventListener<T>,
    options?: EventListenerOptions
  ): void;

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener<T extends GameEvent>(
    eventType: string,
    listener: EventListener<T>
  ): void;

  /**
   * 이벤트 발생
   */
  dispatchEvent(event: GameEvent): boolean;

  /**
   * 모든 리스너 제거
   */
  removeAllListeners(eventType?: string): void;

  /**
   * 이벤트 관리자 활성화/비활성화
   */
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
}

export interface EventListenerOptions {
  readonly once?: boolean;
  readonly passive?: boolean;
  readonly priority?: number;
}

/**
 * 입력 핸들러 인터페이스
 */
export interface InputHandler {
  /**
   * 입력 처리 활성화
   */
  enable(): void;

  /**
   * 입력 처리 비활성화
   */
  disable(): void;

  /**
   * 입력 대상 설정
   */
  setTarget(element: HTMLElement): void;

  /**
   * 좌표 변환 설정
   */
  setCoordinateTransform(transform: CoordinateTransform): void;
}

export interface CoordinateTransform {
  screenToLocal(screenPoint: Point2D): Point2D;
  localToScreen(localPoint: Point2D): Point2D;
  getScale(): number;
  getOffset(): Point2D;
}

/**
 * 제스처 인식기 인터페이스
 */
export interface GestureRecognizer {
  /**
   * 제스처 인식 활성화
   */
  enable(): void;

  /**
   * 제스처 인식 비활성화
   */
  disable(): void;

  /**
   * 제스처 이벤트 리스너 등록
   */
  addGestureListener(gestureType: string, listener: (gesture: GestureEvent) => void): void;

  /**
   * 제스처 이벤트 리스너 제거
   */
  removeGestureListener(gestureType: string, listener: (gesture: GestureEvent) => void): void;
}

/**
 * 제스처 이벤트
 */
export interface GestureEvent extends GameEvent {
  readonly type: 'tap' | 'doubletap' | 'pinch' | 'rotate' | 'swipe' | 'pan';
  readonly position: Point2D;
  readonly scale?: number;
  readonly rotation?: number;
  readonly velocity?: Point2D;
  readonly direction?: 'up' | 'down' | 'left' | 'right';
}

/**
 * 입력 상태 관리자
 */
export interface InputStateManager {
  /**
   * 현재 마우스 위치
   */
  getMousePosition(): Point2D;

  /**
   * 마우스 버튼 상태
   */
  isMouseButtonPressed(button: 'left' | 'middle' | 'right'): boolean;

  /**
   * 키 상태
   */
  isKeyPressed(key: string): boolean;

  /**
   * 모디파이어 키 상태
   */
  getModifiers(): InputModifiers;

  /**
   * 터치 상태
   */
  getActiveTouches(): TouchPoint[];

  /**
   * 게임패드 상태
   */
  getGamepadState(gamepadId: number): GamepadState | null;
}

export interface GamepadState {
  readonly connected: boolean;
  readonly buttons: boolean[];
  readonly axes: number[];
  readonly timestamp: number;
}