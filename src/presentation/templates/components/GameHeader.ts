import { Component, ComponentData, ComponentOptions } from '../base/Component';
import { I18nManager } from '../../i18n/I18nManager';

/**
 * Data interface for GameHeader component
 */
export interface GameHeaderData extends ComponentData {
  title?: string;
}

/**
 * Game header component
 * Renders the main game title
 */
export class GameHeader extends Component<GameHeaderData> {
  constructor(
    data: GameHeaderData = {},
    options: ComponentOptions = {},
    i18n: I18nManager
  ) {
    super(data, { className: 'game-header', ...options }, i18n);
  }

  render(): string {
    const title = this.data.title || this.t('game.title');

    return `
      <div ${this.generateAttributes()}>
        <h1>${title}</h1>
      </div>
    `;
  }
}