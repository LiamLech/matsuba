// ============================================================
// matsuba - LayoutPresetEditor（レイアウトプリセット管理）
// ============================================================

import React, { useState } from 'react'
import type { LayoutPreset, TextAlignment, IndentSize } from '../../types'
import { useLayoutStore } from '../../store/layoutStore'
import styles from './LayoutPresetEditor.module.css'

// ── プレビュー ───────────────────────────────────────────────

const PresetPreview: React.FC<{ preset: LayoutPreset }> = ({ preset }) => (
  <div
    className={styles.preview}
    style={{
      lineHeight: preset.lineHeight,
      fontSize: Math.min(preset.fontSize, 14), // プレビューは最大14px
      letterSpacing: `${preset.letterSpacing}em`,
      textAlign: preset.alignment,
      textIndent: preset.indent === 'none' ? undefined : preset.indent,
    }}
  >
    春はあけぼの。やうやう白くなりゆく山際、少し明りて、紫だちたる雲の細くたなびきたる。
  </div>
)

// ── プリセット編集フォーム ───────────────────────────────────

const PresetForm: React.FC<{
  initial: Partial<LayoutPreset>
  onSave: (values: Omit<LayoutPreset, 'id' | 'isBuiltIn'>) => void
  onCancel: () => void
}> = ({ initial, onSave, onCancel }) => {
  const [label, setLabel] = useState(initial.label ?? '')
  const [lineHeight, setLineHeight] = useState(initial.lineHeight ?? 1.9)
  const [fontSize, setFontSize] = useState(initial.fontSize ?? 16)
  const [indent, setIndent] = useState<IndentSize>(initial.indent ?? 'none')
  const [alignment, setAlignment] = useState<TextAlignment>(initial.alignment ?? 'left')
  const [letterSpacing, setLetterSpacing] = useState(initial.letterSpacing ?? 0.02)
  const [paragraphSpacing, _setParagraphSpacing] = useState(initial.paragraphSpacing ?? 1)

  const preview: LayoutPreset = {
    id: 'preview', label, isBuiltIn: false,
    lineHeight, fontSize, indent, alignment, letterSpacing, paragraphSpacing,
  }

  const handleSave = () => {
    if (!label.trim()) return
    onSave({ label: label.trim(), lineHeight, fontSize, indent, alignment, letterSpacing, paragraphSpacing })
  }

  return (
    <div className={styles.form}>
      <div className={styles.formGrid}>
        {/* 名前 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>プリセット名</label>
          <input
            className={styles.input}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="例：詩（広め）"
          />
        </div>

        {/* フォントサイズ */}
        <div className={styles.formGroup}>
          <label className={styles.label}>フォントサイズ: {fontSize}px</label>
          <input
            type="range" min={12} max={24} step={1}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className={styles.range}
          />
        </div>

        {/* 行間 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>行間: {lineHeight}</label>
          <input
            type="range" min={1.2} max={3.0} step={0.1}
            value={lineHeight}
            onChange={(e) => setLineHeight(Number(e.target.value))}
            className={styles.range}
          />
        </div>

        {/* 字間 */}
        <div className={styles.formGroup}>
          <label className={styles.label}>字間: {letterSpacing}em</label>
          <input
            type="range" min={0} max={0.2} step={0.01}
            value={letterSpacing}
            onChange={(e) => setLetterSpacing(Number(e.target.value))}
            className={styles.range}
          />
        </div>

        {/* インデント */}
        <div className={styles.formGroup}>
          <label className={styles.label}>字下げ</label>
          <div className={styles.segmented}>
            {(['none', '1em', '2em'] as IndentSize[]).map((v) => (
              <button
                key={v}
                className={`${styles.segBtn} ${indent === v ? styles.segBtnActive : ''}`}
                onClick={() => setIndent(v)}
              >
                {v === 'none' ? 'なし' : v}
              </button>
            ))}
          </div>
        </div>

        {/* 揃え */}
        <div className={styles.formGroup}>
          <label className={styles.label}>揃え</label>
          <div className={styles.segmented}>
            {([
              { value: 'left', label: '左' },
              { value: 'center', label: '中央' },
              { value: 'right', label: '右' },
              { value: 'justify', label: '両端' },
            ] as { value: TextAlignment; label: string }[]).map((opt) => (
              <button
                key={opt.value}
                className={`${styles.segBtn} ${alignment === opt.value ? styles.segBtnActive : ''}`}
                onClick={() => setAlignment(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* プレビュー */}
      <div className={styles.previewSection}>
        <div className={styles.previewLabel}>プレビュー</div>
        <PresetPreview preset={preview} />
      </div>

      <div className={styles.formActions}>
        <button className="btn" onClick={onCancel}>キャンセル</button>
        <button className="btn btn--primary" onClick={handleSave} disabled={!label.trim()}>
          保存
        </button>
      </div>
    </div>
  )
}

// ── メインコンポーネント ─────────────────────────────────────

export const LayoutPresetEditor: React.FC = () => {
  const presets = useLayoutStore((s) => s.presets)
  const createPreset = useLayoutStore((s) => s.createPreset)
  const updatePreset = useLayoutStore((s) => s.updatePreset)
  const removePreset = useLayoutStore((s) => s.removePreset)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const handleUpdate = async (id: string, values: Omit<LayoutPreset, 'id' | 'isBuiltIn'>) => {
    await updatePreset(id, values)
    setEditingId(null)
  }

  const handleCreate = async (values: Omit<LayoutPreset, 'id' | 'isBuiltIn'>) => {
    await createPreset(values)
    setIsCreating(false)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>レイアウトプリセット</h2>
        <p className={styles.desc}>
          散文・詩などの執筆スタイルをプリセットとして保存できます。
          組み込みプリセットは削除できませんが、カスタムプリセットは自由に作成・削除できます。
        </p>
      </div>

      {presets.map((preset) => (
        <div key={preset.id} className={styles.presetBlock}>
          {editingId === preset.id ? (
            <PresetForm
              initial={preset}
              onSave={(values) => handleUpdate(preset.id, values)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div className={styles.presetRow}>
              <div className={styles.presetInfo}>
                <span className={styles.presetName}>{preset.label}</span>
                {preset.isBuiltIn && (
                  <span className={styles.builtInBadge}>組み込み</span>
                )}
                <span className={styles.presetMeta}>
                  {preset.fontSize}px · 行間{preset.lineHeight} · {
                    preset.alignment === 'left' ? '左揃え' :
                    preset.alignment === 'center' ? '中央揃え' :
                    preset.alignment === 'right' ? '右揃え' : '両端揃え'
                  }
                </span>
              </div>
              <div className={styles.presetActions}>
                {!preset.isBuiltIn && (
                  <button
                    className="btn btn--ghost"
                    onClick={() => setEditingId(preset.id)}
                  >
                    編集
                  </button>
                )}
                {!preset.isBuiltIn && (
                  <button
                    className="btn btn--ghost btn--danger"
                    onClick={() => {
                      if (window.confirm(`「${preset.label}」を削除しますか？`)) {
                        removePreset(preset.id)
                      }
                    }}
                  >
                    削除
                  </button>
                )}
              </div>
            </div>
          )}
          <div className={styles.presetPreviewWrap}>
            <PresetPreview preset={preset} />
          </div>
        </div>
      ))}

      {/* 新規作成 */}
      {isCreating ? (
        <div className={styles.presetBlock}>
          <PresetForm
            initial={{}}
            onSave={handleCreate}
            onCancel={() => setIsCreating(false)}
          />
        </div>
      ) : (
        <button
          className="btn"
          onClick={() => setIsCreating(true)}
        >
          ＋ プリセットを作成
        </button>
      )}
    </div>
  )
}
