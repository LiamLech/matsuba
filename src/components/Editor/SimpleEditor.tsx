// ============================================================
// matsuba - SimpleEditor（Phase 1暫定エディタ）
// Phase 2でTiptapに置き換える
// ============================================================

import React, { useEffect, useRef, useCallback } from 'react'
import type { ManuscriptId, LayoutPreset, WritingDirection } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { useEditLog } from '../../hooks/useEditLog'
import styles from './SimpleEditor.module.css'

type SimpleEditorProps = {
  manuscriptId: ManuscriptId
  preset: LayoutPreset
  direction: WritingDirection
  onCharCountChange: (count: number) => void
  scrollRef?: (el: HTMLDivElement | null) => void
  onScroll?: () => void
}

export const SimpleEditor: React.FC<SimpleEditorProps> = ({
  manuscriptId,
  preset,
  direction,
  onCharCountChange,
  scrollRef,
  onScroll,
}) => {
  const getById = useManuscriptStore((s) => s.getById)
  const updateManuscript = useManuscriptStore((s) => s.updateManuscript)

  const manuscript = getById(manuscriptId)
  const savedContent = manuscript?.currentContentText ?? ''

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 原稿が切り替わったときにテキストエリアの内容を更新
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = savedContent
      const count = savedContent.replace(/\s/g, '').length
      onCharCountChange(count)
    }
  }, [manuscriptId])

  // デバウンス付き保存
  const scheduleSave = useCallback((text: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      updateManuscript(manuscriptId, { currentContent: text, currentContentText: text })
    }, 500)
  }, [manuscriptId, updateManuscript])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    const count = text.replace(/\s/g, '').length
    onCharCountChange(count)
    scheduleSave(text)
  }, [onCharCountChange, scheduleSave])

  // 執筆ログの記録
  const currentCharCount = textareaRef.current
    ? textareaRef.current.value.replace(/\s/g, '').length
    : 0
  useEditLog({ manuscriptId, charCount: currentCharCount })

  // アンマウント時に即時保存
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (textareaRef.current) {
        updateManuscript(manuscriptId, { currentContent: textareaRef.current.value, currentContentText: textareaRef.current.value })
      }
    }
  }, [manuscriptId, updateManuscript])

  const editorStyle: React.CSSProperties = {
    lineHeight: preset.lineHeight,
    fontSize: preset.fontSize,
    letterSpacing: `${preset.letterSpacing}em`,
    textAlign: preset.alignment as React.CSSProperties['textAlign'],
    textIndent: preset.indent === 'none' ? undefined : preset.indent,
    writingMode: direction === 'vertical' ? 'vertical-rl' : undefined,
  }

  return (
    <div
      className={styles.wrapper}
      ref={scrollRef}
      onScroll={onScroll}
    >
      <textarea
        ref={textareaRef}
        className={styles.editor}
        style={editorStyle}
        defaultValue={savedContent}
        onChange={handleChange}
        placeholder="ここに原稿を入力…"
        spellCheck={false}
        aria-label="原稿エディタ"
      />
    </div>
  )
}
