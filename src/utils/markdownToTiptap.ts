// ============================================================
// matsuba - Markdown → Tiptap JSON 変換
// ============================================================

type TiptapNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: TiptapNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  text?: string
}

// ── インラインパーサー ────────────────────────────────────────

function parseInline(text: string): TiptapNode[] {
  const nodes: TiptapNode[] = []
  let remaining = text
  let safetyCount = 0
  const MAX_ITER = 10000

  while (remaining.length > 0 && safetyCount < MAX_ITER) {
    safetyCount++

    // ルビ記法 {ベース|よみ}
    const rubyMatch = remaining.match(/^\{([^|{}]+)\|([^|{}]+)\}/)
    if (rubyMatch) {
      nodes.push({ type: 'ruby', attrs: { baseText: rubyMatch[1], reading: rubyMatch[2] } })
      remaining = remaining.slice(rubyMatch[0].length)
      continue
    }

    // 太字 **text**
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/)
    if (boldMatch) {
      nodes.push({ type: 'text', text: boldMatch[1], marks: [{ type: 'bold' }] })
      remaining = remaining.slice(boldMatch[0].length)
      continue
    }

    // 取り消し線 ~~text~~
    const strikeMatch = remaining.match(/^~~(.+?)~~/)
    if (strikeMatch) {
      nodes.push({ type: 'text', text: strikeMatch[1], marks: [{ type: 'strike' }] })
      remaining = remaining.slice(strikeMatch[0].length)
      continue
    }

    // イタリック *text*（単独の*はそのまま文字として扱う）
    const italicMatch = remaining.match(/^\*([^*\n]+?)\*(?!\*)/)
    if (italicMatch) {
      nodes.push({ type: 'text', text: italicMatch[1], marks: [{ type: 'italic' }] })
      remaining = remaining.slice(italicMatch[0].length)
      continue
    }

    // インラインコード `code`
    const codeMatch = remaining.match(/^`([^`]+)`/)
    if (codeMatch) {
      nodes.push({ type: 'text', text: codeMatch[1], marks: [{ type: 'code' }] })
      remaining = remaining.slice(codeMatch[0].length)
      continue
    }

    // 先頭1文字をそのままテキストとして追加（必ず進む）
    const lastNode = nodes[nodes.length - 1]
    if (lastNode && lastNode.type === 'text' && !lastNode.marks) {
      lastNode.text = (lastNode.text ?? '') + remaining[0]
    } else {
      nodes.push({ type: 'text', text: remaining[0] })
    }
    remaining = remaining.slice(1)
  }

  return nodes
}

// ── ブロックパーサー ──────────────────────────────────────────

function parseBlock(lines: string[]): TiptapNode[] {
  const nodes: TiptapNode[] = []
  let i = 0
  let safetyCount = 0
  const MAX_ITER = 10000

  while (i < lines.length && safetyCount < MAX_ITER) {
    safetyCount++
    const line = lines[i]

    // 空行
    if (line.trim() === '') {
      i++
      continue
    }

    // 見出し
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (headingMatch) {
      nodes.push({
        type: 'heading',
        attrs: { level: headingMatch[1].length },
        content: parseInline(headingMatch[2]),
      })
      i++
      continue
    }

    // 見出し記号のみ（例：# だけ）→ 空の段落として扱う
    if (line.match(/^#{1,6}\s*$/)) {
      nodes.push({ type: 'paragraph', content: [{ type: 'text', text: line }] })
      i++
      continue
    }

    // 水平線
    if (line.match(/^-{3,}$/) || line.match(/^\*{3,}$/) || line.match(/^_{3,}$/)) {
      nodes.push({ type: 'horizontalRule' })
      i++
      continue
    }

    // コードブロック
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      let codeLoop = 0
      while (i < lines.length && !lines[i].startsWith('```') && codeLoop < 1000) {
        codeLines.push(lines[i])
        i++
        codeLoop++
      }
      if (i < lines.length) i++ // closing ```
      nodes.push({
        type: 'codeBlock',
        attrs: { language: lang },
        content: [{ type: 'text', text: codeLines.join('\n') }],
      })
      continue
    }

    // 引用
    if (line.startsWith('> ') || line === '>') {
      const quoteLines: string[] = []
      let quoteLoop = 0
      while (i < lines.length && (lines[i].startsWith('> ') || lines[i] === '>') && quoteLoop < 1000) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
        quoteLoop++
      }
      nodes.push({ type: 'blockquote', content: parseBlock(quoteLines) })
      continue
    }

    // 箇条書きリスト（- または * で始まる行）
    if (line.match(/^[-*]\s+/)) {
      const items: TiptapNode[] = []
      let listLoop = 0
      while (i < lines.length && lines[i].match(/^[-*]\s+/) && listLoop < 1000) {
        const itemText = lines[i].replace(/^[-*]\s+/, '')
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInline(itemText) }],
        })
        i++
        listLoop++
      }
      nodes.push({ type: 'bulletList', content: items })
      continue
    }

    // リスト記号のみ（- だけ、* だけ）→ テキストとして扱う
    if (line.match(/^[-*]\s*$/)) {
      nodes.push({ type: 'paragraph', content: [{ type: 'text', text: line }] })
      i++
      continue
    }

    // 番号付きリスト
    if (line.match(/^\d+\.\s+/)) {
      const items: TiptapNode[] = []
      let listLoop = 0
      while (i < lines.length && lines[i].match(/^\d+\.\s+/) && listLoop < 1000) {
        const itemText = lines[i].replace(/^\d+\.\s+/, '')
        items.push({
          type: 'listItem',
          content: [{ type: 'paragraph', content: parseInline(itemText) }],
        })
        i++
        listLoop++
      }
      nodes.push({ type: 'orderedList', content: items })
      continue
    }

    // 通常段落（次の空行または特殊行まで）
    const paraLines: string[] = []
    let paraLoop = 0
    while (
      i < lines.length &&
      paraLoop < 1000 &&
      lines[i].trim() !== '' &&
      !lines[i].match(/^#{1,6}[\s#]/) &&
      !lines[i].match(/^[-*]\s/) &&
      !lines[i].match(/^\d+\.\s/) &&
      !lines[i].startsWith('```') &&
      !lines[i].startsWith('> ') &&
      !lines[i].match(/^-{3,}$/) &&
      !lines[i].match(/^\*{3,}$/)
    ) {
      paraLines.push(lines[i])
      i++
      paraLoop++
    }

    if (paraLines.length > 0) {
      nodes.push({
        type: 'paragraph',
        content: parseInline(paraLines.join('\n')),
      })
    } else {
      // どの条件にもマッチしない行は強制的に進める（無限ループ防止）
      nodes.push({ type: 'paragraph', content: [{ type: 'text', text: line }] })
      i++
    }
  }

  return nodes
}

export function markdownToTiptap(markdown: string): unknown {
  if (!markdown || !markdown.trim()) {
    return { type: 'doc', content: [{ type: 'paragraph', content: [] }] }
  }

  // frontmatterを除去
  const withoutFrontmatter = markdown.replace(/^---[\s\S]*?---\n?/, '')
  const lines = withoutFrontmatter.split('\n')
  const content = parseBlock(lines)

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph', content: [] }],
  }
}
