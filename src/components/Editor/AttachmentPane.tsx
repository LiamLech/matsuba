// ============================================================
// matsuba - AttachmentPane（参考画像ペイン表示）
// ============================================================

import React, { useState } from 'react'
import type { ManuscriptId, Attachment } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { AttachmentViewer } from './AttachmentViewer'
import styles from './AttachmentPane.module.css'

type AttachmentPaneProps = {
  manuscriptId: ManuscriptId
}

export const AttachmentPane: React.FC<AttachmentPaneProps> = ({ manuscriptId }) => {
  const manuscript = useManuscriptStore((s) =>
    s.manuscripts.find((m) => m.id === manuscriptId)
  )
  const addAttachment = useManuscriptStore((s) => s.addAttachment)
  const removeAttachment = useManuscriptStore((s) => s.removeAttachment)

  const [viewerAttachment, setViewerAttachment] = useState<Attachment | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const attachments = manuscript?.attachments ?? []
  const selected = attachments.find((a) => a.id === selectedId) ?? attachments[0] ?? null

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue
      const dataUrl = await readFileAsDataUrl(file)
      await addAttachment(manuscriptId, { fileName: file.name, dataUrl, note: '' })
    }
    e.target.value = ''
  }

  const handleDelete = async (attachmentId: string) => {
    if (!window.confirm('この画像を削除しますか？')) return
    await removeAttachment(manuscriptId, attachmentId)
    if (selectedId === attachmentId) setSelectedId(null)
  }

  return (
    <div className={styles.pane}>
      {/* ツールバー */}
      <div className={styles.toolbar}>
        <span className={styles.title}>参考画像</span>
        <label className="btn btn--ghost" style={{ cursor: 'pointer' }}>
          ＋ 追加
          <input
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </label>
      </div>

      {attachments.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🖼</div>
          <p>参考画像がありません</p>
          <label className="btn" style={{ cursor: 'pointer' }}>
            画像を追加
            <input
              type="file"
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </label>
        </div>
      ) : (
        <div className={styles.layout}>
          {/* メイン画像 */}
          <div className={styles.mainArea}>
            {selected && (
              <>
                <img
                  src={selected.dataUrl}
                  alt={selected.fileName}
                  className={styles.mainImage}
                  onClick={() => setViewerAttachment(selected)}
                  title="クリックで拡大"
                />
                <div className={styles.mainMeta}>
                  <span className={styles.mainFileName}>{selected.fileName}</span>
                  {selected.note && (
                    <span className={styles.mainNote}>{selected.note}</span>
                  )}
                  <button
                    className={`btn btn--ghost ${styles.expandBtn}`}
                    onClick={() => setViewerAttachment(selected)}
                  >
                    ⤢ 拡大
                  </button>
                </div>
              </>
            )}
          </div>

          {/* サムネイル一覧 */}
          <div className={styles.thumbnails}>
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={`${styles.thumb} ${selectedId === attachment.id || (!selectedId && attachment === attachments[0]) ? styles.thumbActive : ''}`}
                onClick={() => setSelectedId(attachment.id)}
              >
                <img
                  src={attachment.dataUrl}
                  alt={attachment.fileName}
                  className={styles.thumbImg}
                />
                <button
                  className={styles.thumbDelete}
                  onClick={(e) => { e.stopPropagation(); handleDelete(attachment.id) }}
                  title="削除"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* モーダル拡大ビューア */}
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
