// ============================================================
// matsuba - 自動保存フック
// ============================================================

import { useEffect, useRef, useCallback } from 'react'
import type { ManuscriptId, TiptapJSON } from '../types'
import { useManuscriptStore } from '../store/manuscriptStore'

type UseAutoSaveOptions = {
  manuscriptId: ManuscriptId | null
  content: TiptapJSON
  charCount?: number
  /** デバウンス間隔（ミリ秒）。デフォルト500ms */
  debounceMs?: number
}

/**
 * エディタの内容を自動保存するフック。
 * content が変化するたびにデバウンスしてDBに保存する。
 */
export function useAutoSave({
  manuscriptId,
  content,
  charCount: _charCount,
  debounceMs = 500,
}: UseAutoSaveOptions): void {
  const updateManuscript = useManuscriptStore((s) => s.updateManuscript)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(() => {
    if (!manuscriptId) return
    updateManuscript(manuscriptId, {
      // バージョンのcontentではなく、原稿の「現在の内容」として保存する。
      // 設計上、versionsとは別に currentContent フィールドを持つことを検討してもよい。
      // Phase 1ではupdatedAtの更新のみで代替し、実際のcontentはエディタ側で管理する。
      updatedAt: Math.floor(Date.now() / 1000),
    })
  }, [manuscriptId, updateManuscript])

  useEffect(() => {
    if (!manuscriptId) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(save, debounceMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [content, manuscriptId, debounceMs, save])
}
