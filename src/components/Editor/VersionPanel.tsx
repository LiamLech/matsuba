// ============================================================
// matsuba - VersionPanel（バージョン一覧・保存）
// ============================================================

import React, { useState } from 'react'
import type { ManuscriptId, VersionId } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { useUIStore } from '../../store/uiStore'
import { Modal } from '../common/Modal'
import styles from './VersionPanel.module.css'

type VersionPanelProps = {
  manuscriptId: ManuscriptId
  currentVersionId: VersionId | null
  currentContent: string
}

function formatDateTime(ts: number): string {
  const d = new Date(ts * 1000)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export const VersionPanel: React.FC<VersionPanelProps> = ({
  manuscriptId,
  currentVersionId,
  currentContent: _currentContent,
}) => {
  const getById = useManuscriptStore((s) => s.getById)
  const saveVersion = useManuscriptStore((s) => s.saveVersion)
  const removeVersion = useManuscriptStore((s) => s.removeVersion)
  const setPaneVersion = useUIStore((s) => s.setPaneVersion)
  const activePaneIndex = useUIStore((s) => s.activePaneIndex)

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)
  const [versionLabel, setVersionLabel] = useState('')
  const [versionNote, setVersionNote] = useState('')

  const manuscript = getById(manuscriptId)
  if (!manuscript) return null

  const versions = [...manuscript.versions].reverse()

  // バージョン保存モーダルを開く
  const openSaveModal = () => {
    const nextNum = manuscript.versions.length
    const labels = ['初稿','第二稿','第三稿','第四稿','第五稿','第六稿','第七稿','第八稿','第九稿','第十稿']
    setVersionLabel(labels[nextNum] ?? `第${nextNum + 1}稿`)
    setVersionNote('')
    setIsSaveModalOpen(true)
  }

  const handleSave = async () => {
    if (!versionLabel.trim()) return
    await saveVersion(manuscriptId, versionLabel.trim(), versionNote.trim())
    setIsSaveModalOpen(false)
  }

  // バージョンをペインで開く
  const openVersionInPane = (versionId: VersionId) => {
    setPaneVersion(activePaneIndex, versionId)
  }

  const handleRemove = async (versionId: VersionId, label: string) => {
    if (!window.confirm(`「${label}」を削除しますか？`)) return
    await removeVersion(manuscriptId, versionId)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className="section-label">バージョン履歴</span>
        <button
          className="btn btn--primary"
          onClick={openSaveModal}
          title="現在の内容をバージョンとして保存（Ctrl+S）"
        >
          保存
        </button>
      </div>

      <div className={styles.list}>
        {/* 現在の版 */}
        <div
          className={`${styles.item} ${currentVersionId === null ? styles.itemActive : ''}`}
          onClick={() => setPaneVersion(activePaneIndex, null)}
          role="button"
          tabIndex={0}
        >
          <div className={styles.itemLabel}>現在の版</div>
          <div className={styles.itemMeta}>編集中</div>
        </div>

        {/* 保存済みバージョン */}
        {versions.length === 0 ? (
          <div className={styles.empty}>保存済みのバージョンはありません</div>
        ) : (
          versions.map((v) => (
            <div
              key={v.id}
              className={`${styles.item} ${currentVersionId === v.id ? styles.itemActive : ''}`}
              onClick={() => openVersionInPane(v.id)}
              role="button"
              tabIndex={0}
            >
              <div className={styles.itemLabel}>{v.label}</div>
              {v.note && <div className={styles.itemNote}>{v.note}</div>}
              <div className={styles.itemMeta}>
                <span>{formatDateTime(v.savedAt)}</span>
                <span>{v.charCount.toLocaleString('ja-JP')}字</span>
              </div>
              <button
                className={styles.removeBtn}
                onClick={(e) => { e.stopPropagation(); handleRemove(v.id, v.label) }}
                title="削除"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* バージョン保存モーダル */}
      <Modal
        isOpen={isSaveModalOpen}
        title="バージョンを保存"
        onClose={() => setIsSaveModalOpen(false)}
        footer={
          <>
            <button className="btn" onClick={() => setIsSaveModalOpen(false)}>
              キャンセル
            </button>
            <button
              className="btn btn--primary"
              onClick={handleSave}
              disabled={!versionLabel.trim()}
            >
              保存
            </button>
          </>
        }
      >
        <div className={styles.formGroup}>
          <label className={styles.label}>バージョン名</label>
          <input
            className={styles.input}
            type="text"
            value={versionLabel}
            onChange={(e) => setVersionLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="例：初稿、第二稿…"
            autoFocus
          />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>メモ（任意）</label>
          <textarea
            className={styles.textarea}
            value={versionNote}
            onChange={(e) => setVersionNote(e.target.value)}
            placeholder="改訂内容など"
            rows={3}
          />
        </div>
      </Modal>
    </div>
  )
}
