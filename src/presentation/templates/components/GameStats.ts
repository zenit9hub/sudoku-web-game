import { Component, ComponentData, ComponentOptions } from '../base/Component';
import { I18nManager } from '../../i18n/I18nManager';
import { DOM_SELECTORS } from '../../config/DOMSelectors';

/**
 * Data interface for GameStats component
 */
export interface GameStatsData extends ComponentData {
  timeLabel?: string;
  progressLabel?: string;
  hintsLabel?: string;
  initialTime?: string;
  initialProgress?: string;
  initialHints?: string;
}

/**
 * Game statistics component
 * Renders time, progress, and hints information
 */
export class GameStats extends Component<GameStatsData> {
  constructor(
    data: GameStatsData = {},
    options: ComponentOptions = {},
    i18n: I18nManager
  ) {
    super(data, { className: 'game-stats', ...options }, i18n);
  }

  render(): string {
    const timeLabel = this.data.timeLabel || this.t('stats.time');
    const progressLabel = this.data.progressLabel || this.t('stats.progress');
    const hintsLabel = this.data.hintsLabel || this.t('stats.hints');

    const initialTime = this.data.initialTime || '00:00';
    const initialProgress = this.data.initialProgress || '0/81';
    const initialHints = this.data.initialHints || '0';

    return `
      <div ${this.generateAttributes()}>
        <div class="stats-row">
          ${this.renderStatItem(timeLabel, DOM_SELECTORS.TIMER, initialTime)}
          ${this.renderStatItem(progressLabel, DOM_SELECTORS.COMPLETION, initialProgress)}
          ${this.renderStatItem(hintsLabel, DOM_SELECTORS.HINTS, initialHints)}
        </div>
      </div>
    `;
  }

  private renderStatItem(label: string, valueId: string, initialValue: string): string {
    return `
      <div class="info-item">
        <div class="info-label">${label}</div>
        <div id="${valueId}" class="info-value">${initialValue}</div>
      </div>
    `;
  }
}