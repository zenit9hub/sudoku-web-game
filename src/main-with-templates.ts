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

// Import template system
import { TemplateManager } from './presentation/templates/TemplateManager';
import { I18nManager } from './presentation/i18n/I18nManager';

// Import configuration
import { DOM_SELECTORS } from './presentation/config/DOMSelectors';
import { APP_CONFIG } from './presentation/config/AppConfig';

/**
 * Enhanced Sudoku application with template system
 * Now uses component-based HTML rendering and internationalization
 */
class SudokuApp {
  private gameController!: GameController;
  private domManager!: DOMElementManager;
  private eventManager!: EventManager;
  private uiManager!: UIManager;
  private timerManager!: TimerManager;
  private templateManager!: TemplateManager;
  private i18nManager!: I18nManager;
  private canvas!: HTMLCanvasElement;
  private renderer!: CanvasGameRenderer;

  constructor() {
    this.initializeI18n();
    this.initializeTemplates();
    this.renderUI();
    this.initializeDependencies();
    this.setupManagers();
    this.setupCanvas();
    this.startNewGame();
  }

  /**
   * Initialize internationalization system
   */
  private initializeI18n(): void {
    this.i18nManager = new I18nManager();
    this.i18nManager.initialize(); // Auto-detect language
  }

  /**
   * Initialize template system
   */
  private initializeTemplates(): void {
    this.templateManager = new TemplateManager(this.i18nManager);
  }

  /**
   * Render the complete UI using template system
   */
  private renderUI(): void {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      throw new Error('App container not found');
    }

    // Render the complete game UI
    const gameHTML = this.templateManager.renderGameUI();
    appContainer.innerHTML = gameHTML;
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
    this.uiManager.showMessage(error, 'ERROR', APP_CONFIG.UI.MESSAGE_DURATION);
  }

  /**
   * Setup responsive canvas with proper scaling
   */
  private setupResponsiveCanvas(): void {
    const resizeGame = () => {
      const rect = this.canvas.getBoundingClientRect();
      const canvasSize = Math.min(rect.width, rect.height);
      const devicePixelRatio = window.devicePixelRatio || 1;
      const internalSize = Math.floor(canvasSize * devicePixelRatio);

      console.log('Responsive canvas resize:', {
        cssSize: { width: rect.width, height: rect.height },
        canvasSize,
        devicePixelRatio,
        internalSize,
        timestamp: new Date().toISOString()
      });

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
   * Change application language
   */
  changeLanguage(locale: 'ko' | 'en'): void {
    this.templateManager.changeLanguage(locale);
    this.renderUI();

    // Re-initialize managers after UI re-render
    this.domManager.clearCache();
    this.eventManager.removeEventListeners();
    this.setupManagers();

    // Re-setup canvas
    this.canvas = document.getElementById(DOM_SELECTORS.CANVAS) as HTMLCanvasElement;
    this.renderer = new CanvasGameRenderer(this.canvas);
    this.setupCanvas();

    // Re-render current game if exists
    const currentGame = this.gameController.getCurrentGame();
    if (currentGame) {
      this.handleGameUpdate(currentGame);
    }
  }

  /**
   * Clean up resources when app is destroyed
   */
  destroy(): void {
    this.eventManager.removeEventListeners();
    this.timerManager.destroy();
    this.domManager.clearCache();
    this.templateManager.clearComponents();
  }

  /**
   * Get current language for external access
   */
  getCurrentLanguage(): string {
    return this.templateManager.getCurrentLanguage();
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    const app = new SudokuApp();

    // Add language switcher for demo purposes
    const addLanguageSwitcher = () => {
      const switcherHTML = `
        <div style="position: fixed; top: 10px; right: 10px; z-index: 1000;">
          <button id="lang-ko" style="margin-right: 5px; padding: 5px 10px;">한국어</button>
          <button id="lang-en" style="padding: 5px 10px;">English</button>
        </div>
      `;

      document.body.insertAdjacentHTML('afterbegin', switcherHTML);

      document.getElementById('lang-ko')?.addEventListener('click', () => {
        app.changeLanguage('ko');
      });

      document.getElementById('lang-en')?.addEventListener('click', () => {
        app.changeLanguage('en');
      });
    };

    addLanguageSwitcher();

    // Make app globally accessible for debugging
    (window as any).sudokuApp = app;

  } catch (error) {
    console.error('Failed to initialize Sudoku app:', error);
  }
});