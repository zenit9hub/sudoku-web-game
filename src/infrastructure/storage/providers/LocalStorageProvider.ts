import {
  StorageType,
  ObservableStorageProvider,
  StorageEventListener,
  CacheableStorageProvider,
  CacheStats
} from '../interfaces/StorageProvider.js';

/**
 * LocalStorage 기반 저장소 구현
 *
 * 브라우저의 localStorage를 사용하여 데이터를 영구 저장합니다.
 */
export class LocalStorageProvider implements ObservableStorageProvider, CacheableStorageProvider {
  private readonly prefix: string;
  private readonly listeners: StorageEventListener[] = [];
  private readonly watchers = new Map<string, Array<(newValue: any, oldValue: any) => void>>();
  private readonly cache = new Map<string, { value: any; expiry: number }>();

  constructor(prefix: string = 'sudoku_') {
    this.prefix = prefix;
    this.setupStorageListener();
  }

  async setItem<T>(key: string, value: T): Promise<void> {
    const fullKey = this.getFullKey(key);
    const oldValue = await this.getItem<T>(key);

    try {
      const serializedValue = JSON.stringify({
        value,
        timestamp: Date.now(),
        type: typeof value
      });

      localStorage.setItem(fullKey, serializedValue);

      // 캐시 업데이트
      this.cache.delete(key);

      // 이벤트 발생
      this.notifyListeners('set', key, value, oldValue);
      this.notifyWatchers(key, value, oldValue);

    } catch (error) {
      this.notifyListeners('error', key, undefined, undefined, error as Error);
      throw new Error(`Failed to save item: ${error}`);
    }
  }

  async getItem<T>(key: string): Promise<T | null> {
    // 캐시에서 먼저 확인
    const cached = this.cache.get(key);
    if (cached) {
      if (cached.expiry > Date.now()) {
        return cached.value;
      } else {
        this.cache.delete(key);
      }
    }

    const fullKey = this.getFullKey(key);

    try {
      const item = localStorage.getItem(fullKey);
      if (item === null) {
        return null;
      }

      const parsed = JSON.parse(item);
      const value = parsed.value;

      // 캐시에 저장
      this.cache.set(key, {
        value,
        expiry: Number.MAX_SAFE_INTEGER // 기본적으로 만료되지 않음
      });

      return value;

    } catch (error) {
      console.warn(`Failed to parse stored item '${key}':`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    const fullKey = this.getFullKey(key);
    const oldValue = await this.getItem(key);

    localStorage.removeItem(fullKey);
    this.cache.delete(key);

    this.notifyListeners('remove', key, undefined, oldValue);
    this.notifyWatchers(key, null, oldValue);
  }

  async getAllKeys(): Promise<string[]> {
    const keys: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }

    return keys;
  }

  async clear(): Promise<void> {
    const keys = await this.getAllKeys();

    for (const key of keys) {
      const fullKey = this.getFullKey(key);
      localStorage.removeItem(fullKey);
    }

    this.cache.clear();
    this.notifyListeners('clear');
  }

  async getSize(): Promise<number> {
    let totalSize = 0;
    const keys = await this.getAllKeys();

    for (const key of keys) {
      const fullKey = this.getFullKey(key);
      const item = localStorage.getItem(fullKey);
      if (item) {
        totalSize += new Blob([item]).size;
      }
    }

    return totalSize;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const testKey = this.getFullKey('__test__');
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getType(): StorageType {
    return StorageType.LOCAL_STORAGE;
  }

  // CacheableStorageProvider 구현
  async setItemWithTTL<T>(key: string, value: T, ttlMs: number): Promise<void> {
    await this.setItem(key, value);

    // TTL 캐시 설정
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs
    });

    // 만료 시 자동 삭제 설정
    setTimeout(() => {
      this.removeItem(key);
    }, ttlMs);
  }

  async cleanupExpired(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (cached.expiry <= now) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.removeItem(key);
    }
  }

  async getCacheStats(): Promise<CacheStats> {
    const now = Date.now();
    let totalItems = 0;
    let expiredItems = 0;
    let memoryUsage = 0;

    for (const [, cached] of this.cache.entries()) {
      totalItems++;
      if (cached.expiry <= now) {
        expiredItems++;
      }
      memoryUsage += JSON.stringify(cached.value).length;
    }

    return {
      totalItems,
      expiredItems,
      hitRate: totalItems > 0 ? (totalItems - expiredItems) / totalItems : 0,
      memoryUsage
    };
  }

  // ObservableStorageProvider 구현
  addEventListener(listener: StorageEventListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: StorageEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index >= 0) {
      this.listeners.splice(index, 1);
    }
  }

  watchKey<T>(key: string, callback: (newValue: T | null, oldValue: T | null) => void): () => void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, []);
    }

    this.watchers.get(key)!.push(callback);

    // 구독 해제 함수 반환
    return () => {
      const keyWatchers = this.watchers.get(key);
      if (keyWatchers) {
        const index = keyWatchers.indexOf(callback);
        if (index >= 0) {
          keyWatchers.splice(index, 1);
        }

        if (keyWatchers.length === 0) {
          this.watchers.delete(key);
        }
      }
    };
  }

  // 유틸리티 메소드들
  private getFullKey(key: string): string {
    return this.prefix + key;
  }

  private setupStorageListener(): void {
    // 다른 탭에서의 localStorage 변경 감지
    window.addEventListener('storage', (event) => {
      if (event.key && event.key.startsWith(this.prefix)) {
        const key = event.key.substring(this.prefix.length);
        const newValue = event.newValue ? JSON.parse(event.newValue).value : null;
        const oldValue = event.oldValue ? JSON.parse(event.oldValue).value : null;

        this.notifyWatchers(key, newValue, oldValue);

        if (event.newValue === null) {
          this.notifyListeners('remove', key, undefined, oldValue);
        } else {
          this.notifyListeners('set', key, newValue, oldValue);
        }
      }
    });
  }

  private notifyListeners(
    type: 'set' | 'remove' | 'clear' | 'error',
    key?: string,
    value?: any,
    oldValue?: any,
    error?: Error
  ): void {
    this.listeners.forEach(listener => {
      try {
        switch (type) {
          case 'set':
            listener.onItemSet?.(key!, value, oldValue);
            break;
          case 'remove':
            listener.onItemRemoved?.(key!, oldValue);
            break;
          case 'clear':
            listener.onCleared?.();
            break;
          case 'error':
            listener.onError?.(error!);
            break;
        }
      } catch (listenerError) {
        console.error('Error in storage event listener:', listenerError);
      }
    });
  }

  private notifyWatchers(key: string, newValue: any, oldValue: any): void {
    const keyWatchers = this.watchers.get(key);
    if (keyWatchers) {
      keyWatchers.forEach(callback => {
        try {
          callback(newValue, oldValue);
        } catch (error) {
          console.error('Error in storage watcher:', error);
        }
      });
    }
  }

  // 고급 기능들
  async backup(): Promise<Blob> {
    const data: { [key: string]: any } = {};
    const keys = await this.getAllKeys();

    for (const key of keys) {
      data[key] = await this.getItem(key);
    }

    const backupData = {
      version: 1,
      timestamp: Date.now(),
      data
    };

    return new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json'
    });
  }

  async restore(backup: Blob): Promise<void> {
    const text = await backup.text();
    const backupData = JSON.parse(text);

    if (backupData.version !== 1) {
      throw new Error('Unsupported backup version');
    }

    // 기존 데이터 클리어
    await this.clear();

    // 백업 데이터 복원
    for (const [key, value] of Object.entries(backupData.data)) {
      await this.setItem(key, value);
    }
  }

  // 압축 기능 (선택적)
  async setItemCompressed<T>(key: string, value: T): Promise<void> {
    const serialized = JSON.stringify(value);

    // 간단한 압축 시뮬레이션 (실제로는 더 복잡한 압축 알고리즘 사용)
    const compressed = this.simpleCompress(serialized);

    const wrappedValue = {
      compressed: true,
      data: compressed,
      originalSize: serialized.length
    };

    await this.setItem(key, wrappedValue);
  }

  async getItemCompressed<T>(key: string): Promise<T | null> {
    const item = await this.getItem<any>(key);
    if (!item) return null;

    if (item.compressed) {
      const decompressed = this.simpleDecompress(item.data);
      return JSON.parse(decompressed);
    }

    return item;
  }

  private simpleCompress(data: string): string {
    // 실제 구현에서는 gzip, lz4 등의 압축 라이브러리 사용
    return btoa(data);
  }

  private simpleDecompress(data: string): string {
    return atob(data);
  }
}