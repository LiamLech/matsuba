// ============================================================
// matsuba - TagFilter（サイドバー下部のタグフィルタ）
// ============================================================

import React, { useState } from 'react'
import type { TagId } from '../../types'
import { useTagStore } from '../../store/tagStore'
import styles from './TagFilter.module.css'

type TagFilterProps = {
  selectedTagIds: TagId[]
  onToggle: (tagId: TagId) => void
  onClear: () => void
}

export const TagFilter: React.FC<TagFilterProps> = ({ selectedTagIds, onToggle, onClear }) => {
  const { categories } = useTagStore()
  const [isExpanded, setIsExpanded] = useState(false)

  if (categories.length === 0) return null

  return (
    <div className={styles.container}>
      <button
        className={styles.toggleHeader}
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
      >
        <span className="section-label">タグで絞り込む</span>
        <span className={`${styles.arrow} ${isExpanded ? styles.arrowOpen : ''}`}>▾</span>
        {selectedTagIds.length > 0 && (
          <span className={styles.badge}>{selectedTagIds.length}</span>
        )}
      </button>

      {isExpanded && (
        <div className={styles.body}>
          {selectedTagIds.length > 0 && (
            <button className={`btn btn--ghost ${styles.clearBtn}`} onClick={onClear}>
              クリア
            </button>
          )}
          {categories.map((category) => (
            <div key={category.id} className={styles.category}>
              <div className={styles.categoryLabel}>{category.label}</div>
              <div className={styles.tagList}>
                {category.tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id)
                  return (
                    <button
                      key={tag.id}
                      className={`${styles.tagBtn} ${isSelected ? styles.tagBtnSelected : ''}`}
                      style={isSelected ? { borderColor: tag.color, color: tag.color } : {}}
                      onClick={() => onToggle(tag.id)}
                    >
                      {tag.label}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
