// ============================================================
// matsuba - Header
// ============================================================

import React from 'react'
import type { ViewMode, PaneCount } from '../../types'
import { useUIStore } from '../../store/uiStore'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { useBackup } from '../../hooks/useBackup'
import styles from './Header.module.css'

const PANE_ICONS: Record<PaneCount, string> = {
  1: '▭',
  2: '▭▭',
  3: '▭▭▭',
}

export const Header: React.FC = () => {
  const { viewMode, paneCount, scrollSynced, setViewMode, setPaneCount, setScrollSynced } =
    useUIStore()
  const manuscripts = useManuscriptStore((s) => s.manuscripts)
  const { exportAllAsZip } = useBackup()

  const handleBackup = async () => {
    if (manuscripts.length === 0) {
      window.alert('バックアップする原稿がありません。')
      return
    }
    await exportAllAsZip(manuscripts)
  }

  return (
    <header className={styles.header}>
      {/* アプリ名 */}
      <div className={styles.logo}>matsuba</div>

      <div className={styles.divider} />

      {/* ペイン数切り替え（編集モード時のみ） */}
      {viewMode === 'editor' && (
        <div className={styles.paneControls}>
          {([1, 2, 3] as PaneCount[]).map((n) => (
            <button
              key={n}
              className={`${styles.paneBtn} ${paneCount === n ? styles.paneBtnActive : ''}`}
              onClick={() => setPaneCount(n)}
              title={`${n}ペイン`}
              aria-pressed={paneCount === n}
            >
              {PANE_ICONS[n]}
            </button>
          ))}
        </div>
      )}

      {/* 同期スクロール（編集モード・2ペイン以上） */}
      {viewMode === 'editor' && paneCount > 1 && (
        <button
          className={`btn btn--ghost ${styles.syncBtn} ${scrollSynced ? styles.syncBtnActive : ''}`}
          onClick={() => setScrollSynced(!scrollSynced)}
          title="同期スクロール"
        >
          ⇅ 同期
        </button>
      )}

      <div className={styles.spacer} />

      {/* 全体バックアップ */}
      <button
        className={`btn btn--ghost ${styles.backupBtn}`}
        onClick={handleBackup}
        title="全原稿をZIPでバックアップ"
      >
        ↓ バックアップ
      </button>

      <div className={styles.divider} />

      {/* 表示モード切り替え */}
      <nav className={styles.nav}>
        {(['editor', 'log', 'settings'] as ViewMode[]).map((mode) => {
          const labels: Record<ViewMode, string> = {
            editor: '編集',
            log: 'ログ',
            settings: '設定',
          }
          return (
            <button
              key={mode}
              className={`${styles.navBtn} ${viewMode === mode ? styles.navBtnActive : ''}`}
              onClick={() => setViewMode(mode)}
              aria-current={viewMode === mode ? 'page' : undefined}
            >
              {labels[mode]}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
