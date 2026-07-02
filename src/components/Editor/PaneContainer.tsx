// ============================================================
// matsuba - PaneContainer（1〜3ペインのレイアウト管理）
// ============================================================

import React from "react"
import type { PaneIndex } from '../../types'
import { useUIStore } from '../../store/uiStore'
import { useScrollSync } from '../../hooks/useScrollSync'
import { EditorPane } from './EditorPane'
import styles from './PaneContainer.module.css'

export const PaneContainer: React.FC = () => {
  const paneCount = useUIStore((s) => s.paneCount)
  const { registerPane, onScroll } = useScrollSync()

  // モバイルでは常に1ペイン
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768)
  React.useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  const effectivePaneCount = isMobile ? 1 : paneCount
  const paneIndices = ([0, 1, 2] as PaneIndex[]).slice(0, effectivePaneCount)

  return (
    <div className={`${styles.container} ${styles[`panes${effectivePaneCount}`]}`}>
      {paneIndices.map((index) => (
        <EditorPane
          key={index}
          paneIndex={index}
          scrollRef={(el) => registerPane(index, el)}
          onScroll={() => onScroll(index)}
        />
      ))}
    </div>
  )
}
