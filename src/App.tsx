// ============================================================
// matsuba - App ルートコンポーネント
// ============================================================

import React, { useEffect, useCallback } from 'react'
import { Header } from './components/common/Header'
import { Sidebar } from './components/Sidebar/Sidebar'
import { PaneContainer } from './components/Editor/PaneContainer'
import { SettingsView } from './components/Settings/SettingsView'
import { LogView } from './components/Log/LogView'
import { useManuscriptStore } from './store/manuscriptStore'
import { useTagStore } from './store/tagStore'
import { useLayoutStore } from './store/layoutStore'
import { useUIStore } from './store/uiStore'
import { useBackup } from './hooks/useBackup'
import { seedInitialData } from './db'
import styles from './App.module.css'

const App: React.FC = () => {
  const viewMode = useUIStore((s) => s.viewMode)
  const activePaneIndex = useUIStore((s) => s.activePaneIndex)
  const panes = useUIStore((s) => s.panes)
  const setViewMode = useUIStore((s) => s.setViewMode)
  const setPaneCount = useUIStore((s) => s.setPaneCount)

  const loadManuscripts = useManuscriptStore((s) => s.loadAll)
  const manuscripts = useManuscriptStore((s) => s.manuscripts)
  const saveVersion = useManuscriptStore((s) => s.saveVersion)

  const loadTags = useTagStore((s) => s.loadAll)
  const loadLayouts = useLayoutStore((s) => s.loadAll)
  const { exportAllAsZip } = useBackup()

  // 初期化
  useEffect(() => {
    const init = async () => {
      await seedInitialData()
      await Promise.all([loadManuscripts(), loadTags(), loadLayouts()])
    }
    init()
  }, [loadManuscripts, loadTags, loadLayouts])

  // グローバルショートカット
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const mod = e.metaKey || e.ctrlKey

    // Ctrl/Cmd+S：バージョン保存
    if (mod && !e.shiftKey && e.key === 's') {
      e.preventDefault()
      const manuscriptId = panes[activePaneIndex].manuscriptId
      if (manuscriptId) saveVersion(manuscriptId)
      return
    }

    // Ctrl/Cmd+Shift+S：全体バックアップ
    if (mod && e.shiftKey && e.key === 'S') {
      e.preventDefault()
      if (manuscripts.length > 0) exportAllAsZip(manuscripts)
      return
    }

    // Ctrl/Cmd+1：編集モード
    if (mod && e.key === '1') {
      e.preventDefault()
      setViewMode('editor')
      return
    }

    // Ctrl/Cmd+2：ログモード
    if (mod && e.key === '2') {
      e.preventDefault()
      setViewMode('log')
      return
    }

    // Ctrl/Cmd+3：設定モード
    if (mod && e.key === '3') {
      e.preventDefault()
      setViewMode('settings')
      return
    }

    // Ctrl/Cmd+Shift+1：1ペイン
    if (mod && e.shiftKey && e.key === '!') {
      e.preventDefault()
      setPaneCount(1)
      return
    }

    // Ctrl/Cmd+Shift+2：2ペイン
    if (mod && e.shiftKey && e.key === '@') {
      e.preventDefault()
      setPaneCount(2)
      return
    }

    // Ctrl/Cmd+Shift+3：3ペイン
    if (mod && e.shiftKey && e.key === '#') {
      e.preventDefault()
      setPaneCount(3)
      return
    }
  }, [panes, activePaneIndex, saveVersion, manuscripts, exportAllAsZip, setViewMode, setPaneCount])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className={styles.app}>
      <Header />
      <div className={styles.body}>
        <Sidebar />
        <main className={styles.main}>
          {viewMode === 'editor'   && <PaneContainer />}
          {viewMode === 'log'      && <LogView />}
          {viewMode === 'settings' && <SettingsView />}
        </main>
      </div>
    </div>
  )
}

export default App
