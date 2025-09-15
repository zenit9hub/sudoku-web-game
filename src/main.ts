import { GameService } from './application/services/GameService.js';
import { SudokuValidationService } from './domain/services/SudokuValidationService.js';
import { LocalStorageGameRepository } from './infrastructure/repositories/LocalStorageGameRepository.js';
import { CanvasGameRenderer } from './presentation/renderers/CanvasGameRenderer.js';
import { GameController } from './presentation/controllers/GameController.js';
import { SudokuGame } from './domain/models/SudokuGame.js';
import { Difficulty } from './domain/models/GameState.js';
import { Position } from './domain/models/Position.js';

class SudokuApp {
  private gameController: GameController;
  private timerInterval: number | null = null;

  constructor() {
    // Initialize dependencies
    const gameRepository = new LocalStorageGameRepository();
    const validationService = new SudokuValidationService();
    const gameService = new GameService(gameRepository, validationService);

    // Initialize canvas renderer
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }

    const renderer = new CanvasGameRenderer(canvas);

    // Initialize game controller
    this.gameController = new GameController(gameService, renderer, {
      onGameUpdate: (game) => this.handleGameUpdate(game),
      onGameComplete: (game) => this.handleGameComplete(game),
      onError: (error) => this.handleError(error)
    });

    this.setupEventListeners();
    this.startNewGame();
  }

  private setupEventListeners(): void {
    // Canvas click events
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      console.log('Canvas clicked at:', x, y);
      this.gameController.handleCellClick(x, y);
    });

    // Keyboard events
    document.addEventListener('keydown', (event) => {
      if (event.key >= '1' && event.key <= '9') {
        this.gameController.handleNumberInput(parseInt(event.key));
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        this.gameController.handleClearCell();
      }
    });

    // Button events
    const newGameBtn = document.getElementById('newGame');
    if (newGameBtn) {
      newGameBtn.addEventListener('click', () => this.startNewGame());
    }

    const resetBtn = document.getElementById('resetGame');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.gameController.handleReset());
    }

    const hintBtn = document.getElementById('hintButton');
    if (hintBtn) {
      hintBtn.addEventListener('click', () => this.gameController.handleHint());
    }

    // Number pad events
    const numberButtons = document.querySelectorAll('.number-btn');
    numberButtons.forEach(button => {
      button.addEventListener('click', (event) => {
        const target = event.target as HTMLButtonElement;
        const number = parseInt(target.dataset.number || '0');
        console.log('Number button clicked:', number);
        if (number >= 1 && number <= 9) {
          this.gameController.handleNumberInput(number);
        }
      });
    });

    const clearBtn = document.getElementById('clearCell');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.gameController.handleClearCell();
      });
    }
  }

  private async startNewGame(): Promise<void> {
    await this.gameController.newGame(Difficulty.EASY);
  }

  private handleGameUpdate(game: SudokuGame): void {
    this.updateGameInfo(game);
    this.updateSelectionInfo(game);
    this.startTimer(game);
  }

  private handleGameComplete(game: SudokuGame): void {
    this.updateGameInfo(game);
    this.stopTimer();
    
    setTimeout(() => {
      alert(`🎉 Congratulations! You completed the puzzle!\\n\\nTime: ${this.formatTime(game.state.statistics.elapsedTime)}\\nMoves: ${game.state.statistics.moves}\\nHints: ${game.state.statistics.hints}`);
    }, 100);
  }

  private handleError(error: string): void {
    console.error('Game Error:', error);
    // 사용자에게 에러 메시지 표시
    const selectionInfo = document.getElementById('selectionInfo');
    if (selectionInfo) {
      selectionInfo.textContent = error;
      selectionInfo.style.color = '#dc3545';
      
      // 3초 후 원래 메시지로 복구
      setTimeout(() => {
        if (this.gameController.getCurrentGame()) {
          this.updateSelectionInfo(this.gameController.getCurrentGame()!);
        }
      }, 3000);
    }
  }

  private updateGameInfo(game: SudokuGame): void {
    const movesElement = document.getElementById('moves');
    if (movesElement) {
      movesElement.textContent = game.state.statistics.moves.toString();
    }

    const hintsElement = document.getElementById('hints');
    if (hintsElement) {
      hintsElement.textContent = game.state.statistics.hints.toString();
    }

    const timerElement = document.getElementById('timer');
    if (timerElement) {
      timerElement.textContent = this.formatTime(game.state.statistics.elapsedTime);
    }
  }

  private startTimer(game: SudokuGame): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    const startTime = game.state.statistics.startTime.getTime();
    
    this.timerInterval = window.setInterval(() => {
      const currentTime = new Date().getTime();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      
      const timerElement = document.getElementById('timer');
      if (timerElement) {
        timerElement.textContent = this.formatTime(elapsedSeconds);
      }
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private updateSelectionInfo(game: SudokuGame): void {
    const selectionInfoElement = document.getElementById('selectionInfo');
    if (!selectionInfoElement) return;

    if (game.state.selectedCell) {
      const { row, col } = game.state.selectedCell;
      const cell = game.grid.getCell(new Position(row, col));
      
      if (cell.isGiven) {
        selectionInfoElement.textContent = `선택: (${row + 1}, ${col + 1}) - 고정된 숫자입니다`;
        selectionInfoElement.style.color = '#6c757d';
      } else if (!cell.isEmpty()) {
        selectionInfoElement.textContent = `선택: (${row + 1}, ${col + 1}) - 현재 값: ${cell.value.toString()}`;
        selectionInfoElement.style.color = '#007bff';
      } else {
        selectionInfoElement.textContent = `선택: (${row + 1}, ${col + 1}) - 숫자를 입력하세요`;
        selectionInfoElement.style.color = '#28a745';
      }
    } else {
      selectionInfoElement.textContent = '칸을 선택하고 숫자를 입력하세요';
      selectionInfoElement.style.color = '#666';
    }
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    new SudokuApp();
  } catch (error) {
    console.error('Failed to initialize Sudoku app:', error);
  }
});