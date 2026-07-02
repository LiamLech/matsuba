// ============================================================
// matsuba - TiptapEditor（Phase 2リッチテキストエディタ）
// ============================================================

import React, { useEffect, useRef, useCallback } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import type { ManuscriptId, LayoutPreset, WritingDirection, TiptapJSON } from '../../types'
import { useManuscriptStore } from '../../store/manuscriptStore'
import { useEditLog } from '../../hooks/useEditLog'
import { tiptapToMarkdown } from '../../utils/tiptapToMarkdown'
import { Ruby } from './extensions/Ruby'
import { Toolbar } from './Toolbar'
import { RubyInput } from './RubyInput'
import styles from './TiptapEditor.module.css'

type TiptapEditorProps = {
  manuscriptId: ManuscriptId
  preset: LayoutPreset
  direction: WritingDirection
  onCharCountChange: (count: number) => void
  scrollRef?: (el: HTMLDivElement | null) => void
  onScroll?: () => void
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({
  manuscriptId,
  preset,
  direction,
  onCharCountChange,
  scrollRef,
  onScroll,
}) => {
  const manuscript = useManuscriptStore((s) =>
    s.manuscripts.find((m) => m.id === manuscriptId)
  )
  const updateManuscript = useManuscriptStore((s) => s.updateManuscript)

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleSave = useCallback((json: TiptapJSON, text: string) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      const markdown = tiptapToMarkdown(json)
      updateManuscript(manuscriptId, {
        currentContent: json,
        currentContentText: markdown || text,
      })
    }, 500)
  }, [manuscriptId, updateManuscript])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Ruby,
    ],
    content: (manuscript?.currentContent as object) ?? '',
    editorProps: {
      attributes: {
        class: `${styles.editorContent} ${direction === 'vertical' ? styles.verticalContent : ''}`,
        spellcheck: 'false',
      },
    },
    onUpdate: ({ editor }) => {
      const json = editor.getJSON()
      const text = editor.getText()
      const charCount = text.replace(/\s/g, '').length
      onCharCountChange(charCount)
      scheduleSave(json, text)
    },
    onCreate: ({ editor }) => {
      const text = editor.getText()
      onCharCountChange(text.replace(/\s/g, '').length)
    },
  })

  // 原稿切り替え時にエディタの内容を更新
  useEffect(() => {
    if (!editor || !manuscript) return
    const currentJson = editor.getJSON()
    const savedJson = manuscript.currentContent
    if (JSON.stringify(currentJson) === JSON.stringify(savedJson)) return
    editor.commands.setContent((savedJson as object) ?? '', false)
    const text = editor.getText()
    onCharCountChange(text.replace(/\s/g, '').length)
  }, [manuscriptId])

  // アンマウント時に即時保存
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      if (editor && !editor.isDestroyed) {
        const json = editor.getJSON()
        const markdown = tiptapToMarkdown(json)
        updateManuscript(manuscriptId, {
          currentContent: json,
          currentContentText: markdown || editor.getText(),
        })
      }
    }
  }, [manuscriptId, editor, updateManuscript])

  // 縦書き切り替え時にeditorPropsのクラスを動的に更新
  useEffect(() => {
    if (!editor) return
    editor.setOptions({
      editorProps: {
        attributes: {
          class: `${styles.editorContent} ${direction === 'vertical' ? styles.verticalContent : ''}`,
          spellcheck: 'false',
        },
      },
    })
  }, [editor, direction])

  // 執筆ログ
  const charCount = editor ? editor.getText().replace(/\s/g, '').length : 0
  useEditLog({ manuscriptId, charCount })

  // レイアウトプリセットのCSSカスタムプロパティ
  const presetStyle: React.CSSProperties = {
    '--editor-font-size':         `${preset.fontSize}px`,
    '--editor-line-height':       String(preset.lineHeight),
    '--editor-letter-spacing':    `${preset.letterSpacing}em`,
    '--editor-text-indent':       preset.indent === 'none' ? '0' : preset.indent,
    '--editor-text-align':        preset.alignment,
    '--editor-paragraph-spacing': `${preset.paragraphSpacing}em`,
  } as React.CSSProperties

  // 右クリックメニュー
  const handleContextMenu = (e: React.MouseEvent) => {
    if (!editor) return
    const { empty } = editor.state.selection
    if (empty) return
    e.preventDefault()
    window.dispatchEvent(new CustomEvent('matsuba:openRubyDialog'))
  }

  // 縦書き時のホイールスクロール方向変換（下→左）
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = wrapperRef.current
    if (!el || direction !== 'vertical') return

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      // editorAreaを探してスクロール
      const area = el.querySelector(`.${styles.verticalArea}`) as HTMLElement | null
      if (area) {
        area.scrollLeft -= e.deltaY
      }
    }

    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [direction])

  return (
    <div
      className={styles.wrapper}
      ref={(el) => {
        wrapperRef.current = el
        if (typeof scrollRef === 'function') scrollRef(el)
      }}
      onScroll={onScroll}
      onContextMenu={handleContextMenu}
    >
      {editor && <Toolbar editor={editor} />}
      <div className={`${styles.editorArea} ${direction === 'vertical' ? styles.verticalArea : ''}`} style={presetStyle}>
        <EditorContent
          editor={editor}
          className={`${styles.editorOuter} ${direction === 'vertical' ? styles.verticalOuter : ''}`}
        />
      </div>
      <RubyInput editor={editor} />
    </div>
  )
}
