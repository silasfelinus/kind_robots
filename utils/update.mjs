import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, basename, extname } from 'path'

// ── New artPrompts keyed by page title ────────────────────────────────────────
const ART_PROMPTS = {
  About:
    'A luminous butterfly landing on a glowing mission statement scroll, surrounded by floating speech bubbles with tiny elevator pitches, warm sunrise colors, retrofuturist optimism, no text',
  Art: 'An easel in a sun-drenched studio surrounded by floating canvases showing AI-generated dreamscapes, paint-splattered robot hands gently presenting a finished piece, vibrant saturated palette, no text',
  Bots: 'A cozy neon-lit bot café where cheerful robots of all shapes serve glowing chat bubbles on trays, patrons at tables mid-conversation, warm cyberpunk diner aesthetic, no text',
  Brains:
    'A brain in a jar on a laboratory shelf, surrounded by floating lightbulbs and chaotic sticky notes, colorful sparks arcing between neurons, dark comedy mad-science vibe, no text',
  'Builder Tool':
    'A tiny world being assembled from blueprint fragments — mountains snapping into place, characters popping into existence, a miniature universe under construction inside a glass sphere, no text',
  Button:
    'A single enormous candy-red button on a pedestal, surrounded by a crowd of curious visitors leaning forward despite a "DO NOT PRESS" sign, mischievous energy, comic tension, no text',
  Characters:
    "A gallery of ornate portrait frames, each containing a wildly different character — knight, jellyfish wizard, raccoon detective, glitching android — all slightly aware they're being watched, no text",
  Chats:
    'Thousands of glowing chat bubbles drifting through a dark surreal space like bioluminescent jellyfish, some containing tiny illustrated scenes of absurd conversations, no text',
  'Art Collections':
    'A grand hall with themed exhibition wings visible through archways — one lit in purples for fantasy, one in warm gold for portraits — a curator bot arranging art on the wall, no text',
  Human:
    'A cozy personal treehouse room floating in a soft cloud layer, filled with customizable objects — favorite colors on the walls, a pinboard of personal art, warm lamp glow, no text',
  Dreams:
    'Multiple hands reaching into a shared glowing dreampool, each touch rippling new imagery outward — forests, cityscapes, strange creatures — all blending at the edges, no text',
  Direction:
    'A friendly signpost in the middle of a foggy forest crossroads, arrows pointing in impossible directions, a lost map floating by, whimsical rather than alarming, soft muted palette, no text',
  Forum:
    'An open-air amphitheater full of humans, bots, and creatures mid-debate, ideas literally floating above heads as glowing objects, collaborative creative chaos energy, no text',
  Icons:
    'A vast wall of tiny glowing doorways, each containing a miniature scene — a snail leading to a poetry room, a rocket to a dashboard, infinite visual variety in a grid, no text',
  Robots:
    'The Kind Robots main lab: Dotti at her workbench, AMI as a luminous butterfly hovering above, Silas-silhouette at the terminal, warm workshop glow, sense of creative possibility, no text',
  Login:
    'A glowing archway portal with a friendly robot doorman, two paths visible beyond — a creative wonderland on the other side, warm inviting light, no puzzles or riddles depicted, no text',
  'Memory Dungeon':
    'A dungeon corridor lit by torch-glow where oversized memory cards line the walls like doors, a small adventurer mid-run holding a matched pair aloft, treasure chest spilling light ahead, no text',
  Jellybeans:
    'A playful cross-section of a website rendered as a physical laboratory building, with tiny jellybean icons hidden in corners, under desks, behind potted plants, treasure-hunt energy, no text',
  Navigation:
    'An illustrated fantasy map of the Kind Robots site rendered as a living world — Bot Café here, Dream Deck there, roads and rivers connecting regions, warm cartography aesthetic, no text',
  Privacy:
    "A glowing shield hovering protectively over a small figure's private data vault, friendly rather than corporate, warm colors, sense of care and transparency, no text",
  Registration:
    'A festive gateway decorated with colorful banners, a welcoming committee of bots and characters, confetti mid-explosion, sense of genuine arrival and belonging, no text',
  Rewards:
    'An overflowing treasure chest spilling glowing story objects — cursed crowns, sentient scrolls, mystery potions — each pulsing with its own weird narrative energy, no text',
  Butterfly:
    'AMI as a constellation of luminous digital butterflies filling a sanctuary space, some forming the shape of a world map, warm light suggesting both peace and purpose, no text',
  'Screen FX':
    'A control room console covered in effect triggers, the screen beyond showing a real scene being increasingly overtaken by butterflies, sparkles, and glitch artifacts, playful chaos, no text',
  Servers:
    'A cheerful server room where rack units have personality — little faces, status lights like eyes, cables organized like colorful spaghetti art, friendly tech infrastructure vibe, no text',
  Stories:
    'A story being written and simultaneously becoming real — words lifting off a page and transforming into characters, landscapes, portals, surreal narrative genesis energy, no text',
  Plans:
    'A butterfly-powered generator sending energy to a glowing Kind Robots skyline, support tiers visualized as ascending platforms with increasingly elaborate robot supporters, no text',
  Themes:
    'A single room shown simultaneously in 6 different themes — one slice gothic, one pastel, one neon, one forest — all radiating from a central figure choosing with a remote, no text',
  Wonder:
    "A behind-the-scenes view of a magical clockwork theater, gears and pulleys visible through a lifted curtain, components labeled with whimsical names, inventor's delight aesthetic, no text",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Naively parse YAML frontmatter between --- delimiters.
 * Returns { data: Record<string,string>, content: string, raw: string }
 */
function parseFrontmatter(src) {
  const match = src.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)([\s\S]*)/)
  if (!match) return null
  return { yaml: match[1], rest: match[3] }
}

/**
 * Replace a specific YAML key's value (single-line string, quoted or bare).
 * Works for: key: value  |  key: "value"  |  key: 'value'
 */
function replaceYamlField(yaml, key, newValue) {
  // Escape any characters that would break a double-quoted YAML string
  const escaped = newValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  const re = new RegExp(`^(${key}:\\s*)(.+)$`, 'm')
  if (re.test(yaml)) {
    return yaml.replace(re, `$1"${escaped}"`)
  }
  // Key not found — append it
  return yaml + `\n${key}: "${escaped}"`
}

/**
 * Derive the new image path from the md filename.
 * "screenfx.md"  →  "pages/screenfx.png"
 */
function deriveImagePath(mdFilename) {
  const base = basename(mdFilename, '.md')
  return `pages/${base}.png`
}

// ── Main ──────────────────────────────────────────────────────────────────────

const PAGES_DIR = join(process.cwd(), 'content')

let files
try {
  files = readdirSync(PAGES_DIR).filter((f) => f.endsWith('.md'))
} catch (e) {
  console.error(`Could not read ${PAGES_DIR}:`, e.message)
  process.exit(1)
}

if (files.length === 0) {
  console.warn('No .md files found in content/pages')
  process.exit(0)
}

let updated = 0
let skipped = 0

for (const file of files) {
  const filePath = join(PAGES_DIR, file)
  const src = readFileSync(filePath, 'utf8')
  const parsed = parseFrontmatter(src)

  if (!parsed) {
    console.warn(`  SKIP  ${file} — no frontmatter found`)
    skipped++
    continue
  }

  // Extract current title from frontmatter
  const titleMatch = parsed.yaml.match(/^title:\s*["']?(.+?)["']?\s*$/m)
  if (!titleMatch) {
    console.warn(`  SKIP  ${file} — no title field in frontmatter`)
    skipped++
    continue
  }

  const title = titleMatch[1].replace(/^["']|["']$/g, '').trim()
  const newPrompt = ART_PROMPTS[title]

  if (!newPrompt) {
    console.warn(`  SKIP  ${file} — no artPrompt mapping for title "${title}"`)
    skipped++
    continue
  }

  // Image path is always derived from the md filename
  const newImage = deriveImagePath(file)

  // Apply replacements
  let newYaml = replaceYamlField(parsed.yaml, 'artPrompt', newPrompt)
  newYaml = replaceYamlField(newYaml, 'image', newImage)

  const newSrc = `---\n${newYaml}\n---\n${parsed.rest}`
  writeFileSync(filePath, newSrc, 'utf8')

  console.log(`  OK    ${file}  →  image: ${newImage}`)
  updated++
}

console.log(`\nDone. ${updated} updated, ${skipped} skipped.`)
