import {
  EventManager,
  EventListener,
  EventListenerOptions,
  GameEvent,
  MouseEvent,
  TouchEvent,
  KeyboardEvent,
  InputModifiers,
  InputHandler,
  CoordinateTransform
} from '../interfaces/EventSystem.js';

/**
 * DOM 이벤트를 게임 이벤트로 변환하는 어댑터
 */
class GameEventAdapter {
  static fromMouseEvent(domEvent: globalThis.MouseEvent, transform?: CoordinateTransform): MouseEvent {
    const position = transform
      ? transform.screenToLocal({ x: domEvent.clientX, y: domEvent.clientY })
      : { x: domEvent.clientX, y: domEvent.clientY };

    return {
      type: domEvent.type as any,
      timestamp: domEvent.timeStamp,
      target: domEvent.target as HTMLElement,
      cancelable: domEvent.cancelable,
      position,
      button: this.getMouseButton(domEvent.button),
      buttons: domEvent.buttons,
      modifiers: this.getModifiers(domEvent),
      wheelDelta: this.getWheelDelta(domEvent),
      preventDefault: () => domEvent.preventDefault(),
      stopPropagation: () => domEvent.stopPropagation()
    };
  }

  static fromTouchEvent(domEvent: globalThis.TouchEvent, transform?: CoordinateTransform): TouchEvent {
    return {
      type: domEvent.type as any,
      timestamp: domEvent.timeStamp,
      target: domEvent.target as HTMLElement,
      cancelable: domEvent.cancelable,
      touches: Array.from(domEvent.touches).map(touch => this.convertTouch(touch, transform)),
      changedTouches: Array.from(domEvent.changedTouches).map(touch => this.convertTouch(touch, transform)),
      modifiers: this.getModifiers(domEvent),
      preventDefault: () => domEvent.preventDefault(),
      stopPropagation: () => domEvent.stopPropagation()
    };
  }

  static fromKeyboardEvent(domEvent: globalThis.KeyboardEvent): KeyboardEvent {
    return {
      type: domEvent.type as any,
      timestamp: domEvent.timeStamp,
      target: domEvent.target as HTMLElement,
      cancelable: domEvent.cancelable,
      key: domEvent.key,
      code: domEvent.code,
      repeat: domEvent.repeat,
      modifiers: this.getModifiers(domEvent),
      preventDefault: () => domEvent.preventDefault(),
      stopPropagation: () => domEvent.stopPropagation()
    };
  }

  private static getMouseButton(button: number): 'left' | 'middle' | 'right' {
    switch (button) {
      case 0: return 'left';
      case 1: return 'middle';
      case 2: return 'right';
      default: return 'left';
    }
  }

  private static getModifiers(event: globalThis.MouseEvent | globalThis.KeyboardEvent | globalThis.TouchEvent): InputModifiers {
    return {
      shift: event.shiftKey,
      ctrl: event.ctrlKey,
      alt: event.altKey,
      meta: event.metaKey
    };
  }

  private static getWheelDelta(event: globalThis.MouseEvent): { x: number; y: number } | undefined {
    if (event instanceof WheelEvent) {
      return { x: event.deltaX, y: event.deltaY };
    }
    return undefined;
  }

  private static convertTouch(touch: Touch, transform?: CoordinateTransform) {
    const position = transform
      ? transform.screenToLocal({ x: touch.clientX, y: touch.clientY })
      : { x: touch.clientX, y: touch.clientY };

    return {
      id: touch.identifier,
      position,
      pressure: touch.force || 1.0,
      radiusX: touch.radiusX || 1,
      radiusY: touch.radiusY || 1
    };
  }
}

/**
 * DOM 기반 이벤트 매니저 구현
 */
export class DOMEventManager implements EventManager, InputHandler {
  private listeners = new Map<string, Array<{
    listener: EventListener<any>;
    options?: EventListenerOptions;
  }>>();

  private domListeners = new Map<string, (event: Event) => void>();
  private enabled = false;
  private target?: HTMLElement;
  private coordinateTransform?: CoordinateTransform;

  constructor(target?: HTMLElement) {
    if (target) {
      this.setTarget(target);
    }
  }

  enable(): void {
    if (this.enabled || !this.target) return;

    this.enabled = true;
    this.registerDOMListeners();
  }

  disable(): void {
    if (!this.enabled || !this.target) return;

    this.enabled = false;
    this.unregisterDOMListeners();
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setTarget(element: HTMLElement): void {
    if (this.enabled) {
      this.disable();
    }

    this.target = element;

    if (this.target) {
      this.enable();
    }
  }

  setCoordinateTransform(transform: CoordinateTransform): void {
    this.coordinateTransform = transform;
  }

  addEventListener<T extends GameEvent>(
    eventType: string,
    listener: EventListener<T>,
    options?: EventListenerOptions
  ): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    this.listeners.get(eventType)!.push({ listener, options });

    // DOM 리스너가 아직 등록되지 않았다면 등록
    if (this.enabled && this.target && !this.domListeners.has(eventType)) {
      this.registerDOMListener(eventType);
    }
  }

  removeEventListener<T extends GameEvent>(
    eventType: string,
    listener: EventListener<T>
  ): void {
    const eventListeners = this.listeners.get(eventType);
    if (!eventListeners) return;

    const index = eventListeners.findIndex(item => item.listener === listener);
    if (index >= 0) {
      eventListeners.splice(index, 1);

      // 리스너가 모두 제거되면 DOM 리스너도 제거
      if (eventListeners.length === 0) {
        this.listeners.delete(eventType);
        this.unregisterDOMListener(eventType);
      }
    }
  }

  dispatchEvent(event: GameEvent): boolean {
    const eventListeners = this.listeners.get(event.type);
    if (!eventListeners) return true;

    // 우선순위에 따라 정렬
    const sortedListeners = [...eventListeners].sort((a, b) => {
      const priorityA = a.options?.priority || 0;
      const priorityB = b.options?.priority || 0;
      return priorityB - priorityA; // 높은 우선순위부터
    });

    for (const { listener, options } of sortedListeners) {
      try {
        const result = listener(event);

        // once 옵션이 설정된 경우 리스너 제거
        if (options?.once) {
          this.removeEventListener(event.type, listener);
        }

        // 리스너가 false를 반환하면 이벤트 전파 중단
        if (result === false) {
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    }

    return true;
  }

  removeAllListeners(eventType?: string): void {
    if (eventType) {
      this.listeners.delete(eventType);
      this.unregisterDOMListener(eventType);
    } else {
      this.listeners.clear();
      this.unregisterDOMListeners();
    }
  }

  private registerDOMListeners(): void {
    if (!this.target) return;

    // 마우스 이벤트
    const mouseEvents = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove', 'wheel'];
    mouseEvents.forEach(eventType => {
      if (this.listeners.has(eventType)) {
        this.registerDOMListener(eventType);
      }
    });

    // 터치 이벤트
    const touchEvents = ['touchstart', 'touchmove', 'touchend', 'touchcancel'];
    touchEvents.forEach(eventType => {
      if (this.listeners.has(eventType)) {
        this.registerDOMListener(eventType);
      }
    });

    // 키보드 이벤트
    const keyboardEvents = ['keydown', 'keyup', 'keypress'];
    keyboardEvents.forEach(eventType => {
      if (this.listeners.has(eventType)) {
        this.registerDOMListener(eventType);
      }
    });
  }

  private registerDOMListener(eventType: string): void {
    if (!this.target || this.domListeners.has(eventType)) return;

    const domListener = (domEvent: Event) => {
      const gameEvent = this.convertDOMEvent(domEvent);
      if (gameEvent) {
        this.dispatchEvent(gameEvent);
      }
    };

    this.domListeners.set(eventType, domListener);
    this.target.addEventListener(eventType, domListener, { passive: false });
  }

  private unregisterDOMListeners(): void {
    if (!this.target) return;

    this.domListeners.forEach((listener, eventType) => {
      this.target!.removeEventListener(eventType, listener);
    });
    this.domListeners.clear();
  }

  private unregisterDOMListener(eventType: string): void {
    if (!this.target) return;

    const listener = this.domListeners.get(eventType);
    if (listener) {
      this.target.removeEventListener(eventType, listener);
      this.domListeners.delete(eventType);
    }
  }

  private convertDOMEvent(domEvent: Event): GameEvent | null {
    if (domEvent instanceof globalThis.MouseEvent || domEvent instanceof WheelEvent) {
      return GameEventAdapter.fromMouseEvent(domEvent, this.coordinateTransform);
    } else if (domEvent instanceof globalThis.TouchEvent) {
      return GameEventAdapter.fromTouchEvent(domEvent, this.coordinateTransform);
    } else if (domEvent instanceof globalThis.KeyboardEvent) {
      return GameEventAdapter.fromKeyboardEvent(domEvent);
    }

    return null;
  }
}