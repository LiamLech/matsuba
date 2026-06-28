// ============================================================
// matsuba - 執筆ログフック
// ============================================================

import { useEffect, useRef } from 'react'
import type { ManuscriptId } from '../types'
import { useManuscriptStore } from '../store/manuscriptStore'

type UseEditLogOptions = {
  manuscriptId: ManuscriptId | null
  charCount: number
}

/**
 * エディタへの入力開始・終了を検知して執筆ログを記録するフック。
 *
 * 動作：
 * - manuscriptIdが設定された時点でセッション開始時刻を記録
 * - manuscriptIdがnullになるかコンポーネントがアンマウントされた時点でログを保存
 * - 文字数の増減（charCountDelta）も記録する
 */
export function useEditLog({ manuscriptId, charCount }: UseEditLogOptions): void {
  const appendLog = useManuscriptStore((s) => s.appendLog)

  const sessionStartRef = useRef<number | null>(null)
  const startCharCountRef = useRef<number>(0)
  const currentManuscriptRef = useRef<ManuscriptId | null>(null)

  // セッション終了処理
  const endSession = () => {
    const id = currentManuscriptRef.current
    const start = sessionStartRef.current
    if (!id || start === null) return

    const endedAt = Math.floor(Date.now() / 1000)
    // 1秒未満のセッションは記録しない
    if (endedAt - start < 1) return

    appendLog(id, {
      startedAt: start,
      endedAt,
      charCountDelta: charCount - startCharCountRef.current,
    })

    sessionStartRef.current = null
    startCharCountRef.current = 0
  }

  useEffect(() => {
    if (manuscriptId !== currentManuscriptRef.current) {
      // 別の原稿に切り替わった場合、前のセッションを終了する
      endSession()
    }

    if (manuscriptId) {
      sessionStartRef.current = Math.floor(Date.now() / 1000)
      startCharCountRef.current = charCount
      currentManuscriptRef.current = manuscriptId
    } else {
      currentManuscriptRef.current = null
    }

    return () => {
      // アンマウント時にセッションを終了する
      endSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscriptId])
}
