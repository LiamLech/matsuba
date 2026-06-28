// ============================================================
// matsuba - IndexedDB操作
// ============================================================

import type {
  Manuscript,
  ManuscriptId,
  AppSettings,
  TagCategory,
  LayoutPreset,
} from '../types'

const DB_NAME = 'matsuba'
const DB_VERSION = 2

// ストア名
const STORE_MANUSCRIPTS = 'manuscripts'
const STORE_TAG_CATEGORIES = 'tagCategories'
const STORE_LAYOUT_PRESETS = 'layoutPresets'
const STORE_SETTINGS = 'settings'

// ------------------------------------------------------------
// DB初期化
// ------------------------------------------------------------

let _db: IDBDatabase | null = null

export async function openDB(): Promise<IDBDatabase> {
  if (_db) return _db

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // 既存ストアをすべて削除して再作成（スキーマ変更に対応）
      Array.from(db.objectStoreNames).forEach((name) => db.deleteObjectStore(name))

      const store = db.createObjectStore(STORE_MANUSCRIPTS, { keyPath: 'id' })
      store.createIndex('order', 'order', { unique: false })
      store.createIndex('updatedAt', 'updatedAt', { unique: false })
      store.createIndex('createdAt', 'createdAt', { unique: false })
      store.createIndex('title', 'title', { unique: false })

      db.createObjectStore(STORE_TAG_CATEGORIES, { keyPath: 'id' })
      db.createObjectStore(STORE_LAYOUT_PRESETS, { keyPath: 'id' })
      db.createObjectStore(STORE_SETTINGS)
    }

    request.onsuccess = (event) => {
      _db = (event.target as IDBOpenDBRequest).result
      resolve(_db)
    }

    request.onerror = () => {
      reject(new Error(`IndexedDBのオープンに失敗しました: ${request.error?.message}`))
    }
  })
}

// ------------------------------------------------------------
// 汎用トランザクションヘルパー
// ------------------------------------------------------------

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode)
    const store = tx.objectStore(storeName)
    const request = fn(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function withStoreVoid(
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest
): Promise<void> {
  await withStore(storeName, mode, fn)
}

// ------------------------------------------------------------
// 原稿（Manuscript）
// ------------------------------------------------------------

export async function getAllManuscripts(): Promise<Manuscript[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_MANUSCRIPTS, 'readonly')
    const store = tx.objectStore(STORE_MANUSCRIPTS)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result as Manuscript[])
    request.onerror = () => reject(request.error)
  })
}

export async function getManuscript(id: ManuscriptId): Promise<Manuscript | undefined> {
  return withStore<Manuscript | undefined>(STORE_MANUSCRIPTS, 'readonly', (store) =>
    store.get(id)
  )
}

export async function putManuscript(manuscript: Manuscript): Promise<void> {
  await withStoreVoid(STORE_MANUSCRIPTS, 'readwrite', (store) => store.put(manuscript))
}

export async function deleteManuscript(id: ManuscriptId): Promise<void> {
  await withStoreVoid(STORE_MANUSCRIPTS, 'readwrite', (store) => store.delete(id))
}

// ------------------------------------------------------------
// タグカテゴリ（TagCategory）
// ------------------------------------------------------------

export async function getAllTagCategories(): Promise<TagCategory[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TAG_CATEGORIES, 'readonly')
    const store = tx.objectStore(STORE_TAG_CATEGORIES)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result as TagCategory[])
    request.onerror = () => reject(request.error)
  })
}

export async function putTagCategory(category: TagCategory): Promise<void> {
  await withStoreVoid(STORE_TAG_CATEGORIES, 'readwrite', (store) => store.put(category))
}

export async function deleteTagCategory(id: string): Promise<void> {
  await withStoreVoid(STORE_TAG_CATEGORIES, 'readwrite', (store) => store.delete(id))
}

// ------------------------------------------------------------
// レイアウトプリセット（LayoutPreset）
// ------------------------------------------------------------

export async function getAllLayoutPresets(): Promise<LayoutPreset[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_LAYOUT_PRESETS, 'readonly')
    const store = tx.objectStore(STORE_LAYOUT_PRESETS)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result as LayoutPreset[])
    request.onerror = () => reject(request.error)
  })
}

export async function putLayoutPreset(preset: LayoutPreset): Promise<void> {
  await withStoreVoid(STORE_LAYOUT_PRESETS, 'readwrite', (store) => store.put(preset))
}

export async function deleteLayoutPreset(id: string): Promise<void> {
  await withStoreVoid(STORE_LAYOUT_PRESETS, 'readwrite', (store) => store.delete(id))
}

// ------------------------------------------------------------
// アプリ設定（AppSettings）
// ------------------------------------------------------------

const SETTINGS_KEY = 'app'

export async function getSettings(): Promise<AppSettings | undefined> {
  return withStore<AppSettings | undefined>(STORE_SETTINGS, 'readonly', (store) =>
    store.get(SETTINGS_KEY)
  )
}

export async function putSettings(settings: AppSettings): Promise<void> {
  await withStoreVoid(STORE_SETTINGS, 'readwrite', (store) =>
    store.put(settings, SETTINGS_KEY)
  )
}

// ------------------------------------------------------------
// 初期データの投入
// ------------------------------------------------------------

import {
  DEFAULT_LAYOUT_PRESETS,
  DEFAULT_TAG_CATEGORIES,
  DEFAULT_APP_SETTINGS,
} from '../types'

/**
 * 初回起動時に必要なデフォルトデータをDBに投入する。
 * すでにデータがある場合はスキップする。
 */
export async function seedInitialData(): Promise<void> {
  const [presets, categories, settings] = await Promise.all([
    getAllLayoutPresets(),
    getAllTagCategories(),
    getSettings(),
  ])

  if (presets.length === 0) {
    for (const preset of DEFAULT_LAYOUT_PRESETS) {
      await putLayoutPreset(preset)
    }
  }

  if (categories.length === 0) {
    for (const category of DEFAULT_TAG_CATEGORIES) {
      await putTagCategory(category)
    }
  }

  if (!settings) {
    await putSettings(DEFAULT_APP_SETTINGS)
  }
}
