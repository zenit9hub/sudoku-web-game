import { GameService } from './application/services/GameService';
import { SudokuValidationService } from './domain/services/SudokuValidationService';
import { LocalStorageGameRepository } from './infrastructure/repositories/LocalStorageGameRepository';
import { CanvasGameRenderer } from './presentation/renderers/CanvasGameRenderer';
import { GameController } from './presentation/controllers/GameController';
import { SudokuGame } from './domain/models/SudokuGame';
import { Difficulty } from './domain/models/GameState';
import { Position } from './domain/models/Position';

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
    this.setupResponsiveCanvas(canvas, renderer);
    this.startNewGame();
  }

  private setupEventListeners(): void {
    this.setupCanvasEvents();
    this.setupKeyboardEvents();
    this.setupButtonEvents();
  }

  private setupCanvasEvents(): void {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    canvas.addEventListener('click', (event) => {
      const rect = canvas.getBoundingClientRect();

      // 캔버스 내 실제 좌표 계산 (CSS 스케일링 자동 고려됨)
      const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

      console.log('Click event:', {
        clientX: event.clientX,
        clientY: event.clientY,
        rect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        canvas: { width: canvas.width, height: canvas.height },
        calculated: { x, y }
      });

      this.gameController.handleCellClick(x, y);
    });
  }

  private setupKeyboardEvents(): void {
    document.addEventListener('keydown', (event) => {
      if (event.key >= '1' && event.key <= '9') {
        this.gameController.handleNumberInput(parseInt(event.key));
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        this.gameController.handleClearCell();
      }
    });
  }

  private setupButtonEvents(): void {
    const buttons = {
      newGame: () => this.startNewGame(),
      resetGame: () => this.gameController.handleReset(),
      hintButton: () => this.gameController.handleHint(),
      clearCell: () => this.gameController.handleClearCell()
    };

    Object.entries(buttons).forEach(([id, handler]) => {
      const button = document.getElementById(id);
      if (button) button.addEventListener('click', handler);
    });

    // Number pad events
    document.querySelectorAll('.number-btn').forEach(button => {
      button.addEventListener('click', (event) => {
        const target = event.target as HTMLButtonElement;
        const number = parseInt(target.dataset.number || '0');
        if (number >= 1 && number <= 9) {
          this.gameController.handleNumberInput(number);
        }
      });
    });
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
    // 타이머를 먼저 정지하고 최종 시간을 업데이트
    this.stopTimer();

    // 최종 경과 시간 계산
    const finalElapsedTime = Math.floor((new Date().getTime() - game.state.statistics.startTime.getTime()) / 1000);

    // 최종 시간으로 화면 업데이트
    const timerElement = document.getElementById('timer');
    if (timerElement) {
      timerElement.textContent = this.formatTime(finalElapsedTime);
    }

    // 다른 통계 정보 업데이트
    this.updateGameInfo(game);

    setTimeout(() => {
      const stats = game.state.statistics;
      alert(`🎉 축하합니다! 퍼즐을 완성했습니다!\n\n⏱️ 시간: ${this.formatTime(finalElapsedTime)}\n🎯 이동: ${stats.moves}회\n💡 힌트: ${stats.hints}회`);
    }, 100);
  }

  private handleError(error: string): void {
    this.showMessage(error, '#dc3545', 3000);
  }

  private showMessage(message: string, color: string = '#666', duration: number = 0): void {
    const selectionInfo = document.getElementById('selectionInfo');
    if (!selectionInfo) return;

    selectionInfo.textContent = message;
    selectionInfo.style.color = color;

    if (duration > 0) {
      setTimeout(() => {
        const currentGame = this.gameController.getCurrentGame();
        if (currentGame) {
          this.updateSelectionInfo(currentGame);
        }
      }, duration);
    }
  }

  private updateGameInfo(game: SudokuGame): void {
    const stats = game.state.statistics;

    // 실시간 경과 시간 계산 (타이머와 동일한 방식)
    const currentTime = new Date().getTime();
    const startTime = stats.startTime.getTime();
    const realTimeElapsed = Math.floor((currentTime - startTime) / 1000);

    // 완성도 계산 (채워진 셀 / 전체 셀)
    const filledCells = this.getFilledCellsCount(game);
    const totalCells = 81;

    const updates = {
      completion: `${filledCells}/${totalCells}`,
      hints: stats.hints.toString(),
      timer: this.formatTime(realTimeElapsed)
    };

    Object.entries(updates).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  }

  private getFilledCellsCount(game: SudokuGame): number {
    let count = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const position = new Position(row, col);
        const cell = game.grid.getCell(position);
        if (!cell.isEmpty()) {
          count++;
        }
      }
    }
    return count;
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

  private setupResponsiveCanvas(canvas: HTMLCanvasElement, renderer: any): void {
    const resizeGame = () => {
      // CSS에서 계산된 실제 캔버스 크기 가져오기
      const rect = canvas.getBoundingClientRect();
      const canvasSize = Math.min(rect.width, rect.height);

      // Canvas의 내부 해상도를 CSS 크기에 맞춤 (고해상도 지원)
      const devicePixelRatio = window.devicePixelRatio || 1;
      const internalSize = Math.floor(canvasSize * devicePixelRatio);

      console.log('Responsive canvas resize:', {
        cssSize: { width: rect.width, height: rect.height },
        canvasSize,
        devicePixelRatio,
        internalSize,
        timestamp: new Date().toISOString()
      });

      // Canvas 내부 해상도 설정
      canvas.width = internalSize;
      canvas.height = internalSize;

      // Canvas CSS 크기는 이미 CSS에서 설정됨

      // 렌더러에게 실제 캔버스 크기 알림
      renderer.resize(internalSize, internalSize);

      // 게임 재렌더링
      const currentGame = this.gameController.getCurrentGame();
      if (currentGame) {
        renderer.render(currentGame, {
          highlightErrors: true,
          showPossibleValues: false,
          theme: 'light'
        });
      }
    };

    // 초기 리사이즈 (DOM 로드 후 실행)
    setTimeout(resizeGame, 200);

    // 윈도우 리사이즈 이벤트
    window.addEventListener('resize', () => {
      setTimeout(resizeGame, 100);
    });

    // 방향 변경 이벤트 (모바일)
    window.addEventListener('orientationchange', () => {
      setTimeout(resizeGame, 300);
    });
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