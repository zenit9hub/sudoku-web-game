/**
 * Mock classes for testing
 * Provides mock implementations of key classes for isolated testing
 */

import { GameRenderer } from '../../presentation/interfaces/GameRenderer';
import { SudokuGame } from '../../domain/models/SudokuGame';
import { GameRepository } from '../../infrastructure/interfaces/GameRepository';

/**
 * Mock Game Renderer for testing rendering logic
 */
export class MockGameRenderer implements GameRenderer {
  public renderCalls: Array<{ game: SudokuGame; options?: any }> = [];
  public resizeCalls: Array<{ width: number; height: number }> = [];

  render(game: SudokuGame, options?: any): void {
    this.renderCalls.push({ game, options });
  }

  resize(width: number, height: number): void {
    this.resizeCalls.push({ width, height });
  }

  clearCanvas(): void {
    // Mock implementation
  }

  /**
   * Test helper methods
   */
  getLastRenderCall(): { game: SudokuGame; options?: any } | undefined {
    return this.renderCalls[this.renderCalls.length - 1];
  }

  getLastResizeCall(): { width: number; height: number } | undefined {
    return this.resizeCalls[this.resizeCalls.length - 1];
  }

  reset(): void {
    this.renderCalls = [];
    this.resizeCalls = [];
  }
}

/**
 * Mock Game Repository for testing persistence logic
 */
export class MockGameRepository implements GameRepository {
  private storage: Map<string, SudokuGame> = new Map();
  public saveCalls: Array<{ key: string; game: SudokuGame }> = [];
  public loadCalls: Array<{ key: string }> = [];

  async saveGame(key: string, game: SudokuGame): Promise<void> {
    this.saveCalls.push({ key, game });
    this.storage.set(key, game);
  }

  async loadGame(key: string): Promise<SudokuGame | null> {
    this.loadCalls.push({ key });
    return this.storage.get(key) || null;
  }

  async deleteGame(key: string): Promise<void> {
    this.storage.delete(key);
  }

  async listGames(): Promise<string[]> {
    return Array.from(this.storage.keys());
  }

  /**
   * Test helper methods
   */
  hasGame(key: string): boolean {
    return this.storage.has(key);
  }

  getStoredGame(key: string): SudokuGame | undefined {
    return this.storage.get(key);
  }

  reset(): void {
    this.storage.clear();
    this.saveCalls = [];
    this.loadCalls = [];
  }
}

/**
 * Mock DOM Element Manager for testing DOM operations
 */
export class MockDOMElementManager {
  private elements: Map<string, HTMLElement> = new Map();
  public getElementCalls: string[] = [];
  public updateTextContentCalls: Array<{ elementId: string; content: string }> = [];
  public updateStyleCalls: Array<{ elementId: string; property: string; value: string }> = [];

  getElement<T extends HTMLElement = HTMLElement>(elementId: string): T {
    this.getElementCalls.push(elementId);

    if (!this.elements.has(elementId)) {
      // Create a mock element
      const element = document.createElement('div');
      element.id = elementId;
      this.elements.set(elementId, element);
    }

    return this.elements.get(elementId) as T;
  }

  updateTextContent(elementId: string, content: string): void {
    this.updateTextContentCalls.push({ elementId, content });
    const element = this.getElement(elementId);
    element.textContent = content;
  }

  updateStyle(elementId: string, property: keyof CSSStyleDeclaration, value: string): void {
    this.updateStyleCalls.push({ elementId, property: property.toString(), value });
    const element = this.getElement(elementId);
    (element.style as any)[property] = value;
  }

  /**
   * Test helper methods
   */
  setMockElement(elementId: string, element: HTMLElement): void {
    this.elements.set(elementId, element);
  }

  getUpdateCalls(elementId: string): Array<{ elementId: string; content: string }> {
    return this.updateTextContentCalls.filter(call => call.elementId === elementId);
  }

  reset(): void {
    this.elements.clear();
    this.getElementCalls = [];
    this.updateTextContentCalls = [];
    this.updateStyleCalls = [];
  }
}

/**
 * Mock Timer Manager for testing timing logic
 */
export class MockTimerManager {
  public startCalls: SudokuGame[] = [];
  public stopCalls: number = 0;
  public formatTimeCalls: number[] = [];
  private mockElapsedTime: number = 0;

  constructor(private onTimeUpdate: (formattedTime: string) => void) {}

  start(game: SudokuGame): void {
    this.startCalls.push(game);
    // Simulate immediate time update
    this.onTimeUpdate(this.formatTime(this.mockElapsedTime));
  }

  stop(): void {
    this.stopCalls++;
  }

  getElapsedSeconds(): number {
    return this.mockElapsedTime;
  }

  getFormattedElapsedTime(): string {
    return this.formatTime(this.mockElapsedTime);
  }

  formatTime(seconds: number): string {
    this.formatTimeCalls.push(seconds);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  destroy(): void {
    // Mock implementation
  }

  /**
   * Test helper methods
   */
  setMockElapsedTime(seconds: number): void {
    this.mockElapsedTime = seconds;
  }

  simulateTimeUpdate(): void {
    this.onTimeUpdate(this.formatTime(this.mockElapsedTime));
  }

  reset(): void {
    this.startCalls = [];
    this.stopCalls = 0;
    this.formatTimeCalls = [];
    this.mockElapsedTime = 0;
  }
}

/**
 * Mock Event Manager for testing event handling
 */
export class MockEventManager {
  public setupEventListenersCalls: number = 0;
  public removeEventListenersCalls: number = 0;
  private eventHandlers: Map<string, Function[]> = new Map();

  setupEventListeners(): void {
    this.setupEventListenersCalls++;
  }

  removeEventListeners(): void {
    this.removeEventListenersCalls++;
    this.eventHandlers.clear();
  }

  /**
   * Simulate event firing for testing
   */
  simulateEvent(eventType: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(eventType) || [];
    handlers.forEach(handler => handler(...args));
  }

  /**
   * Add mock event handler
   */
  addMockEventHandler(eventType: string, handler: Function): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  reset(): void {
    this.setupEventListenersCalls = 0;
    this.removeEventListenersCalls = 0;
    this.eventHandlers.clear();
  }
}

/**
 * Mock I18n Manager for testing internationalization
 */
export class MockI18nManager {
  private currentLocale: 'ko' | 'en' = 'ko';
  private mockTranslations: Map<string, string> = new Map();
  public setLocaleCalls: Array<'ko' | 'en'> = [];
  public tCalls: Array<{ key: string; params?: any }> = [];

  getCurrentLocale(): 'ko' | 'en' {
    return this.currentLocale;
  }

  setLocale(locale: 'ko' | 'en'): void {
    this.setLocaleCalls.push(locale);
    this.currentLocale = locale;
  }

  t(key: string, params?: any): string {
    this.tCalls.push({ key, params });
    return this.mockTranslations.get(key) || key;
  }

  /**
   * Test helper methods
   */
  setMockTranslation(key: string, value: string): void {
    this.mockTranslations.set(key, value);
  }

  reset(): void {
    this.currentLocale = 'ko';
    this.mockTranslations.clear();
    this.setLocaleCalls = [];
    this.tCalls = [];
  }
}