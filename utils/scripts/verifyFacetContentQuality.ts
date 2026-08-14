// /utils/scripts/verifyFacetContentQuality.ts
//
// Prose rules for authored Facet catalog content. Offline; no database.
//
//   npx tsx utils/scripts/verifyFacetContentQuality.ts
//
// WHY
// ---
// 565 descriptions is more prose than anyone will re-read, and the failure modes
// are the ones that only show up in bulk: the same sentence shape 118 times, a
// description that restates its own title, encyclopedia filler that says nothing
// ("A type of animal known for its characteristics"), or a stray entry keyed to
// the wrong Facet.
//
// The catalog's existing voice is specific and dry -- ANIMAL "Axolotl": "Refused
// to grow up. The universe respected this. Regenerates everything, including bad
// decisions." These rules exist to keep 565 new rows from dragging that average
// down, and every one of them is a thing I caught myself doing while writing.
import { checkArtPromptContract } from './../../server/utils/artPromptContract'
import { loadFacetContentBatches } from './publishFacetContent'

const entries = loadFacetContentBatches()

/**
 * Openers that describe the CATEGORY rather than the thing. A catalog row whose
 * description begins "A type of ..." has told the reader nothing they could not
 * get from the taxonomy column they are already looking at.
 */
const FILLER_OPENERS =
  /^(?:a (?:type|kind|form|sort|variety) of|this (?:facet|trait|style|genre|material|archetype|personality)|represents?|refers? to|describes?|characterized by|known for (?:its|their) (?:characteristics|qualities|traits))\b/i

/** Words that promise specificity and deliver none. */
const EMPTY_QUALIFIERS =
  /\b(?:various|numerous|many different|a variety of|all kinds of|etc\.?)\b/i

const violations: string[] = []
const seenDescriptions = new Map<string, string>()
const openings = new Map<string, string[]>()

for (const entry of entries) {
  const where = `${entry.taxonomy} #${entry.facetId} "${entry.title}"`
  const description = entry.description.trim()
  const words = description.split(/\s+/).length

  if (words < 6) {
    violations.push(`${where}: description is ${words} words; too short to say anything.`)
  }
  if (description.length > 600) {
    violations.push(`${where}: description is ${description.length} chars; over the 600 limit.`)
  }
  if (FILLER_OPENERS.test(description)) {
    violations.push(
      `${where}: opens with category filler ("${description.slice(0, 40)}…"). ` +
        'The taxonomy column already says what kind of thing it is.',
    )
  }
  if (EMPTY_QUALIFIERS.test(description)) {
    violations.push(`${where}: uses an empty qualifier (various/numerous/etc).`)
  }

  // "Adamantium: Adamantium is a metal that..." — restating the title as the
  // whole first clause wastes the one line the catalog gives this row.
  const firstClause = description.split(/[.,;:]/)[0] || ''
  if (
    firstClause.toLowerCase().trim() === entry.title.toLowerCase().trim() ||
    new RegExp(`^${entry.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} is an? `, 'i').test(description)
  ) {
    violations.push(`${where}: the description restates its own title.`)
  }

  const duplicate = seenDescriptions.get(description.toLowerCase())
  if (duplicate) {
    violations.push(`${where}: description is identical to ${duplicate}.`)
  } else {
    seenDescriptions.set(description.toLowerCase(), where)
  }

  // Same opening three words, over and over, is what bulk authoring looks like
  // from a distance even when each line reads fine on its own.
  const opener = description.toLowerCase().split(/\s+/).slice(0, 3).join(' ')
  const list = openings.get(opener) ?? []
  list.push(where)
  openings.set(opener, list)

  if (entry.flavorText && entry.flavorText.trim().length < 3) {
    violations.push(`${where}: flavorText is present but empty.`)
  }

  /*
   * A Facet description is also an ART PROMPT, and that was learned the
   * expensive way.
   *
   * `generate_facet_art.ts` composes each job's prompt out of the Facet's own
   * title, description, flavor text and examples, and `/api/art/enqueue` gates
   * the FULL composed string. So an ordinary English phrase in a description
   * rejects the job -- and because the maintenance run enqueues inside a
   * serialized session, one bad row fails the ENTIRE run at the last step,
   * after the catalog work has already committed.
   *
   * That is exactly what happened on 2026-08-14 (run 31765805301). MATERIAL
   * "Moonstone" read "Sheens blue when turned, and only when turned" -- good
   * prose, and "only when" is a conditional the contract refuses. One of 565
   * descriptions took down a run covering 714 facets, six minutes in.
   *
   * The dream prompts in config/art-coverage were checked against this contract
   * before anything was spent. These were not, purely because a description did
   * not look like a prompt. It is one.
   */
  const composed = [
    `Illustrate the Facet concept “${entry.title}”.`,
    description,
    entry.flavorText || '',
  ]
    .filter(Boolean)
    .join('\n')
  for (const violation of checkArtPromptContract({
    prompt: composed,
    engine: 'krea2',
    cfg: 1,
    steps: 8,
  })) {
    violations.push(
      `${where}: this description would be rejected as an art prompt — ` +
        `[${violation.rule}] ${violation.detail}`,
    )
  }
}

for (const [opener, list] of openings) {
  if (list.length > 6) {
    violations.push(
      `${list.length} descriptions open with "${opener}…" — that is a template, not a voice. ` +
        `First few: ${list.slice(0, 3).join('; ')}`,
    )
  }
}

if (violations.length) {
  console.error(`Facet content quality FAILED (${violations.length}):`)
  for (const violation of violations.slice(0, 60)) console.error(`  - ${violation}`)
  if (violations.length > 60) console.error(`  … and ${violations.length - 60} more`)
  process.exit(1)
}

const byTaxonomy = new Map<string, number>()
for (const entry of entries) {
  byTaxonomy.set(entry.taxonomy, (byTaxonomy.get(entry.taxonomy) ?? 0) + 1)
}
const words = entries.map((e) => e.description.trim().split(/\s+/).length).sort((a, b) => a - b)
console.log(
  `Facet content quality verified: ${entries.length} description(s) across ` +
    `${byTaxonomy.size} taxonomy/taxonomies, ` +
    `${words.length ? `${words[0]}-${words[words.length - 1]} words (median ${words[Math.floor(words.length / 2)]})` : 'none yet'}.`,
)
