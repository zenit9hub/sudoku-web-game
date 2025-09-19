import { RenderingFactory, RenderingConfig, RenderingConfigManager } from './rendering/factories/RenderingFactory.js';
import { GameRenderer } from './rendering/interfaces/GameRenderer.js';
import { DOMEventManager } from './events/managers/DOMEventManager.js';
import { LocalStorageProvider } from './storage/providers/LocalStorageProvider.js';
import { StorageProvider } from './storage/interfaces/StorageProvider.js';
import { EventManager } from './events/interfaces/EventSystem.js';

/**
 * 인프라스트럭처 파사드
 *
 * 모든 인프라스트럭처 서비스를 통합하여 애플리케이션 레이어에
 * 깔끔한 인터페이스를 제공합니다.
 */
export class InfrastructureFacade {
  public readonly rendering: RenderingManager;
  public readonly events: EventManager;
  public readonly storage: StorageProvider;

  private constructor(
    rendering: RenderingManager,
    events: EventManager,
    storage: StorageProvider
  ) {
    this.rendering = rendering;
    this.events = events;
    this.storage = storage;
  }

  /**
   * 인프라스트럭처 파사드 생성
   */
  static async create(canvas: HTMLCanvasElement, config?: InfrastructureConfig): Promise<InfrastructureFacade> {
    const finalConfig = {
      ...InfrastructureFacade.getDefaultConfig(),
      ...config
    };

    // 렌더링 매니저 초기화
    const renderingManager = new RenderingManager();
    await renderingManager.initialize(canvas, finalConfig.rendering);

    // 이벤트 매니저 초기화
    const eventManager = new DOMEventManager(canvas);

    // 저장소 초기화
    const storageProvider = new LocalStorageProvider(finalConfig.storage.prefix);

    return new InfrastructureFacade(
      renderingManager,
      eventManager,
      storageProvider
    );
  }

  /**
   * 리소스 정리
   */
  async dispose(): Promise<void> {
    this.events.disable();
    await this.rendering.dispose();
  }

  /**
   * 인프라스트럭처 상태 점검
   */
  async healthCheck(): Promise<InfrastructureHealthStatus> {
    const renderingStatus = await this.rendering.getStatus();
    const storageStatus = await this.storage.isAvailable();

    return {
      rendering: {
        available: renderingStatus.initialized,
        engineType: renderingStatus.engineType,
        capabilities: renderingStatus.capabilities
      },
      events: {
        available: this.events.isEnabled(),
        activeListeners: this.getEventListenerCount()
      },
      storage: {
        available: storageStatus,
        type: this.storage.getType(),
        size: await this.storage.getSize()
      },
      overall: {
        healthy: renderingStatus.initialized && storageStatus && this.events.isEnabled()
      }
    };
  }

  private getEventListenerCount(): number {
    // DOM 이벤트 매니저의 리스너 수를 가져오는 메소드
    // 실제 구현에서는 DOMEventManager에 이 기능을 추가해야 함
    return 0;
  }

  private static getDefaultConfig(): InfrastructureConfig {
    return {
      rendering: RenderingConfigManager.createDefaultConfig(),
      storage: {
        prefix: 'sudoku_',
        enableEncryption: false,
        enableCompression: false
      },
      events: {
        enableGestures: true,
        enableKeyboard: true,
        enableMouse: true,
        enableTouch: true
      }
    };
  }
}

/**
 * 렌더링 매니저
 */
class RenderingManager {
  private gameRenderer?: GameRenderer;
  private renderingFactory: RenderingFactory;
  private config?: RenderingConfig;

  constructor() {
    this.renderingFactory = RenderingFactory.getInstance();
  }

  async initialize(canvas: HTMLCanvasElement, config: RenderingConfig): Promise<void> {
    this.config = config;

    // 최적의 렌더링 엔진 선택
    const engineType = config.engineType === 'canvas' ? 'canvas' :
                      config.engineType === 'webgl' ? 'webgl' :
                      await this.renderingFactory.selectOptimalEngine();

    // 게임 렌더러 생성
    this.gameRenderer = await this.renderingFactory.createRenderer(engineType);

    // 렌더링 엔진 초기화
    const engine = (this.gameRenderer as any).renderingEngine || (this.gameRenderer as any).engine;
    if (engine) {
      await engine.initialize(canvas);
      engine.resize({ width: canvas.clientWidth, height: canvas.clientHeight });
    }
  }

  getRenderer(): GameRenderer {
    if (!this.gameRenderer) {
      throw new Error('Rendering manager not initialized');
    }
    return this.gameRenderer;
  }

  async getStatus(): Promise<RenderingStatus> {
    if (!this.gameRenderer || !this.config) {
      return {
        initialized: false,
        engineType: 'unknown',
        capabilities: null
      };
    }

    return {
      initialized: true,
      engineType: this.config.engineType,
      capabilities: await this.getBenchmarkInfo()
    };
  }

  async dispose(): Promise<void> {
    // 렌더링 리소스 정리
    if (this.gameRenderer) {
      // GameRenderer에 dispose 메소드가 있다면 호출
      const engine = (this.gameRenderer as any).renderingEngine || (this.gameRenderer as any).engine;
      if (engine && engine.dispose) {
        engine.dispose();
      }
    }
  }

  private async getBenchmarkInfo(): Promise<any> {
    if (!this.config) return null;

    try {
      return await this.renderingFactory.benchmarkEngine(this.config.engineType);
    } catch (error) {
      console.warn('Failed to get benchmark info:', error);
      return null;
    }
  }
}

/**
 * 인프라스트럭처 설정 인터페이스
 */
export interface InfrastructureConfig {
  rendering: RenderingConfig;
  storage: {
    prefix: string;
    enableEncryption: boolean;
    enableCompression: boolean;
  };
  events: {
    enableGestures: boolean;
    enableKeyboard: boolean;
    enableMouse: boolean;
    enableTouch: boolean;
  };
}

/**
 * 인프라스트럭처 상태 인터페이스
 */
export interface InfrastructureHealthStatus {
  rendering: {
    available: boolean;
    engineType: string;
    capabilities: any;
  };
  events: {
    available: boolean;
    activeListeners: number;
  };
  storage: {
    available: boolean;
    type: string;
    size: number;
  };
  overall: {
    healthy: boolean;
  };
}

export interface RenderingStatus {
  initialized: boolean;
  engineType: string;
  capabilities: any;
}

/**
 * 인프라스트럭처 팩토리
 */
export class InfrastructureFactory {
  /**
   * 개발 환경용 인프라스트럭처 생성
   */
  static async createDevelopment(canvas: HTMLCanvasElement): Promise<InfrastructureFacade> {
    const config: InfrastructureConfig = {
      rendering: {
        engineType: 'canvas',
        enableVSync: false,
        maxFPS: 120,
        enableAntialiasing: true,
        textureQuality: 'high',
        enableEffects: true,
        effectQuality: 'high'
      },
      storage: {
        prefix: 'sudoku_dev_',
        enableEncryption: false,
        enableCompression: false
      },
      events: {
        enableGestures: true,
        enableKeyboard: true,
        enableMouse: true,
        enableTouch: true
      }
    };

    return InfrastructureFacade.create(canvas, config);
  }

  /**
   * 프로덕션 환경용 인프라스트럭처 생성
   */
  static async createProduction(canvas: HTMLCanvasElement): Promise<InfrastructureFacade> {
    const config: InfrastructureConfig = {
      rendering: {
        engineType: 'webgl',
        enableVSync: true,
        maxFPS: 60,
        enableAntialiasing: true,
        textureQuality: 'medium',
        enableEffects: true,
        effectQuality: 'medium'
      },
      storage: {
        prefix: 'sudoku_',
        enableEncryption: true,
        enableCompression: true
      },
      events: {
        enableGestures: true,
        enableKeyboard: true,
        enableMouse: true,
        enableTouch: true
      }
    };

    return InfrastructureFacade.create(canvas, config);
  }

  /**
   * 모바일 환경용 인프라스트럭처 생성
   */
  static async createMobile(canvas: HTMLCanvasElement): Promise<InfrastructureFacade> {
    const config: InfrastructureConfig = {
      rendering: {
        engineType: 'canvas', // 모바일에서는 호환성을 위해 Canvas 사용
        enableVSync: true,
        maxFPS: 30,
        enableAntialiasing: false, // 성능을 위해 비활성화
        textureQuality: 'low',
        enableEffects: true,
        effectQuality: 'low'
      },
      storage: {
        prefix: 'sudoku_mobile_',
        enableEncryption: false,
        enableCompression: true // 저장 공간 절약
      },
      events: {
        enableGestures: true,
        enableKeyboard: false,
        enableMouse: false,
        enableTouch: true
      }
    };

    return InfrastructureFacade.create(canvas, config);
  }
}