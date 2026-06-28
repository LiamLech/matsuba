// ============================================================
// matsuba - ManuscriptItem（サイドバーの原稿一覧アイテム）
// ============================================================

import React, { useState, useRef } from 'react'
import type { Manuscript } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { useTagStore } from '../../store/tagStore'
import styles from './ManuscriptItem.module.css'

type ManuscriptItemProps = {
  manuscript: Manuscript
  isActive: boolean
  onClick: () => void
  onDelete: () => void
  onRename: (title: string) => void
  /** ドラッグ&ドロップ用 */
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}

function formatDate(ts: number): string {
  const d = new Date(ts * 1000)
  const mo = d.getMonth() + 1
  const da = d.getDate()
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${mo}/${da} ${h}:${m}`
}

/**
 * 現在の編集内容が最後のバージョンと異なるかどうかを判定する
 * = バージョン未保存の編集がある状態
 */
function hasUnsavedChanges(manuscript: Manuscript): boolean {
  const current = manuscript.currentContent ?? ''
  if (manuscript.versions.length === 0) {
    return current.length > 0
  }
  const lastVersion = manuscript.versions[manuscript.versions.length - 1]
  return current !== (lastVersion.content as string ?? '')
}

export const ManuscriptItem: React.FC<ManuscriptItemProps> = ({
  manuscript: manuscriptProp,
  isActive,
  onClick,
  onDelete,
  onRename,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(manuscriptProp.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const getAllTags = useTagStore((s) => s.getAllTags)

  // ストアから最新データを購読してリアルタイムに未保存状態を反映する
  const manuscript = useManuscriptStore((s) =>
    s.manuscripts.find((m) => m.id === manuscriptProp.id)
  ) ?? manuscriptProp

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation()
    setRenameValue(manuscript.title)
    setIsRenaming(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const commitRename = () => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== manuscript.title) {
      onRename(trimmed)
    }
    setIsRenaming(false)
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitRename()
    if (e.key === 'Escape') setIsRenaming(false)
  }

  // タグ情報を取得（最大2件表示）
  const allTags = getAllTags()
  const tags = manuscript.tags
    .map((id) => allTags.find((t) => t.id === id))
    .filter(Boolean)
    .slice(0, 2)

  return (
    <div
      className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
      onClick={onClick}
      onDoubleClick={startRename}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {/* シグネチャ：原稿用紙の束を表す影 */}
      <div className={styles.stackShadow} aria-hidden />

      <div className={styles.inner}>
        {/* タイトル */}
        {isRenaming ? (
          <input
            ref={inputRef}
            className={styles.renameInput}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        ) : (
          <div className={styles.title}>
            {manuscript.title}
            {hasUnsavedChanges(manuscript) && (
              <span className={styles.unsavedMark} title="バージョン未保存の編集があります">
                ●
              </span>
            )}
          </div>
        )}

        {/* タグ */}
        {tags.length > 0 && (
          <div className={styles.tags}>
            {tags.map((tag) => tag && (
              <span
                key={tag.id}
                className={styles.tag}
                style={{ borderColor: tag.color, color: tag.color }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* メタ情報 */}
        <div className={styles.meta}>
          <span className={styles.metaVersion}>v{manuscript.versions.length}</span>
          <span className={styles.metaDate}>{formatDate(manuscript.updatedAt)}</span>
        </div>
      </div>

      {/* 削除ボタン */}
      <button
        className={styles.deleteBtn}
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        title="削除"
        aria-label={`${manuscript.title}を削除`}
      >
        ×
      </button>
    </div>
  )
}
