/**
 * 렌더링 엔진 기본 인터페이스
 *
 * Canvas, WebGL 등 다양한 렌더링 백엔드를 지원하기 위한 추상화 레이어
 */

export interface Vector2D {
  readonly x: number;
  readonly y: number;
}

export interface Size2D {
  readonly width: number;
  readonly height: number;
}

export interface Color {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export interface RenderingStyle {
  readonly fillColor?: Color;
  readonly strokeColor?: Color;
  readonly lineWidth?: number;
  readonly font?: string;
  readonly textAlign?: 'left' | 'center' | 'right';
  readonly alpha?: number;
}

export interface RenderingContext {
  /**
   * 기본 도형 그리기
   */
  drawRect(position: Vector2D, size: Size2D, style: RenderingStyle): void;
  drawCircle(center: Vector2D, radius: number, style: RenderingStyle): void;
  drawLine(from: Vector2D, to: Vector2D, style: RenderingStyle): void;
  drawText(text: string, position: Vector2D, style: RenderingStyle): void;

  /**
   * 고급 그리기 기능
   */
  drawRoundedRect(position: Vector2D, size: Size2D, radius: number, style: RenderingStyle): void;
  drawGradient(position: Vector2D, size: Size2D, colors: Color[], direction: 'horizontal' | 'vertical'): void;
  drawShadow(position: Vector2D, size: Size2D, blur: number, color: Color): void;

  /**
   * 변환 및 상태 관리
   */
  save(): void;
  restore(): void;
  translate(offset: Vector2D): void;
  scale(factor: Vector2D): void;
  rotate(angle: number): void;
  setClip(position: Vector2D, size: Size2D): void;

  /**
   * 컨텍스트 정보
   */
  getSize(): Size2D;
  clear(color?: Color): void;
}

export interface RenderingEngine {
  /**
   * 엔진 초기화 및 설정
   */
  initialize(canvas: HTMLCanvasElement): Promise<void>;
  resize(size: Size2D): void;
  dispose(): void;

  /**
   * 렌더링 컨텍스트 접근
   */
  getContext(): RenderingContext;

  /**
   * 프레임 관리
   */
  beginFrame(): void;
  endFrame(): void;

  /**
   * 엔진 정보
   */
  getEngineType(): 'canvas' | 'webgl' | 'webgpu';
  getCapabilities(): RenderingCapabilities;
}

export interface RenderingCapabilities {
  readonly maxTextureSize: number;
  readonly supportsShaders: boolean;
  readonly supportsInstancing: boolean;
  readonly supportsMSAA: boolean;
  readonly maxAnisotropy: number;
}