// ============================================================
// matsuba - PDF出力フック（新規ウィンドウで印刷）
// ============================================================

import { useCallback } from 'react'
import type { Manuscript, Version, LayoutPreset } from '../types'
import { tiptapToHtml } from '../utils/tiptapToHtml'

type PrintOptions = {
  manuscript: Manuscript
  version: Version | null
  preset: LayoutPreset
}

export function usePrint() {
  const printManuscript = useCallback(({ manuscript, version, preset }: PrintOptions) => {
    const content = version ? version.content : manuscript.currentContent
    const bodyHtml = tiptapToHtml(content)
    const versionLabel = version ? version.label : '現在の版'
    const dateStr = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

    const printVars = [
      `--print-font-size: ${preset.fontSize}pt`,
      `--print-line-height: ${preset.lineHeight}`,
      `--print-letter-spacing: ${preset.letterSpacing}em`,
      `--print-text-indent: ${preset.indent === 'none' ? '0' : preset.indent}`,
      `--print-text-align: ${preset.alignment}`,
      `--print-paragraph-spacing: ${preset.paragraphSpacing}em`,
    ].join('; ')

    const win = window.open('', '_blank', 'width=800,height=900')
    if (!win) {
      window.alert('ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。')
      return
    }

    win.document.write(`<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(manuscript.title)} — ${versionLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Hiragino Mincho ProN', 'Yu Mincho', 'MS Mincho', serif;
      color: #000;
      background: #fff;
      padding: 20mm 18mm;
    }
    .print-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      border-bottom: 1px solid #ccc;
      padding-bottom: 10pt;
      margin-bottom: 20pt;
    }
    .print-title { font-size: 18pt; font-weight: bold; }
    .print-meta { font-size: 9pt; color: #666; text-align: right; line-height: 1.6; }
    .print-body {
      font-size: var(--print-font-size, 11pt);
      line-height: var(--print-line-height, 1.9);
      letter-spacing: var(--print-letter-spacing, 0.02em);
      text-align: var(--print-text-align, left);
    }
    .print-body p { margin-bottom: var(--print-paragraph-spacing, 1em); text-indent: var(--print-text-indent, 0); }
    .print-body p:last-child { margin-bottom: 0; }
    .print-body h1 { font-size: 16pt; font-weight: bold; margin: 1.2em 0 0.6em; }
    .print-body h2 { font-size: 13pt; font-weight: bold; margin: 1em 0 0.5em; }
    .print-body h3 { font-size: 11pt; font-weight: bold; margin: 0.8em 0 0.4em; }
    .print-body strong { font-weight: bold; }
    .print-body em { font-style: italic; }
    .print-body s { text-decoration: line-through; }
    .print-body ul, .print-body ol { padding-left: 2em; margin-bottom: 1em; }
    .print-body blockquote { border-left: 3pt solid #ccc; padding-left: 1em; margin-left: 0; color: #444; }
    .print-body hr { border: none; border-top: 1pt solid #ccc; margin: 1.5em 0; }
    .print-body ruby { ruby-align: center; }
    .print-body ruby rt { font-size: 0.5em; }
    @page { margin: 20mm 18mm; }
  </style>
</head>
<body>
  <div class="print-header">
    <div class="print-title">${escapeHtml(manuscript.title)}</div>
    <div class="print-meta">
      <div>${versionLabel}</div>
      <div>${dateStr}</div>
    </div>
  </div>
  <div class="print-body" style="${printVars}">
    ${bodyHtml}
  </div>
  <script>
    window.onload = function() {
      window.print()
      window.onafterprint = function() { window.close() }
    }
  </script>
</body>
</html>`)

    win.document.close()
  }, [])

  return { printManuscript }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}
