// ============================================================
// matsuba - LogView（執筆ログビュー）
// ============================================================

import React, { useState } from 'react'
import { Timeline } from './Timeline'
import { CalendarView } from './CalendarView'
import { useManuscriptStore } from '../../store/manuscriptStore'
import styles from './LogView.module.css'

type LogTab = 'timeline' | 'calendar'

export const LogView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LogTab>('timeline')
  const manuscripts = useManuscriptStore((s) => s.manuscripts)

  // 全体の統計
  const totalSessions = manuscripts.reduce((sum, m) => sum + (m.logs?.length ?? 0), 0)
  const totalSeconds = manuscripts.reduce(
    (sum, m) => sum + (m.logs ?? []).reduce((s, log) => s + (log.endedAt - log.startedAt), 0),
    0
  )
  const totalHours = Math.floor(totalSeconds / 3600)
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60)

  return (
    <div className={styles.view}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>
              {totalHours > 0 ? `${totalHours}h ${totalMinutes}m` : `${totalMinutes}m`}
            </span>
            <span className={styles.statLabel}>総執筆時間</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{totalSessions}</span>
            <span className={styles.statLabel}>セッション数</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{manuscripts.length}</span>
            <span className={styles.statLabel}>原稿数</span>
          </div>
        </div>

        {/* タブ */}
        <div className={styles.tabs}>
          {([
            { id: 'timeline', label: 'タイムライン' },
            { id: 'calendar', label: 'カレンダー' },
          ] as { id: LogTab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* コンテンツ */}
      <div className={styles.content}>
        {activeTab === 'timeline' && <Timeline />}
        {activeTab === 'calendar' && <CalendarView />}
      </div>
    </div>
  )
}
