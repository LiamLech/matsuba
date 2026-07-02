// ============================================================
// matsuba - Tiptap JSON → HTML 変換（印刷用）
// ============================================================

type TiptapNode = {
  type: string
  text?: string
  content?: TiptapNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  attrs?: Record<string, unknown>
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function applyMarksHtml(text: string, marks: TiptapNode['marks'] = []): string {
  let result = escapeHtml(text)
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':   result = `<strong>${result}</strong>`; break
      case 'italic': result = `<em>${result}</em>`;         break
      case 'strike': result = `<s>${result}</s>`;           break
      case 'code':   result = `<code>${result}</code>`;     break
    }
  }
  return result
}

function inlineHtml(nodes: TiptapNode[] = []): string {
  return nodes.map((node) => {
    if (node.type === 'text')      return applyMarksHtml(node.text ?? '', node.marks)
    if (node.type === 'hardBreak') return '<br>'
    if (node.type === 'ruby') {
      const baseText = escapeHtml((node.attrs?.baseText as string) ?? '')
      const reading  = escapeHtml((node.attrs?.reading as string) ?? '')
      return `<ruby>${baseText}<rt>${reading}</rt></ruby>`
    }
    return inlineHtml(node.content)
  }).join('')
}

function nodeToHtml(node: TiptapNode, __________________listDepth = 0, _ordered = false, _index = 0): string {
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map((c) => nodeToHtml(c)).join('\n')

    case 'paragraph':
      return `<p>${inlineHtml(node.content)}</p>`

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1
      return `<h${level}>${inlineHtml(node.content)}</h${level}>`
    }

    case 'bulletList':
      return `<ul>${(node.content ?? []).map((c) => nodeToHtml(c, 0, false)).join('')}</ul>`

    case 'orderedList':
      return `<ol>${(node.content ?? []).map((c, i) => nodeToHtml(c, 0, true, i + 1)).join('')}</ol>`

    case 'listItem':
      return `<li>${(node.content ?? []).map((c) => nodeToHtml(c)).join('')}</li>`

    case 'blockquote':
      return `<blockquote>${(node.content ?? []).map((c) => nodeToHtml(c)).join('')}</blockquote>`

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) ?? ''
      return `<pre><code class="language-${lang}">${inlineHtml(node.content)}</code></pre>`
    }

    case 'horizontalRule': return '<hr>'
    case 'hardBreak':      return '<br>'

    case 'text':
      return applyMarksHtml(node.text ?? '', node.marks)

    case 'ruby': {
      const baseText = escapeHtml((node.attrs?.baseText as string) ?? '')
      const reading  = escapeHtml((node.attrs?.reading as string) ?? '')
      return `<ruby>${baseText}<rt>${reading}</rt></ruby>`
    }

    default:
      return (node.content ?? []).map((c) => nodeToHtml(c)).join('')
  }
}

export function tiptapToHtml(json: unknown): string {
  if (!json || typeof json !== 'object') return ''
  const doc = json as TiptapNode
  if (doc.type !== 'doc') return ''
  return nodeToHtml(doc)
}
