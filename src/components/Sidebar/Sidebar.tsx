// ============================================================
// matsuba - Sidebar
// ============================================================

import React, { useState } from 'react'
import type { TagId } from '../../types'
import { useUIStore } from '../../store/uiStore'
import { ManuscriptList } from './ManuscriptList'
import { TagFilter } from './TagFilter'
import styles from './Sidebar.module.css'

export const Sidebar: React.FC = () => {
  const [selectedTagIds, setSelectedTagIds] = useState<TagId[]>([])
  const isSidebarOpen = useUIStore((s) => s.isSidebarOpen)
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen)

  const handleToggle = (tagId: TagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    )
  }

  const handleClear = () => setSelectedTagIds([])

  // モバイルで原稿を選択したらサイドバーを閉じる
  const handleManuscriptSelect = () => {
    if (window.innerWidth <= 768) {
      setSidebarOpen(false)
    }
  }

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isSidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99,
            background: 'rgba(0,0,0,0.3)',
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
        <ManuscriptList
          filterTagIds={selectedTagIds}
          onManuscriptSelect={handleManuscriptSelect}
        />
        <TagFilter
          selectedTagIds={selectedTagIds}
          onToggle={handleToggle}
          onClear={handleClear}
        />
      </aside>
    </>
  )
}
