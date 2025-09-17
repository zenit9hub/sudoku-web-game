/**
 * Manages DOM element access and manipulation
 * Provides a centralized way to access and update DOM elements with caching
 */
export class DOMElementManager {
  private elementCache: Map<string, HTMLElement> = new Map();

  /**
   * Get a DOM element by its ID with type safety
   * Caches elements to avoid repeated queries
   */
  getElement<T extends HTMLElement = HTMLElement>(elementId: string): T {
    if (!this.elementCache.has(elementId)) {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element not found: ${elementId}`);
      }
      this.elementCache.set(elementId, element);
    }
    return this.elementCache.get(elementId) as T;
  }

  /**
   * Get multiple elements by a CSS selector
   */
  getElements<T extends HTMLElement = HTMLElement>(selector: string): NodeListOf<T> {
    return document.querySelectorAll<T>(selector);
  }

  /**
   * Update text content of an element
   */
  updateTextContent(elementId: string, content: string): void {
    const element = this.getElement(elementId);
    element.textContent = content;
  }

  /**
   * Update a CSS style property of an element
   */
  updateStyle(elementId: string, property: keyof CSSStyleDeclaration, value: string): void {
    const element = this.getElement(elementId);
    (element.style as any)[property] = value;
  }

  /**
   * Update multiple style properties at once
   */
  updateStyles(elementId: string, styles: Partial<CSSStyleDeclaration>): void {
    const element = this.getElement(elementId);
    Object.entries(styles).forEach(([property, value]) => {
      if (value !== undefined) {
        (element.style as any)[property] = value;
      }
    });
  }

  /**
   * Check if an element exists
   */
  elementExists(elementId: string): boolean {
    try {
      this.getElement(elementId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if an element exists without caching it
   */
  hasElement(elementId: string): boolean {
    return document.getElementById(elementId) !== null;
  }

  /**
   * Clear the element cache
   * Useful when DOM structure changes
   */
  clearCache(): void {
    this.elementCache.clear();
  }

  /**
   * Remove a specific element from cache
   */
  removeFromCache(elementId: string): void {
    this.elementCache.delete(elementId);
  }
}