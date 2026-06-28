// ============================================================
// matsuba - Toolbar（Tiptapの書式ツールバー）
// ============================================================

import React from 'react'
import type { Editor } from '@tiptap/react'
import styles from './Toolbar.module.css'

type ToolbarProps = {
  editor: Editor
}

type ToolbarButton = {
  label: string
  title: string
  action: () => void
  isActive: () => boolean
  isDisabled?: () => boolean
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  const buttons: ToolbarButton[] = [
    {
      label: 'B',
      title: '太字 (Ctrl+B)',
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: () => editor.isActive('bold'),
    },
    {
      label: 'I',
      title: 'イタリック (Ctrl+I)',
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: () => editor.isActive('italic'),
    },
    {
      label: 'S',
      title: '取り消し線',
      action: () => editor.chain().focus().toggleStrike().run(),
      isActive: () => editor.isActive('strike'),
    },
  ]

  const headingButtons = [1, 2, 3].map((level) => ({
    label: `H${level}`,
    title: `見出し${level}`,
    action: () => editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run(),
    isActive: () => editor.isActive('heading', { level }),
  }))

  const listButtons: ToolbarButton[] = [
    {
      label: '≡',
      title: '箇条書きリスト',
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: () => editor.isActive('bulletList'),
    },
    {
      label: '1.',
      title: '番号付きリスト',
      action: () => editor.chain().focus().toggleOrderedList().run(),
      isActive: () => editor.isActive('orderedList'),
    },
  ]

  const historyButtons: ToolbarButton[] = [
    {
      label: '↩',
      title: '元に戻す (Ctrl+Z)',
      action: () => editor.chain().focus().undo().run(),
      isActive: () => false,
      isDisabled: () => !editor.can().undo(),
    },
    {
      label: '↪',
      title: 'やり直す (Ctrl+Y)',
      action: () => editor.chain().focus().redo().run(),
      isActive: () => false,
      isDisabled: () => !editor.can().redo(),
    },
  ]

  const renderButton = (btn: ToolbarButton, key: string) => (
    <button
      key={key}
      className={`${styles.btn} ${btn.isActive() ? styles.btnActive : ''}`}
      onClick={btn.action}
      disabled={btn.isDisabled?.()}
      title={btn.title}
      aria-label={btn.title}
      aria-pressed={btn.isActive()}
    >
      {btn.label}
    </button>
  )

  return (
    <div className={styles.toolbar}>
      {/* 書式 */}
      <div className={styles.group}>
        {buttons.map((btn) => renderButton(btn, btn.label))}
      </div>

      <div className={styles.divider} />

      {/* 見出し */}
      <div className={styles.group}>
        {headingButtons.map((btn) => renderButton(btn, btn.label))}
      </div>

      <div className={styles.divider} />

      {/* リスト */}
      <div className={styles.group}>
        {listButtons.map((btn) => renderButton(btn, btn.label))}
      </div>

      <div className={styles.divider} />

      {/* ルビ */}
      <div className={styles.group}>
        <button
          className={styles.btn}
          onClick={() => window.dispatchEvent(new CustomEvent('matsuba:openRubyDialog'))}
          title="ルビを追加 (Ctrl+R / Cmd+R)"
          disabled={!editor.state.selection || editor.state.selection.empty}
        >
          ルビ
        </button>
      </div>

      <div className={styles.spacer} />

      {/* 履歴 */}
      <div className={styles.group}>
        {historyButtons.map((btn) => renderButton(btn, btn.label))}
      </div>
    </div>
  )
}
