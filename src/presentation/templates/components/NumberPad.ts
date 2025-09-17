import { Component, ComponentData, ComponentOptions } from '../base/Component';
import { I18nManager } from '../../i18n/I18nManager';
import { DOM_SELECTORS } from '../../config/DOMSelectors';

/**
 * Data interface for NumberPad component
 */
export interface NumberPadData extends ComponentData {
  title?: string;
  clearButtonText?: string;
  selectionMessage?: string;
}

/**
 * Number input pad component
 * Renders the number input interface
 */
export class NumberPad extends Component<NumberPadData> {
  constructor(
    data: NumberPadData = {},
    options: ComponentOptions = {},
    i18n: I18nManager
  ) {
    super(data, { className: 'game-input', ...options }, i18n);
  }

  render(): string {
    const title = this.data.title || this.t('game.numberInput');
    const clearText = this.data.clearButtonText || this.t('game.clear');
    const selectionMessage = this.data.selectionMessage || this.t('messages.selectCell');

    return `
      <div ${this.generateAttributes()}>
        <div class="number-pad-title">${title}</div>
        <div class="number-grid">
          ${this.renderNumberButtons()}
        </div>
        <button id="${DOM_SELECTORS.CLEAR_CELL_BTN}" class="clear-btn">${clearText}</button>
        <div id="${DOM_SELECTORS.SELECTION_INFO}" class="selection-info">${selectionMessage}</div>
      </div>
    `;
  }

  private renderNumberButtons(): string {
    const numbers = Array.from({ length: 9 }, (_, i) => i + 1);

    return numbers
      .map(number =>
        `<button class="number-btn" data-number="${number}">${number}</button>`
      )
      .join('');
  }
}