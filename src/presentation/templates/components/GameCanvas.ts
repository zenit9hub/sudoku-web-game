import { Component, ComponentData, ComponentOptions } from '../base/Component';
import { I18nManager } from '../../i18n/I18nManager';
import { DOM_SELECTORS } from '../../config/DOMSelectors';

/**
 * Data interface for GameCanvas component
 */
export interface GameCanvasData extends ComponentData {
  // Canvas doesn't need dynamic data as it's managed by the renderer
}

/**
 * Game canvas component
 * Renders the main game canvas area
 */
export class GameCanvas extends Component<GameCanvasData> {
  constructor(
    data: GameCanvasData = {},
    options: ComponentOptions = {},
    i18n: I18nManager
  ) {
    super(data, { className: 'game-main', ...options }, i18n);
  }

  render(): string {
    return `
      <div ${this.generateAttributes()}>
        <canvas id="${DOM_SELECTORS.CANVAS}"></canvas>
      </div>
    `;
  }
}