// ============================================================
// matsuba - Tiptap ルビ拡張（グループルビ固定）
// ============================================================

import { Node, mergeAttributes, InputRule } from '@tiptap/core'

export interface RubyOptions {
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ruby: {
      setRuby: (baseText: string, reading: string) => ReturnType
      unsetRuby: () => ReturnType
    }
  }
}

export const Ruby = Node.create<RubyOptions>({
  name: 'ruby',
  group: 'inline',
  inline: true,
  atom: true,

  addOptions() {
    return { HTMLAttributes: {} }
  },

  addAttributes() {
    return {
      baseText: { default: '' },
      reading:  { default: '' },
    }
  },

  parseHTML() {
    return [{
      tag: 'ruby',
      getAttrs: (el) => {
        const ruby = el as HTMLElement
        const rt = ruby.querySelector('rt')
        const reading = rt?.textContent ?? ''
        const baseText = ruby.textContent?.replace(reading, '').trim() ?? ''
        return { baseText, reading }
      },
    }]
  },

  renderHTML({ HTMLAttributes }) {
    const { baseText, reading, ...rest } = HTMLAttributes
    return [
      'ruby',
      mergeAttributes(this.options.HTMLAttributes, rest),
      baseText,
      ['rt', reading],
    ]
  },

  addCommands() {
    return {
      setRuby:
        (baseText, reading) =>
        ({ chain, state }) => {
          const { from, to } = state.selection
          const selectedText = baseText || state.doc.textBetween(from, to)
          return chain()
            .deleteSelection()
            .insertContent({
              type: this.name,
              attrs: { baseText: selectedText, reading },
            })
            .run()
        },
      unsetRuby:
        () =>
        ({ state, chain }) => {
          const { from } = state.selection
          const node = state.doc.nodeAt(from)
          if (node?.type.name === this.name) {
            const baseText = node.attrs.baseText as string
            return chain()
              .deleteRange({ from, to: from + 1 })
              .insertContentAt(from, baseText)
              .run()
          }
          return false
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-r': () => {
        window.dispatchEvent(new CustomEvent('matsuba:openRubyDialog'))
        return true
      },
    }
  },

  addInputRules() {
    return [
      new InputRule({
        find: /\{([^|{}]+)\|([^|{}]+)\}$/,
        handler: ({ state, range, match }) => {
          const baseText = match[1]
          const reading = match[2]
          const { tr } = state
          tr.delete(range.from, range.to)
          const rubyNode = state.schema.nodes[this.name]
          if (rubyNode) {
            tr.insert(range.from, rubyNode.create({ baseText, reading }))
          }
        },
      }),
    ]
  },
})
