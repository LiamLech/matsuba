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

  const paneIndices = ([0, 1, 2] as PaneIndex[]).slice(0, paneCount)

  return (
    <div className={`${styles.container} ${styles[`panes${paneCount}`]}`}>
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
