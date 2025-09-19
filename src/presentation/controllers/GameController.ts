import { GameService } from '../../application/services/GameService';
import { GameRenderer } from '../../infrastructure/rendering/GameRenderer';
import { SudokuGame } from '../../domain/sudoku/aggregates/Game';
import { Position } from '../../domain/sudoku/value-objects/Position';
import { CellValue } from '../../domain/sudoku/value-objects/CellValue';
import { Difficulty } from '../../domain/sudoku/entities/GameState';
import { LineCompletionEffect } from '../../domain/effects/entities/LineCompletionEffect';
import { CanvasGameRenderer } from '../renderers/CanvasGameRenderer';

export interface GameControllerEvents {
  onGameUpdate: (game: SudokuGame) => void;
  onGameComplete: (game: SudokuGame) => void;
  onError: (error: string) => void;
}

export class GameController {
  private currentGame: SudokuGame | null = null;
  private animationFrameId: number | null = null;

  constructor(
    private gameService: GameService,
    private renderer: GameRenderer,
    private events: GameControllerEvents
  ) {}

  async newGame(difficulty: Difficulty): Promise<void> {
    try {
      this.currentGame = await this.gameService.createNewGame(difficulty);
      this.renderGame();
      this.events.onGameUpdate(this.currentGame);
    } catch (error) {
      this.events.onError(`Failed to create new game: ${error}`);
    }
  }

  async loadGame(gameId: string): Promise<void> {
    try {
      const game = await this.gameService.loadGame(gameId);
      if (game) {
        this.currentGame = game;
        this.renderGame();
        this.events.onGameUpdate(this.currentGame);
      } else {
        this.events.onError('Game not found');
      }
    } catch (error) {
      this.events.onError(`Failed to load game: ${error}`);
    }
  }

  async handleCellClick(x: number, y: number): Promise<void> {
    console.log('GameController.handleCellClick called with:', x, y);
    
    if (!this.currentGame) {
      console.log('No current game');
      return;
    }

    const position = this.renderer.getPositionFromCoords(x, y);
    console.log('Position from coords:', position);
    
    if (!position) {
      console.log('Invalid position');
      return;
    }

    try {
      this.currentGame = await this.gameService.selectCell(this.currentGame, position);
      console.log('Cell selected successfully, selected cell:', this.currentGame.state.selectedCell);
      this.renderGame();
      this.events.onGameUpdate(this.currentGame);
    } catch (error) {
      console.error('Error selecting cell:', error);
      this.events.onError(`셀 선택에 실패했습니다: ${error}`);
    }
  }

  async handleNumberInput(value: number): Promise<void> {
    if (!this.currentGame?.state.selectedCell) {
      this.events.onError('셀을 먼저 선택해주세요');
      return;
    }

    try {
      const { row, col } = this.currentGame.state.selectedCell;
      const result = await this.gameService.makeMove(
        this.currentGame, 
        new Position(row, col), 
        CellValue.from(value)
      );

      this.currentGame = result.game;

      // Handle line completion effects
      if (result.lineCompletionEffects && result.lineCompletionEffects.length > 0) {
        this.handleLineCompletionEffects(result.lineCompletionEffects);
      } else {
        this.renderGame();
      }

      this.events.onGameUpdate(this.currentGame);

      // 게임 완료 체크 로깅 추가
      console.log('Game completion check:', {
        isComplete: result.isComplete,
        success: result.success,
        filledCells: this.getFilledCellsCount(),
        totalCells: 81
      });

      if (result.isComplete) {
        console.log('🎉 Game completed! Calling onGameComplete...');
        this.events.onGameComplete(this.currentGame);
      } else if (!result.success) {
        this.events.onError('잘못된 입력입니다');
      }
    } catch (error) {
      this.events.onError(`Failed to make move: ${error}`);
    }
  }

  async handleClearCell(): Promise<void> {
    if (!this.currentGame) return;

    if (!this.currentGame.state.selectedCell) {
      this.events.onError('셀을 먼저 선택해주세요');
      return;
    }

    try {
      const { row, col } = this.currentGame.state.selectedCell;
      const position = new Position(row, col);
      
      const result = await this.gameService.makeMove(
        this.currentGame, 
        position, 
        CellValue.empty()
      );

      this.currentGame = result.game;

      // Handle line completion effects from clear action
      if (result.lineCompletionEffects && result.lineCompletionEffects.length > 0) {
        this.handleLineCompletionEffects(result.lineCompletionEffects);
      } else {
        this.renderGame();
      }

      this.events.onGameUpdate(this.currentGame);
    } catch (error) {
      this.events.onError(`Failed to clear cell: ${error}`);
    }
  }

  async handleHint(): Promise<void> {
    if (!this.currentGame) return;

    try {
      const hint = await this.gameService.getHint(this.currentGame);
      if (hint) {
        // hint.game에는 이미 힌트 카운트가 증가된 상태
        this.currentGame = hint.game;
        
        // Auto-fill the hint
        const result = await this.gameService.makeMove(
          this.currentGame,
          hint.position,
          hint.value
        );

        this.currentGame = result.game;

        // Handle line completion effects from hint
        if (result.lineCompletionEffects && result.lineCompletionEffects.length > 0) {
          this.handleLineCompletionEffects(result.lineCompletionEffects);
        } else {
          this.renderGame();
        }

        this.events.onGameUpdate(this.currentGame);

        if (result.isComplete) {
          this.events.onGameComplete(this.currentGame);
        }
      } else {
        this.events.onError('No hints available');
      }
    } catch (error) {
      this.events.onError(`Failed to get hint: ${error}`);
    }
  }

  async handleReset(): Promise<void> {
    if (!this.currentGame) return;

    try {
      this.currentGame = await this.gameService.resetGame(this.currentGame);
      this.renderGame();
      this.events.onGameUpdate(this.currentGame);
    } catch (error) {
      this.events.onError(`Failed to reset game: ${error}`);
    }
  }

  async handlePause(): Promise<void> {
    if (!this.currentGame) return;

    try {
      this.currentGame = await this.gameService.pauseGame(this.currentGame);
      this.renderGame();
      this.events.onGameUpdate(this.currentGame);
    } catch (error) {
      this.events.onError(`Failed to pause game: ${error}`);
    }
  }

  async handleResume(): Promise<void> {
    if (!this.currentGame) return;

    try {
      this.currentGame = await this.gameService.resumeGame(this.currentGame);
      this.renderGame();
      this.events.onGameUpdate(this.currentGame);
    } catch (error) {
      this.events.onError(`Failed to resume game: ${error}`);
    }
  }

  getCurrentGame(): SudokuGame | null {
    return this.currentGame;
  }

  private getFilledCellsCount(): number {
    if (!this.currentGame) return 0;

    let count = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const position = new Position(row, col);
        const cell = this.currentGame.grid.getCell(position);
        if (!cell.isEmpty()) {
          count++;
        }
      }
    }
    return count;
  }

  private renderGame(): void {
    if (this.currentGame) {
      this.renderer.render(this.currentGame, {
        highlightErrors: true,
        showPossibleValues: false,
        theme: 'light'
      });
    }
  }

  private handleLineCompletionEffects(effects: LineCompletionEffect[]): void {
    if (this.renderer instanceof CanvasGameRenderer) {
      this.renderer.addEffects(effects);
      this.startEffectAnimation();
    } else {
      // Fallback for non-canvas renderers
      this.renderGame();
    }
  }

  private startEffectAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    let lastFrameTime = 0;
    const targetFPS = 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (currentTime: number) => {
      // Throttle to 60fps for better performance
      if (currentTime - lastFrameTime >= frameInterval) {
        this.renderGame();
        lastFrameTime = currentTime;
      }

      if (this.renderer instanceof CanvasGameRenderer && this.renderer.hasActiveEffects()) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}