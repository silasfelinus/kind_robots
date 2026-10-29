import assert from 'node:assert/strict'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import { PLAYBOOK_GAMES } from '../playbook/games'
import type { Playbook, PlaybookNode } from '../playbook/types'

// Playbook Forge art prompts: every beat a game still has to paint carries a
// prompt written for the engine it renders on. Krea 2, Z-Image and Flux 2 read
// prose literally (Silas, 2026-10-27: "no metaphors for krea2"), so a prompt
// names what is visible: who, where, doing what, under what light, from what
// camera. Games set `artPromptsComplete` once every unpainted beat has one;
// from then on this test holds them to it.
//
//   npm run test:playbook-art-prompts                 enforce complete games
//   npm run test:playbook-art-prompts -- --report     coverage for every game
//   npm run test:playbook-art-prompts -- --game <id>  every gap in one game

const ABSTRACT: [RegExp, string][] = [
  [
    /\b(?:metaphor\w*|symbol\w*|represent\w*|embod\w*|allegor\w*)\b/i,
    'figurative',
  ],
  [
    /\b(?:evok\w*|evocative|conveys?|conveying|suggest(?:s|ing)?)\b/i,
    'figurative',
  ],
  [/\b(?:as if|as though|seems? to|appears? to be|almost like)\b/i, 'simile'],
  [
    /\b(?:sense|feeling|spirit|air|aura|essence|idea|promise|weight|echo) of\b/i,
    'abstract',
  ],
  [
    /\b(?:vibes?|essence|concept|themes?|narrative|story|storytelling)\b/i,
    'abstract',
  ],
  [
    /\b(?:iconic|premium|readable|legible|thumbnail|focal|composition|unmistakable|striking|stunning|epic|masterpiece)\b/i,
    'art-direction',
  ],
  [/\b(?:no|not|without|never|none|nothing|nobody|no one)\b/i, 'negation'],
  [/\b(?:Kind Robots|Playbook|beat|game|chapter|scene card)\b/i, 'app wrapper'],
]

export function promptProblems(
  prompt: string,
  node: Pick<PlaybookNode, 'title'>,
  engine: string,
): string[] {
  const text = prompt.replace(/\s+/g, ' ').trim()
  const found: string[] = []
  if (text.length < 120) found.push('too short (under 120 characters)')
  if (text.length > 900) found.push('too long (over 900 characters)')
  for (const [pattern, label] of ABSTRACT) {
    const word = text.match(pattern)?.[0]
    if (word) found.push(`${label}: "${word}"`)
  }
  const title = node.title.trim()
  if (
    title.split(/\s+/).length >= 3 &&
    text.toLowerCase().includes(title.toLowerCase())
  )
    found.push('carries the beat title')
  for (const v of checkArtPromptContract({ prompt: text, engine }))
    found.push(`contract ${v.rule}`)
  return found
}

type Gap = { key: string; title: string; problem: string }

export function auditPlaybook(book: Playbook) {
  const engine = book.artLanes[0] ?? 'krea2'
  const unprompted: Gap[] = []
  const bad: Gap[] = []
  let prompted = 0
  let needsArt = 0
  for (const key of new Set([...book.order, ...Object.keys(book.nodes)])) {
    const node = book.nodes[key]
    if (!node) continue
    if (node.needsArt) needsArt += 1
    const prompt = node.artPrompt?.trim()
    if (!prompt) {
      if (node.needsArt)
        unprompted.push({ key, title: node.title, problem: 'no art prompt' })
      continue
    }
    prompted += 1
    const problems = promptProblems(prompt, node, engine)
    if (problems.length)
      bad.push({ key, title: node.title, problem: problems.join('; ') })
  }
  return { engine, needsArt, prompted, unprompted, bad }
}

const args = process.argv.slice(2)
const only = args.includes('--game') ? args[args.indexOf('--game') + 1] : null
const report = args.includes('--report') || !!only

assert.deepEqual(
  promptProblems(
    'A long red velvet couch floats above a grey moon, three crew members sit on its cushions inside a clear dome of air, earth-blue light from the left, wide shot from below',
    { title: 'Couch Over the Moon' },
    'krea2',
  ),
  [],
)
assert.ok(
  promptProblems(
    'The couch as a symbol of comfort, evoking a sense of home among the stars, iconic composition',
    { title: 'Home' },
    'krea2',
  ).length >= 3,
)
assert.ok(
  promptProblems(
    'Ashdock shipyard at night with the dockworkers who never clocked out standing in empty pressure suits under arc lamps',
    { title: 'The Dockworkers Who Never Clocked Out' },
    'krea2',
  ).some((p) => p.includes('title')),
)

let failures = 0
for (const game of PLAYBOOK_GAMES) {
  if (only && game.id !== only) continue
  const book = game.build()
  const audit = auditPlaybook(book)
  const complete = !!book.artPromptsComplete
  if (report)
    console.log(
      `${game.id.padEnd(30)} ${complete ? 'complete' : 'open    '} needsArt=${audit.needsArt} prompted=${audit.prompted} unprompted=${audit.unprompted.length} failing=${audit.bad.length} (${audit.engine})`,
    )
  if (only)
    for (const gap of [...audit.unprompted, ...audit.bad])
      console.log(`  ${gap.key}\t${gap.title}\t${gap.problem}`)
  if (!complete) continue
  for (const gap of [...audit.unprompted, ...audit.bad]) {
    failures += 1
    console.error(`${game.id} ${gap.key} "${gap.title}": ${gap.problem}`)
  }
}

if (failures) {
  console.error(
    `${failures} art prompt gap(s) in games marked artPromptsComplete.`,
  )
  process.exit(1)
}
console.log(
  'Playbook art prompts: every complete game has a literal prompt for every unpainted beat.',
)
