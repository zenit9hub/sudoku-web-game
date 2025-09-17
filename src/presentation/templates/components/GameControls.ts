import { Component, ComponentData, ComponentOptions } from '../base/Component';
import { I18nManager } from '../../i18n/I18nManager';
import { DOM_SELECTORS } from '../../config/DOMSelectors';

/**
 * Data interface for GameControls component
 */
export interface GameControlsData extends ComponentData {
  newGameText?: string;
  resetText?: string;
  hintText?: string;
}

/**
 * Game controls component
 * Renders the main action buttons (New Game, Reset, Hint)
 */
export class GameControls extends Component<GameControlsData> {
  constructor(
    data: GameControlsData = {},
    options: ComponentOptions = {},
    i18n: I18nManager
  ) {
    super(data, { className: 'game-controls', ...options }, i18n);
  }

  render(): string {
    const newGameText = this.data.newGameText || this.t('game.newGame');
    const resetText = this.data.resetText || this.t('game.reset');
    const hintText = this.data.hintText || this.t('game.hint');

    return `
      <div ${this.generateAttributes()}>
        ${this.renderButton(DOM_SELECTORS.NEW_GAME_BTN, newGameText, 'btn-primary')}
        ${this.renderButton(DOM_SELECTORS.RESET_GAME_BTN, resetText, 'btn-secondary')}
        ${this.renderButton(DOM_SELECTORS.HINT_BTN, hintText, 'btn-secondary')}
      </div>
    `;
  }

  private renderButton(id: string, text: string, buttonClass: string): string {
    return `<button id="${id}" class="btn ${buttonClass}">${text}</button>`;
  }
}