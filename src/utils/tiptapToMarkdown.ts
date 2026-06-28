// ============================================================
// matsuba - Tiptap JSON → Markdown 変換
// ============================================================

type TiptapNode = {
  type: string
  text?: string
  content?: TiptapNode[]
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  attrs?: Record<string, unknown>
}

function applyMarks(text: string, marks: TiptapNode['marks'] = []): string {
  let result = text
  for (const mark of marks) {
    switch (mark.type) {
      case 'bold':   result = `**${result}**`; break
      case 'italic': result = `*${result}*`;   break
      case 'strike': result = `~~${result}~~`; break
      case 'code':   result = `\`${result}\``; break
    }
  }
  return result
}

function inlineContent(nodes: TiptapNode[] = []): string {
  return nodes.map((node) => {
    if (node.type === 'text') return applyMarks(node.text ?? '', node.marks)
    if (node.type === 'hardBreak') return '  \n'
    if (node.type === 'ruby') {
      const baseText = node.attrs?.baseText as string ?? ''
      const reading = node.attrs?.reading as string ?? ''
      return `{${baseText}|${reading}}`
    }
    return inlineContent(node.content)
  }).join('')
}

function nodeToMarkdown(node: TiptapNode, listDepth = 0, ordered = false, index = 0): string {
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map((c) => nodeToMarkdown(c)).join('\n')

    case 'paragraph': {
      const text = inlineContent(node.content)
      return text ? text + '\n' : '\n'
    }

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1
      return `${'#'.repeat(level)} ${inlineContent(node.content)}\n`
    }

    case 'bulletList':
      return (node.content ?? []).map((item) => nodeToMarkdown(item, listDepth, false)).join('')

    case 'orderedList':
      return (node.content ?? []).map((item, i) => nodeToMarkdown(item, listDepth, true, i + 1)).join('')

    case 'listItem': {
      const indent = '  '.repeat(listDepth)
      const marker = ordered ? `${index}.` : '-'
      const children = node.content ?? []
      const lines = children.map((child, i) => {
        if (child.type === 'paragraph') {
          const text = inlineContent(child.content)
          return i === 0 ? `${indent}${marker} ${text}` : `${indent}  ${text}`
        }
        return nodeToMarkdown(child, listDepth + 1, child.type === 'orderedList')
      })
      return lines.join('\n') + '\n'
    }

    case 'blockquote': {
      const inner = (node.content ?? []).map((c) => nodeToMarkdown(c)).join('')
      return inner.split('\n').map((l) => l ? `> ${l}` : '>').join('\n') + '\n'
    }

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) ?? ''
      return `\`\`\`${lang}\n${inlineContent(node.content)}\n\`\`\`\n`
    }

    case 'horizontalRule': return '---\n'
    case 'hardBreak':      return '  \n'
    case 'text':           return applyMarks(node.text ?? '', node.marks)
    case 'ruby': {
      const baseText = (node.attrs?.baseText as string) ?? ''
      const reading = (node.attrs?.reading as string) ?? ''
      return `{${baseText}|${reading}}`
    }

    default:
      return (node.content ?? []).map((c) => nodeToMarkdown(c)).join('')
  }
}

export function tiptapToMarkdown(json: unknown): string {
  if (!json || typeof json !== 'object') return ''
  const doc = json as TiptapNode
  if (doc.type !== 'doc') return ''
  return nodeToMarkdown(doc).replace(/\n{3,}/g, '\n\n').trim()
}

export function buildFrontmatter(title: string, versionLabel?: string): string {
  return [
    '---',
    `title: ${title}`,
    versionLabel ? `version: ${versionLabel}` : 'version: 現在の版',
    `date: ${new Date().toISOString().slice(0, 10)}`,
    '---',
    '',
  ].join('\n')
}
