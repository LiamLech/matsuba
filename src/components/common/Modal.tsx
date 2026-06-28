// ============================================================
// matsuba - Modal（汎用）
// ============================================================

import React, { useEffect, useRef } from 'react'
import styles from './Modal.module.css'

type ModalProps = {
  isOpen: boolean
  title: string
  onClose: () => void
  children: React.ReactNode
  footer?: React.ReactNode
}

export const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, footer }) => {
  const dialogRef = useRef<HTMLDivElement>(null)

  // Escキーで閉じる
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // オーバーレイクリックで閉じる
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={handleOverlayClick} role="dialog" aria-modal>
      <div className={styles.modal} ref={dialogRef}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button className="btn btn--ghost" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  )
}
