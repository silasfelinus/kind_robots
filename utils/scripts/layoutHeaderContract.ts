type TemplateNode = {
  tag: string
  classTokens: string[]
  children: TemplateNode[]
}

const SURFACED_TAGS = new Set(['article', 'section'])
const SURFACED_CLASSES = /^(?:kr-panel|card)(?:-|$)/
const LARGE_TITLE = /^(?:(?:sm|md|lg|xl|2xl):)?text-(?:2xl|3xl)$/
const ACTION_TAGS = new Set(['a', 'button'])
const MEDIA_TAGS = new Set(['img', 'svg', 'icon'])
const ACTION_CLASS = /^(?:btn|kr-btn)(?:-|$)/

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

/*
 * A link/button (real <a>/<button>, or anything carrying a btn/kr-btn class)
 * or standalone media (<img>/<svg>/<Icon>) sibling means this block is a
 * distinct hero/CTA section, not a repeat of the shell's title -- a genuine
 * duplicate shell-title block is pure copy (an eyebrow, the title, a
 * description line), nothing interactive or illustrative alongside it.
 */
function isActionOrMedia(node: TemplateNode): boolean {
  const tag = node.tag.toLowerCase()
  return (
    ACTION_TAGS.has(tag) ||
    MEDIA_TAGS.has(tag) ||
    node.classTokens.some((token) => ACTION_CLASS.test(token))
  )
}

function shallowTitleStack(node: TemplateNode): boolean {
  if (isSurface(node)) return false

  const directTitle = node.children.some(isLargeBlackTitle)
  if (!directTitle) return false

  // kind_robots components/pages/giving-page.vue (conductor
  // interface-vision/t-127): its "Give Directly. We Never Touch It." headline
  // says something the shell's "Giving & Support" title does not, and sits
  // beside a donate button and an icon -- structurally a hero/CTA section,
  // not Scene Animator's bare eyebrow+title+description toolbar. A block
  // this shallow that also carries its own action or media is content, not
  // shell-chrome duplication.
  if (node.children.some(isActionOrMedia)) return false

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
