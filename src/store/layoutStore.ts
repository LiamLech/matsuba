// ============================================================
// matsuba - レイアウトプリセットストア（Zustand）
// ============================================================

import { create } from 'zustand'
import { nanoid } from 'nanoid'
import type { LayoutPreset, LayoutPresetId } from '../types'
import {
  getAllLayoutPresets,
  putLayoutPreset,
  deleteLayoutPreset,
} from '../db'

type LayoutStore = {
  presets: LayoutPreset[]
  isLoading: boolean

  loadAll: () => Promise<void>

  createPreset: (preset: Omit<LayoutPreset, 'id' | 'isBuiltIn'>) => Promise<LayoutPreset>
  updatePreset: (id: LayoutPresetId, patch: Partial<Omit<LayoutPreset, 'id' | 'isBuiltIn'>>) => Promise<void>
  removePreset: (id: LayoutPresetId) => Promise<void>

  getById: (id: LayoutPresetId) => LayoutPreset | undefined
}

export const useLayoutStore = create<LayoutStore>((set, get) => ({
  presets: [],
  isLoading: false,

  loadAll: async () => {
    set({ isLoading: true })
    try {
      const presets = await getAllLayoutPresets()
      set({ presets, isLoading: false })
    } catch (err) {
      console.error('レイアウトプリセットの読み込みに失敗しました', err)
      set({ isLoading: false })
    }
  },

  createPreset: async (preset) => {
    const newPreset: LayoutPreset = {
      ...preset,
      id: nanoid(),
      isBuiltIn: false,
    }
    await putLayoutPreset(newPreset)
    set((state) => ({ presets: [...state.presets, newPreset] }))
    return newPreset
  },

  updatePreset: async (id, patch) => {
    const { presets } = get()
    const target = presets.find((p) => p.id === id)
    if (!target || target.isBuiltIn) return

    const updated = { ...target, ...patch }
    await putLayoutPreset(updated)
    set({ presets: presets.map((p) => (p.id === id ? updated : p)) })
  },

  removePreset: async (id) => {
    const { presets } = get()
    const target = presets.find((p) => p.id === id)
    if (!target || target.isBuiltIn) return

    await deleteLayoutPreset(id)
    set({ presets: presets.filter((p) => p.id !== id) })
  },

  getById: (id) => {
    return get().presets.find((p) => p.id === id)
  },
}))
