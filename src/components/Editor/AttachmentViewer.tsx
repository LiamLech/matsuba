// ============================================================
// matsuba - AttachmentViewer（参考画像モーダル拡大表示）
// ============================================================

import React, { useEffect, useCallback } from 'react'
import type { Attachment } from '../../types'
import styles from './AttachmentViewer.module.css'

type AttachmentViewerProps = {
  attachment: Attachment
  attachments: Attachment[]
  onClose: () => void
  onChange: (attachment: Attachment) => void
}

export const AttachmentViewer: React.FC<AttachmentViewerProps> = ({
  attachment,
  attachments,
  onClose,
  onChange,
}) => {
  const currentIndex = attachments.findIndex((a) => a.id === attachment.id)
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < attachments.length - 1

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onChange(attachments[currentIndex - 1])
  }, [currentIndex, attachments, onChange])

  const goNext = useCallback(() => {
    if (currentIndex < attachments.length - 1) onChange(attachments[currentIndex + 1])
  }, [currentIndex, attachments, onChange])

  // キーボード操作
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, goPrev, goNext])

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        {/* ヘッダー */}
        <div className={styles.header}>
          <span className={styles.fileName}>{attachment.fileName}</span>
          {attachment.note && (
            <span className={styles.note}>{attachment.note}</span>
          )}
          <div className={styles.counter}>
            {currentIndex + 1} / {attachments.length}
          </div>
          <button className="btn btn--ghost" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        {/* 画像 */}
        <div className={styles.imageArea}>
          {hasPrev && (
            <button className={`${styles.navBtn} ${styles.navBtnPrev}`} onClick={goPrev} aria-label="前の画像">
              ‹
            </button>
          )}
          <img
            src={attachment.dataUrl}
            alt={attachment.fileName}
            className={styles.image}
          />
          {hasNext && (
            <button className={`${styles.navBtn} ${styles.navBtnNext}`} onClick={goNext} aria-label="次の画像">
              ›
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
