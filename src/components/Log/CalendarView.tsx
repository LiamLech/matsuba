// ============================================================
// matsuba - CalendarView（執筆ログのカレンダー表示）
// 週・月・年の3粒度切り替え・原稿フィルタ・タグ色分け対応
// ============================================================

import React, { useState, useMemo } from 'react'
import type { CalendarViewMode } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { useTagStore } from '../../store/tagStore'
import { useUIStore } from '../../store/uiStore'
import styles from './CalendarView.module.css'

// ── ユーティリティ ───────────────────────────────────────────

function toDateKey(ts: number): string {
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h${m}m`
  if (m > 0) return `${m}m`
  return `${seconds}s`
}

type ManuscriptMeta = {
  id: string
  title: string
  color: string  // タグの色（ジャンルカテゴリから取得）
}


// ── 年ビュー ──────────────────────────────────────────────────

const YearView: React.FC<{
  dayMap: Map<string, { seconds: number; color: string }>
  year: number
}> = ({ dayMap, year }) => {
  const cells = useMemo(() => {
    const result: { key: string; seconds: number; color: string }[] = []
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const entry = dayMap.get(key)
      result.push({ key, seconds: entry?.seconds ?? 0, color: entry?.color ?? '#C4956A' })
    }
    return result
  }, [dayMap, year])

  const maxSeconds = Math.max(...cells.map((c) => c.seconds), 1)

  const getOpacity = (seconds: number): number => {
    if (seconds === 0) return 0
    const ratio = seconds / maxSeconds
    if (ratio < 0.25) return 0.2
    if (ratio < 0.5)  return 0.45
    if (ratio < 0.75) return 0.7
    return 1
  }

  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']

  return (
    <div className={styles.yearView}>
      <div className={styles.yearMonths}>
        {months.map((m) => <span key={m} className={styles.yearMonth}>{m}</span>)}
      </div>
      <div className={styles.yearGrid}>
        {cells.map(({ key, seconds, color }) => (
          <div
            key={key}
            className={styles.yearCell}
            style={seconds > 0 ? {
              backgroundColor: color,
              opacity: getOpacity(seconds),
            } : undefined}
            title={seconds > 0 ? `${key}: ${formatDuration(seconds)}` : key}
          />
        ))}
      </div>
      <div className={styles.yearLegend}>
        <span className={styles.legendLabel}>少ない</span>
        {[0.0, 0.2, 0.45, 0.7, 1.0].map((op, i) => (
          <div
            key={i}
            className={styles.yearCell}
            style={op > 0 ? { backgroundColor: '#C4956A', opacity: op } : undefined}
          />
        ))}
        <span className={styles.legendLabel}>多い</span>
      </div>
    </div>
  )
}

// ── 月ビュー ──────────────────────────────────────────────────

const MonthView: React.FC<{
  dayMap: Map<string, { seconds: number; color: string }>
  year: number
  month: number
  filterManuscriptId: string | null
}> = ({ dayMap, year, month, filterManuscriptId }) => {
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const manuscripts = useManuscriptStore((s) => s.manuscripts)
  const openInPane = useUIStore((s) => s.openInPane)
  const activePaneIndex = useUIStore((s) => s.activePaneIndex)
  const setViewMode = useUIStore((s) => s.setViewMode)

  const jumpToManuscript = (manuscriptId: string) => {
    openInPane(activePaneIndex, manuscriptId)
    setViewMode('editor')
  }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const getDayKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const filtered = filterManuscriptId
    ? manuscripts.filter((m) => m.id === filterManuscriptId)
    : manuscripts

  const selectedSessions = selectedDay
    ? filtered.flatMap((m) =>
        (m.logs ?? [])
          .filter((log) => toDateKey(log.startedAt) === selectedDay)
          .map((log) => ({ log, title: m.title, manuscriptId: m.id }))
      ).sort((a, b) => a.log.startedAt - b.log.startedAt)
    : []

  return (
    <div className={styles.monthView}>
      <div className={styles.weekdays}>
        {['日','月','火','水','木','金','土'].map((d) => (
          <div key={d} className={styles.weekday}>{d}</div>
        ))}
      </div>
      <div className={styles.monthGrid}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className={styles.monthCell} />
          const key = getDayKey(day)
          const entry = dayMap.get(key)
          const seconds = entry?.seconds ?? 0
          const color = entry?.color ?? '#C4956A'
          const isSelected = selectedDay === key
          const isToday = key === toDateKey(Math.floor(Date.now() / 1000))
          return (
            <div
              key={key}
              className={`${styles.monthCell} ${styles.monthCellDay} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
              style={seconds > 0 ? { backgroundColor: `${color}18` } : undefined}
              onClick={() => setSelectedDay(isSelected ? null : key)}
            >
              <span className={styles.dayNum}>{day}</span>
              {seconds > 0 && (
                <span className={styles.dayDuration} style={{ color }}>{formatDuration(seconds)}</span>
              )}
            </div>
          )
        })}
      </div>

      {selectedDay && selectedSessions.length > 0 && (
        <div className={styles.dayDetail}>
          <div className={styles.dayDetailTitle}>{selectedDay} のセッション</div>
          {selectedSessions.map(({ log, title, manuscriptId }) => (
            <div key={log.id} className={styles.dayDetailSession}>
              <button
                className={styles.dayDetailTitle2}
                onClick={() => jumpToManuscript(manuscriptId)}
                title="原稿を開く"
              >
                {title}
              </button>
              <span className={styles.dayDetailTime}>
                {new Date(log.startedAt * 1000).toLocaleTimeString('ja-JP')}
                {' 〜 '}
                {new Date(log.endedAt * 1000).toLocaleTimeString('ja-JP')}
              </span>
              <span className={styles.dayDetailDuration}>
                {formatDuration(log.endedAt - log.startedAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── 週ビュー ──────────────────────────────────────────────────

const WeekView: React.FC<{
  dayMap: Map<string, { seconds: number; color: string }>
  weekStart: Date
  filterManuscriptId: string | null
}> = ({ dayMap, weekStart, filterManuscriptId }) => {
  const manuscripts = useManuscriptStore((s) => s.manuscripts)
  const openInPane = useUIStore((s) => s.openInPane)
  const activePaneIndex = useUIStore((s) => s.activePaneIndex)
  const setViewMode = useUIStore((s) => s.setViewMode)

  const jumpToManuscript = (manuscriptId: string) => {
    openInPane(activePaneIndex, manuscriptId)
    setViewMode('editor')
  }

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    return d
  })

  const getDayKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const WEEKDAYS = ['日','月','火','水','木','金','土']

  const filtered = filterManuscriptId
    ? manuscripts.filter((m) => m.id === filterManuscriptId)
    : manuscripts

  return (
    <div className={styles.weekView}>
      {days.map((day) => {
        const key = getDayKey(day)
        const entry = dayMap.get(key)
        const seconds = entry?.seconds ?? 0
        const color = entry?.color ?? '#C4956A'
        const isToday = key === toDateKey(Math.floor(Date.now() / 1000))

        const sessions = filtered.flatMap((m) =>
          (m.logs ?? [])
            .filter((log) => toDateKey(log.startedAt) === key)
            .map((log) => ({ log, title: m.title, manuscriptId: m.id }))
        ).sort((a, b) => a.log.startedAt - b.log.startedAt)

        return (
          <div key={key} className={`${styles.weekDay} ${isToday ? styles.weekDayToday : ''}`}>
            <div className={styles.weekDayHeader}>
              <span className={styles.weekDayName}>{WEEKDAYS[day.getDay()]}</span>
              <span className={`${styles.weekDayNum} ${isToday ? styles.weekDayNumToday : ''}`}>
                {day.getDate()}
              </span>
              {seconds > 0 && (
                <span className={styles.weekDayTotal} style={{ color }}>{formatDuration(seconds)}</span>
              )}
            </div>
            <div className={styles.weekSessions}>
              {sessions.map(({ log, title, manuscriptId }) => (
                <div
                  key={log.id}
                  className={styles.weekSession}
                  style={{ borderLeftColor: color }}
                >
                  <button
                    className={styles.weekSessionTitle}
                    onClick={() => jumpToManuscript(manuscriptId)}
                    title="原稿を開く"
                  >
                    {title}
                  </button>
                  <div className={styles.weekSessionTime}>
                    {new Date(log.startedAt * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    {' – '}
                    {new Date(log.endedAt * 1000).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                    {' '}
                    <span className={styles.weekSessionDuration} style={{ color }}>
                      {formatDuration(log.endedAt - log.startedAt)}
                    </span>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <div className={styles.weekNoSession}>—</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── メインコンポーネント ─────────────────────────────────────

export const CalendarView: React.FC = () => {
  const manuscripts = useManuscriptStore((s) => s.manuscripts)
  const categories = useTagStore((s) => s.categories)
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [filterManuscriptId, setFilterManuscriptId] = useState<string | null>(null)

  // ジャンルカテゴリのタグ色を原稿に付与
  const genreCategory = categories.find((c) => c.id === 'genre')

  const manuscriptMetas: ManuscriptMeta[] = useMemo(() => {
    return manuscripts.map((m, i) => {
      // ジャンルタグの色を優先、なければパレットから色を割り当て
      const genreTagId = m.tags.find((tagId) =>
        genreCategory?.tags.some((t) => t.id === tagId)
      )
      const genreTag = genreCategory?.tags.find((t) => t.id === genreTagId)
      const palette = ['#C4956A', '#6E9BC9', '#9B6EC9', '#6EC98A', '#C96E6E', '#6EC9C9']
      const color = genreTag?.color ?? palette[i % palette.length]
      return { id: m.id, title: m.title, color }
    })
  }, [manuscripts, genreCategory])

  // 原稿ごとの色マップ
  const colorMap = useMemo(() => {
    const map = new Map<string, string>()
    manuscriptMetas.forEach((m) => map.set(m.id, m.color))
    return map
  }, [manuscriptMetas])

  // dayMapを生成（色情報付き）
  const dayMap = useMemo(() => {
    const map = new Map<string, { seconds: number; color: string }>()
    const filtered = filterManuscriptId
      ? manuscripts.filter((m) => m.id === filterManuscriptId)
      : manuscripts

    for (const m of filtered) {
      const color = colorMap.get(m.id) ?? '#C4956A'
      for (const log of m.logs ?? []) {
        const key = toDateKey(log.startedAt)
        const existing = map.get(key)
        map.set(key, {
          seconds: (existing?.seconds ?? 0) + (log.endedAt - log.startedAt),
          color: existing?.color ?? color,
        })
      }
    }
    return map
  }, [manuscripts, filterManuscriptId, colorMap])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const weekStart = new Date(currentDate)
  weekStart.setDate(currentDate.getDate() - currentDate.getDay())

  const navigate = (dir: -1 | 1) => {
    const d = new Date(currentDate)
    if (viewMode === 'week') d.setDate(d.getDate() + dir * 7)
    else if (viewMode === 'month') d.setMonth(d.getMonth() + dir)
    else d.setFullYear(d.getFullYear() + dir)
    setCurrentDate(d)
  }

  const periodLabel = () => {
    if (viewMode === 'week') {
      const end = new Date(weekStart)
      end.setDate(end.getDate() + 6)
      return `${weekStart.getMonth() + 1}/${weekStart.getDate()} 〜 ${end.getMonth() + 1}/${end.getDate()}`
    }
    if (viewMode === 'month') return `${year}年 ${month + 1}月`
    return `${year}年`
  }

  return (
    <div className={styles.container}>
      {/* コントロールバー */}
      <div className={styles.controls}>
        <div className={styles.modeSwitcher}>
          {(['week', 'month', 'year'] as CalendarViewMode[]).map((m) => {
            const labels: Record<CalendarViewMode, string> = { week: '週', month: '月', year: '年' }
            return (
              <button
                key={m}
                className={`${styles.modeBtn} ${viewMode === m ? styles.modeBtnActive : ''}`}
                onClick={() => setViewMode(m)}
              >
                {labels[m]}
              </button>
            )
          })}
        </div>

        <div className={styles.navigator}>
          <button className="btn btn--ghost" onClick={() => navigate(-1)}>‹</button>
          <span className={styles.periodLabel}>{periodLabel()}</span>
          <button className="btn btn--ghost" onClick={() => navigate(1)}>›</button>
        </div>

        <button className="btn btn--ghost" onClick={() => setCurrentDate(new Date())}>
          今日
        </button>

        {/* 原稿フィルタ */}
        <div className={styles.filterArea}>
          <select
            className={styles.filterSelect}
            value={filterManuscriptId ?? ''}
            onChange={(e) => setFilterManuscriptId(e.target.value || null)}
          >
            <option value="">すべての原稿</option>
            {manuscriptMetas.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 凡例（複数原稿表示時） */}
      {!filterManuscriptId && manuscriptMetas.filter((m) =>
        manuscripts.find((ms) => ms.id === m.id)?.logs?.length ?? 0 > 0
      ).length > 1 && (
        <div className={styles.legend}>
          {manuscriptMetas
            .filter((m) => (manuscripts.find((ms) => ms.id === m.id)?.logs?.length ?? 0) > 0)
            .slice(0, 8)
            .map((m) => (
              <div key={m.id} className={styles.legendItem}>
                <div className={styles.legendDot} style={{ backgroundColor: m.color }} />
                <span className={styles.legendName}>{m.title}</span>
              </div>
            ))}
        </div>
      )}

      {/* ビュー本体 */}
      <div className={styles.body}>
        {viewMode === 'week'  && <WeekView dayMap={dayMap} weekStart={weekStart} filterManuscriptId={filterManuscriptId} />}
        {viewMode === 'month' && <MonthView dayMap={dayMap} year={year} month={month} filterManuscriptId={filterManuscriptId} />}
        {viewMode === 'year'  && <YearView dayMap={dayMap} year={year} />}
      </div>
    </div>
  )
}
