// ============================================================
// matsuba - 同期スクロールフック
// ============================================================

import { useRef, useCallback } from 'react'
import { useUIStore } from '../store/uiStore'

/**
 * 同期スクロールを管理するフック。
 *
 * 使い方：
 * const { registerPane, unregisterPane, onScroll } = useScrollSync()
 * <div ref={(el) => registerPane(paneIndex, el)} onScroll={() => onScroll(paneIndex)}>
 */
export function useScrollSync() {
  const scrollSynced = useUIStore((s) => s.scrollSynced)
  const panesRef = useRef<Map<number, HTMLElement>>(new Map())
  const isSyncingRef = useRef(false)

  const registerPane = useCallback((index: number, el: HTMLElement | null) => {
    if (el) {
      panesRef.current.set(index, el)
    } else {
      panesRef.current.delete(index)
    }
  }, [])

  const unregisterPane = useCallback((index: number) => {
    panesRef.current.delete(index)
  }, [])

  const onScroll = useCallback(
    (sourceIndex: number) => {
      if (!scrollSynced || isSyncingRef.current) return

      const source = panesRef.current.get(sourceIndex)
      if (!source) return

      const scrollRatio =
        source.scrollTop / (source.scrollHeight - source.clientHeight || 1)

      isSyncingRef.current = true

      panesRef.current.forEach((pane, index) => {
        if (index === sourceIndex) return
        const maxScroll = pane.scrollHeight - pane.clientHeight
        pane.scrollTop = scrollRatio * maxScroll
      })

      // 次のフレームでフラグを解除して無限ループを防ぐ
      requestAnimationFrame(() => {
        isSyncingRef.current = false
      })
    },
    [scrollSynced]
  )

  return { registerPane, unregisterPane, onScroll }
}
