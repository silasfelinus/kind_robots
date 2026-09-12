type TemplateNode = {
  tag: string
  classTokens: string[]
  children: TemplateNode[]
}

const SURFACED_TAGS = new Set(['article', 'section'])
const SURFACED_CLASSES = /^(?:kr-panel|card)(?:-|$)/
const LARGE_TITLE = /^(?:(?:sm|md|lg|xl|2xl):)?text-(?:2xl|3xl)$/

function isSurface(node: TemplateNode): boolean {
  return (
    SURFACED_TAGS.has(node.tag.toLowerCase()) ||
    node.classTokens.some((token) => SURFACED_CLASSES.test(token))
  )
}

function isLargeBlackTitle(node: TemplateNode): boolean {
  return (
    node.classTokens.includes('font-black') &&
    node.classTokens.some((token) => LARGE_TITLE.test(token))
  )
}

function shallowTitleStack(node: TemplateNode): boolean {
  if (isSurface(node)) return false

  const directTitle = node.children.some(isLargeBlackTitle)
  if (!directTitle) return false

  // A duplicate shell-title block is a stack, not a lone display value. Requiring
  // sibling copy keeps ranks/scores and other large values out of the signal.
  return node.children.length >= 2
}

/**
 * Conservative non-h1 half of Interface Vision's one-header contract.
 *
 * Only inspect the page root and its immediate children. Do not descend through
 * article/section/panel/card content surfaces: runtime entity names, result-state
 * headings and authored heroes belong there and are not shell-title duplication.
 */
export function hasShallowDuplicateTitleBlock(nodes: TemplateNode[]): boolean {
  const root = nodes[0]
  if (!root) return false

  if (shallowTitleStack(root)) return true
  return root.children.some(shallowTitleStack)
}

export type { TemplateNode }
