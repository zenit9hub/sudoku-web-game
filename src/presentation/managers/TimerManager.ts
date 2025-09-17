import { SudokuGame } from '@/domain/models/SudokuGame';
import { formatTime } from '../../utils/index';

/**
 * Manages game timer functionality
 * Uses requestAnimationFrame for smoother, independent timer updates
 */
export class TimerManager {
  private animationFrameId: number | null = null;
  private startTime: Date | null = null;
  private lastDisplayedSeconds: number = -1;

  constructor(private onTimeUpdate: (formattedTime: string) => void) {}

  /**
   * Start the timer for a game
   */
  start(game: SudokuGame): void {
    // Don't restart if already running with the same start time
    if (this.isRunning() && this.startTime &&
        this.startTime.getTime() === game.state.statistics.startTime.getTime()) {
      return;
    }

    this.stop(); // Clear any existing timer
    this.startTime = game.state.statistics.startTime;
    this.lastDisplayedSeconds = -1;
    this.tick();
  }

  /**
   * Stop the timer
   */
  stop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Timer tick using requestAnimationFrame for smooth updates
   */
  private tick = (): void => {
    const elapsedSeconds = this.getElapsedSeconds();

    // Only update UI when seconds actually change to avoid unnecessary updates
    if (elapsedSeconds !== this.lastDisplayedSeconds) {
      const formattedTime = formatTime(elapsedSeconds);
      this.onTimeUpdate(formattedTime);
      this.lastDisplayedSeconds = elapsedSeconds;
    }

    // Continue the timer loop
    this.animationFrameId = requestAnimationFrame(this.tick);
  };

  /**
   * Get current elapsed seconds
   */
  getElapsedSeconds(): number {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }

  /**
   * Get formatted elapsed time string
   */
  getFormattedElapsedTime(): string {
    return formatTime(this.getElapsedSeconds());
  }

  /**
   * Check if timer is currently running
   */
  isRunning(): boolean {
    return this.animationFrameId !== null;
  }

  /**
   * Clean up timer resources
   * Should be called when TimerManager is no longer needed
   */
  destroy(): void {
    this.stop();
    this.startTime = null;
  }

  /**
   * Reset timer state without starting
   */
  reset(): void {
    this.stop();
    this.startTime = null;
    this.lastDisplayedSeconds = -1;
    this.onTimeUpdate(formatTime(0));
  }
}