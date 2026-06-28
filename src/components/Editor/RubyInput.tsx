// ============================================================
// matsuba - RubyInput（ルビ入力ダイアログ）
// ============================================================

import React, { useState, useEffect, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import { Modal } from '../common/Modal'
import styles from './RubyInput.module.css'

type RubyInputProps = {
  editor: Editor | null
}

export const RubyInput: React.FC<RubyInputProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [reading, setReading] = useState('')
  const [selectedText, setSelectedText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handler = () => {
      if (!editor) return
      const { from, to, empty } = editor.state.selection
      if (empty) return

      const text = editor.state.doc.textBetween(from, to)
      setSelectedText(text)
      setReading('')
      setIsOpen(true)
    }

    window.addEventListener('matsuba:openRubyDialog', handler)
    return () => window.removeEventListener('matsuba:openRubyDialog', handler)
  }, [editor])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const handleApply = () => {
    if (!editor || !reading.trim()) return
    editor.chain().focus().setRuby(selectedText, reading.trim()).run()
    setIsOpen(false)
  }

  const handleRemove = () => {
    if (!editor) return
    editor.chain().focus().unsetRuby().run()
    setIsOpen(false)
  }

  const handleClose = () => {
    setIsOpen(false)
    editor?.commands.focus()
  }

  return (
    <Modal
      isOpen={isOpen}
      title="ルビを追加"
      onClose={handleClose}
      footer={
        <>
          <button className="btn btn--danger" onClick={handleRemove}>
            ルビを削除
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={handleClose}>
            キャンセル
          </button>
          <button
            className="btn btn--primary"
            onClick={handleApply}
            disabled={!reading.trim()}
          >
            適用
          </button>
        </>
      }
    >
      {/* プレビュー */}
      <div className={styles.preview}>
        <ruby>
          <span>{selectedText}</span>
          <rt>{reading || '　'}</rt>
        </ruby>
      </div>

      {/* 読み入力 */}
      <div className={styles.formGroup}>
        <label className={styles.label}>読み（ふりがな）</label>
        <input
          ref={inputRef}
          className={styles.input}
          type="text"
          value={reading}
          onChange={(e) => setReading(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="ふりがなを入力"
        />
      </div>

      <div className={styles.hint}>
        テキストを選択してから Ctrl+Shift+R（Mac: Cmd+Shift+R）でも開けます
      </div>
    </Modal>
  )
}
