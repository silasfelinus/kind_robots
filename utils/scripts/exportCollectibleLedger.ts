// Print a Conductor art ledger (YAML) for one collectible set, so the code
// catalog stays the single source of truth for keys and prompts.
//
//   npx tsx utils/scripts/exportCollectibleLedger.ts tarot > \
//     ../conductor/projects/tarot-studio/art/COLLECTIBLES-1.yaml
//
// Subject keys equal catalog item keys; server/utils/collectibles.ts links a
// rendered job back to its item by the ledger request key.
import { collectibleSetBySlug } from '../collectibles/registry'

const slug = process.argv[2] ?? 'tarot'
const set = collectibleSetBySlug(slug)
if (!set) {
  console.error(`Unknown collectible set: ${slug}`)
  process.exit(1)
}

const q = (value: string) => JSON.stringify(value)
const lines: string[] = [
  `# ${set.title} collectible art (${set.projectSlug}; Silas, 2026-11-27 PT).`,
  `# Generated from kind_robots utils/collectibles/sets/${slug}.ts by`,
  '# utils/scripts/exportCollectibleLedger.ts: edit the catalog, then re-export.',
  `# ${set.cards.length} collectible cards and ${set.backs.length} unlockable card backs. Subject keys`,
  '# are catalog item keys; POST /api/collectibles/<set>/art-sync links each DONE',
  '# job to its item by request key. Generated art is pre-approved (AGENTS.md).',
  '# auto_submit: true. Queued is not rendered; rendered is not linked.',
  `round: ${set.projectSlug}-collectibles-1`,
  `project_slug: ${set.projectSlug}`,
  `designer: ${q(`${set.title} art bay`)}`,
  'is_public: false',
  'is_mature: false',
  'cast_loras: false',
  'auto_submit: true',
  'lanes:',
  `- key: ${set.ledgerLane}`,
  `  label: ${q(`Krea 2 (${set.title})`)}`,
  '  engine: krea2',
  '  prompt: prose',
  `  suffix: ${q(set.artStyle)}`,
  'subjects:',
]

let seed = 930001
for (const item of [...set.cards, ...set.backs]) {
  lines.push(
    `- key: ${item.key}`,
    `  lane: ${set.ledgerLane}`,
    `  entity: ${'rarity' in item ? `collectible-${item.rarity}` : 'card-back'}`,
    `  title: ${q(item.title)}`,
    `  asset: collectibles/${set.slug}/${item.key}`,
    '  size: 832x1216',
    `  seed: ${seed++}`,
    `  prompt_prose: ${q(item.artPrompt)}`,
  )
}

console.log(lines.join('\n'))
