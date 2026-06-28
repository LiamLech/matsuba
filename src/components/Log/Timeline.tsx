// ============================================================
// matsuba - Timeline（執筆ログのタイムライン表示）
// ============================================================

import React, { useMemo } from 'react'
import type { EditLog, Manuscript } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { useUIStore } from '../../store/uiStore'
import styles from './Timeline.module.css'

// ── ユーティリティ ───────────────────────────────────────────

function formatDate(ts: number): string {
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${String(d.getDate()).padStart(2, '0')}`
}

function formatTime(ts: number): string {
  const d = new Date(ts * 1000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}時間${m}分${s}秒`
  if (m > 0) return `${m}分${s}秒`
  return `${s}秒`
}

// ── 型定義 ──────────────────────────────────────────────────

type LogEntry = {
  log: EditLog
  manuscript: Manuscript
}

type DayGroup = {
  date: string
  entries: LogEntry[]
  totalSeconds: number
}

// ── コンポーネント ───────────────────────────────────────────

export const Timeline: React.FC = () => {
  const manuscripts = useManuscriptStore((s) => s.manuscripts)
  const openInPane = useUIStore((s) => s.openInPane)
  const activePaneIndex = useUIStore((s) => s.activePaneIndex)
  const setViewMode = useUIStore((s) => s.setViewMode)

  const jumpToManuscript = (manuscriptId: string) => {
    openInPane(activePaneIndex, manuscriptId)
    setViewMode('editor')
  }

  // 全原稿のログをフラット化して日付でグループ化
  const dayGroups = useMemo<DayGroup[]>(() => {
    const allEntries: LogEntry[] = manuscripts.flatMap((manuscript) =>
      (manuscript.logs ?? []).map((log) => ({ log, manuscript }))
    )

    // startedAt の降順でソート
    allEntries.sort((a, b) => b.log.startedAt - a.log.startedAt)

    // 日付でグループ化
    const map = new Map<string, LogEntry[]>()
    for (const entry of allEntries) {
      const date = formatDate(entry.log.startedAt)
      if (!map.has(date)) map.set(date, [])
      map.get(date)!.push(entry)
    }

    return Array.from(map.entries()).map(([date, entries]) => ({
      date,
      entries,
      totalSeconds: entries.reduce((sum, e) => sum + (e.log.endedAt - e.log.startedAt), 0),
    }))
  }, [manuscripts])

  if (dayGroups.length === 0) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon}>✎</div>
        <p>執筆ログがまだありません</p>
        <p className={styles.emptyHint}>原稿を編集すると自動的に記録されます</p>
      </div>
    )
  }

  return (
    <div className={styles.timeline}>
      {dayGroups.map((group) => (
        <div key={group.date} className={styles.dayGroup}>
          {/* 日付ヘッダー */}
          <div className={styles.dayHeader}>
            <span className={styles.dayDate}>{group.date}</span>
            <span className={styles.dayTotal}>
              合計 {formatDuration(group.totalSeconds)}
            </span>
          </div>

          {/* セッション一覧 */}
          <div className={styles.sessions}>
            {group.entries.map(({ log, manuscript }) => {
              const duration = log.endedAt - log.startedAt
              return (
                <div key={log.id} className={styles.session}>
                  {/* 左側：タイムバー */}
                  <div className={styles.sessionBar}>
                    <div className={styles.sessionDot} />
                    <div className={styles.sessionLine} />
                  </div>

                  {/* 右側：詳細 */}
                  <div className={styles.sessionBody}>
                    <button
                      className={styles.sessionTitle}
                      onClick={() => jumpToManuscript(manuscript.id)}
                      title="原稿を開く"
                    >
                      {manuscript.title}
                    </button>
                    <div className={styles.sessionMeta}>
                      <span className={styles.sessionTime}>
                        {formatTime(log.startedAt)} 〜 {formatTime(log.endedAt)}
                      </span>
                      <span className={styles.sessionDuration}>
                        {formatDuration(duration)}
                      </span>
                      {log.charCountDelta !== 0 && (
                        <span className={`${styles.sessionDelta} ${log.charCountDelta > 0 ? styles.positive : styles.negative}`}>
                          {log.charCountDelta > 0 ? `+${log.charCountDelta}` : log.charCountDelta}字
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
