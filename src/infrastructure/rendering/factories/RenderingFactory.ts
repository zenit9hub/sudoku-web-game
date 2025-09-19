import { GameRenderer, GameRendererFactory } from '../interfaces/GameRenderer.js';
import { RenderingEngine } from '../interfaces/RenderingEngine.js';
import { CanvasRenderingEngine } from '../engines/CanvasRenderingEngine.js';
import { WebGLRenderingEngine } from '../engines/WebGLRenderingEngine.js';
import { CanvasGameRenderer } from '../renderers/CanvasGameRenderer.js';

/**
 * 렌더링 팩토리 구현
 *
 * 적절한 렌더링 엔진과 게임 렌더러를 생성하고 관리합니다.
 */
export class RenderingFactory implements GameRendererFactory {
  private static instance?: RenderingFactory;

  private constructor() {}

  static getInstance(): RenderingFactory {
    if (!this.instance) {
      this.instance = new RenderingFactory();
    }
    return this.instance;
  }

  async createRenderer(engineType: 'canvas' | 'webgl'): Promise<GameRenderer> {
    const engine = await this.createRenderingEngine(engineType);

    // 현재는 Canvas 게임 렌더러만 구현되어 있음
    // WebGL 게임 렌더러는 추후 구현
    return new CanvasGameRenderer(engine);
  }

  getSupportedEngines(): string[] {
    const supported: string[] = [];

    // Canvas 2D 지원 확인
    if (this.isCanvasSupported()) {
      supported.push('canvas');
    }

    // WebGL 지원 확인
    if (this.isWebGLSupported()) {
      supported.push('webgl');
    }

    return supported;
  }

  getRecommendedEngine(): string {
    // 지원되는 엔진 목록을 가져와서 우선순위에 따라 추천
    const supported = this.getSupportedEngines();

    if (supported.includes('webgl')) {
      return 'webgl';
    }

    if (supported.includes('canvas')) {
      return 'canvas';
    }

    throw new Error('No supported rendering engines found');
  }

  /**
   * 렌더링 엔진 생성
   */
  private async createRenderingEngine(engineType: 'canvas' | 'webgl'): Promise<RenderingEngine> {
    switch (engineType) {
      case 'canvas':
        return new CanvasRenderingEngine();

      case 'webgl':
        return new WebGLRenderingEngine();

      default:
        throw new Error(`Unsupported engine type: ${engineType}`);
    }
  }

  /**
   * Canvas 2D 지원 확인
   */
  private isCanvasSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      return ctx !== null;
    } catch {
      return false;
    }
  }

  /**
   * WebGL 지원 확인
   */
  private isWebGLSupported(): boolean {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      return gl !== null;
    } catch {
      return false;
    }
  }

  /**
   * 렌더링 성능 벤치마크
   */
  async benchmarkEngine(engineType: 'canvas' | 'webgl'): Promise<RenderingBenchmarkResult> {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;

    const engine = await this.createRenderingEngine(engineType);
    await engine.initialize(canvas);

    const startTime = performance.now();
    const iterations = 1000;

    // 간단한 렌더링 벤치마크
    for (let i = 0; i < iterations; i++) {
      engine.beginFrame();

      const ctx = engine.getContext();
      ctx.clear({ r: 0.95, g: 0.95, b: 0.95, a: 1 });

      // 여러 도형 그리기
      for (let j = 0; j < 10; j++) {
        ctx.drawRect(
          { x: j * 10, y: j * 10 },
          { width: 50, height: 50 },
          { fillColor: { r: 0.5, g: 0.5, b: 1, a: 1 } }
        );
      }

      engine.endFrame();
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const fps = (iterations * 1000) / totalTime;

    engine.dispose();

    return {
      engineType,
      totalTime,
      averageFrameTime: totalTime / iterations,
      estimatedFPS: fps,
      capabilities: engine.getCapabilities()
    };
  }

  /**
   * 최적의 엔진 자동 선택
   */
  async selectOptimalEngine(): Promise<'canvas' | 'webgl'> {
    const supportedEngines = this.getSupportedEngines();

    if (supportedEngines.length === 0) {
      throw new Error('No rendering engines supported');
    }

    if (supportedEngines.length === 1) {
      return supportedEngines[0] as 'canvas' | 'webgl';
    }

    // 여러 엔진이 지원되는 경우 벤치마크를 통해 선택
    const benchmarks = await Promise.all(
      supportedEngines.map(engine =>
        this.benchmarkEngine(engine as 'canvas' | 'webgl')
      )
    );

    // FPS가 높은 엔진 선택
    const bestEngine = benchmarks.reduce((best, current) =>
      current.estimatedFPS > best.estimatedFPS ? current : best
    );

    return bestEngine.engineType;
  }
}

/**
 * 렌더링 벤치마크 결과
 */
export interface RenderingBenchmarkResult {
  engineType: 'canvas' | 'webgl';
  totalTime: number;
  averageFrameTime: number;
  estimatedFPS: number;
  capabilities: any;
}

/**
 * 렌더링 설정 관리자
 */
export class RenderingConfigManager {
  private static readonly STORAGE_KEY = 'sudoku_rendering_config';

  /**
   * 렌더링 설정 저장
   */
  static saveConfig(config: RenderingConfig): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save rendering config:', error);
    }
  }

  /**
   * 렌더링 설정 로드
   */
  static loadConfig(): RenderingConfig | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn('Failed to load rendering config:', error);
      return null;
    }
  }

  /**
   * 기본 설정 생성
   */
  static createDefaultConfig(): RenderingConfig {
    return {
      engineType: 'canvas',
      enableVSync: true,
      maxFPS: 60,
      enableAntialiasing: true,
      textureQuality: 'high',
      enableEffects: true,
      effectQuality: 'medium'
    };
  }
}

/**
 * 렌더링 설정 인터페이스
 */
export interface RenderingConfig {
  engineType: 'canvas' | 'webgl';
  enableVSync: boolean;
  maxFPS: number;
  enableAntialiasing: boolean;
  textureQuality: 'low' | 'medium' | 'high';
  enableEffects: boolean;
  effectQuality: 'low' | 'medium' | 'high';
}