// ============================================================
// matsuba - ExportMenu（エクスポートメニュー）
// ============================================================

import React, { useState, useRef, useEffect } from 'react'
import type { Manuscript, Version } from '../../types'
import { useExport } from '../../hooks/useExport'
import { useBackup } from '../../hooks/useBackup'
import styles from './ExportMenu.module.css'

type ExportMenuProps = {
  manuscript: Manuscript
  currentVersion: Version | null
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ manuscript, currentVersion }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 })
  const [includeMetadata, setIncludeMetadata] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { exportFile } = useExport()
  const { exportOneAsZip } = useBackup()

  // メニュー外クリックで閉じる
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [isOpen])

  const handleToggle = () => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    setMenuPos({
      top: rect.top - 4,
      right: window.innerWidth - rect.right,
    })
    setIsOpen((v) => !v)
  }

  const handle = (format: 'txt' | 'md') => {
    exportFile(manuscript, currentVersion, format, includeMetadata)
    setIsOpen(false)
  }

  const handleZip = async () => {
    await exportOneAsZip(manuscript)
    setIsOpen(false)
  }

  return (
    <div className={styles.container}>
      <button
        ref={btnRef}
        className="btn"
        onClick={handleToggle}
        title="エクスポート"
      >
        書き出し ▾
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className={styles.menu}
          style={{
            position: 'fixed',
            bottom: `calc(100vh - ${menuPos.top}px)`,
            right: `${menuPos.right}px`,
          }}
        >
          {/* 対象バージョンの表示 */}
          <div className={styles.target}>
            対象：{currentVersion ? currentVersion.label : '現在の版'}
          </div>

          <div className={styles.divider} />

          {/* 単体ファイル書き出し */}
          <div className={styles.sectionLabel}>単体ファイル</div>

          <button className={styles.menuItem} onClick={() => handle('txt')}>
            <span className={styles.menuIcon}>T</span>
            <span className={styles.menuLabel}>
              <span className={styles.menuTitle}>テキスト (.txt)</span>
              <span className={styles.menuDesc}>プレーンテキストで書き出し</span>
            </span>
          </button>

          <button className={styles.menuItem} onClick={() => handle('md')}>
            <span className={styles.menuIcon}>M</span>
            <span className={styles.menuLabel}>
              <span className={styles.menuTitle}>Markdown (.md)</span>
              <span className={styles.menuDesc}>Markdown形式で書き出し</span>
            </span>
          </button>

          <button
            className={`${styles.menuItem} ${styles.menuItemDisabled}`}
            disabled
            title="Phase 2で実装予定"
          >
            <span className={styles.menuIcon}>P</span>
            <span className={styles.menuLabel}>
              <span className={styles.menuTitle}>PDF (.pdf)</span>
              <span className={styles.menuDesc}>Phase 2で実装予定</span>
            </span>
          </button>

          <div className={styles.divider} />

          {/* バックアップ */}
          <div className={styles.sectionLabel}>バックアップ</div>

          <button className={styles.menuItem} onClick={handleZip}>
            <span className={styles.menuIcon}>Z</span>
            <span className={styles.menuLabel}>
              <span className={styles.menuTitle}>この原稿をZIPで保存</span>
              <span className={styles.menuDesc}>全バージョンをまとめて保存</span>
            </span>
          </button>

          <div className={styles.divider} />

          {/* オプション */}
          <label className={styles.option}>
            <input
              type="checkbox"
              checked={includeMetadata}
              onChange={(e) => setIncludeMetadata(e.target.checked)}
            />
            <span>メタデータを含める（Markdownのみ）</span>
          </label>
        </div>
      )}
    </div>
  )
}
