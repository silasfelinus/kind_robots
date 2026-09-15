// /scripts/generate_facet_art_v4.ts
//
// Audits the complete active Facet catalog and creates durable ArtJobs for
// uncovered Facets. Baseline mode intentionally queues ONE useful image per
// Facet; purpose-built card/hero/icon renders are optional enhancements and are
// only backfilled with --all-variants. Structural oddities are reported and
// skipped rather than rewarded with art.
//
// Krea 2 is intentionally treated as a caption-conditioned image model here,
// not as an instruction-following chat model. The prompt contains the visual
// subject, scene, medium, composition, light, and texture. It does NOT contain
// app nouns, taxonomy labels, prompt-writing instructions, or the words that
// describe what the image will be used for. Those wrappers were rendered as
// logos/title copy by the v2/v3 Facet producer.
//
// v5 (2026-09-14) extends that same principle one step further, to the words
// the producer itself adds. v4 removed the app context but replaced it with
// art-direction jargon -- "Iconic scene, concrete focal subject", "unmistakable
// silhouette" -- which is still writing ABOUT a picture rather than describing
// one. For a Facet with prose of its own the clause was diluted and the art was
// fine. For a Facet without prose the clause WAS the prompt, and Krea rendered
// it exactly as written: 154 GENRE/THEME/SETTING Facets came back as the same
// grey concrete bust, 50 OCCUPATION/ROLE/ARCHETYPE Facets as the same black
// paper cut-out. Found from a Storybook genre-picker screenshot, six weeks
// after the renders landed and long after they had passed a green test suite
// that asserted the exact clause was acceptable.
//
// Usage:
//   npx tsx scripts/generate_facet_art.ts
//   npx tsx scripts/generate_facet_art.ts --write
//   npx tsx scripts/generate_facet_art.ts --write --all-variants
//   npx tsx scripts/generate_facet_art.ts --write --repair-tainted
//   npx tsx scripts/generate_facet_art.ts --write --requeue-curated
//
// --repair-tainted re-queues v2/v3 wholesale, and the v4 renders whose prompt
// was clause-dominated. Healthy v4 renders and non-depictable prompt-modifier
// Facets are counted and reported, never re-rolled.

import 'dotenv/config'
import { buildKrea2WorkflowFromRequest } from '../server/api/comfy/krea2/utils/workflow'
import {
  assertArtPromptContract,
  checkArtPromptContract,
} from '../server/utils/artPromptContract'
import { enrichArtJobPayload } from '../server/utils/artJobProvenance'
import {
  auditFacetCatalog,
  type FacetAuditInput,
} from '../utils/facetCatalogAudit'
import {
  ENHANCEMENT_SWATCH_SUBJECT,
  ENHANCEMENT_SWATCH_SUBJECTS,
  isRetiredPromptEnhancement,
} from '../utils/promptEnhancementPolicy'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'

const WRITE = process.argv.includes('--write')
const ALL_VARIANTS = process.argv.includes('--all-variants')
const REPAIR_TAINTED = process.argv.includes('--repair-tainted')
/*
 * Re-render a Facet whose curated artPrompt no longer matches the prompt its
 * current picture was made from.
 *
 * Authored prompts are the answer to variety -- a shared clause can only ever
 * give 146 cards the same look -- but the repair modes cannot see them: those
 * select on a known GENERATED clause, and a curated prompt matches none. So
 * without this, writing a better prompt changes nothing that anyone can see,
 * which is the exact silent failure that has already cost three rounds here.
 */
const REQUEUE_CURATED = process.argv.includes('--requeue-curated')
/*
 * --facets <slug,slug> limits everything this run would queue to those Facets.
 *
 * Art direction is judged by looking, and looking costs a render. Without a way
 * to try three, every wording change is an all-or-nothing bet on 45 or 146
 * pictures -- which is how two bad clauses reached the whole catalog before
 * anyone saw one. Dry-run reporting is unaffected.
 */
const FACET_FILTER = (() => {
  const index = process.argv.indexOf('--facets')
  if (index < 0) return null
  const raw = process.argv[index + 1] ?? ''
  const slugs = raw
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
  return slugs.length ? new Set(slugs) : null
})()
const FACET_FILTER_INPUT = FACET_FILTER ? [...FACET_FILTER] : []
const PROJECT_SLUG = 'facet-catalog'
// The module keeps its v4 filename (three verify scripts and the stable
// entrypoint import it by path); this constant, not the filename, is the
// provenance of record.
const FACET_ART_VERSION = 'facet-coverage-krea2-v6'
const LEGACY_FACET_ART_VERSIONS = new Set([
  'facet-multi-art-krea2-v2',
  'facet-coverage-krea2-v3',
  // v4's own output. Its taxonomy clauses were art-direction jargon and Krea
  // painted them literally; see taxonomyVisualLanguage() below. Unlike v2/v3,
  // v4 is NOT uniformly tainted -- a Facet with real prose diluted the clause
  // and rendered correctly -- so the repair sweep narrows this one by
  // v4PromptWasClauseDominated() rather than re-rendering the whole catalog.
  'facet-coverage-krea2-v4',
  // v5's occupation clause. It fixed the black paper cut-out and introduced two
  // new faults of its own; see taxonomyVisualLanguage(). Narrowed by
  // v5RenderNeedsRepair() to the 50 rows that carry that one clause -- v5's
  // genre and theme renders are good and must not be re-rolled.
  'facet-coverage-krea2-v5',
])

// v2 and v3 persisted this exact generated wrapper into Facet.artPrompt. It is
// provenance, not curated prose. Recognize only the generator signature so a
// human-authored artPrompt is never rewritten just because it contains words
// such as "facet" or "illustrate" somewhere in its subject matter.
//
// The quoted title may itself contain straight quotes (`Carries a candle
// everywhere "just in case."`), so a curly-quoted title runs to the closing
// curly quote and a straight-quoted one to the closing straight quote; a
// single character class excluding both left ten wrapper prompts unrecognized
// and the contract then rejected them at write time (2026-09-05 repair run).
const LEGACY_GENERATED_IDENTITY =
  /^Illustrate the Facet concept (?:“[^”]+”|"[^"]+")\.\s*/i

// v4 persisted its own generated tail into Facet.artPrompt the same way. Every
// v4 clause is listed, not only the two that misrendered: a stored v4 prompt is
// returned verbatim by buildFacetIdentityPrompt(), so any clause left
// unrecognized would be handed straight back to the prompt contract, which now
// rejects the jargon -- aborting the whole run instead of repairing it.
const LEGACY_V4_TAXONOMY_TAILS = [
  'One unmistakable full creature, recognizable anatomy, distinctive personality, habitat cues.',
  'Iconic scene, concrete focal subject, environment, action, strong atmosphere.',
  'Character-centered visual metaphor, clear emotion through pose, expression, costume, and environment.',
  'Unmistakable palette or material behavior through lighting, texture, and a strong central form.',
  'Polished sample of the visual treatment, coherent medium, linework, palette, lighting, and surface detail.',
  'Single distinctive figure in action, readable tools, unmistakable silhouette, workplace cues.',
  'Premium collectible object or emblem, rarity expressed through materials and lighting, clean silhouette.',
  'Single clear subject or emblem, immediately legible at thumbnail size.',
] as const

// The v5 clauses. Same reasoning as the v4 table above: a stored prompt this
// function does not recognize is returned verbatim by buildFacetIdentityPrompt,
// so an unlisted clause would be handed back to Krea unchanged and no edit here
// could ever reach a render.
const LEGACY_V5_TAXONOMY_TAILS = [
  'The whole animal head to tail, its markings and proportions true to the species, alert in the habitat it lives in.',
  'A scene of this kind underway, everyone in it and the place around them painted together, the light and the weather carrying its mood.',
  'The place itself, wide and lived-in, its architecture and ground and sky and weather doing the work.',
  'A person at full height doing something only someone like this would do, in a place that belongs to them, the feeling carried in the face and the posture.',
  'A single large form filling the frame, made of this, lit so the colour and the surface behave the way they really do.',
  'A finished picture made this way, the medium and the linework and the palette and the lighting all plainly visible in it.',
  'A person at full height in the middle of this work, the tools of the trade in their hands, the room or the landscape of that work around them.',
  'A single treasured object resting alone, its materials and the light around it telling you how rare it is.',
  'One clear subject alone in the frame, large and plainly lit.',
] as const

/** The single v5 clause that misrendered, kept separate so repair can target it. */
const V5_OCCUPATION_TAIL =
  'A person at full height in the middle of this work, the tools of the trade in their hands, the room or the landscape of that work around them.'

// Order matters. It is the same coverage fallback contract used by the UI and
// claim-time deduper: a general image is most reusable, then card, hero, icon.
const ART_VARIANTS = [
  {
    field: 'imagePath',
    label: 'square illustration',
    width: 1024,
    height: 1024,
    composition:
      'A square picture with the subject large and centred.',
  },
  {
    field: 'cardPath',
    label: 'vertical 2:3 illustration',
    width: 512,
    height: 768,
    composition:
      'A tall picture with open space above and below the subject.',
  },
  {
    field: 'heroPath',
    label: 'wide cinematic illustration',
    width: 1280,
    height: 720,
    composition:
      'A wide picture with the subject near the middle.',
  },
  {
    field: 'iconPath',
    label: 'compact emblem illustration',
    width: 256,
    height: 256,
    composition:
      'A small square picture with one simple shape filling it.',
  },
] as const

/**
 * Slots the entity-art collapse retired. Kept as data rather than removed from
 * ART_VARIANTS because repair still has to map a legacy job's stored field back
 * onto its variant geometry; only NEW queueing is suppressed.
 */
const RETIRED_VARIANT_FIELDS = new Set<string>([
  'cardPath',
  'heroPath',
  'iconPath',
])

type FacetArtField = (typeof ART_VARIANTS)[number]['field']
type FacetArtVariant = (typeof ART_VARIANTS)[number]

// Krea 2 Turbo runs at cfg 1, where negative conditioning is effectively inert.
// Keep the negative prompt empty and describe the wanted visual result once in
// positive conditioning instead of feeding the model unwanted text nouns.
const NEGATIVE_PROMPT = ''

const BLOCKING_REASON_CODES = new Set([
  'missing-profile',
  'duplicate-title',
  'prompt-cargo-cult',
  'parenthetical-genre',
  'composite-genre',
  'setting-shaped-genre',
  'subject-shaped-genre',
  'occupation-shaped-personality',
  'worldview-shaped-personality',
  'quirk-shaped-backstory',
  'sentence-title',
  'underspecified-title',
  'unreviewed-legacy-record',
])

type JsonObject = Record<string, unknown>

type FacetRow = {
  id: number
  title: string
  slug: string | null
  description: string | null
  flavorText: string | null
  examples: string | null
  artPrompt: string | null
  imagePath: string | null
  icon: string | null
  artImageId: number | null
  artCollectionId: number | null
  userId: number
  isPublic: boolean
  isMature: boolean
}

type ProfileRow = {
  facetId: number
  taxonomy: string
  canonicalValue: string | null
  groupKey: string | null
  groupLabel: string | null
  isRandomizable: boolean
  randomWeight: number
  artRequired: boolean
  sourceRank: number
  metadata: string | null
}

type FacetSnapshot = {
  id: number
  title: string
  slug: string | null
  taxonomy: string
  canonicalValue: string | null
  artPrompt: string | null
  imagePath: string | null
}

type HistoryJob = {
  id: number
  status: string
  payload: string
  artImageId: number | null
}

type ArtTarget = {
  entityId: number
  field: FacetArtField
  version: string
  basePrompt: string
}

type QueueEntry = {
  facet: FacetRow
  profile: ProfileRow
  identityPrompt: string
  variant: FacetArtVariant
  repairSourceJobId?: number
  repairSourceVersion?: string
  repairReason?: string
}

function asObject(value: unknown): JsonObject {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonObject)
    : {}
}

function parseMetadata(value: string | null | undefined): JsonObject {
  if (!value) return {}
  try {
    return asObject(JSON.parse(value))
  } catch {
    return {}
  }
}

function parsePayload(value: string): JsonObject {
  try {
    return asObject(JSON.parse(value))
  } catch {
    return {}
  }
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function compactLines(values: unknown[]): string[] {
  return values.map(clean).filter(Boolean)
}

// FacetProfile.metadata.artworkPrompt is seed-time provenance written for the
// old contextual producers ("Kind Robots premium Builder card illustration for
// Dream Types: Art. ...", "Expressive inclusive character-card illustration
// representing ..."). It restates the description and adds app-name and
// card-format vocabulary that Krea paints literally and the prompt contract
// rejects (2026-09-05 repair run: 28 Facets, format-vocabulary). Only a
// metadata prompt that stands on its own as a caption is used; otherwise the
// title/description/flavor prose carries the identity, as for every other
// Facet.
function usableMetadataArtworkPrompt(metadata: JsonObject): string {
  const prompt = metadataArtworkPrompt(metadata)
  if (!prompt) return ''
  if (/\bKind Robots\b/i.test(prompt)) return ''
  const violations = checkArtPromptContract({
    prompt,
    engine: 'krea2',
    steps: 8,
    cfg: 1,
  })
  return violations.length ? '' : prompt
}

function metadataArtworkPrompt(metadata: JsonObject): string {
  const direct = clean(metadata.artworkPrompt)
  if (direct) return direct

  const artBuilder = asObject(metadata.artBuilder)
  const hints: string[] = []
  for (const value of Object.values(artBuilder)) {
    const hint = clean(asObject(value).promptHint)
    if (hint) hints.push(hint)
  }
  return [...new Set(hints)].join(', ')
}

/*
 * These clauses are the LAST thing in the prompt and, for a Facet with no prose
 * of its own, very nearly the ONLY thing in it. So each one has to read as a
 * description of a picture that already exists, in ordinary words, and never as
 * a brief commissioning one.
 *
 * The v4 wording did the opposite and Krea painted it verbatim (2026-09-14):
 *
 *   'Iconic scene, concrete focal subject, ...'  -> a monumental CONCRETE BUST,
 *   the same grey head in the same grey room for all 154 GENRE/THEME/SETTING
 *   Facets that had no description. Office Satire, Body Horror and Aging
 *   Protagonist are the same image with different damage on it.
 *
 *   '... unmistakable silhouette, workplace cues.' -> a literal black paper
 *   cut-out of a man on a desk, for all 50 OCCUPATION/ROLE/ARCHETYPE Facets.
 *
 * "everyone in it" rather than "the people in it": this catalog's GENRE and
 * THEME rows include animal- and robot-centred entries (Animal Interiority),
 * and naming people forces people. It is still a DECISION that the frame has a
 * cast, stated once, not a conditional -- Krea cannot evaluate "if the scene
 * calls for them" and paints the clause instead (ART-PROMPTS.md, 2026-08-08).
 *
 * Rules for editing anything below: no art-direction nouns (focal subject,
 * silhouette, emblem, composition, thumbnail), no adjective that names a
 * material unless the image really is made of it ("concrete", "iconic"), no
 * negation, and no instruction the model would have to obey rather than draw.
 * server/utils/artPromptContract.ts now rejects the known offenders outright.
 */
export function taxonomyVisualLanguage(taxonomy: string): string {
  switch (taxonomy) {
    case 'ANIMAL':
    case 'SPECIES':
      return 'The whole animal head to tail, its markings and proportions true to the species, alert in the habitat it lives in.'
    case 'GENRE':
    case 'THEME':
      return 'A scene of this kind underway, everyone in it and the place around them painted together, the light and the weather carrying its mood.'
    case 'SETTING':
      return 'The place itself, wide and lived-in, its architecture and ground and sky and weather doing the work.'
    case 'PERSONALITY':
    case 'ALIGNMENT':
    case 'QUIRK':
    case 'BACKSTORY':
      return 'One person seen from head to shoes, doing something only someone like this would do, in a place that belongs to them, the feeling carried in the face and the posture.'
    case 'COLOR':
    case 'MATERIAL':
      return 'A single large form filling the frame, made of this, lit so the colour and the surface behave the way they really do.'
    case 'STYLE':
    case 'ART_DIRECTION':
      return 'A finished picture made this way, the medium and the linework and the palette and the lighting all plainly visible in it.'
    /*
     * A prompt modifier is not a subject, so a swatch supplies one. The same
     * pear and marble every time, with the technique named first: the title is
     * the strongest position in a caption, and holding the subject still is
     * what makes 46 cards a comparison instead of 46 unrelated pictures.
     *
     * v4 routed these through the STYLE clause above, which names no subject
     * either -- so nothing anchored the frame and Krea fell back to its own
     * portrait prior. That is the whole reason "4k render" is two anime women.
     */
    case 'PROMPT_ENHANCEMENT':
      return ENHANCEMENT_SWATCH_SUBJECT
    /*
     * v6 (2026-09-15). The v5 wording here made 50 near-identical cards, and it
     * did it in two separate ways, both worth keeping written down:
     *
     *   "at full height" -> Krea filled the frame with a body and CROPPED THE
     *   HEAD. Every one of the 50 is a headless torso. The phrase reads as a
     *   framing instruction to a person and as "make the body big" to a caption
     *   model; naming the head and the shoes instead gives it two anchors it
     *   has to fit inside the frame.
     *
     *   "the tools of the trade in their hands" -> literal hammers and pliers
     *   in all 50, whatever the row actually was. "Ambient Threat" and "Apex
     *   Predator" are not trades. This is the ORIGINAL bug in a new costume: a
     *   concrete noun sitting in the boilerplate gets painted every time, and
     *   when the title is abstract the boilerplate is all Krea has. The clause
     *   must not name any object at all.
     */
    case 'OCCUPATION':
    case 'ARCHETYPE':
    case 'ROLE':
      return 'One person seen from head to shoes, their face turned toward the light, standing in the place where they do this.'
    case 'RARITY':
    case 'REWARD_TYPE':
      return 'A single treasured object resting alone, its materials and the light around it telling you how rare it is.'
    default:
      return 'One clear subject alone in the frame, large and plainly lit.'
  }
}

/**
 * Every taxonomy taxonomyVisualLanguage() answers for. Exported so the contract
 * test can enumerate the clauses this producer can currently emit and prove
 * each one is registered below.
 */
export const CLAUSE_TAXONOMIES = [
  'ANIMAL', 'SPECIES', 'GENRE', 'THEME', 'SETTING', 'PERSONALITY', 'ALIGNMENT',
  'QUIRK', 'BACKSTORY', 'COLOR', 'MATERIAL', 'STYLE', 'ART_DIRECTION',
  'PROMPT_ENHANCEMENT', 'OCCUPATION', 'ARCHETYPE', 'ROLE', 'RARITY',
  'REWARD_TYPE', 'DREAM_TYPE',
] as const

/*
 * Every clause this producer has EVER appended to a generated prompt.
 *
 * buildFacetIdentityPrompt returns an unrecognized stored prompt verbatim, so a
 * clause missing from here is a cohort that can never be rebuilt: edits land,
 * tests pass, and not one picture changes. That has happened three times in
 * this work -- v4's clauses, v5's, and the swatch subject -- each time silently.
 *
 * Keeping one list, rather than a check per generation, is what makes the
 * failure testable: verifyFacetLegacyPromptSignature enumerates
 * CLAUSE_TAXONOMIES and fails if any clause the producer can emit today is
 * absent here. Retiring an entry is what freezes a cohort, so entries are only
 * ever added.
 */
const GENERATED_PROMPT_TAILS: readonly string[] = [
  ...LEGACY_V4_TAXONOMY_TAILS,
  ...LEGACY_V5_TAXONOMY_TAILS,
  ...ENHANCEMENT_SWATCH_SUBJECTS,
  // v6 taxonomy clauses.
  'The whole animal head to tail, its markings and proportions true to the species, alert in the habitat it lives in.',
  'A scene of this kind underway, everyone in it and the place around them painted together, the light and the weather carrying its mood.',
  'The place itself, wide and lived-in, its architecture and ground and sky and weather doing the work.',
  'One person seen from head to shoes, doing something only someone like this would do, in a place that belongs to them, the feeling carried in the face and the posture.',
  'A single large form filling the frame, made of this, lit so the colour and the surface behave the way they really do.',
  'A finished picture made this way, the medium and the linework and the palette and the lighting all plainly visible in it.',
  'One person seen from head to shoes, their face turned toward the light, standing in the place where they do this.',
  'A single treasured object resting alone, its materials and the light around it telling you how rare it is.',
  'One clear subject alone in the frame, large and plainly lit.',
]

export function isLegacyGeneratedFacetPrompt(value: unknown): boolean {
  const prompt = clean(value)
  if (!prompt) return false
  if (LEGACY_GENERATED_IDENTITY.test(prompt)) return true
  return GENERATED_PROMPT_TAILS.some((tail) => prompt.endsWith(tail))
}

/**
 * A swatch rendered from an older subject. The v1 scene was correct but inert:
 * flat light, one distance, one material, no palette, so most of the 45
 * techniques had nothing to act on and the cards were 45 pictures of a pear.
 */
export function swatchSubjectIsStale(facet: FacetRow): boolean {
  const prompt = clean(facet.artPrompt)
  if (!prompt) return false
  return (
    ENHANCEMENT_SWATCH_SUBJECTS.some((subject) => prompt.endsWith(subject)) &&
    !prompt.endsWith(ENHANCEMENT_SWATCH_SUBJECT)
  )
}

/**
 * A v5 render that came back wrong. Only the occupation clause did: its 50
 * OCCUPATION/ROLE/ARCHETYPE cards are headless torsos holding generic hammers
 * in a generic meadow, near-identical to each other. v5's genre, theme and
 * setting renders are good and are deliberately excluded.
 */
/**
 * Whether a Facet's curated prompt has outrun the picture on screen.
 *
 * Pulled out of main() and exported because the first version of this shipped
 * broken and no test could reach it: the selection lived inside a function that
 * needs a database, so "queues nothing at all" looked exactly like "nothing to
 * do". 146 authored prompts were written and zero jobs were created.
 *
 * @param hasAttempt whether ANY job has ever targeted this slot. Distinct from
 *   having a recorded prompt: a v2/v3 job predates basePromptString, so an
 *   attempted slot with no recorded prompt cannot be compared and must be
 *   re-rendered rather than assumed current.
 */
export function curatedPromptNeedsRender(
  facet: FacetRow,
  hasAttempt: boolean,
  renderedPrompt: string | undefined,
  paintedPrompt?: string | undefined,
): boolean {
  const curated = clean(facet.artPrompt)
  // Nothing authored here, or the text is the producer's own: not this mode's
  // business. The repair modes own generated prompts.
  if (!curated || isLegacyGeneratedFacetPrompt(curated)) return false
  /*
   * Never rendered at all: ordinary coverage queues it -- UNLESS the Facet
   * already carries a hand-placed asset under /images. imagePath counts as
   * art-backed in the coverage audit, so coverage skips those rows forever,
   * and with no job in their history this mode used to skip them too. The
   * result was a silent limbo: 15 genres given authored prompts on 2026-09-15
   * (fantasy, steampunk, mystery, romance ...) sat with the right text and no
   * way to ever be painted from it, because a static .webp made them look
   * finished to the only two modes that could have queued them.
   *
   * A static asset is not a render of the curated prompt, so those rows are
   * this mode's to claim. They cannot double-queue with coverage precisely
   * because coverage considers them backed.
   */
  const staticOnly = Boolean(clean(facet.imagePath)) && facet.artImageId === null
  if (!hasAttempt && !staticOnly) return false
  /*
   * The picture on the card is the only thing Silas can see, so it is the only
   * honest answer to "has this been rendered yet".
   *
   * The job payload answers a DIFFERENT question -- what the producer last
   * ASKED for -- and the two come apart whenever a job is queued and then does
   * not produce the linked image: cancelled before claim, failed, or superseded
   * by an older image that stayed linked. On 2026-09-15 that gap hid 148
   * genre/theme cards whose catalog prompt was the authored one, whose job
   * payload was the authored one, and whose actual picture had been painted
   * from the retired v5 template clause. Every counter said done; every card
   * was wrong.
   *
   * So prefer what was painted, and fall back to the payload only when nothing
   * is linked. The renderer appends framing guidance to the stored prompt, so
   * containment is the correct comparison against a painted prompt, where the
   * payload's basePrompt is stored raw and compares exactly.
   */
  if (paintedPrompt !== undefined) {
    return !promptWasPainted(curated, paintedPrompt)
  }
  // Rendered from this exact text already.
  if (renderedPrompt && renderedPrompt === curated) return false
  return true
}

/**
 * Whether `painted` is the text that produced a picture from `curated`.
 *
 * Containment rather than equality: the renderer appends framing and style
 * guidance ("A square picture with the subject large and centred.") to the
 * prompt it was given, so an exact match never holds for a real render.
 */
export function promptWasPainted(curated: string, painted: string): boolean {
  const norm = (value: string) => value.replace(/\s+/g, ' ').trim().toLowerCase()
  const needle = norm(curated)
  if (!needle) return false
  return norm(painted).includes(needle)
}

export function v5RenderNeedsRepair(facet: FacetRow): boolean {
  return clean(facet.artPrompt).endsWith(V5_OCCUPATION_TAIL)
}

/**
 * True when v4's taxonomy clause was effectively the ENTIRE prompt, because the
 * Facet carried no description, flavor text, or examples of its own. With no
 * prose to dilute it, the clause was the only subject Krea had.
 */
export function v4PromptWasClauseDominated(facet: FacetRow): boolean {
  return !compactLines([facet.description, facet.flavorText, facet.examples])
    .length
}

/**
 * Whether a v4 render is one of the ones that actually came back wrong.
 *
 * Both halves are required, and the pairing is the whole point:
 *
 *   - clause-dominated, because a Facet with prose of its own had a real
 *     subject and rendered correctly even with the jargon appended. 210 stored
 *     prompts are in that group; their text is rebuilt by the recognizer above,
 *     but re-rolling their art would replace good images with a fresh random
 *     seed for nothing.
 *   - contract-violating, because not every bare clause misrendered. The ANIMAL
 *     clause names a real subject ("One unmistakable full creature...") and its
 *     64 renders are correct -- a Blue-Footed Booby looks like a Blue-Footed
 *     Booby. Only the clauses the contract now rejects are the ones Krea was
 *     observed to paint literally: 154 GENRE/THEME/SETTING concrete busts and
 *     50 OCCUPATION/ROLE/ARCHETYPE paper silhouettes.
 *
 * Asking the contract rather than re-listing the bad clauses here keeps one
 * source of truth: what we refuse to send is exactly what we go back and fix.
 */
export function v4RenderNeedsRepair(
  facet: FacetRow,
  taxonomy?: string | null,
): boolean {
  if (!v4PromptWasClauseDominated(facet)) return false

  // PROMPT_ENHANCEMENT failed a different way and the jargon rule cannot see
  // it. v4 routed the pack through the STYLE clause ("Polished sample of the
  // visual treatment..."), which trips nothing in the contract -- it is not
  // jargon, it is simply not a SUBJECT. With the title ("film grain") not a
  // subject either, the prompt named no thing at all and Krea fell back to its
  // own portrait prior. A prompt that describes nothing is as broken as one
  // that describes the wrong thing; it just fails silently instead of loudly,
  // which is exactly why this needs its own clause rather than a wider jargon
  // pattern.
  if (String(taxonomy || '').toUpperCase() === 'PROMPT_ENHANCEMENT') return true

  return checkArtPromptContract({
    prompt: clean(facet.artPrompt),
    engine: 'krea2',
    steps: 8,
    cfg: 1,
  }).some((violation) => violation.rule === 'art-direction-jargon')
}

export function facetEntityMarker(
  facetId: number,
  field?: FacetArtField,
): string {
  const entity = `"entityType":"facet","entityId":${facetId},`
  return field ? `${entity}"field":"${field}",` : entity
}

export function facetArtVersionMarker(): string {
  return `\"facetArtworkVersion\":\"${FACET_ART_VERSION}\"`
}

export function buildFacetIdentityPrompt(
  facet: FacetRow,
  profile: ProfileRow,
): string {
  const existing = clean(facet.artPrompt)
  if (existing && !isLegacyGeneratedFacetPrompt(existing)) return existing

  const metadata = parseMetadata(profile.metadata)
  const metadataPrompt = usableMetadataArtworkPrompt(metadata)
  const scientificName = clean(metadata.scientificName)
  const category = clean(metadata.category)
  const prose = compactLines([
    facet.description,
    facet.flavorText,
    facet.examples,
    metadataPrompt,
  ])

  // Deliberately caption-shaped. "Surreal Horror" is useful conditioning;
  // "Illustrate the Facet concept named Surreal Horror for Kind Robots" is a
  // pile of extra concrete words that Krea is perfectly capable of painting.
  return [
    `${facet.title}.`,
    scientificName ? `${scientificName}.` : '',
    category ? `${category}.` : '',
    ...prose,
    taxonomyVisualLanguage(profile.taxonomy),
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/*
 * The house tail. "Polished fantasy illustration" is right for a genre, a
 * creature or an archetype, and wrong for an enhancement swatch: half that
 * group is photographic (film grain, studio photography, photoreal lighting),
 * and telling Krea "fantasy illustration" fights the very technique the card
 * exists to demonstrate. Only PROMPT_ENHANCEMENT diverges -- every other
 * taxonomy keeps the exact tail the 204 queued repairs were dry-run against.
 */
function styleTail(taxonomy: string): string {
  if (taxonomy === 'PROMPT_ENHANCEMENT') {
    // The swatch scene names its own lamp and its own falloff. "Rich controlled
    // lighting" on top of that argues with the half of the group that is about
    // shadow -- moody atmosphere, dramatic shadows, volumetric light.
    return 'Clean unmarked surfaces.'
  }
  return 'Polished fantasy illustration. Rich controlled lighting. Clean unmarked surfaces.'
}

export function buildFacetVariantPrompt(
  _facet: FacetRow,
  profile: ProfileRow,
  identityPrompt: string,
  variant: FacetArtVariant,
): string {
  return [
    identityPrompt,
    variant.composition,
    styleTail(profile.taxonomy),
  ].join('\n\n')
}

function facetSnapshot(
  facet: FacetRow,
  profile: ProfileRow,
  artPrompt: string,
): FacetSnapshot {
  return {
    id: facet.id,
    title: facet.title,
    slug: facet.slug,
    taxonomy: profile.taxonomy,
    canonicalValue: profile.canonicalValue,
    artPrompt,
    imagePath: facet.imagePath,
  }
}

function repairRetry(sourceJobId: number, reason = 'facet-art-direction-jargon-repair-v5'): JsonObject {
  return {
    mode: 'NEW_OUTPUT',
    sourceJobId,
    rootJobId: sourceJobId,
    targetArtImageId: null,
    refreshSeed: true,
    requestedAt: new Date().toISOString(),
    reason,
  }
}

export function buildFacetArtPayload(
  facet: FacetRow,
  profile: ProfileRow,
  identityPrompt: string,
  variant: FacetArtVariant,
  repair?: { sourceJobId: number; sourceVersion: string; reason?: string },
) {
  const promptString = buildFacetVariantPrompt(
    facet,
    profile,
    identityPrompt,
    variant,
  )

  // This producer writes ArtJobs directly, so enforce the same model contract
  // used by the API before anything reaches the queue ledger.
  assertArtPromptContract({
    prompt: promptString,
    engine: 'krea2',
    steps: 8,
    cfg: 1,
  })

  const { workflow, seed } = buildKrea2WorkflowFromRequest({
    prompt: promptString,
    negativePrompt: NEGATIVE_PROMPT,
    width: variant.width,
    height: variant.height,
    steps: 8,
    cfg: 1,
  })

  return enrichArtJobPayload(
    'COMFY',
    {
      promptString,
      basePromptString: identityPrompt,
      negativePrompt: NEGATIVE_PROMPT,
      width: variant.width,
      height: variant.height,
      steps: 8,
      cfg: 1,
      seed,
      workflow,
      save: {
        isPublic: facet.isPublic,
        isMature: facet.isMature,
        designer: 'facet-catalog',
      },
      facets: [facetSnapshot(facet, profile, identityPrompt)],
      entityArt: {
        entityType: 'facet',
        entityId: facet.id,
        field: variant.field,
        preserveOriginal: true,
        mode: 'recreate',
      },
      /*
       * retry provenance is not decoration: server/utils/artJobQueueCoverage.ts
       * exempts a job from baseline-coverage cleanup ONLY when payload.retry is
       * present (readFacetCoverageTarget returns null for it). Without it, a
       * replacement queued for a Facet that already has art is cancelled before
       * claim -- which is what happened to all 146 authored-prompt jobs on
       * 2026-09-15: created, reported queued, then cancelled unrendered.
       */
      ...(repair ? { retry: repairRetry(repair.sourceJobId, repair.reason) } : {}),
      facetArtworkVersion: FACET_ART_VERSION,
      facetCatalog: {
        taxonomy: profile.taxonomy,
        groupKey: profile.groupKey,
        sourceRank: profile.sourceRank,
        variant: variant.field,
        coverageMode: ALL_VARIANTS ? 'all-variants' : 'baseline',
        ...(repair
          ? {
              repairReason: 'art-direction-jargon-rendered-literally',
              repairSourceJobId: repair.sourceJobId,
              repairSourceVersion: repair.sourceVersion,
            }
          : {}),
      },
    },
    {
      projectSlug: PROJECT_SLUG,
      idempotencyKey: `facet:${facet.id}:${variant.field}:${FACET_ART_VERSION}`,
      requireCompletionProof: true,
    },
  ).payload
}

function priorityFor(profile: ProfileRow): number {
  if (profile.sourceRank <= 10) return -10
  if (profile.sourceRank <= 30) return -15
  return -20
}

function repairPriority(profile: ProfileRow): number {
  return Math.max(50, priorityFor(profile))
}

function artTarget(payload: string): ArtTarget | null {
  const parsed = parsePayload(payload)
  const entityArt = asObject(parsed.entityArt)
  if (clean(entityArt.entityType).toLowerCase() !== 'facet') return null
  const entityId = Number(entityArt.entityId)
  const field = clean(entityArt.field)
  if (!Number.isInteger(entityId) || entityId <= 0) return null
  if (!ART_VARIANTS.some((variant) => variant.field === field)) return null
  return {
    entityId,
    field: field as FacetArtField,
    version: clean(parsed.facetArtworkVersion),
    // The identity prompt this job actually rendered. Comparing it to the
    // Facet's current artPrompt is how --requeue-curated notices that someone
    // has written a better prompt since the picture was made.
    basePrompt: clean(parsed.basePromptString),
  }
}

function fieldVariant(field: FacetArtField): FacetArtVariant {
  return ART_VARIANTS.find((variant) => variant.field === field)!
}

/*
 * Only imagePath survives the entity-art slot collapse. The retired fields stay
 * in ART_VARIANTS so repair can still map a legacy job's stored field onto its
 * variant geometry, but a Facet row no longer carries them -- so they resolve
 * to "nothing here", which is exactly what the coverage checks should see.
 */
function slotArtImageId(facet: FacetRow, field: FacetArtField): number | null {
  return field === 'imagePath' ? facet.artImageId : null
}

function slotPath(facet: FacetRow, field: FacetArtField): string {
  return field === 'imagePath' ? clean(facet.imagePath) : ''
}

function likelyStillCarriesLegacyOutput(
  facet: FacetRow,
  field: FacetArtField,
  jobArtImageId: number | null,
): boolean {
  const currentId = slotArtImageId(facet, field)
  if (jobArtImageId && currentId) return jobArtImageId === currentId
  if (currentId && !jobArtImageId) return false

  // Per-slot ArtImage ids have existed since before both tainted producer
  // versions. A populated path with no slot id is uncommon legacy data; because
  // this mode is explicitly a provenance repair and preserveOriginal is true,
  // treat it as likely tainted rather than leaving an unprovable bad render in
  // place forever. A current nonmatching ArtImage id, above, always wins.
  return Boolean(slotPath(facet, field)) || !currentId
}

async function runWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let cursor = 0
  async function lane(): Promise<void> {
    while (cursor < items.length) {
      const item = items[cursor]
      cursor += 1
      if (item !== undefined) await worker(item)
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => lane()),
  )
}

/*
 * Reject a flag this build does not understand, instead of ignoring it.
 *
 * argv flags fail silently by default, and that cost two full queue cycles:
 * `--requeue-curated` on a build predating it ran as a plain --write and
 * printed "queued: 0"; `--facets a,b,c` on a build predating THAT queued all
 * 146 and printed a number that looked like success.
 *
 * Called from main(), NOT at module scope. As a top-level statement it ran on
 * IMPORT, so utils/scripts/applyCuratedFacetArtPrompts.ts -- which imports this
 * module for isLegacyGeneratedFacetPrompt -- died on its own `--apply` before
 * writing a single prompt. A module that exits the process when someone
 * imports it is a worse failure than the one this guard prevents.
 */
function assertKnownFlags(): void {
  const KNOWN_FLAGS = new Set([
    '--write',
    '--all-variants',
    '--repair-tainted',
    '--requeue-curated',
    '--facets',
  ])
  const unknown = process.argv
    .slice(2)
    .filter((arg) => arg.startsWith('--') && !KNOWN_FLAGS.has(arg))
  if (!unknown.length) return
  console.error(
    `Unrecognized option(s): ${unknown.join(', ')}\n` +
      `This build understands: ${[...KNOWN_FLAGS].join(', ')}\n` +
      'A flag this build does not know is almost always a checkout older than ' +
      'the command. Run `git pull` and try again; refusing rather than running ' +
      'with the option quietly dropped.',
  )
  process.exit(2)
}

export async function main(): Promise<void> {
  assertKnownFlags()

  await withDatabaseRetry('Facet artwork queue', async () => {
    const prisma = createScriptPrismaClient()
    try {
      const [
        facets,
        profiles,
        aliases,
        artImageLinks,
        artCollectionLinks,
        activeJobs,
        historyJobs,
      ] = await Promise.all([
        prisma.facet.findMany({
          where: { isActive: true },
          orderBy: { id: 'asc' },
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            flavorText: true,
            examples: true,
            artPrompt: true,
            imagePath: true,
            icon: true,
            artImageId: true,
            artCollectionId: true,
            userId: true,
            isPublic: true,
            isMature: true,
          },
        }),
        prisma.facetProfile.findMany({
          select: {
            facetId: true,
            taxonomy: true,
            canonicalValue: true,
            groupKey: true,
            groupLabel: true,
            isRandomizable: true,
            randomWeight: true,
            artRequired: true,
            sourceRank: true,
            metadata: true,
          },
        }),
        prisma.facetAlias.findMany({
          where: { isActive: true },
          select: { facetId: true, alias: true },
        }),
        prisma.facetArtImage.findMany({ select: { facetId: true } }),
        prisma.facetArtCollection.findMany({ select: { facetId: true } }),
        // Reuse ANY active Facet ArtJob during ordinary coverage. Repair mode
        // separately cancels tainted pending jobs and marks replacements as
        // explicit retries so claim-time baseline cleanup cannot discard them.
        prisma.artJob.findMany({
          where: {
            projectSlug: PROJECT_SLUG,
            status: { in: ['PENDING', 'RUNNING'] },
            payload: { contains: '"entityType":"facet"' },
          },
          select: { id: true, status: true, payload: true },
        }),
        // Both modes read job history. --requeue-curated compares each Facet's
        // curated prompt against the prompt its current picture was actually
        // made from, and that comparison lives in the job payload: with an
        // empty history every Facet looks like it has never been rendered, and
        // the sweep silently queues nothing. That is exactly what the first
        // production run did -- 146 prompts written, 0 jobs queued.
        REPAIR_TAINTED || REQUEUE_CURATED
          ? prisma.artJob.findMany({
              where: {
                projectSlug: PROJECT_SLUG,
                payload: { contains: '"entityType":"facet"' },
              },
              orderBy: { id: 'desc' },
              select: {
                id: true,
                status: true,
                payload: true,
                artImageId: true,
              },
            })
          : Promise.resolve([] as HistoryJob[]),
      ])

      const facetRows = facets as FacetRow[]
      const facetById = new Map(facetRows.map((facet) => [facet.id, facet]))
      /*
       * What each Facet's current picture was ACTUALLY painted from. Read from
       * the linked ArtImage rather than inferred from the job payload -- see
       * curatedPromptNeedsRender for why the two disagree and what it cost.
       */
      const paintedPromptByFacet = new Map<number, string>()
      if (REQUEUE_CURATED) {
        const linkedImageIds = facetRows
          .map((facet) => facet.artImageId)
          .filter((id): id is number => typeof id === 'number')
        if (linkedImageIds.length) {
          const images = await prisma.artImage.findMany({
            where: { id: { in: linkedImageIds } },
            select: { id: true, promptString: true },
          })
          const promptByImage = new Map(
            images.map((image) => [image.id, image.promptString ?? '']),
          )
          for (const facet of facetRows) {
            if (facet.artImageId === null) continue
            const painted = promptByImage.get(facet.artImageId)
            if (painted !== undefined) {
              paintedPromptByFacet.set(facet.id, painted)
            }
          }
        }
      }
      const profileByFacet = new Map(
        profiles.map((profile) => [profile.facetId, profile as ProfileRow]),
      )
      const aliasesByFacet = new Map<number, string[]>()
      for (const alias of aliases) {
        const entries = aliasesByFacet.get(alias.facetId) ?? []
        entries.push(alias.alias)
        aliasesByFacet.set(alias.facetId, entries)
      }
      const linkedPrimaryArt = new Set(
        artImageLinks.map((link) => link.facetId),
      )
      const linkedCollections = new Set(
        artCollectionLinks.map((link) => link.facetId),
      )
      const pendingFacetFields = new Set<string>()
      for (const job of activeJobs) {
        const target = artTarget(job.payload)
        if (target) pendingFacetFields.add(`${target.entityId}:${target.field}`)
      }

      const auditInputs: FacetAuditInput[] = facetRows.map((facet) => {
        const profile = profileByFacet.get(facet.id)
        return {
          id: facet.id,
          title: facet.title,
          slug: facet.slug,
          taxonomy: (profile?.taxonomy as FacetAuditInput['taxonomy']) ?? null,
          groupKey: profile?.groupKey ?? null,
          groupLabel: profile?.groupLabel ?? null,
          isRandomizable: profile?.isRandomizable ?? false,
          randomWeight: profile?.randomWeight ?? 0,
          sourceRank: profile?.sourceRank ?? null,
          description: facet.description,
          flavorText: facet.flavorText,
          examples: facet.examples,
          artPrompt: facet.artPrompt,
          aliases: aliasesByFacet.get(facet.id) ?? [],
          artBacked: Boolean(
            facet.imagePath ||
            facet.icon ||
            facet.artImageId !== null ||
            facet.artCollectionId !== null ||
            linkedPrimaryArt.has(facet.id) ||
            linkedCollections.has(facet.id),
          ),
        }
      })
      const audit = auditFacetCatalog(auditInputs)
      const blockersByFacet = new Map<number, string[]>()
      for (const candidate of audit.candidates) {
        const blockers = candidate.reasons
          .map((reason) => reason.code)
          .filter((code) => BLOCKING_REASON_CODES.has(code))
        if (blockers.length) blockersByFacet.set(candidate.id, blockers)
      }

      const available = new Map<FacetArtField, number>(
        ART_VARIANTS.map((variant) => [variant.field, 0]),
      )
      const notRequired: number[] = []
      const reused: Array<{ id: number; field: FacetArtField }> = []
      const blocked: Array<{ id: number; title: string; reasons: string[] }> =
        []
      const queue: QueueEntry[] = []

      for (const facet of facetRows) {
        const profile = profileByFacet.get(facet.id)
        if (!profile) {
          blocked.push({
            id: facet.id,
            title: facet.title,
            reasons: ['missing-profile'],
          })
          continue
        }
        if (!profile.artRequired) {
          notRequired.push(facet.id)
          continue
        }

        const blockers = blockersByFacet.get(facet.id) ?? []
        if (blockers.length) {
          blocked.push({ id: facet.id, title: facet.title, reasons: blockers })
          continue
        }

        const identityPrompt = buildFacetIdentityPrompt(facet, profile)

        for (const variant of ART_VARIANTS) {
          const primaryLinked = Boolean(
            variant.field === 'imagePath' &&
            (facet.artImageId !== null || linkedPrimaryArt.has(facet.id)),
          )
          if (slotPath(facet, variant.field) || primaryLinked) {
            available.set(
              variant.field,
              (available.get(variant.field) ?? 0) + 1,
            )
          }
        }

        if (!ALL_VARIANTS) {
          const hasDisplayArt = Boolean(
            clean(facet.imagePath) ||
            facet.artImageId !== null ||
            linkedPrimaryArt.has(facet.id),
          )
          if (hasDisplayArt) continue

          const pendingVariant = ART_VARIANTS.find((variant) =>
            pendingFacetFields.has(`${facet.id}:${variant.field}`),
          )
          if (pendingVariant) {
            reused.push({ id: facet.id, field: pendingVariant.field })
            continue
          }

          queue.push({
            facet,
            profile,
            identityPrompt,
            variant: ART_VARIANTS[0],
          })
          continue
        }

        for (const variant of ART_VARIANTS) {
          /*
           * The slot collapse (2026-09-05): card/hero/icon are retired, so even
           * --all-variants only tops up the primary now. This producer writes
           * ArtJobs straight to the table rather than going through
           * prepareEntityArtEnqueue, so it does not inherit that gate and has
           * to refuse the retired slots itself. Repair still maps a legacy
           * job's field back onto its variant via fieldVariant(), which is why
           * the entries stay in ART_VARIANTS rather than being deleted.
           */
          if (RETIRED_VARIANT_FIELDS.has(variant.field)) continue
          const primaryLinked = Boolean(
            variant.field === 'imagePath' &&
            (facet.artImageId !== null || linkedPrimaryArt.has(facet.id)),
          )
          if (slotPath(facet, variant.field) || primaryLinked) continue
          if (pendingFacetFields.has(`${facet.id}:${variant.field}`)) {
            reused.push({ id: facet.id, field: variant.field })
            continue
          }
          queue.push({ facet, profile, identityPrompt, variant })
        }
      }

      // The single source of truth for "this legacy job gets a v5 replacement".
      // Cancellation and re-queue both consult it, so a job can never be
      // cancelled by one rule and skipped by the other.
      const isRepairableLegacyJob = (
        version: string,
        facet: FacetRow | undefined,
        profile: ProfileRow | undefined,
      ): boolean => {
        if (!facet || !profile || !profile.artRequired) return false
        if (isRetiredPromptEnhancement(facet)) return false
        if (version === 'facet-coverage-krea2-v5') return v5RenderNeedsRepair(facet)
        if (version !== 'facet-coverage-krea2-v4') return true
        return v4RenderNeedsRepair(facet, profile.taxonomy)
      }

      const history = historyJobs as HistoryJob[]
      /*
       * Newest attempt per Facet slot, by producer version.
       *
       * currentVersionKeys below only knows about jobs at the CURRENT version,
       * which is empty at the moment a version is bumped. That is not enough: a
       * Facet keeps every job it has ever had, so after the swatch work landed
       * at v5, each of the 45 swatch Facets still had its old v4 job sitting in
       * history -- and the v4 predicate still says "yes, repair this", because
       * the v4 RENDER really was bad. The v5 job that already fixed it is
       * invisible to that question.
       *
       * Result on the 2026-09-15 v6 run: 95 jobs queued instead of 50, the
       * extra 45 being a second copy of swatch work already pending. Same
       * prompt, fresh seed, so the output was right and the compute was wasted.
       *
       * Ranking every version once and asking "has this slot already been
       * attempted more recently?" closes it for every future bump, rather than
       * needing a new special case each time.
       */
      const VERSION_ORDER = [
        'facet-multi-art-krea2-v2',
        'facet-coverage-krea2-v3',
        'facet-coverage-krea2-v4',
        'facet-coverage-krea2-v5',
        FACET_ART_VERSION,
      ]
      const versionRank = (version: string): number =>
        VERSION_ORDER.indexOf(version)
      const newestAttemptRank = new Map<string, number>()

      const currentVersionKeys = new Set<string>()
      const legacyPendingIds: number[] = []
      for (const job of history) {
        const target = artTarget(job.payload)
        if (!target) continue
        const key = `${target.entityId}:${target.field}`
        if (
          target.version === FACET_ART_VERSION &&
          ['PENDING', 'RUNNING', 'DONE'].includes(job.status)
        ) {
          currentVersionKeys.add(key)
        }
        if (['PENDING', 'RUNNING', 'DONE'].includes(job.status)) {
          const rank = versionRank(target.version)
          if (rank > (newestAttemptRank.get(key) ?? -1)) {
            newestAttemptRank.set(key, rank)
          }
        }
        if (
          LEGACY_FACET_ART_VERSIONS.has(target.version) &&
          job.status === 'PENDING' &&
          // A pending job is cancelled because a replacement is coming. Only
          // v4 jobs the repair sweep will actually re-queue qualify: cancelling
          // a healthy v4 job whose repair is deliberately skipped would leave
          // that Facet with neither art nor a job to make it.
          isRepairableLegacyJob(target.version, facetById.get(target.entityId), profileByFacet.get(target.entityId))
        ) {
          legacyPendingIds.push(job.id)
        }
      }

      /*
       * A curated prompt that has changed since the picture was made.
       *
       * Keyed on the newest job's recorded basePromptString rather than on a
       * clause, because that is the only thing that stays true for an AUTHORED
       * prompt: there is no pattern to match, and the whole point of authoring
       * is that every one is different. If they differ, the picture on screen
       * was made from text that no longer exists.
       */
      const curatedRequeue: QueueEntry[] = []
      const staleSwatchRequeue: QueueEntry[] = []
      if (REQUEUE_CURATED) {
        const attempted = new Set<string>()
        const newestJobPrompt = new Map<string, string>()
        const newestJob = new Map<string, { id: number; version: string }>()
        for (const job of history) {
          const target = artTarget(job.payload)
          if (!target) continue
          if (!['PENDING', 'RUNNING', 'DONE'].includes(job.status)) continue
          const key = `${target.entityId}:${target.field}`
          attempted.add(key)
          const rank = versionRank(target.version)
          if (rank >= (newestAttemptRank.get(key) ?? -1)) {
            newestJob.set(key, { id: job.id, version: target.version })
            if (target.basePrompt) newestJobPrompt.set(key, target.basePrompt)
          }
        }
        for (const facet of facetRows) {
          const profile = profileByFacet.get(facet.id)
          if (!profile || !profile.artRequired) continue
          if ((blockersByFacet.get(facet.id) ?? []).length) continue
          const variant = ART_VARIANTS[0]
          const key = `${facet.id}:${variant.field}`
          if (
            !curatedPromptNeedsRender(
              facet,
              attempted.has(key),
              newestJobPrompt.get(key),
              paintedPromptByFacet.get(facet.id),
            )
          ) {
            continue
          }
          const source = newestJob.get(key)
          curatedRequeue.push({
            facet,
            profile,
            identityPrompt: buildFacetIdentityPrompt(facet, profile),
            variant,
            repairSourceJobId: source?.id,
            repairSourceVersion: source?.version,
            repairReason: 'facet-curated-prompt-refresh',
          })
        }

        // Swatches are generated, not curated, so the check above cannot see
        // them -- but a new swatch subject has exactly the same problem an
        // edited authored prompt does: the picture on screen was made from text
        // that no longer exists. Kept as its own narrow predicate rather than
        // widening the curated one, because "regenerate everything whose clause
        // changed" would re-roll the 64 animal cards, and those are good.
        for (const facet of facetRows) {
          const profile = profileByFacet.get(facet.id)
          if (!profile || !profile.artRequired) continue
          if ((blockersByFacet.get(facet.id) ?? []).length) continue
          if (isRetiredPromptEnhancement(facet)) continue
          if (!swatchSubjectIsStale(facet)) continue
          const swatchKey = `${facet.id}:${ART_VARIANTS[0].field}`
          const swatchSource = newestJob.get(swatchKey)
          staleSwatchRequeue.push({
            facet,
            profile,
            identityPrompt: buildFacetIdentityPrompt(facet, profile),
            variant: ART_VARIANTS[0],
            repairSourceJobId: swatchSource?.id,
            repairSourceVersion: swatchSource?.version,
            repairReason: 'facet-swatch-subject-refresh',
          })
        }
        queue.push(...curatedRequeue, ...staleSwatchRequeue)
      }

      const repairQueued = new Set<string>()
      const repairSkippedSuperseded: number[] = []
      const repairSkippedHealthy: number[] = []
      const repairSkippedNonVisual: number[] = []
      const repairSkippedNewerAttempt: number[] = []
      const repairBlocked: number[] = []
      if (REPAIR_TAINTED) {
        for (const job of history) {
          const target = artTarget(job.payload)
          if (!target || !LEGACY_FACET_ART_VERSIONS.has(target.version))
            continue
          if (!['PENDING', 'RUNNING', 'DONE'].includes(job.status)) continue

          const key = `${target.entityId}:${target.field}`
          if (currentVersionKeys.has(key) || repairQueued.has(key)) continue

          // Something newer has already had a go at this slot. Whatever this
          // older job's own verdict is, it has been superseded by an attempt
          // that is still pending or already delivered.
          if ((newestAttemptRank.get(key) ?? -1) > versionRank(target.version)) {
            repairSkippedNewerAttempt.push(job.id)
            continue
          }

          const facet = facetById.get(target.entityId)
          const profile = profileByFacet.get(target.entityId)
          if (!facet || !profile || !profile.artRequired) continue
          if ((blockersByFacet.get(facet.id) ?? []).length) {
            repairBlocked.push(job.id)
            continue
          }

          // v2/v3 were tainted wholesale. v4 was not: only the prose-less
          // Facets, where the jargon clause was the whole prompt, rendered
          // badly. Re-rolling the rest would burn GPU hours replacing art that
          // is already good with a fresh random seed.
          if (
            target.version === 'facet-coverage-krea2-v4' &&
            !v4RenderNeedsRepair(facet, profile.taxonomy)
          ) {
            repairSkippedHealthy.push(job.id)
            continue
          }

          // v5 is mostly good. Only its occupation clause misrendered, and a
          // pending v5 genre job must survive this run untouched -- 69 of them
          // were still draining the queue when v6 was written.
          if (
            target.version === 'facet-coverage-krea2-v5' &&
            !v5RenderNeedsRepair(facet)
          ) {
            repairSkippedHealthy.push(job.id)
            continue
          }

          // A quality incantation ("masterpiece", "4k render") depicts nothing,
          // so every render of it is an arbitrary picture wearing a label.
          // Those rows are being withdrawn from the catalog entirely by
          // utils/scripts/retireCargoCultPromptEnhancements.ts; skip them here
          // so a repair run before or after that script behaves the same.
          //
          // The rest of the pack -- depth of field, subsurface scattering, oil
          // on canvas effect -- are real techniques and DO repair, onto the
          // fixed swatch subject.
          if (isRetiredPromptEnhancement(facet)) {
            repairSkippedNonVisual.push(job.id)
            continue
          }

          if (
            job.status === 'DONE' &&
            !likelyStillCarriesLegacyOutput(facet, target.field, job.artImageId)
          ) {
            repairSkippedSuperseded.push(job.id)
            continue
          }

          // A pending tainted job that no longer owns an empty slot is cancelled
          // below but does not need a replacement. Its current art was supplied
          // by another job and that DONE job's provenance decides whether *it*
          // needs repair.
          if (
            job.status === 'PENDING' &&
            (slotArtImageId(facet, target.field) ||
              slotPath(facet, target.field))
          ) {
            continue
          }

          queue.push({
            facet,
            profile,
            identityPrompt: buildFacetIdentityPrompt(facet, profile),
            variant: fieldVariant(target.field),
            repairSourceJobId: job.id,
            repairSourceVersion: target.version,
          })
          repairQueued.add(key)
        }
      }

      // Build and validate the complete replacement job payload set BEFORE
      // committing any mutation. buildFacetArtPayload() synchronously
      // throws via assertArtPromptContract() on an invalid prompt, so
      // constructing jobRows first guarantees a bad entry aborts the whole
      // write before any legacy job is cancelled or Facet.artPrompt is
      // rewritten. Previously this ran last, after the cancellation and
      // prompt-update writes had already committed — if any single entry's
      // payload failed to build, those writes were left in place with no
      // replacement ArtJob created, silently stranding the facet
      // (dream-cycle/t-006 pass 1 + pass 2 review finding on PR #2414).
      //
      // Built in dry-run mode too, so a dry run exercises the same prompt
      // contract as the write and reports a rejected prompt instead of
      // passing a plan the write then refuses.
      const scopedQueue = FACET_FILTER
        ? queue.filter((entry) =>
            FACET_FILTER.has(String(entry.facet.slug ?? '').toLowerCase()),
          )
        : queue
      const scopedOut = queue.length - scopedQueue.length

      // A slug that matches no queued Facet is a typo or a stale name, and
      // scoping to it silently produces an empty, successful-looking run. The
      // trailing "~" on a pasted command line is enough to do it.
      const unmatchedFacets = FACET_FILTER
        ? FACET_FILTER_INPUT.filter(
            (slug) =>
              !queue.some(
                (entry) => String(entry.facet.slug ?? '').toLowerCase() === slug,
              ),
          )
        : []
      if (unmatchedFacets.length) {
        console.error(
          `--facets matched no queued Facet for: ${unmatchedFacets.join(', ')}`,
        )
      }

      const jobRows = scopedQueue.map((entry) => ({
        engine: 'COMFY' as const,
        userId: entry.facet.userId,
        projectSlug: PROJECT_SLUG,
        priority: entry.repairSourceJobId
          ? repairPriority(entry.profile)
          : priorityFor(entry.profile),
        payload: JSON.stringify(
          buildFacetArtPayload(
            entry.facet,
            entry.profile,
            entry.identityPrompt,
            entry.variant,
            entry.repairSourceJobId && entry.repairSourceVersion
              ? {
                  sourceJobId: entry.repairSourceJobId,
                  sourceVersion: entry.repairSourceVersion,
                  reason: entry.repairReason,
                }
              : undefined,
          ),
        ),
      }))

      if (WRITE) {
        if (REPAIR_TAINTED && legacyPendingIds.length) {
          await prisma.artJob.updateMany({
            where: {
              id: { in: legacyPendingIds },
              status: 'PENDING',
            },
            data: {
              status: 'CANCELLED',
              claimedAt: null,
              claimedBy: null,
              error:
                'Cancelled by Facet Krea prompt repair: the v2/v3 contextual wrapper rendered as text and the v4 taxonomy clause rendered as concrete busts and paper silhouettes; superseded by the v5 depictive prompt.',
            },
          })
        }

        const promptUpdates = Array.from(
          new Map(
            queue
              .filter(
                (entry) =>
                  !clean(entry.facet.artPrompt) ||
                  isLegacyGeneratedFacetPrompt(entry.facet.artPrompt),
              )
              .map((entry) => [entry.facet.id, entry]),
          ).values(),
        )
        await runWithConcurrency(promptUpdates, 8, async (entry) => {
          await prisma.facet.update({
            where: { id: entry.facet.id },
            data: { artPrompt: entry.identityPrompt },
          })
        })

        let inserted = 0
        for (let index = 0; index < jobRows.length; index += 25) {
          const chunk = jobRows.slice(index, index + 25)
          if (!chunk.length) continue
          const result = await prisma.artJob.createMany({ data: chunk })
          inserted += result.count
        }

        console.log(
          `Facet art: ${inserted} job(s) queued, ${reused.length} active coverage job(s) reused, ${blocked.length} entry/entries held for catalog review.` +
            (REPAIR_TAINTED
              ? ` Repair scan: ${repairQueued.size} tainted target(s) resubmitted, ${legacyPendingIds.length} tainted pending job(s) cancelled, ${repairSkippedSuperseded.length} superseded output(s) preserved, ${repairSkippedHealthy.length} healthy v4 render(s) left alone, ${repairSkippedNonVisual.length} prompt-modifier Facet(s) reported rather than re-rolled, ${repairSkippedNewerAttempt.length} slot(s) already attempted by a newer version, ${repairBlocked.length} blocked target(s) held.`
              : ''),
        )
      }

      console.log(
        JSON.stringify(
          {
            mode: WRITE ? 'write' : 'dry-run',
            coverageMode: ALL_VARIANTS ? 'all-variants' : 'baseline',
            repairTainted: REPAIR_TAINTED,
            requeueCurated: REQUEUE_CURATED,
            facetFilter: FACET_FILTER ? [...FACET_FILTER] : null,
            projectSlug: PROJECT_SLUG,
            version: FACET_ART_VERSION,
            repairedVersions: [...LEGACY_FACET_ART_VERSIONS],
            fields: ART_VARIANTS.map((variant) => variant.field),
            totals: {
              active: facets.length,
              available: Object.fromEntries(available),
              notRequired: notRequired.length,
              pendingReused: reused.length,
              // What was actually written. Before --facets existed these were
              // the same number; with a filter they are not, and reporting the
              // pre-filter figure made a scoped run of 3 print "queued: 191".
              queued: scopedQueue.length,
              queuedBeforeFacetFilter: queue.length,
              repairQueued: repairQueued.size,
              repairPendingCancelled: legacyPendingIds.length,
              repairSupersededPreserved: repairSkippedSuperseded.length,
              repairHealthyPreserved: repairSkippedHealthy.length,
              repairNonVisualReported: repairSkippedNonVisual.length,
              repairNewerAttemptSkipped: repairSkippedNewerAttempt.length,
              curatedPromptRequeued: curatedRequeue.length,
              staleSwatchRequeued: staleSwatchRequeue.length,
              heldByFacetFilter: scopedOut,
              facetFilterUnmatched: unmatchedFacets,
              repairBlocked: repairBlocked.length,
              blocked: blocked.length,
            },
            audit: audit.totals,
            blocked: blocked.slice(0, 100),
            policy: {
              prompt:
                'Krea receives semantic image content only: subject, scene, medium, composition, lighting, and texture. App/taxonomy/context wrappers are excluded, and so is art-direction jargon -- the clause has to describe a picture, not commission one.',
              qualityGate:
                'Validate Krea 2 prompts before enqueue; do not generate art for duplicate, malformed, composite, taxonomy-leaking, cargo-cult, or unreviewed legacy Facets.',
              repair:
                'When --repair-tainted is set: resubmit v2/v3 outputs that still own their Facet slot, and the v4 outputs whose prompt was both clause-dominated and rejected by the art-direction-jargon rule. Preserve outputs already superseded by a different ArtImage id, healthy v4 renders, and prompt-modifier Facets that depict nothing. Cancel a pending legacy job only when a replacement is being queued for it.',
              scope: ALL_VARIANTS
                ? 'Explicit enhancement mode: queue every missing imagePath, cardPath, heroPath, and iconPath without replacing curated art.'
                : 'Coverage-first mode: queue at most one imagePath job for a Facet with no display art and no active Facet ArtJob.',
              dedupe:
                'Reuse PENDING/RUNNING coverage work normally; repair jobs carry retry provenance so claim-time baseline cleanup cannot discard an intentional replacement.',
            },
          },
          null,
          2,
        ),
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}
