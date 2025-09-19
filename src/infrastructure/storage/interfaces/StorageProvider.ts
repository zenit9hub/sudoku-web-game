/**
 * 저장소 추상화 인터페이스
 *
 * 다양한 저장 매체(localStorage, IndexedDB, 원격 서버 등)를
 * 통일된 인터페이스로 관리합니다.
 */

export interface StorageProvider {
  /**
   * 데이터 저장
   */
  setItem<T>(key: string, value: T): Promise<void>;

  /**
   * 데이터 조회
   */
  getItem<T>(key: string): Promise<T | null>;

  /**
   * 데이터 삭제
   */
  removeItem(key: string): Promise<void>;

  /**
   * 모든 키 조회
   */
  getAllKeys(): Promise<string[]>;

  /**
   * 저장소 클리어
   */
  clear(): Promise<void>;

  /**
   * 저장소 크기 조회
   */
  getSize(): Promise<number>;

  /**
   * 저장소 사용 가능 여부
   */
  isAvailable(): Promise<boolean>;

  /**
   * 저장소 타입
   */
  getType(): StorageType;
}

export enum StorageType {
  LOCAL_STORAGE = 'localStorage',
  SESSION_STORAGE = 'sessionStorage',
  INDEXED_DB = 'indexedDB',
  MEMORY = 'memory',
  REMOTE = 'remote'
}

/**
 * 트랜잭션 지원 저장소 인터페이스
 */
export interface TransactionalStorageProvider extends StorageProvider {
  /**
   * 트랜잭션 시작
   */
  beginTransaction(): Promise<StorageTransaction>;

  /**
   * 배치 작업 수행
   */
  batch(operations: StorageOperation[]): Promise<void>;
}

export interface StorageTransaction {
  setItem<T>(key: string, value: T): void;
  getItem<T>(key: string): Promise<T | null>;
  removeItem(key: string): void;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export interface StorageOperation {
  type: 'set' | 'remove';
  key: string;
  value?: any;
}

/**
 * 캐시 기능 지원 저장소 인터페이스
 */
export interface CacheableStorageProvider extends StorageProvider {
  /**
   * TTL(Time To Live)을 가진 데이터 저장
   */
  setItemWithTTL<T>(key: string, value: T, ttlMs: number): Promise<void>;

  /**
   * 만료된 데이터 정리
   */
  cleanupExpired(): Promise<void>;

  /**
   * 캐시 통계
   */
  getCacheStats(): Promise<CacheStats>;
}

export interface CacheStats {
  totalItems: number;
  expiredItems: number;
  hitRate: number;
  memoryUsage: number;
}

/**
 * 암호화 지원 저장소 인터페이스
 */
export interface EncryptedStorageProvider extends StorageProvider {
  /**
   * 암호화 키 설정
   */
  setEncryptionKey(key: string): Promise<void>;

  /**
   * 암호화 활성화/비활성화
   */
  setEncryptionEnabled(enabled: boolean): Promise<void>;

  /**
   * 암호화 상태 확인
   */
  isEncryptionEnabled(): boolean;
}

/**
 * 저장소 이벤트 인터페이스
 */
export interface StorageEventListener {
  onItemSet?(key: string, value: any, oldValue?: any): void;
  onItemRemoved?(key: string, oldValue?: any): void;
  onCleared?(): void;
  onError?(error: Error): void;
}

export interface ObservableStorageProvider extends StorageProvider {
  /**
   * 이벤트 리스너 등록
   */
  addEventListener(listener: StorageEventListener): void;

  /**
   * 이벤트 리스너 제거
   */
  removeEventListener(listener: StorageEventListener): void;

  /**
   * 특정 키 변경 감지
   */
  watchKey<T>(key: string, callback: (newValue: T | null, oldValue: T | null) => void): () => void;
}

/**
 * 저장소 마이그레이션 인터페이스
 */
export interface MigratableStorageProvider extends StorageProvider {
  /**
   * 데이터 스키마 버전
   */
  getSchemaVersion(): Promise<number>;

  /**
   * 스키마 마이그레이션 수행
   */
  migrate(fromVersion: number, toVersion: number): Promise<void>;

  /**
   * 마이그레이션 함수 등록
   */
  registerMigration(version: number, migrationFn: MigrationFunction): void;
}

export type MigrationFunction = (storage: StorageProvider) => Promise<void>;

/**
 * 저장소 설정
 */
export interface StorageConfig {
  readonly name: string;
  readonly version: number;
  readonly encryption?: {
    enabled: boolean;
    algorithm: string;
    keyDerivation: string;
  };
  readonly cache?: {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
  };
  readonly compression?: {
    enabled: boolean;
    algorithm: 'gzip' | 'lz4' | 'zstd';
    level: number;
  };
  readonly backup?: {
    enabled: boolean;
    interval: number;
    maxBackups: number;
  };
}