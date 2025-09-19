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
 * WebGL 셰이더 프로그램 인터페이스
 */
interface ShaderProgram {
  program: WebGLProgram;
  attributes: { [name: string]: number };
  uniforms: { [name: string]: WebGLUniformLocation | null };
}

/**
 * WebGL 기반 렌더링 컨텍스트 구현
 */
class WebGLRenderingContext implements RenderingContext {
  private matrixStack: Float32Array[] = [];
  private currentMatrix: Float32Array;

  constructor(
    private readonly gl: WebGL2RenderingContext,
    private readonly shaderPrograms: Map<string, ShaderProgram>
  ) {
    this.currentMatrix = this.createIdentityMatrix();
    this.initializeWebGL();
  }

  drawRect(position: Vector2D, size: Size2D, style: RenderingStyle): void {
    const program = this.shaderPrograms.get('basic');
    if (!program) return;

    this.gl.useProgram(program.program);

    // 사각형 정점 데이터
    const vertices = new Float32Array([
      position.x, position.y,
      position.x + size.width, position.y,
      position.x, position.y + size.height,
      position.x + size.width, position.y + size.height
    ]);

    // 버퍼 생성 및 바인딩
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    // 정점 속성 설정
    this.gl.enableVertexAttribArray(program.attributes.position);
    this.gl.vertexAttribPointer(program.attributes.position, 2, this.gl.FLOAT, false, 0, 0);

    // 유니폼 설정
    if (style.fillColor && program.uniforms.color) {
      this.gl.uniform4f(
        program.uniforms.color,
        style.fillColor.r,
        style.fillColor.g,
        style.fillColor.b,
        style.fillColor.a
      );
    }

    if (program.uniforms.matrix) {
      this.gl.uniformMatrix3fv(program.uniforms.matrix, false, this.currentMatrix);
    }

    // 그리기
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);

    // 정리
    this.gl.deleteBuffer(buffer);
  }

  drawCircle(center: Vector2D, radius: number, style: RenderingStyle): void {
    const program = this.shaderPrograms.get('circle');
    if (!program) return;

    this.gl.useProgram(program.program);

    // 원을 위한 정점 데이터 (삼각형 팬 방식)
    const segments = 32;
    const vertices: number[] = [center.x, center.y]; // 중심점

    for (let i = 0; i <= segments; i++) {
      const angle = (i * 2 * Math.PI) / segments;
      vertices.push(
        center.x + Math.cos(angle) * radius,
        center.y + Math.sin(angle) * radius
      );
    }

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);

    this.gl.enableVertexAttribArray(program.attributes.position);
    this.gl.vertexAttribPointer(program.attributes.position, 2, this.gl.FLOAT, false, 0, 0);

    if (style.fillColor && program.uniforms.color) {
      this.gl.uniform4f(
        program.uniforms.color,
        style.fillColor.r,
        style.fillColor.g,
        style.fillColor.b,
        style.fillColor.a
      );
    }

    if (program.uniforms.matrix) {
      this.gl.uniformMatrix3fv(program.uniforms.matrix, false, this.currentMatrix);
    }

    this.gl.drawArrays(this.gl.TRIANGLE_FAN, 0, vertices.length / 2);
    this.gl.deleteBuffer(buffer);
  }

  drawLine(from: Vector2D, to: Vector2D, style: RenderingStyle): void {
    const program = this.shaderPrograms.get('basic');
    if (!program) return;

    this.gl.useProgram(program.program);

    const vertices = new Float32Array([from.x, from.y, to.x, to.y]);

    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

    this.gl.enableVertexAttribArray(program.attributes.position);
    this.gl.vertexAttribPointer(program.attributes.position, 2, this.gl.FLOAT, false, 0, 0);

    if (style.strokeColor && program.uniforms.color) {
      this.gl.uniform4f(
        program.uniforms.color,
        style.strokeColor.r,
        style.strokeColor.g,
        style.strokeColor.b,
        style.strokeColor.a
      );
    }

    if (program.uniforms.matrix) {
      this.gl.uniformMatrix3fv(program.uniforms.matrix, false, this.currentMatrix);
    }

    this.gl.lineWidth(style.lineWidth || 1);
    this.gl.drawArrays(this.gl.LINES, 0, 2);
    this.gl.deleteBuffer(buffer);
  }

  drawText(_text: string, _position: Vector2D, _style: RenderingStyle): void {
    // WebGL에서의 텍스트 렌더링은 복잡하므로 기본 구현만 제공
    // 실제로는 텍스트 텍스처를 생성하여 렌더링해야 함
    console.warn('Text rendering in WebGL is not fully implemented');
  }

  drawRoundedRect(position: Vector2D, size: Size2D, _radius: number, style: RenderingStyle): void {
    // 간단화된 구현: 기본 사각형으로 대체
    this.drawRect(position, size, style);
  }

  drawGradient(_position: Vector2D, _size: Size2D, _colors: Color[], _direction: 'horizontal' | 'vertical'): void {
    const program = this.shaderPrograms.get('gradient');
    if (!program) return;

    // 그라데이션 구현은 셰이더에서 처리
    this.gl.useProgram(program.program);
    // 구현 세부사항 생략...
  }

  drawShadow(_position: Vector2D, _size: Size2D, _blur: number, _color: Color): void {
    // 그림자 효과는 별도의 패스로 구현
    console.warn('Shadow rendering in WebGL requires additional implementation');
  }

  save(): void {
    this.matrixStack.push(new Float32Array(this.currentMatrix));
  }

  restore(): void {
    if (this.matrixStack.length > 0) {
      this.currentMatrix = this.matrixStack.pop()!;
    }
  }

  translate(offset: Vector2D): void {
    const translationMatrix = this.createTranslationMatrix(offset.x, offset.y);
    this.currentMatrix = this.multiplyMatrices(this.currentMatrix, translationMatrix);
  }

  scale(factor: Vector2D): void {
    const scaleMatrix = this.createScaleMatrix(factor.x, factor.y);
    this.currentMatrix = this.multiplyMatrices(this.currentMatrix, scaleMatrix);
  }

  rotate(angle: number): void {
    const rotationMatrix = this.createRotationMatrix(angle);
    this.currentMatrix = this.multiplyMatrices(this.currentMatrix, rotationMatrix);
  }

  setClip(position: Vector2D, size: Size2D): void {
    this.gl.enable(this.gl.SCISSOR_TEST);
    this.gl.scissor(position.x, position.y, size.width, size.height);
  }

  getSize(): Size2D {
    return {
      width: this.gl.canvas.width,
      height: this.gl.canvas.height
    };
  }

  clear(color?: Color): void {
    if (color) {
      this.gl.clearColor(color.r, color.g, color.b, color.a);
    }
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  private initializeWebGL(): void {
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    this.gl.enable(this.gl.DEPTH_TEST);
  }

  private createIdentityMatrix(): Float32Array {
    return new Float32Array([
      1, 0, 0,
      0, 1, 0,
      0, 0, 1
    ]);
  }

  private createTranslationMatrix(x: number, y: number): Float32Array {
    return new Float32Array([
      1, 0, x,
      0, 1, y,
      0, 0, 1
    ]);
  }

  private createScaleMatrix(x: number, y: number): Float32Array {
    return new Float32Array([
      x, 0, 0,
      0, y, 0,
      0, 0, 1
    ]);
  }

  private createRotationMatrix(angle: number): Float32Array {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return new Float32Array([
      cos, -sin, 0,
      sin, cos, 0,
      0, 0, 1
    ]);
  }

  private multiplyMatrices(a: Float32Array, b: Float32Array): Float32Array {
    const result = new Float32Array(9);
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        result[i * 3 + j] =
          a[i * 3 + 0] * b[0 * 3 + j] +
          a[i * 3 + 1] * b[1 * 3 + j] +
          a[i * 3 + 2] * b[2 * 3 + j];
      }
    }
    return result;
  }
}

/**
 * WebGL 기반 렌더링 엔진 구현
 */
export class WebGLRenderingEngine implements RenderingEngine {
  private canvas?: HTMLCanvasElement;
  private gl?: WebGL2RenderingContext;
  private renderingContext?: WebGLRenderingContext;
  private shaderPrograms = new Map<string, ShaderProgram>();

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2');

    if (!gl) {
      throw new Error('WebGL2 not supported');
    }

    this.gl = gl;
    await this.initializeShaders();
    this.renderingContext = new WebGLRenderingContext(gl, this.shaderPrograms);
  }

  resize(size: Size2D): void {
    if (!this.canvas || !this.gl) {
      throw new Error('WebGL not initialized');
    }

    const devicePixelRatio = window.devicePixelRatio || 1;

    this.canvas.width = size.width * devicePixelRatio;
    this.canvas.height = size.height * devicePixelRatio;
    this.canvas.style.width = size.width + 'px';
    this.canvas.style.height = size.height + 'px';

    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  dispose(): void {
    if (this.gl) {
      // 셰이더 프로그램 정리
      this.shaderPrograms.forEach(program => {
        this.gl!.deleteProgram(program.program);
      });
      this.shaderPrograms.clear();
    }

    this.canvas = undefined;
    this.gl = undefined;
    this.renderingContext = undefined;
  }

  getContext(): RenderingContext {
    if (!this.renderingContext) {
      throw new Error('WebGL rendering context not available');
    }
    return this.renderingContext;
  }

  beginFrame(): void {
    if (!this.gl) {
      throw new Error('WebGL not initialized');
    }

    this.gl.clearColor(0.95, 0.95, 0.95, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  }

  endFrame(): void {
    // WebGL에서는 자동으로 프레임이 완료됨
  }

  getEngineType(): 'canvas' | 'webgl' | 'webgpu' {
    return 'webgl';
  }

  getCapabilities(): RenderingCapabilities {
    if (!this.gl) {
      throw new Error('WebGL not initialized');
    }

    return {
      maxTextureSize: this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE),
      supportsShaders: true,
      supportsInstancing: true,
      supportsMSAA: true,
      maxAnisotropy: this.getMaxAnisotropy()
    };
  }

  private async initializeShaders(): Promise<void> {
    if (!this.gl) return;

    // 기본 셰이더
    const basicProgram = await this.createShaderProgram(
      this.getVertexShaderSource(),
      this.getFragmentShaderSource()
    );

    if (basicProgram) {
      this.shaderPrograms.set('basic', basicProgram);
    }

    // 원형 셰이더 (기본과 동일하게 설정)
    if (basicProgram) {
      this.shaderPrograms.set('circle', basicProgram);
    }
  }

  private async createShaderProgram(vertexSource: string, fragmentSource: string): Promise<ShaderProgram | null> {
    if (!this.gl) return null;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) {
      return null;
    }

    const program = this.gl.createProgram();
    if (!program) return null;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Shader program link error:', this.gl.getProgramInfoLog(program));
      return null;
    }

    return {
      program,
      attributes: {
        position: this.gl.getAttribLocation(program, 'a_position')
      },
      uniforms: {
        color: this.gl.getUniformLocation(program, 'u_color'),
        matrix: this.gl.getUniformLocation(program, 'u_matrix')
      }
    };
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  private getVertexShaderSource(): string {
    return `#version 300 es
      in vec2 a_position;
      uniform mat3 u_matrix;

      void main() {
        vec3 position = u_matrix * vec3(a_position, 1.0);
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `;
  }

  private getFragmentShaderSource(): string {
    return `#version 300 es
      precision mediump float;
      uniform vec4 u_color;
      out vec4 outColor;

      void main() {
        outColor = u_color;
      }
    `;
  }

  private getMaxAnisotropy(): number {
    if (!this.gl) return 1;

    const ext = this.gl.getExtension('EXT_texture_filter_anisotropic');
    return ext ? this.gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 1;
  }
}