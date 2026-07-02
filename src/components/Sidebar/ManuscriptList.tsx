// ============================================================
// matsuba - ManuscriptList（ドラッグ並べ替え・ソート付き一覧）
// ============================================================

import React, { useState } from 'react'
import type { SortKey, TagId } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { useUIStore } from '../../store/uiStore'
import { ManuscriptItem } from './ManuscriptItem'
import styles from './ManuscriptList.module.css'

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'manual',    label: '手動' },
  { key: 'updatedAt', label: '更新日' },
  { key: 'createdAt', label: '作成日' },
  { key: 'title',     label: 'タイトル' },
]

type ManuscriptListProps = {
  filterTagIds: TagId[]
  onManuscriptSelect?: () => void
}

export const ManuscriptList: React.FC<ManuscriptListProps> = ({ filterTagIds, onManuscriptSelect }) => {
  const {
    getSorted,
    sortConfig,
    setSortConfig,
    createManuscript,
    updateManuscript,
    removeManuscript,
    reorderManuscripts,
  } = useManuscriptStore()

  const { panes, activePaneIndex, openInPane, setViewMode } = useUIStore()

  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const sorted = getSorted()
  // タグフィルタが設定されている場合は絞り込む
  const filtered = filterTagIds.length === 0
    ? sorted
    : sorted.filter((m) => filterTagIds.every((tagId) => m.tags.includes(tagId)))
  const activeManuscriptId = panes[activePaneIndex].manuscriptId

  // ── ドラッグ&ドロップ ──────────────────────────────────

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragFromIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverIndex(index)
  }

  const handleDrop = (toIndex: number) => async (e: React.DragEvent) => {
    e.preventDefault()
    if (dragFromIndex === null || dragFromIndex === toIndex) {
      setDragFromIndex(null)
      setDragOverIndex(null)
      return
    }
    await reorderManuscripts(dragFromIndex, toIndex)
    setDragFromIndex(null)
    setDragOverIndex(null)
    // 手動並べ替えを使ったらソートをmanualに戻す
    if (sortConfig.key !== 'manual') {
      setSortConfig({ key: 'manual', order: 'asc' })
    }
  }

  const handleDragEnd = () => {
    setDragFromIndex(null)
    setDragOverIndex(null)
  }

  // ── ソート切り替え ───────────────────────────────────────

  const toggleSort = (key: SortKey) => {
    if (sortConfig.key === key) {
      setSortConfig({ key, order: sortConfig.order === 'asc' ? 'desc' : 'asc' })
    } else {
      setSortConfig({ key, order: 'asc' })
    }
  }

  // ── 新規作成 ────────────────────────────────────────────

  const handleCreate = async () => {
    const title = window.prompt('原稿名を入力してください', '無題の原稿')
    if (title === null) return  // キャンセル時は何もしない
    const manuscript = await createManuscript(title.trim() || '無題の原稿')
    openInPane(activePaneIndex, manuscript.id)
  }

  // ── 削除 ─────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!window.confirm('この原稿を削除しますか？この操作は取り消せません。')) return
    await removeManuscript(id)
  }

  return (
    <div className={styles.container}>
      {/* ヘッダー */}
      <div className={styles.header}>
        <span className="section-label">原稿</span>
        <button
          className={`btn btn--ghost ${styles.newBtn}`}
          onClick={handleCreate}
          title="新規原稿"
          aria-label="新規原稿を作成"
        >
          ＋
        </button>
      </div>

      {/* ソートバー */}
      <div className={styles.sortBar}>
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            className={`${styles.sortBtn} ${sortConfig.key === key ? styles.sortBtnActive : ''}`}
            onClick={() => toggleSort(key)}
          >
            {label}
            {sortConfig.key === key && (
              <span className={styles.sortArrow}>
                {sortConfig.order === 'asc' ? '↑' : '↓'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 一覧 */}
      <div className={styles.list} onDragEnd={handleDragEnd}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            {sorted.length === 0 ? (
              <>
                <p>原稿がありません</p>
                <button className="btn btn--primary" onClick={handleCreate}>
                  最初の原稿を作成
                </button>
              </>
            ) : (
              <p>該当する原稿がありません</p>
            )}
          </div>
        ) : (
          filtered.map((manuscript, index) => (
            <div
              key={manuscript.id}
              className={`${styles.itemWrapper} ${dragOverIndex === index ? styles.dragOver : ''}`}
            >
              <ManuscriptItem
                manuscript={manuscript}
                isActive={activeManuscriptId === manuscript.id}
                onClick={() => {
                  openInPane(activePaneIndex, manuscript.id)
                  setViewMode('editor')
                  onManuscriptSelect?.()
                }}
                onDelete={() => handleDelete(manuscript.id)}
                onRename={(title) => updateManuscript(manuscript.id, { title })}
                draggable={sortConfig.key === 'manual'}
                onDragStart={handleDragStart(index)}
                onDragOver={handleDragOver(index)}
                onDrop={handleDrop(index)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  )
}
