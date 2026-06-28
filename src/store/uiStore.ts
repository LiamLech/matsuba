// ============================================================
// matsuba - UIストア（Zustand）
// ============================================================

import { create } from 'zustand'
import type {
  UIState,
  ViewMode,
  PaneCount,
  PaneIndex,
  ManuscriptId,
  VersionId,
} from '../types'
import { DEFAULT_UI_STATE } from '../types'

type UIStore = UIState & {
  // ペイン操作
  setPaneCount: (count: PaneCount) => void
  setActivePane: (index: PaneIndex) => void
  setPaneManuscript: (paneIndex: PaneIndex, manuscriptId: ManuscriptId | null) => void
  setPaneVersion: (paneIndex: PaneIndex, versionId: VersionId | null) => void
  openInPane: (paneIndex: PaneIndex, manuscriptId: ManuscriptId, versionId?: VersionId | null) => void

  // 表示モード
  setViewMode: (mode: ViewMode) => void

  // スクロール同期
  setScrollSynced: (synced: boolean) => void

  // 文字数表示
  setCharCountVisible: (visible: boolean) => void
  toggleCharCount: () => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  ...DEFAULT_UI_STATE,

  // ── ペイン操作 ───────────────────────────────────────────

  setPaneCount: (count) => {
    set({ paneCount: count })
  },

  setActivePane: (index) => {
    set({ activePaneIndex: index })
  },

  setPaneManuscript: (paneIndex, manuscriptId) => {
    const panes = [...get().panes] as UIState['panes']
    panes[paneIndex] = { ...panes[paneIndex], manuscriptId }
    set({ panes })
  },

  setPaneVersion: (paneIndex, versionId) => {
    const panes = [...get().panes] as UIState['panes']
    panes[paneIndex] = { ...panes[paneIndex], versionId }
    set({ panes })
  },

  openInPane: (paneIndex, manuscriptId, versionId = null) => {
    const panes = [...get().panes] as UIState['panes']
    panes[paneIndex] = { manuscriptId, versionId }
    set({ panes, activePaneIndex: paneIndex })
  },

  // ── 表示モード ───────────────────────────────────────────

  setViewMode: (mode) => {
    set({ viewMode: mode })
  },

  // ── スクロール同期 ───────────────────────────────────────

  setScrollSynced: (synced) => {
    set({ scrollSynced: synced })
  },

  // ── 文字数表示 ───────────────────────────────────────────

  setCharCountVisible: (visible) => {
    set({ charCountVisible: visible })
  },

  toggleCharCount: () => {
    set((state) => ({ charCountVisible: !state.charCountVisible }))
  },
}))
