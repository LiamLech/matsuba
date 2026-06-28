// ============================================================
// matsuba - タグストア（Zustand）
// ============================================================

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { Tag, TagCategory, TagCategoryId, TagId } from '../types'
import {
  getAllTagCategories,
  putTagCategory,
  deleteTagCategory,
} from '../db'

type TagStore = {
  categories: TagCategory[]
  isLoading: boolean

  loadAll: () => Promise<void>

  // カテゴリ操作
  createCategory: (label: string, color: string) => Promise<TagCategory>
  updateCategory: (id: TagCategoryId, patch: Partial<Omit<TagCategory, 'id' | 'tags'>>) => Promise<void>
  removeCategory: (id: TagCategoryId) => Promise<void>

  // タグ操作
  createTag: (categoryId: TagCategoryId, label: string, color: string) => Promise<Tag>
  updateTag: (categoryId: TagCategoryId, tagId: TagId, patch: Partial<Omit<Tag, 'id' | 'categoryId'>>) => Promise<void>
  removeTag: (categoryId: TagCategoryId, tagId: TagId) => Promise<void>

  // セレクター
  getTagById: (tagId: TagId) => Tag | undefined
  getAllTags: () => Tag[]
}

export const useTagStore = create<TagStore>((set, get) => ({
  categories: [],
  isLoading: false,

  loadAll: async () => {
    set({ isLoading: true })
    try {
      const categories = await getAllTagCategories()
      set({ categories, isLoading: false })
    } catch (err) {
      console.error('タグの読み込みに失敗しました', err)
      set({ isLoading: false })
    }
  },

  // ── カテゴリ操作 ─────────────────────────────────────────

  createCategory: async (label, color) => {
    const category: TagCategory = {
      id: nanoid(),
      label,
      color,
      tags: [],
    }
    await putTagCategory(category)
    set((state) => ({ categories: [...state.categories, category] }))
    return category
  },

  updateCategory: async (id, patch) => {
    const { categories } = get()
    const updated = categories.map((c) =>
      c.id === id ? { ...c, ...patch } : c
    )
    const target = updated.find((c) => c.id === id)
    if (target) {
      await putTagCategory(target)
      set({ categories: updated })
    }
  },

  removeCategory: async (id) => {
    await deleteTagCategory(id)
    set((state) => ({
      categories: state.categories.filter((c) => c.id !== id),
    }))
  },

  // ── タグ操作 ────────────────────────────────────────────

  createTag: async (categoryId, label, color) => {
    const { categories } = get()
    const tag: Tag = {
      id: nanoid(),
      categoryId,
      label,
      color,
    }
    const updated = categories.map((c) =>
      c.id === categoryId ? { ...c, tags: [...c.tags, tag] } : c
    )
    const target = updated.find((c) => c.id === categoryId)
    if (target) {
      await putTagCategory(target)
      set({ categories: updated })
    }
    return tag
  },

  updateTag: async (categoryId, tagId, patch) => {
    const { categories } = get()
    const updated = categories.map((c) =>
      c.id === categoryId
        ? { ...c, tags: c.tags.map((t) => (t.id === tagId ? { ...t, ...patch } : t)) }
        : c
    )
    const target = updated.find((c) => c.id === categoryId)
    if (target) {
      await putTagCategory(target)
      set({ categories: updated })
    }
  },

  removeTag: async (categoryId, tagId) => {
    const { categories } = get()
    const updated = categories.map((c) =>
      c.id === categoryId
        ? { ...c, tags: c.tags.filter((t) => t.id !== tagId) }
        : c
    )
    const target = updated.find((c) => c.id === categoryId)
    if (target) {
      await putTagCategory(target)
      set({ categories: updated })
    }
  },

  // ── セレクター ───────────────────────────────────────────

  getTagById: (tagId) => {
    return get().getAllTags().find((t) => t.id === tagId)
  },

  getAllTags: () => {
    return get().categories.flatMap((c) => c.tags)
  },
}))
