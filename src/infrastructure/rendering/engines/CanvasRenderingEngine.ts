import {
  RenderingEngine,
  RenderingContext,
  RenderingCapabilities,
  Vector2D,
  Size2D,
  Color,
  RenderingStyle
} from '../interfaces/RenderingEngine.js';

/**
 * Canvas 2D 기반 렌더링 컨텍스트 구현
 */
class CanvasRenderingContext implements RenderingContext {
  constructor(private readonly ctx: CanvasRenderingContext2D) {}

  drawRect(position: Vector2D, size: Size2D, style: RenderingStyle): void {
    this.applyStyle(style);

    if (style.fillColor) {
      this.ctx.fillRect(position.x, position.y, size.width, size.height);
    }

    if (style.strokeColor) {
      this.ctx.strokeRect(position.x, position.y, size.width, size.height);
    }
  }

  drawCircle(center: Vector2D, radius: number, style: RenderingStyle): void {
    this.applyStyle(style);

    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);

    if (style.fillColor) {
      this.ctx.fill();
    }

    if (style.strokeColor) {
      this.ctx.stroke();
    }
  }

  drawLine(from: Vector2D, to: Vector2D, style: RenderingStyle): void {
    this.applyStyle(style);

    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.stroke();
  }

  drawText(text: string, position: Vector2D, style: RenderingStyle): void {
    this.applyStyle(style);

    if (style.fillColor) {
      this.ctx.fillText(text, position.x, position.y);
    }

    if (style.strokeColor) {
      this.ctx.strokeText(text, position.x, position.y);
    }
  }

  drawRoundedRect(position: Vector2D, size: Size2D, radius: number, style: RenderingStyle): void {
    this.applyStyle(style);

    const x = position.x;
    const y = position.y;
    const width = size.width;
    const height = size.height;

    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();

    if (style.fillColor) {
      this.ctx.fill();
    }

    if (style.strokeColor) {
      this.ctx.stroke();
    }
  }

  drawGradient(position: Vector2D, size: Size2D, colors: Color[], direction: 'horizontal' | 'vertical'): void {
    const gradient = direction === 'horizontal'
      ? this.ctx.createLinearGradient(position.x, position.y, position.x + size.width, position.y)
      : this.ctx.createLinearGradient(position.x, position.y, position.x, position.y + size.height);

    colors.forEach((color, index) => {
      const stop = index / (colors.length - 1);
      gradient.addColorStop(stop, this.colorToString(color));
    });

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(position.x, position.y, size.width, size.height);
  }

  drawShadow(position: Vector2D, size: Size2D, blur: number, color: Color): void {
    const originalShadowBlur = this.ctx.shadowBlur;
    const originalShadowColor = this.ctx.shadowColor;

    this.ctx.shadowBlur = blur;
    this.ctx.shadowColor = this.colorToString(color);

    this.ctx.fillRect(position.x, position.y, size.width, size.height);

    this.ctx.shadowBlur = originalShadowBlur;
    this.ctx.shadowColor = originalShadowColor;
  }

  save(): void {
    this.ctx.save();
  }

  restore(): void {
    this.ctx.restore();
  }

  translate(offset: Vector2D): void {
    this.ctx.translate(offset.x, offset.y);
  }

  scale(factor: Vector2D): void {
    this.ctx.scale(factor.x, factor.y);
  }

  rotate(angle: number): void {
    this.ctx.rotate(angle);
  }

  setClip(position: Vector2D, size: Size2D): void {
    this.ctx.beginPath();
    this.ctx.rect(position.x, position.y, size.width, size.height);
    this.ctx.clip();
  }

  getSize(): Size2D {
    return {
      width: this.ctx.canvas.width,
      height: this.ctx.canvas.height
    };
  }

  clear(color?: Color): void {
    if (color) {
      this.ctx.fillStyle = this.colorToString(color);
      this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    } else {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
  }

  private applyStyle(style: RenderingStyle): void {
    if (style.fillColor) {
      this.ctx.fillStyle = this.colorToString(style.fillColor);
    }

    if (style.strokeColor) {
      this.ctx.strokeStyle = this.colorToString(style.strokeColor);
    }

    if (style.lineWidth !== undefined) {
      this.ctx.lineWidth = style.lineWidth;
    }

    if (style.font) {
      this.ctx.font = style.font;
    }

    if (style.textAlign) {
      this.ctx.textAlign = style.textAlign;
    }

    if (style.alpha !== undefined) {
      this.ctx.globalAlpha = style.alpha;
    }
  }

  private colorToString(color: Color): string {
    return `rgba(${Math.round(color.r * 255)}, ${Math.round(color.g * 255)}, ${Math.round(color.b * 255)}, ${color.a})`;
  }
}

/**
 * Canvas 2D 기반 렌더링 엔진 구현
 */
export class CanvasRenderingEngine implements RenderingEngine {
  private canvas?: HTMLCanvasElement;
  private context?: CanvasRenderingContext2D;
  private renderingContext?: CanvasRenderingContext;

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get 2D rendering context');
    }

    this.context = ctx;
    this.renderingContext = new CanvasRenderingContext(ctx);

    // Canvas 최적화 설정
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }

  resize(size: Size2D): void {
    if (!this.canvas) {
      throw new Error('Canvas not initialized');
    }

    // 고해상도 디스플레이 지원
    const devicePixelRatio = window.devicePixelRatio || 1;

    this.canvas.width = size.width * devicePixelRatio;
    this.canvas.height = size.height * devicePixelRatio;
    this.canvas.style.width = size.width + 'px';
    this.canvas.style.height = size.height + 'px';

    if (this.context) {
      this.context.scale(devicePixelRatio, devicePixelRatio);
    }
  }

  dispose(): void {
    this.canvas = undefined;
    this.context = undefined;
    this.renderingContext = undefined;
  }

  getContext(): RenderingContext {
    if (!this.renderingContext) {
      throw new Error('Rendering context not available');
    }
    return this.renderingContext;
  }

  beginFrame(): void {
    if (!this.context) {
      throw new Error('Context not initialized');
    }

    // 프레임 시작 시 초기화
    this.context.save();
  }

  endFrame(): void {
    if (!this.context) {
      throw new Error('Context not initialized');
    }

    // 프레임 종료 시 정리
    this.context.restore();
  }

  getEngineType(): 'canvas' | 'webgl' | 'webgpu' {
    return 'canvas';
  }

  getCapabilities(): RenderingCapabilities {
    return {
      maxTextureSize: 4096, // Canvas 2D의 일반적인 제한
      supportsShaders: false,
      supportsInstancing: false,
      supportsMSAA: false,
      maxAnisotropy: 1
    };
  }
}