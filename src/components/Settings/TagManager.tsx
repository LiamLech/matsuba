// ============================================================
// matsuba - TagManager（タグ・カテゴリの管理）
// ============================================================

import React, { useState } from 'react'
import type { TagCategory, Tag } from '../../types'
import { useTagStore } from '../../store/tagStore'
import styles from './TagManager.module.css'

const PRESET_COLORS = [
  '#6E9BC9', '#C9A96E', '#9B6EC9', '#6EC98A',
  '#C96E6E', '#6EC9C9', '#C9C96E', '#9BC96E',
]

// ── カラーピッカー ──────────────────────────────────────────

const ColorPicker: React.FC<{
  value: string
  onChange: (color: string) => void
}> = ({ value, onChange }) => (
  <div className={styles.colorPicker}>
    {PRESET_COLORS.map((c) => (
      <button
        key={c}
        className={`${styles.colorDot} ${value === c ? styles.colorDotActive : ''}`}
        style={{ background: c }}
        onClick={() => onChange(c)}
        aria-label={c}
      />
    ))}
  </div>
)

// ── タグ行 ──────────────────────────────────────────────────

const TagRow: React.FC<{
  tag: Tag
  categoryId: string
}> = ({ tag, categoryId }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [label, setLabel] = useState(tag.label)
  const [color, setColor] = useState(tag.color)
  const updateTag = useTagStore((s) => s.updateTag)
  const removeTag = useTagStore((s) => s.removeTag)

  const handleSave = async () => {
    if (!label.trim()) return
    await updateTag(categoryId, tag.id, { label: label.trim(), color })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className={styles.tagRowEditing}>
        <input
          className={styles.input}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        <ColorPicker value={color} onChange={setColor} />
        <div className={styles.rowActions}>
          <button className="btn btn--primary" onClick={handleSave}>保存</button>
          <button className="btn" onClick={() => setIsEditing(false)}>戻る</button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.tagRow}>
      <span
        className={styles.tagBadge}
        style={{ borderColor: tag.color, color: tag.color }}
      >
        {tag.label}
      </span>
      <div className={styles.rowActions}>
        <button className="btn btn--ghost" onClick={() => setIsEditing(true)}>編集</button>
        <button
          className="btn btn--ghost btn--danger"
          onClick={() => removeTag(categoryId, tag.id)}
        >
          削除
        </button>
      </div>
    </div>
  )
}

// ── カテゴリブロック ─────────────────────────────────────────

const CategoryBlock: React.FC<{ category: TagCategory }> = ({ category }) => {
  const [isEditingName, setIsEditingName] = useState(false)
  const [categoryLabel, setCategoryLabel] = useState(category.label)
  const [newTagLabel, setNewTagLabel] = useState('')
  const [newTagColor, setNewTagColor] = useState(PRESET_COLORS[0])
  const [isAddingTag, setIsAddingTag] = useState(false)

  const updateCategory = useTagStore((s) => s.updateCategory)
  const removeCategory = useTagStore((s) => s.removeCategory)
  const createTag = useTagStore((s) => s.createTag)

  const handleSaveCategory = async () => {
    if (!categoryLabel.trim()) return
    await updateCategory(category.id, { label: categoryLabel.trim() })
    setIsEditingName(false)
  }

  const handleAddTag = async () => {
    if (!newTagLabel.trim()) return
    await createTag(category.id, newTagLabel.trim(), newTagColor)
    setNewTagLabel('')
    setNewTagColor(PRESET_COLORS[0])
    setIsAddingTag(false)
  }

  return (
    <div className={styles.categoryBlock}>
      {/* カテゴリヘッダー */}
      <div className={styles.categoryHeader}>
        {isEditingName ? (
          <div className={styles.categoryNameEdit}>
            <input
              className={styles.input}
              value={categoryLabel}
              onChange={(e) => setCategoryLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveCategory()}
              autoFocus
            />
            <button className="btn btn--primary" onClick={handleSaveCategory}>保存</button>
            <button className="btn" onClick={() => setIsEditingName(false)}>戻る</button>
          </div>
        ) : (
          <>
            <span className={styles.categoryLabel}>{category.label}</span>
            <div className={styles.rowActions}>
              <button className="btn btn--ghost" onClick={() => setIsEditingName(true)}>
                名前変更
              </button>
              <button
                className="btn btn--ghost btn--danger"
                onClick={() => {
                  if (window.confirm(`「${category.label}」カテゴリを削除しますか？\nタグもすべて削除されます。`)) {
                    removeCategory(category.id)
                  }
                }}
              >
                削除
              </button>
            </div>
          </>
        )}
      </div>

      {/* タグ一覧 */}
      <div className={styles.tagList}>
        {category.tags.length === 0 && (
          <div className={styles.empty}>タグがありません</div>
        )}
        {category.tags.map((tag) => (
          <TagRow key={tag.id} tag={tag} categoryId={category.id} />
        ))}
      </div>

      {/* タグ追加 */}
      {isAddingTag ? (
        <div className={styles.addTagForm}>
          <input
            className={styles.input}
            value={newTagLabel}
            onChange={(e) => setNewTagLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="タグ名"
            autoFocus
          />
          <ColorPicker value={newTagColor} onChange={setNewTagColor} />
          <div className={styles.rowActions}>
            <button className="btn btn--primary" onClick={handleAddTag}>追加</button>
            <button className="btn" onClick={() => setIsAddingTag(false)}>戻る</button>
          </div>
        </div>
      ) : (
        <button
          className={`btn btn--ghost ${styles.addTagBtn}`}
          onClick={() => setIsAddingTag(true)}
        >
          ＋ タグを追加
        </button>
      )}
    </div>
  )
}

// ── メインコンポーネント ─────────────────────────────────────

export const TagManager: React.FC = () => {
  const categories = useTagStore((s) => s.categories)
  const createCategory = useTagStore((s) => s.createCategory)
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryLabel, setNewCategoryLabel] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState(PRESET_COLORS[0])

  const handleAddCategory = async () => {
    if (!newCategoryLabel.trim()) return
    await createCategory(newCategoryLabel.trim(), newCategoryColor)
    setNewCategoryLabel('')
    setNewCategoryColor(PRESET_COLORS[0])
    setIsAddingCategory(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>タグ管理</h2>
        <p className={styles.desc}>
          カテゴリとタグを管理します。原稿の整理・絞り込みに使います。
        </p>
      </div>

      {categories.map((category) => (
        <CategoryBlock key={category.id} category={category} />
      ))}

      {/* カテゴリ追加 */}
      {isAddingCategory ? (
        <div className={styles.addCategoryForm}>
          <input
            className={styles.input}
            value={newCategoryLabel}
            onChange={(e) => setNewCategoryLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            placeholder="カテゴリ名（例：用途、プロジェクト）"
            autoFocus
          />
          <ColorPicker value={newCategoryColor} onChange={setNewCategoryColor} />
          <div className={styles.rowActions}>
            <button className="btn btn--primary" onClick={handleAddCategory}>追加</button>
            <button className="btn" onClick={() => setIsAddingCategory(false)}>戻る</button>
          </div>
        </div>
      ) : (
        <button
          className={`btn ${styles.addCategoryBtn}`}
          onClick={() => setIsAddingCategory(true)}
        >
          ＋ カテゴリを追加
        </button>
      )}
    </div>
  )
}
