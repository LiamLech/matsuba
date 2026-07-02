// ============================================================
// matsuba - MarkdownEditor（Markdownモードのエディタ）
// ============================================================

import React, { useEffect, useRef, useCallback } from 'react'
import type { ManuscriptId, LayoutPreset } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { markdownToTiptap } from '../../utils/markdownToTiptap'
import styles from './MarkdownEditor.module.css'

type MarkdownEditorProps = {
  manuscriptId: ManuscriptId
  preset: LayoutPreset
  onCharCountChange: (count: number) => void
  scrollRef?: (el: HTMLDivElement | null) => void
  onScroll?: () => void
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  manuscriptId,
  preset,
  onCharCountChange,
  scrollRef,
  onScroll,
}) => {
  const savedContent = useManuscriptStore(
    (s) => s.manuscripts.find((m) => m.id === manuscriptId)?.currentContentText ?? ''
  )
  const updateManuscript = useManuscriptStore((s) => s.updateManuscript)
  // appendLogをストアから直接取得（レンダリングサイクル外で使用）
  const appendLog = useManuscriptStore((s) => s.appendLog)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // ログ用のrefはレンダリングとは無関係に管理する
  const sessionStartRef = useRef<number>(Math.floor(Date.now() / 1000))
  const startCharCountRef = useRef<number>(0)

  // 原稿切り替え時にテキストエリアを更新
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.value = savedContent
      const count = savedContent.replace(/\s/g, '').length
      onCharCountChange(count)
      // セッション開始を記録
      sessionStartRef.current = Math.floor(Date.now() / 1000)
      startCharCountRef.current = count
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscriptId])

  // デバウンス付き保存
  const scheduleSave = useCallback((text: string, _charCount: number) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const tiptapJson = markdownToTiptap(text)
      updateManuscript(manuscriptId, {
        currentContent: tiptapJson,
        currentContentText: text,
      })
    }, 500)
  }, [manuscriptId, updateManuscript])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    const count = text.replace(/\s/g, '').length
    onCharCountChange(count)
    scheduleSave(text, count)
  }, [onCharCountChange, scheduleSave])

  // アンマウント時に即時保存＋ログ記録
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      const text = textareaRef.current?.value ?? ''
      const endedAt = Math.floor(Date.now() / 1000)
      const charCount = text.replace(/\s/g, '').length

      // 保存
      if (text) {
        updateManuscript(manuscriptId, {
          currentContent: markdownToTiptap(text),
          currentContentText: text,
        })
      }

      // ログ記録（1秒以上のセッションのみ）
      if (endedAt - sessionStartRef.current >= 1) {
        appendLog(manuscriptId, {
          startedAt: sessionStartRef.current,
          endedAt,
          charCountDelta: charCount - startCharCountRef.current,
        })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manuscriptId])

  const editorStyle: React.CSSProperties = {
    fontSize: preset.fontSize,
    lineHeight: preset.lineHeight,
    letterSpacing: `${preset.letterSpacing}em`,
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
        placeholder={'# 見出し\n\n本文を入力…\n\n**太字** *イタリック* ~~取り消し線~~\n{漢字|ふりがな}'}
        spellCheck={false}
        aria-label="Markdownエディタ"
      />
    </div>
  )
}
