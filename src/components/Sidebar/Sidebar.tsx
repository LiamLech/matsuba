// ============================================================
// matsuba - Sidebar
// ============================================================

import React, { useState } from 'react'
import type { TagId } from '../../types'
import { ManuscriptList } from './ManuscriptList'
import { TagFilter } from './TagFilter'
import styles from './Sidebar.module.css'

export const Sidebar: React.FC = () => {
  const [selectedTagIds, setSelectedTagIds] = useState<TagId[]>([])

  const handleToggle = (tagId: TagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleClear = () => setSelectedTagIds([])

  return (
    <aside className={styles.sidebar}>
      <ManuscriptList filterTagIds={selectedTagIds} />
      <TagFilter
        selectedTagIds={selectedTagIds}
        onToggle={handleToggle}
        onClear={handleClear}
      />
    </aside>
  )
}
