import { I18nManager } from '../../i18n/I18nManager';

/**
 * Base interface for component data
 */
export interface ComponentData {
  [key: string]: any;
}

/**
 * Component configuration options
 */
export interface ComponentOptions {
  className?: string;
  id?: string;
  attributes?: Record<string, string>;
}

/**
 * Base component class for all UI components
 * Provides common functionality for templating and rendering
 */
export abstract class Component<T extends ComponentData = ComponentData> {
  protected i18n: I18nManager;
  protected data: T;
  protected options: ComponentOptions;

  constructor(
    data: T,
    options: ComponentOptions = {},
    i18n: I18nManager
  ) {
    this.data = data;
    this.options = options;
    this.i18n = i18n;
  }

  /**
   * Abstract method to render the component HTML
   */
  abstract render(): string;

  /**
   * Update component data and re-render if needed
   */
  updateData(newData: Partial<T>): void {
    this.data = { ...this.data, ...newData };
  }

  /**
   * Get current component data
   */
  getData(): T {
    return this.data;
  }

  /**
   * Generate attributes string for HTML elements
   */
  protected generateAttributes(additionalAttrs: Record<string, string> = {}): string {
    const allAttrs = { ...this.options.attributes, ...additionalAttrs };

    if (this.options.id) {
      allAttrs.id = this.options.id;
    }

    if (this.options.className) {
      allAttrs.class = this.options.className;
    }

    return Object.entries(allAttrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
  }

  /**
   * Helper method for translation
   */
  protected t(key: string, params?: any): string {
    return this.i18n.t(key, params);
  }

  /**
   * Create a DOM element from the rendered HTML
   */
  createElement(): HTMLElement {
    const template = document.createElement('template');
    template.innerHTML = this.render().trim();
    return template.content.firstElementChild as HTMLElement;
  }

  /**
   * Render component directly into a target element
   */
  renderInto(target: HTMLElement): void {
    target.innerHTML = this.render();
  }
}