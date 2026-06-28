// ============================================================
// matsuba - CalendarView（執筆ログのカレンダー表示）
// 週・月・年の3粒度切り替え対応
// ============================================================

import React, { useState, useMemo } from 'react'
import type { CalendarViewMode } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
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

/** 日付ごとの執筆秒数マップを生成 */
function buildDayMap(manuscripts: ReturnType<typeof useManuscriptStore.getState>['manuscripts']) {
  const map = new Map<string, number>()
  for (const m of manuscripts) {
    for (const log of m.logs ?? []) {
      const key = toDateKey(log.startedAt)
      map.set(key, (map.get(key) ?? 0) + (log.endedAt - log.startedAt))
    }
  }
  return map
}

// ── 年ビュー（GitHubスタイル） ───────────────────────────────

const YearView: React.FC<{ dayMap: Map<string, number>; year: number }> = ({ dayMap, year }) => {
  const cells = useMemo(() => {
    const result: { key: string; seconds: number }[] = []
    const start = new Date(year, 0, 1)
    const end = new Date(year, 11, 31)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      result.push({ key, seconds: dayMap.get(key) ?? 0 })
    }
    return result
  }, [dayMap, year])

  const maxSeconds = Math.max(...cells.map((c) => c.seconds), 1)

  const getLevel = (seconds: number): number => {
    if (seconds === 0) return 0
    const ratio = seconds / maxSeconds
    if (ratio < 0.25) return 1
    if (ratio < 0.5) return 2
    if (ratio < 0.75) return 3
    return 4
  }

  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

  return (
    <div className={styles.yearView}>
      <div className={styles.yearMonths}>
        {months.map((m) => <span key={m} className={styles.yearMonth}>{m}</span>)}
      </div>
      <div className={styles.yearGrid}>
        {cells.map(({ key, seconds }) => (
          <div
            key={key}
            className={`${styles.yearCell} ${styles[`level${getLevel(seconds)}`]}`}
            title={seconds > 0 ? `${key}: ${formatDuration(seconds)}` : key}
          />
        ))}
      </div>
      <div className={styles.yearLegend}>
        <span className={styles.legendLabel}>少ない</span>
        {[0, 1, 2, 3, 4].map((l) => (
          <div key={l} className={`${styles.yearCell} ${styles[`level${l}`]}`} />
        ))}
        <span className={styles.legendLabel}>多い</span>
      </div>
    </div>
  )
}

// ── 月ビュー ─────────────────────────────────────────────────

const MonthView: React.FC<{
  dayMap: Map<string, number>
  year: number
  month: number
}> = ({ dayMap, year, month }) => {
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

  // 選択日のセッション
  const selectedSessions = selectedDay
    ? manuscripts.flatMap((m) =>
        (m.logs ?? [])
          .filter((log) => toDateKey(log.startedAt) === selectedDay)
          .map((log) => ({ log, title: m.title, manuscriptId: m.id }))
      ).sort((a, b) => a.log.startedAt - b.log.startedAt)
    : []

  return (
    <div className={styles.monthView}>
      <div className={styles.weekdays}>
        {['日', '月', '火', '水', '木', '金', '土'].map((d) => (
          <div key={d} className={styles.weekday}>{d}</div>
        ))}
      </div>
      <div className={styles.monthGrid}>
        {cells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className={styles.monthCell} />
          const key = getDayKey(day)
          const seconds = dayMap.get(key) ?? 0
          const isSelected = selectedDay === key
          const isToday = key === toDateKey(Math.floor(Date.now() / 1000))
          return (
            <div
              key={key}
              className={`${styles.monthCell} ${styles.monthCellDay} ${seconds > 0 ? styles.hasLog : ''} ${isSelected ? styles.selected : ''} ${isToday ? styles.today : ''}`}
              onClick={() => setSelectedDay(isSelected ? null : key)}
            >
              <span className={styles.dayNum}>{day}</span>
              {seconds > 0 && (
                <span className={styles.dayDuration}>{formatDuration(seconds)}</span>
              )}
            </div>
          )
        })}
      </div>

      {/* 選択日のセッション詳細 */}
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

// ── 週ビュー ─────────────────────────────────────────────────

const WeekView: React.FC<{
  dayMap: Map<string, number>
  weekStart: Date
}> = ({ dayMap, weekStart }) => {
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

  const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土']

  return (
    <div className={styles.weekView}>
      {days.map((day) => {
        const key = getDayKey(day)
        const seconds = dayMap.get(key) ?? 0
        const isToday = key === toDateKey(Math.floor(Date.now() / 1000))
        const sessions = manuscripts.flatMap((m) =>
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
                <span className={styles.weekDayTotal}>{formatDuration(seconds)}</span>
              )}
            </div>
            <div className={styles.weekSessions}>
              {sessions.map(({ log, title, manuscriptId }) => (
                <div key={log.id} className={styles.weekSession}>
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
                    <span className={styles.weekSessionDuration}>
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
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())

  const dayMap = useMemo(() => buildDayMap(manuscripts), [manuscripts])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // 週の開始日（日曜日）
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

        <button
          className="btn btn--ghost"
          onClick={() => setCurrentDate(new Date())}
        >
          今日
        </button>
      </div>

      {/* ビュー本体 */}
      <div className={styles.body}>
        {viewMode === 'week'  && <WeekView dayMap={dayMap} weekStart={weekStart} />}
        {viewMode === 'month' && <MonthView dayMap={dayMap} year={year} month={month} />}
        {viewMode === 'year'  && <YearView dayMap={dayMap} year={year} />}
      </div>
    </div>
  )
}
