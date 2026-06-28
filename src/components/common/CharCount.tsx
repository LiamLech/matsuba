// ============================================================
// matsuba - CharCount（文字数表示）
// ============================================================

import React from 'react'
import { useUIStore } from '../../store/uiStore'
import styles from './CharCount.module.css'

type CharCountProps = {
  count: number
  /** 目標文字数（任意） */
  target?: number
}

export const CharCount: React.FC<CharCountProps> = ({ count, target }) => {
  const charCountVisible = useUIStore((s) => s.charCountVisible)
  if (!charCountVisible) return null

  return (
    <span className={styles.charCount}>
      {count.toLocaleString('ja-JP')} 字
      {target != null && (
        <span className={styles.target}>
          {' '}/ {target.toLocaleString('ja-JP')} 字
        </span>
      )}
    </span>
  )
}
