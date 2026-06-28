// ============================================================
// matsuba - EditorPane（1つのペイン）
// ============================================================

import React, { useState, useCallback } from 'react'
import type { PaneIndex } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { useLayoutStore } from '../../store/layoutStore'
import { useUIStore } from '../../store/uiStore'
import { PaneHeader } from './PaneHeader'
import { SimpleEditor } from './SimpleEditor'
import { VersionPanel } from './VersionPanel'
import { ExportMenu } from './ExportMenu'
import { ManuscriptDetailPanel } from './ManuscriptDetailPanel'
import { CharCount } from '../common/CharCount'
import styles from './EditorPane.module.css'

type EditorPaneProps = {
  paneIndex: PaneIndex
  scrollRef?: (el: HTMLDivElement | null) => void
  onScroll?: () => void
}

export const EditorPane: React.FC<EditorPaneProps> = ({
  paneIndex,
  scrollRef,
  onScroll,
}) => {
  const panes = useUIStore((s) => s.panes)
  const paneCount = useUIStore((s) => s.paneCount)
  const setPaneCount = useUIStore((s) => s.setPaneCount)
  const setActivePane = useUIStore((s) => s.setActivePane)

  const pane = panes[paneIndex]
  const { manuscriptId, versionId } = pane

  // セレクタで直接購読して更新を検知する
  const manuscript = useManuscriptStore((s) =>
    s.manuscripts.find((m) => m.id === (manuscriptId ?? ''))
  ) ?? null
  const presets = useLayoutStore((s) => s.presets)
  const preset = presets.find((p) => p.id === (manuscript?.layoutId ?? 'prose')) ?? {
    id: 'prose', label: '散文', isBuiltIn: true,
    lineHeight: 1.9, fontSize: 16, indent: 'none' as const,
    alignment: 'left' as const, letterSpacing: 0.02, paragraphSpacing: 1,
  }

  const [charCount, setCharCount] = useState(0)
  const [showVersionPanel, setShowVersionPanel] = useState(true)
  const [showDetailPanel, setShowDetailPanel] = useState(false)

  const isReadOnly = versionId !== null

  const handleClose = useCallback(() => {
    const newCount = Math.max(1, paneCount - 1) as 1 | 2 | 3
    setPaneCount(newCount)
  }, [paneCount, setPaneCount])

  const handleFocus = () => {
    setActivePane(paneIndex)
  }

  // 原稿が選択されていない状態
  if (!manuscriptId || !manuscript) {
    return (
      <div className={styles.pane} onClick={handleFocus}>
        <PaneHeader
          paneIndex={paneIndex}
          manuscriptId={null}
          versionId={null}
          onClose={handleClose}
          canClose={paneCount > 1}
        />
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>✎</div>
          <p className={styles.emptyText}>原稿を選択してください</p>
          <p className={styles.emptyHint}>左のサイドバーから原稿を選択するか<br />新しい原稿を作成してください</p>
        </div>
      </div>
    )
  }

  const displayContent = isReadOnly
    ? (manuscript.versions.find((v) => v.id === versionId)?.content as string ?? '')
    : manuscript.currentContent ?? ''

  return (
    <div className={styles.pane} onMouseDown={handleFocus}>
      <PaneHeader
        paneIndex={paneIndex}
        manuscriptId={manuscriptId}
        versionId={versionId}
        onClose={handleClose}
        canClose={paneCount > 1}
      />

      <div className={styles.body}>
        <div className={styles.editorArea}>
          {isReadOnly ? (
            <div
              className={styles.readOnlyWrapper}
              ref={scrollRef}
              onScroll={onScroll}
            >
              <div
                className={styles.readOnlyContent}
                style={{
                  lineHeight: preset.lineHeight,
                  fontSize: preset.fontSize,
                  letterSpacing: `${preset.letterSpacing}em`,
                  writingMode: manuscript.direction === 'vertical' ? 'vertical-rl' : undefined,
                }}
              >
                {displayContent || <span className={styles.emptyVersion}>（内容なし）</span>}
              </div>
            </div>
          ) : (
            <SimpleEditor
              manuscriptId={manuscriptId}
              preset={preset}
              direction={manuscript.direction}
              onCharCountChange={setCharCount}
              scrollRef={scrollRef}
              onScroll={onScroll}
            />
          )}
        </div>

        {!isReadOnly && showVersionPanel && (
          <VersionPanel
            manuscriptId={manuscriptId}
            currentVersionId={versionId}
            currentContent=""
          />
        )}

        {showDetailPanel && (
          <ManuscriptDetailPanel
            manuscriptId={manuscriptId}
            onClose={() => setShowDetailPanel(false)}
          />
        )}
      </div>

      <div className={styles.statusBar}>
        <span className={styles.presetLabel}>{preset.label}</span>
        {manuscript.direction === 'vertical' && (
          <span className={styles.directionLabel}>縦書き</span>
        )}
        <div className={styles.spacer} />
        {!isReadOnly && <CharCount count={charCount} />}
        <ExportMenu
          manuscript={manuscript}
          currentVersion={
            isReadOnly
              ? manuscript.versions.find((v) => v.id === versionId) ?? null
              : null
          }
        />
        {!isReadOnly && (
          <button
            className={`btn btn--ghost ${styles.toggleVersionBtn}`}
            onClick={() => setShowVersionPanel((v) => !v)}
            title="バージョン履歴"
          >
            {showVersionPanel ? '履歴 ▸' : '履歴 ◂'}
          </button>
        )}
        <button
          className={`btn btn--ghost ${styles.toggleVersionBtn} ${showDetailPanel ? styles.activePanelBtn : ''}`}
          onClick={() => setShowDetailPanel((v) => !v)}
          title="原稿の設定"
        >
          設定 ⚙
        </button>
      </div>
    </div>
  )
}
