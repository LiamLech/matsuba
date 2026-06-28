// ============================================================
// matsuba - ManuscriptDetailPanel（原稿の詳細設定パネル）
// ============================================================

import React from 'react'
import type { ManuscriptId } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { useTagStore } from '../../store/tagStore'
import { useLayoutStore } from '../../store/layoutStore'
import styles from './ManuscriptDetailPanel.module.css'

type ManuscriptDetailPanelProps = {
  manuscriptId: ManuscriptId
  onClose: () => void
}

export const ManuscriptDetailPanel: React.FC<ManuscriptDetailPanelProps> = ({
  manuscriptId,
  onClose,
}) => {
  // セレクタで直接原稿を購読することで更新を検知する
  const manuscript = useManuscriptStore((s) =>
    s.manuscripts.find((m) => m.id === manuscriptId)
  )
  const updateManuscript = useManuscriptStore((s) => s.updateManuscript)
  const categories = useTagStore((s) => s.categories)
  const presets = useLayoutStore((s) => s.presets)

  if (!manuscript) return null

  const currentTagIds = manuscript.tags ?? []
  const currentLayoutId = manuscript.layoutId
  const currentDirection = manuscript.direction

  // ── タグのトグル（カテゴリ内排他選択） ──────────────────────

  const handleTagToggle = async (tagId: string, categoryId: string) => {
    const latest = useManuscriptStore.getState().manuscripts.find((m) => m.id === manuscriptId)
    const latestTags = latest?.tags ?? []

    // 同じカテゴリに属するタグIDを取得
    const category = categories.find((c) => c.id === categoryId)
    const siblingTagIds = category?.tags.map((t) => t.id) ?? []

    // 同カテゴリのタグをすべて外してから選択タグを付与（すでに選択中なら外すだけ）
    const withoutSiblings = latestTags.filter((id) => !siblingTagIds.includes(id))
    const next = latestTags.includes(tagId)
      ? withoutSiblings              // すでに選択中 → 外す
      : [...withoutSiblings, tagId]  // 未選択 → カテゴリ内の他を外して付与

    await updateManuscript(manuscriptId, { tags: next })
  }

  // ── プリセット選択 ────────────────────────────────────────

  const handlePresetChange = async (layoutId: string) => {
    await updateManuscript(manuscriptId, { layoutId })
  }

  // ── 書字方向 ──────────────────────────────────────────────

  const handleDirectionChange = async (direction: 'horizontal' | 'vertical') => {
    await updateManuscript(manuscriptId, { direction })
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className="section-label">原稿の設定</span>
        <button className="btn btn--ghost" onClick={onClose} aria-label="閉じる">
          ×
        </button>
      </div>

      <div className={styles.body}>
        {/* 書字方向 */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>書字方向</div>
          <div className={styles.segmented}>
            <button
              className={`${styles.segBtn} ${currentDirection === 'horizontal' ? styles.segBtnActive : ''}`}
              onClick={() => handleDirectionChange('horizontal')}
            >
              横書き
            </button>
            <button
              className={`${styles.segBtn} ${currentDirection === 'vertical' ? styles.segBtnActive : ''}`}
              onClick={() => handleDirectionChange('vertical')}
            >
              縦書き
            </button>
          </div>
        </div>

        {/* レイアウトプリセット */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>レイアウト</div>
          <div className={styles.presetList}>
            {presets.map((preset) => (
              <button
                key={preset.id}
                className={`${styles.presetBtn} ${currentLayoutId === preset.id ? styles.presetBtnActive : ''}`}
                onClick={() => handlePresetChange(preset.id)}
              >
                <span className={styles.presetName}>{preset.label}</span>
                <span className={styles.presetMeta}>
                  {preset.fontSize}px · 行間{preset.lineHeight}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* タグ */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>タグ</div>
          {categories.length === 0 ? (
            <div className={styles.empty}>
              設定画面でタグを作成してください
            </div>
          ) : (
            categories.map((category) => (
              <div key={category.id} className={styles.categoryGroup}>
                <div className={styles.categoryLabel}>{category.label}</div>
                <div className={styles.tagList}>
                  {category.tags.map((tag) => {
                    const isSelected = currentTagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        className={`${styles.tagBtn} ${isSelected ? styles.tagBtnSelected : ''}`}
                        style={isSelected ? { borderColor: tag.color, color: tag.color } : {}}
                        onClick={() => handleTagToggle(tag.id, category.id)}
                      >
                        {tag.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
