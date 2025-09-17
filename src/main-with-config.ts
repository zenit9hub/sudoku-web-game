import { GameService } from './application/services/GameService';
import { SudokuValidationService } from './domain/services/SudokuValidationService';
import { LocalStorageGameRepository } from './infrastructure/repositories/LocalStorageGameRepository';
import { CanvasGameRenderer } from './presentation/renderers/CanvasGameRenderer';
import { GameController } from './presentation/controllers/GameController';
import { SudokuGame } from './domain/models/SudokuGame';

// Import refactored manager classes
import { DOMElementManager } from './presentation/managers/DOMElementManager';
import { EventManager } from './presentation/managers/EventManager';
import { UIManager } from './presentation/managers/UIManager';
import { TimerManager } from './presentation/managers/TimerManager';

// Import centralized configuration system
import { configManager } from './config/ConfigManager';

// Import configuration
import { DOM_SELECTORS } from './presentation/config/DOMSelectors';
import { APP_CONFIG, getRuntimeConfig, getThemeColors } from './presentation/config/AppConfig';

/**
 * Enhanced Sudoku application with centralized configuration system
 * Now uses environment-aware configuration and theme management
 */
class SudokuApp {
  private gameController!: GameController;
  private domManager!: DOMElementManager;
  private eventManager!: EventManager;
  private uiManager!: UIManager;
  private timerManager!: TimerManager;
  private canvas!: HTMLCanvasElement;
  private renderer!: CanvasGameRenderer;

  constructor() {
    this.initializeConfiguration();
    this.initializeDependencies();
    this.setupManagers();
    this.setupCanvas();
    this.startNewGame();
  }

  /**
   * Initialize configuration systems
   */
  private initializeConfiguration(): void {
    // Configuration is automatically initialized by the configManager singleton

    // Log configuration in development
    if (configManager.isDevelopment()) {
      configManager.logCurrentState();
    }

    // Setup theme change listener
    configManager.getThemeManager().addThemeListener((theme) => {
      console.log(`🎨 Theme changed to: ${theme.name}`);
    });
  }

  /**
   * Initialize core dependencies using dependency injection
   */
  private initializeDependencies(): void {
    // Repository and services
    const gameRepository = new LocalStorageGameRepository();
    const validationService = new SudokuValidationService();
    const gameService = new GameService(gameRepository, validationService);

    // Canvas and renderer
    this.canvas = document.getElementById(DOM_SELECTORS.CANVAS) as HTMLCanvasElement;
    if (!this.canvas) {
      throw new Error('Canvas element not found');
    }
    this.renderer = new CanvasGameRenderer(this.canvas);

    // Game controller with callbacks
    this.gameController = new GameController(gameService, this.renderer, {
      onGameUpdate: (game) => this.handleGameUpdate(game),
      onGameComplete: (game) => this.handleGameComplete(game),
      onError: (error) => this.handleError(error)
    });
  }

  /**
   * Initialize and connect all manager classes
   */
  private setupManagers(): void {
    // DOM element manager
    this.domManager = new DOMElementManager();

    // Timer manager with UI update callback
    this.timerManager = new TimerManager((formattedTime) => {
      this.uiManager.updateTimer(formattedTime);
    });

    // UI manager
    this.uiManager = new UIManager(this.domManager);

    // Event manager (must be last as it depends on other managers)
    this.eventManager = new EventManager(this.gameController, this.domManager);
    this.eventManager.setupEventListeners();
  }

  /**
   * Setup responsive canvas behavior
   */
  private setupCanvas(): void {
    this.setupResponsiveCanvas();
  }

  /**
   * Start a new game with default difficulty
   */
  private async startNewGame(): Promise<void> {
    // Import Difficulty here to avoid circular dependencies
    const { Difficulty } = await import('./domain/models/GameState.js');
    await this.gameController.newGame(Difficulty.EASY);
  }

  /**
   * Handle game state updates
   */
  private handleGameUpdate(game: SudokuGame): void {
    this.uiManager.updateGameInfo(game);
    this.uiManager.updateSelectionInfo(game);
    this.timerManager.start(game);
  }

  /**
   * Handle game completion
   */
  private handleGameComplete(game: SudokuGame): void {
    // Stop timer and get final time
    this.timerManager.stop();
    const finalTime = this.timerManager.getFormattedElapsedTime();

    // Update UI with final stats
    this.uiManager.updateGameInfo(game, finalTime);
    this.uiManager.showGameComplete(game, finalTime);
  }

  /**
   * Handle errors
   */
  private handleError(error: string): void {
    const config = getRuntimeConfig();
    this.uiManager.showMessage(error, 'ERROR', config.FEATURES.STATISTICS_ENABLED ? APP_CONFIG.UI.MESSAGE_DURATION : 2000);
  }

  /**
   * Setup responsive canvas with proper scaling
   */
  private setupResponsiveCanvas(): void {
    const performanceConfig = configManager.getPerformanceConfig();

    const resizeGame = () => {
      const rect = this.canvas.getBoundingClientRect();
      const canvasSize = Math.min(rect.width, rect.height);
      const devicePixelRatio = window.devicePixelRatio || 1;
      const internalSize = Math.floor(canvasSize * devicePixelRatio);

      // Log performance information in development
      if (configManager.isFeatureEnabled('enablePerformanceLogging')) {
        console.log('🔧 Responsive canvas resize:', {
          cssSize: { width: rect.width, height: rect.height },
          canvasSize,
          devicePixelRatio,
          internalSize,
          targetFPS: performanceConfig.targetFPS,
          timestamp: new Date().toISOString()
        });
      }

      // Set canvas internal resolution
      this.canvas.width = internalSize;
      this.canvas.height = internalSize;

      // Notify renderer of size change
      this.renderer.resize(internalSize, internalSize);

      // Re-render current game
      const currentGame = this.gameController.getCurrentGame();
      if (currentGame) {
        this.renderer.render(currentGame, {
          highlightErrors: true,
          showPossibleValues: false,
          theme: 'light'
        });
      }
    };

    // Initial resize with delay for DOM to be ready
    setTimeout(resizeGame, APP_CONFIG.TIMER.INITIAL_DELAY);

    // Window resize events
    window.addEventListener('resize', () => {
      setTimeout(resizeGame, APP_CONFIG.TIMER.RESIZE_DELAY);
    });

    // Orientation change events (mobile)
    window.addEventListener('orientationchange', () => {
      setTimeout(resizeGame, APP_CONFIG.TIMER.ORIENTATION_CHANGE_DELAY);
    });
  }

  /**
   * Change application theme
   */
  changeTheme(themeName: string): void {
    configManager.switchTheme(themeName);
  }

  /**
   * Toggle debug mode (if available)
   */
  toggleDebugMode(): void {
    if (configManager.isDevelopment()) {
      const currentMode = configManager.isDebugEnabled();
      configManager.getEnvironmentManager().override({
        features: {
          ...configManager.getEnvironmentManager().getConfig().features,
          enableDebugMode: !currentMode
        }
      });
      console.log(`🔧 Debug mode ${!currentMode ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Export configuration for debugging
   */
  exportConfiguration(): any {
    return configManager.exportConfiguration();
  }

  /**
   * Clean up resources when app is destroyed
   */
  destroy(): void {
    this.eventManager.removeEventListeners();
    this.timerManager.destroy();
    this.domManager.clearCache();
  }

  /**
   * Get current configuration info
   */
  getConfigInfo(): any {
    const runtimeConfig = getRuntimeConfig();
    const themeColors = getThemeColors();

    return {
      environment: configManager.getEnvironment(),
      theme: configManager.getCurrentTheme(),
      version: configManager.getVersion(),
      features: runtimeConfig.FEATURES,
      performance: runtimeConfig.TIMING,
      colors: themeColors
    };
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new SudokuApp();

    // Add development tools if available
    if (configManager.isFeatureEnabled('enableThemeSwitcher')) {
      const addThemeSwitcher = () => {
        const switcherHTML = `
          <div style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
            <button id="theme-light" style="margin-right: 5px; padding: 5px 10px;">Light</button>
            <button id="theme-dark" style="margin-right: 5px; padding: 5px 10px;">Dark</button>
            ${configManager.isDevelopment() ? '<button id="debug-toggle" style="padding: 5px 10px;">Debug</button>' : ''}
          </div>
        `;

        document.body.insertAdjacentHTML('afterbegin', switcherHTML);

        document.getElementById('theme-light')?.addEventListener('click', () => {
          app.changeTheme('light');
        });

        document.getElementById('theme-dark')?.addEventListener('click', () => {
          app.changeTheme('dark');
        });

        if (configManager.isDevelopment()) {
          document.getElementById('debug-toggle')?.addEventListener('click', () => {
            app.toggleDebugMode();
          });
        }
      };

      addThemeSwitcher();
    }

    // Make app globally accessible for debugging
    if (configManager.isDevelopment()) {
      (window as any).sudokuApp = app;
      (window as any).configManager = configManager;

      // Log helpful debugging commands
      console.group('🛠️ Development Tools');
      console.log('Access app: window.sudokuApp');
      console.log('Access config: window.configManager');
      console.log('Get config info: sudokuApp.getConfigInfo()');
      console.log('Export config: sudokuApp.exportConfiguration()');
      console.groupEnd();
    }

  } catch (error) {
    console.error('❌ Failed to initialize Sudoku app:', error);

    // Show user-friendly error in production
    if (configManager.isProduction()) {
      document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center; padding: 20px;">
            <h2>🔧 Application Error</h2>
            <p>Sorry, the game could not be loaded. Please refresh the page.</p>
          </div>
        </div>
      `;
    }
  }
});