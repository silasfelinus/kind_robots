// DB-free validator for an Adventure bundle (kr-adventures/t-004).
import type { Adventure, AdventureIssue, AdventureNode, AdventureValidation } from '~/types/adventure'

export const ADVENTURE_MIN_WORDS = 60
export const ADVENTURE_MAX_WORDS = 180

const ENDING_KINDS = ['triumph', 'bittersweet', 'funny', 'tragic', 'secret']

export const countWords = (text: string): number => text.trim().split(/\s+/).filter(Boolean).length

const blank = (value: unknown): boolean => typeof value !== 'string' || !value.trim()

export function validateAdventure(book: Adventure): AdventureValidation {
  const errors: AdventureIssue[] = []
  const warnings: AdventureIssue[] = []
  const err = (code: string, message: string, nodeId?: string) => errors.push({ code, message, nodeId })
  const warn = (code: string, message: string, nodeId?: string) => warnings.push({ code, message, nodeId })

  if (book.version !== 1) err('version', `unsupported version ${String(book.version)}`)
  for (const key of ['slug', 'title', 'scenarioSlug', 'styleBible', 'start'] as const) {
    if (blank(book[key])) err('missing-field', `"${key}" is required`)
  }
  if (blank(book.hero?.characterSlug) || blank(book.hero?.name) || blank(book.hero?.blurb)) {
    err('hero', 'hero needs characterSlug, name and blurb')
  }

  const nodes: Record<string, AdventureNode> = book.nodes ?? {}
  const ids = Object.keys(nodes)
  if (!nodes[book.start]) err('start-missing', `start node "${book.start}" does not exist`)

  const setFlags = new Set<string>()
  for (const id of ids) for (const c of nodes[id]?.choices ?? []) for (const f of c.sets ?? []) setFlags.add(f)

  let endings = 0
  for (const id of ids) {
    const node = nodes[id]
    if (!node) continue
    if (node.id !== id) err('id-mismatch', `node key "${id}" has id "${node.id}"`, id)

    const words = countWords(node.text ?? '')
    if (words < ADVENTURE_MIN_WORDS || words > ADVENTURE_MAX_WORDS) {
      err('word-count', `${words} words; expected ${ADVENTURE_MIN_WORDS}-${ADVENTURE_MAX_WORDS}`, id)
    }
    if (blank(node.art?.file)) err('art-file', 'missing art.file', id)
    if (blank(node.art?.alt)) err('art-alt', 'missing art.alt', id)
    if (blank(node.art?.prompt)) err('art-prompt', 'missing art.prompt', id)

    const choices = node.choices ?? []
    if (node.ending) {
      endings++
      if (!ENDING_KINDS.includes(node.ending.kind)) err('ending-kind', `unknown ending kind "${node.ending.kind}"`, id)
      if (blank(node.ending.title)) err('ending-title', 'ending needs a title', id)
      if (choices.length) err('ending-choices', 'an ending must not have choices', id)
    } else {
      if (!choices.length) err('dead-end', 'non-ending node has no choices', id)
      else if (!choices.some((c) => !c.requires?.length)) {
        err('no-open-choice', 'every choice is gated; none is always available', id)
      }
      if (choices.length === 1) warn('single-choice', 'only one choice', id)
      if (choices.length > 3) warn('many-choices', `${choices.length} choices; brief says 2-3`, id)
    }

    for (const c of choices) {
      if (blank(c.label)) err('choice-label', 'choice has no label', id)
      if (!nodes[c.to]) err('dangling-link', `choice "${c.label}" points to missing node "${c.to}"`, id)
      for (const f of c.requires ?? []) {
        if (!setFlags.has(f)) err('flag-never-set', `requires "${f}" which no choice sets`, id)
      }
    }
  }

  const seen = new Set<string>()
  const queue = nodes[book.start] ? [book.start] : []
  while (queue.length) {
    const id = queue.pop() as string
    if (seen.has(id)) continue
    seen.add(id)
    for (const c of nodes[id]?.choices ?? []) if (nodes[c.to] && !seen.has(c.to)) queue.push(c.to)
  }
  for (const id of ids) {
    if (seen.has(id)) continue
    err(nodes[id]?.ending ? 'ending-unreachable' : 'unreachable', 'not reachable from start', id)
  }
  if (!endings) err('no-endings', 'book has no endings')

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    stats: { nodes: ids.length, endings, reachable: seen.size },
  }
}
