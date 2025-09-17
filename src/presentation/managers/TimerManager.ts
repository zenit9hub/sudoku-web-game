import { SudokuGame } from '@/domain/models/SudokuGame';
import { APP_CONFIG } from '../config/AppConfig';

/**
 * Manages game timer functionality
 * Uses requestAnimationFrame for smoother, independent timer updates
 */
export class TimerManager {
  private animationFrameId: number | null = null;
  private startTime: Date | null = null;
  private lastUpdateTime: number = 0;
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
    this.lastUpdateTime = performance.now();
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
    const now = performance.now();
    const elapsedSeconds = this.getElapsedSeconds();

    // Only update UI when seconds actually change to avoid unnecessary updates
    if (elapsedSeconds !== this.lastDisplayedSeconds) {
      const formattedTime = this.formatTime(elapsedSeconds);
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
    this.onTimeUpdate(this.formatTime(0));
  }
}