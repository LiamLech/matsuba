// ============================================================
// matsuba - PaneHeader（ペインのヘッダー）
// ============================================================

import React from 'react'
import type { ManuscriptId, VersionId, PaneIndex } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { useUIStore } from '../../store/uiStore'
import styles from './PaneHeader.module.css'

type PaneHeaderProps = {
  paneIndex: PaneIndex
  manuscriptId: ManuscriptId | null
  versionId: VersionId | null
  onClose: () => void
  canClose: boolean
}

export const PaneHeader: React.FC<PaneHeaderProps> = ({
  paneIndex,
  manuscriptId,
  versionId,
  onClose,
  canClose,
}) => {
  const manuscripts = useManuscriptStore((s) => s.manuscripts)
  const openInPane = useUIStore((s) => s.openInPane)
  const setPaneVersion = useUIStore((s) => s.setPaneVersion)

  const currentManuscript = manuscripts.find((m) => m.id === manuscriptId) ?? null
  const versions = currentManuscript?.versions ?? []
  const isReadOnly = versionId !== null

  const handleManuscriptChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value as ManuscriptId
    if (id) openInPane(paneIndex, id, null)
  }

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setPaneVersion(paneIndex, val === 'current' ? null : val as VersionId)
  }

  return (
    <div className={`${styles.header} ${isReadOnly ? styles.headerReadOnly : ''}`}>
      {/* 原稿選択 */}
      <select
        className={styles.select}
        value={manuscriptId ?? ''}
        onChange={handleManuscriptChange}
        aria-label="原稿を選択"
      >
        <option value="">— 原稿を選択 —</option>
        {manuscripts.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
      </select>

      {/* バージョン選択（原稿が選択されているとき） */}
      {currentManuscript && (
        <>
          <span className={styles.sep}>›</span>
          <select
            className={styles.select}
            value={versionId ?? 'current'}
            onChange={handleVersionChange}
            aria-label="バージョンを選択"
          >
            <option value="current">現在の版（編集中）</option>
            {[...versions].reverse().map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </>
      )}

      {/* 読み取り専用バッジ */}
      {isReadOnly && (
        <span className={styles.readOnlyBadge}>読み取り専用</span>
      )}

      <div className={styles.spacer} />

      {/* 閉じるボタン */}
      {canClose && (
        <button
          className={`btn btn--ghost ${styles.closeBtn}`}
          onClick={onClose}
          aria-label="ペインを閉じる"
          title="ペインを閉じる"
        >
          ×
        </button>
      )}
    </div>
  )
}
