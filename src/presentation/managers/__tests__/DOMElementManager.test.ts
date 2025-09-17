import { DOMElementManager } from '../DOMElementManager';

describe('DOMElementManager', () => {
  let domManager: DOMElementManager;

  beforeEach(() => {
    domManager = new DOMElementManager();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    domManager.clearCache();
  });

  describe('getElement', () => {
    it('should return element when it exists', () => {
      const element = document.createElement('div');
      element.id = 'test-element';
      document.body.appendChild(element);

      const result = domManager.getElement('test-element');

      expect(result).toBe(element);
      expect(result.tagName).toBe('DIV');
    });

    it('should throw error when element does not exist', () => {
      expect(() => {
        domManager.getElement('non-existent');
      }).toThrow('Element not found: non-existent');
    });

    it('should cache elements after first access', () => {
      const element = document.createElement('div');
      element.id = 'cached-element';
      document.body.appendChild(element);

      const spy = jest.spyOn(document, 'getElementById');

      // First access
      const result1 = domManager.getElement('cached-element');
      expect(spy).toHaveBeenCalledWith('cached-element');
      expect(spy).toHaveBeenCalledTimes(1);

      // Second access should use cache
      const result2 = domManager.getElement('cached-element');
      expect(spy).toHaveBeenCalledTimes(1); // Should not be called again
      expect(result1).toBe(result2);

      spy.mockRestore();
    });

    it('should return correctly typed elements', () => {
      const canvas = document.createElement('canvas');
      canvas.id = 'test-canvas';
      document.body.appendChild(canvas);

      const result = domManager.getElement<HTMLCanvasElement>('test-canvas');

      expect(result).toBe(canvas);
      expect(result instanceof HTMLCanvasElement).toBe(true);
    });
  });

  describe('updateTextContent', () => {
    it('should update text content of element', () => {
      const element = document.createElement('div');
      element.id = 'text-element';
      document.body.appendChild(element);

      domManager.updateTextContent('text-element', 'Hello World');

      expect(element.textContent).toBe('Hello World');
    });

    it('should update text content multiple times', () => {
      const element = document.createElement('div');
      element.id = 'text-element';
      document.body.appendChild(element);

      domManager.updateTextContent('text-element', 'First');
      expect(element.textContent).toBe('First');

      domManager.updateTextContent('text-element', 'Second');
      expect(element.textContent).toBe('Second');
    });

    it('should throw error if element does not exist', () => {
      expect(() => {
        domManager.updateTextContent('non-existent', 'test');
      }).toThrow('Element not found: non-existent');
    });
  });

  describe('updateStyle', () => {
    it('should update style property of element', () => {
      const element = document.createElement('div');
      element.id = 'style-element';
      document.body.appendChild(element);

      domManager.updateStyle('style-element', 'color', 'red');

      expect(element.style.color).toBe('red');
    });

    it('should update multiple style properties', () => {
      const element = document.createElement('div');
      element.id = 'style-element';
      document.body.appendChild(element);

      domManager.updateStyle('style-element', 'color', 'red');
      domManager.updateStyle('style-element', 'backgroundColor', 'blue');

      expect(element.style.color).toBe('red');
      expect(element.style.backgroundColor).toBe('blue');
    });

    it('should throw error if element does not exist', () => {
      expect(() => {
        domManager.updateStyle('non-existent', 'color', 'red');
      }).toThrow('Element not found: non-existent');
    });
  });

  describe('clearCache', () => {
    it('should clear element cache', () => {
      const element = document.createElement('div');
      element.id = 'cache-test';
      document.body.appendChild(element);

      // Access element to cache it
      domManager.getElement('cache-test');

      const spy = jest.spyOn(document, 'getElementById');

      // Clear cache
      domManager.clearCache();

      // Next access should call getElementById again
      domManager.getElement('cache-test');
      expect(spy).toHaveBeenCalledWith('cache-test');

      spy.mockRestore();
    });

    it('should work when cache is already empty', () => {
      expect(() => {
        domManager.clearCache();
      }).not.toThrow();
    });
  });

  describe('hasElement', () => {
    it('should return true for existing element', () => {
      const element = document.createElement('div');
      element.id = 'exists';
      document.body.appendChild(element);

      expect(domManager.hasElement('exists')).toBe(true);
    });

    it('should return false for non-existing element', () => {
      expect(domManager.hasElement('does-not-exist')).toBe(false);
    });

    it('should not cache element when checking existence', () => {
      const element = document.createElement('div');
      element.id = 'check-exists';
      document.body.appendChild(element);

      const spy = jest.spyOn(document, 'getElementById');

      // Check existence
      domManager.hasElement('check-exists');
      const firstCallCount = spy.mock.calls.length;

      // Get element should still call getElementById
      domManager.getElement('check-exists');
      expect(spy.mock.calls.length).toBe(firstCallCount + 1);

      spy.mockRestore();
    });
  });

  describe('error handling', () => {
    it('should handle elements that are removed from DOM', () => {
      const element = document.createElement('div');
      element.id = 'removable';
      document.body.appendChild(element);

      // Cache the element
      const cachedElement = domManager.getElement('removable');
      expect(cachedElement).toBe(element);

      // Remove element from DOM
      document.body.removeChild(element);

      // Cached element should still be accessible
      const stillCached = domManager.getElement('removable');
      expect(stillCached).toBe(element);
    });

    it('should handle null element IDs gracefully', () => {
      expect(() => {
        domManager.getElement('');
      }).toThrow('Element not found: ');
    });
  });
});