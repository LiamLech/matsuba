// ============================================================
// matsuba - AttachmentPanel（参考画像サイドパネル）
// ============================================================

import React, { useState, useRef } from 'react'
import type { ManuscriptId, Attachment } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { AttachmentViewer } from './AttachmentViewer'
import styles from './AttachmentPanel.module.css'

type AttachmentPanelProps = {
  manuscriptId: ManuscriptId
  onClose: () => void
}

export const AttachmentPanel: React.FC<AttachmentPanelProps> = ({ manuscriptId, onClose }) => {
  const manuscript = useManuscriptStore((s) =>
    s.manuscripts.find((m) => m.id === manuscriptId)
  )
  const addAttachment = useManuscriptStore((s) => s.addAttachment)
  const removeAttachment = useManuscriptStore((s) => s.removeAttachment)
  const updateAttachmentNote = useManuscriptStore((s) => s.updateAttachmentNote)

  const [viewerAttachment, setViewerAttachment] = useState<Attachment | null>(null)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteValue, setNoteValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const attachments = manuscript?.attachments ?? []

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      const dataUrl = await readFileAsDataUrl(file)
      await addAttachment(manuscriptId, {
        fileName: file.name,
        dataUrl,
        note: '',
      })
    }
    // ファイル入力をリセット（同じファイルを再選択できるように）
    e.target.value = ''
  }

  const handleDelete = async (attachmentId: string) => {
    if (!window.confirm('この画像を削除しますか？')) return
    await removeAttachment(manuscriptId, attachmentId)
  }

  const startEditNote = (attachment: Attachment) => {
    setEditingNoteId(attachment.id)
    setNoteValue(attachment.note)
  }

  const saveNote = async () => {
    if (!editingNoteId) return
    await updateAttachmentNote(manuscriptId, editingNoteId, noteValue)
    setEditingNoteId(null)
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className="section-label">参考画像</span>
        <div className={styles.headerActions}>
          <button
            className="btn btn--ghost"
            onClick={() => fileInputRef.current?.click()}
            title="画像を追加"
          >
            ＋ 追加
          </button>
          <button className="btn btn--ghost" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      <div className={styles.list}>
        {attachments.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🖼</div>
            <p>参考画像がありません</p>
            <button
              className="btn"
              onClick={() => fileInputRef.current?.click()}
            >
              画像を追加
            </button>
          </div>
        ) : (
          attachments.map((attachment) => (
            <div key={attachment.id} className={styles.item}>
              {/* サムネイル */}
              <div
                className={styles.thumbnail}
                onClick={() => setViewerAttachment(attachment)}
                title="クリックで拡大"
              >
                <img
                  src={attachment.dataUrl}
                  alt={attachment.fileName}
                  className={styles.thumbnailImg}
                />
                <div className={styles.thumbnailOverlay}>拡大</div>
              </div>

              {/* 情報 */}
              <div className={styles.itemInfo}>
                <div className={styles.fileName}>{attachment.fileName}</div>

                {/* メモ */}
                {editingNoteId === attachment.id ? (
                  <div className={styles.noteEdit}>
                    <input
                      className={styles.noteInput}
                      value={noteValue}
                      onChange={(e) => setNoteValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveNote()
                        if (e.key === 'Escape') setEditingNoteId(null)
                      }}
                      onBlur={saveNote}
                      autoFocus
                      placeholder="メモを入力"
                    />
                  </div>
                ) : (
                  <div
                    className={styles.note}
                    onClick={() => startEditNote(attachment)}
                    title="クリックで編集"
                  >
                    {attachment.note || <span className={styles.notePlaceholder}>メモを追加</span>}
                  </div>
                )}
              </div>

              {/* 削除ボタン */}
              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(attachment.id)}
                title="削除"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* 拡大ビューア */}
      {viewerAttachment && (
        <AttachmentViewer
          attachment={viewerAttachment}
          attachments={attachments}
          onClose={() => setViewerAttachment(null)}
          onChange={setViewerAttachment}
        />
      )}
    </div>
  )
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
