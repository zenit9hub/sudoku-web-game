import { I18nManager } from '../i18n/I18nManager';
import { Component } from './base/Component';

// Import all components
import { GameHeader, GameHeaderData } from './components/GameHeader';
import { GameCanvas, GameCanvasData } from './components/GameCanvas';
import { NumberPad, NumberPadData } from './components/NumberPad';
import { GameStats, GameStatsData } from './components/GameStats';
import { GameControls, GameControlsData } from './components/GameControls';

/**
 * Component registry type
 */
export type ComponentType = 'header' | 'canvas' | 'numberPad' | 'stats' | 'controls';

/**
 * Component data mapping
 */
export interface ComponentDataMap {
  header: GameHeaderData;
  canvas: GameCanvasData;
  numberPad: NumberPadData;
  stats: GameStatsData;
  controls: GameControlsData;
}

/**
 * Game layout structure
 */
export interface GameLayout {
  wrapper: {
    className: string;
  };
  container: {
    className: string;
    components: ComponentType[];
  };
}

/**
 * Template manager for handling all UI components
 * Provides centralized component creation and layout management
 */
export class TemplateManager {
  private i18n: I18nManager;
  private components: Map<ComponentType, Component> = new Map();

  constructor(i18n: I18nManager) {
    this.i18n = i18n;
  }

  /**
   * Create a component by type
   */
  createComponent<T extends ComponentType>(
    type: T,
    data?: ComponentDataMap[T],
    options?: any
  ): Component {
    let component: Component;

    switch (type) {
      case 'header':
        component = new GameHeader(data as GameHeaderData, options, this.i18n);
        break;
      case 'canvas':
        component = new GameCanvas(data as GameCanvasData, options, this.i18n);
        break;
      case 'numberPad':
        component = new NumberPad(data as NumberPadData, options, this.i18n);
        break;
      case 'stats':
        component = new GameStats(data as GameStatsData, options, this.i18n);
        break;
      case 'controls':
        component = new GameControls(data as GameControlsData, options, this.i18n);
        break;
      default:
        throw new Error(`Unknown component type: ${type}`);
    }

    this.components.set(type, component);
    return component;
  }

  /**
   * Get an existing component
   */
  getComponent(type: ComponentType): Component | undefined {
    return this.components.get(type);
  }

  /**
   * Render complete game layout
   */
  renderGameLayout(layout: GameLayout, componentData: Partial<ComponentDataMap> = {}): string {
    const components = layout.container.components
      .map(type => {
        const data = componentData[type];
        const component = this.createComponent(type, data);
        return component.render();
      })
      .join('\n');

    return `
      <div class="${layout.wrapper.className}">
        <div class="${layout.container.className}">
          ${components}
        </div>
      </div>
    `;
  }

  /**
   * Default game layout configuration
   */
  getDefaultLayout(): GameLayout {
    return {
      wrapper: {
        className: 'game-wrapper'
      },
      container: {
        className: 'game-container',
        components: ['header', 'canvas', 'numberPad', 'stats', 'controls']
      }
    };
  }

  /**
   * Render the complete game UI with default layout
   */
  renderGameUI(componentData: Partial<ComponentDataMap> = {}): string {
    const layout = this.getDefaultLayout();
    return this.renderGameLayout(layout, componentData);
  }

  /**
   * Update a specific component's data
   */
  updateComponent<T extends ComponentType>(
    type: T,
    newData: Partial<ComponentDataMap[T]>
  ): void {
    const component = this.components.get(type);
    if (component) {
      component.updateData(newData);
    }
  }

  /**
   * Re-render a specific component
   */
  reRenderComponent(type: ComponentType, target: HTMLElement): void {
    const component = this.components.get(type);
    if (component) {
      component.renderInto(target);
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): string {
    return this.i18n.getCurrentLocale();
  }

  /**
   * Change language and optionally re-render components
   */
  changeLanguage(locale: 'ko' | 'en'): void {
    this.i18n.setLocale(locale);

    // Re-create all components with new language
    const existingTypes = Array.from(this.components.keys());
    this.components.clear();

    existingTypes.forEach(type => {
      this.createComponent(type);
    });
  }

  /**
   * Clear all components
   */
  clearComponents(): void {
    this.components.clear();
  }
}