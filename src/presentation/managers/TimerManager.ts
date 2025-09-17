import { SudokuGame } from '@/domain/models/SudokuGame';
import { APP_CONFIG } from '../config/AppConfig';

/**
 * Manages game timer functionality
 * Handles timer lifecycle, time calculation, and formatting
 */
export class TimerManager {
  private intervalId: number | null = null;
  private startTime: Date | null = null;

  constructor(private onTimeUpdate: (formattedTime: string) => void) {}

  /**
   * Start the timer for a game
   */
  start(game: SudokuGame): void {
    this.stop(); // Clear any existing timer
    this.startTime = game.state.statistics.startTime;

    this.intervalId = window.setInterval(() => {
      const elapsedSeconds = this.getElapsedSeconds();
      const formattedTime = this.formatTime(elapsedSeconds);
      this.onTimeUpdate(formattedTime);
    }, APP_CONFIG.TIMER.UPDATE_INTERVAL);
  }

  /**
   * Stop the timer
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

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
    return this.formatTime(this.getElapsedSeconds());
  }

  /**
   * Format seconds into MM:SS format
   */
  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * Check if timer is currently running
   */
  isRunning(): boolean {
    return this.intervalId !== null;
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
    this.onTimeUpdate(this.formatTime(0));
  }
}