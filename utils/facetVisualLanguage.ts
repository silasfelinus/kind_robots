// /utils/facetVisualLanguage.ts
//
// The Facet art direction that used to live inside
// scripts/generate_facet_art_v4.ts, lifted out so the SERVER can reach it.
//
// Why it moved (2026-09-21). Six versions of this vocabulary were written and
// corrected in the producer script -- v4's concrete bust, v5's headless torso
// and generic hammers, v6's fix for both -- while a completely separate
// surface, server/utils/entityArt.ts#buildEntityArtPrompt, went on queuing
// Facet art that never read a line of it. That path takes Facet.artPrompt
// VERBATIM as its first paragraph, so a Facet still carrying a v4 tail was
// still rendering v4 art months after v4 was repaired.
//
// ArtJobs 29108/29109/29111 are what that looks like from the owner's end
// (Silas, 2026-09-21: "we're trying to get really quality art generations. no
// text ... another prompt that is ignoring the need for krea to be literal.
// how is this happening"). The conditioning that actually reached CLIP for
// Facet "Inventor" was:
//
//   a square composition centred on one clear subject. Inventor. Builds the
//   thing before establishing whether it should exist. The demonstration
//   usually settles that question one way or the other. Single distinctive
//   figure in action, readable tools
//
// Krea was not ignoring literalness. It was being perfectly literal: handed
// grammatical English that names nothing visible, the likeliest image
// CONTAINING those words is an image OF those words, so it painted the caption
// -- garbled, because 8 steps at cfg 1. Qwen-Image lineage is the strongest
// open text renderer there is; card copy is the one input it must never get.
//
// The rule this file exists to enforce: a module that only a script can import
// is art direction that only a script can apply. Anything here must be
// reachable from every producer, or the next repair will miss a cohort the
// same way.
import {
  ENHANCEMENT_SWATCH_SUBJECT,
  ENHANCEMENT_SWATCH_SUBJECTS,
} from './promptEnhancementPolicy'
import { repairFramePrompt } from './framePromptRepair'

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

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
export const LEGACY_GENERATED_IDENTITY =
  /^Illustrate the Facet concept (?:“[^”]+”|"[^"]+")\.\s*/i

// v4 persisted its own generated tail into Facet.artPrompt the same way. Every
// v4 clause is listed, not only the two that misrendered: a stored v4 prompt is
// returned verbatim by buildFacetIdentityPrompt(), so any clause left
// unrecognized would be handed straight back to the prompt contract, which now
// rejects the jargon -- aborting the whole run instead of repairing it.
export const LEGACY_V4_TAXONOMY_TAILS = [
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
export const LEGACY_V5_TAXONOMY_TAILS = [
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
export const V5_OCCUPATION_TAIL =
  'A person at full height in the middle of this work, the tools of the trade in their hands, the room or the landscape of that work around them.'
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
      return 'A single large form filling the picture, made of this, lit so the colour and the surface behave the way they really do.'
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
      return 'One clear subject alone in the picture, large and plainly lit.'
  }
}

/**
 * Every taxonomy taxonomyVisualLanguage() answers for. Exported so the contract
 * test can enumerate the clauses this producer can currently emit and prove
 * each one is registered below.
 */
export const CLAUSE_TAXONOMIES = [
  'ANIMAL',
  'SPECIES',
  'GENRE',
  'THEME',
  'SETTING',
  'PERSONALITY',
  'ALIGNMENT',
  'QUIRK',
  'BACKSTORY',
  'COLOR',
  'MATERIAL',
  'STYLE',
  'ART_DIRECTION',
  'PROMPT_ENHANCEMENT',
  'OCCUPATION',
  'ARCHETYPE',
  'ROLE',
  'RARITY',
  'REWARD_TYPE',
  'DREAM_TYPE',
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
export const GENERATED_PROMPT_TAILS: readonly string[] = [
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
  /*
   * v7 (2026-09-21). One word, in two clauses: "frame" -> "picture".
   *
   * Krea paints "frame" as a physical picture frame whichever sense is meant,
   * so a clause that is very nearly the WHOLE prompt for a Facet with no prose
   * of its own was handing it a frame to draw. See the frame-noun rule in
   * server/utils/artPromptContract.ts, which now rejects both spellings of the
   * old wording outright -- which is also why the v6 strings above have to stay
   * here: they are how a stored prompt still carrying one gets recognized and
   * rebuilt instead of being handed straight back to Krea.
   */
  'A single large form filling the picture, made of this, lit so the colour and the surface behave the way they really do.',
  'One clear subject alone in the picture, large and plainly lit.',
  /*
   * Variants of the clauses above that reached the live catalog by a route this
   * file did not know about, and each of which froze a whole cohort.
   *
   * The first is a v4 creature clause rewritten as an instruction by an earlier
   * catalog pass. 97 ANIMAL/SPECIES Facets carry it. Unrecognized, it was
   * handed back to Krea verbatim -- and because the title is not in it, all 97
   * prompts named no subject at all. Facet 290 "Octopus" read "Three hearts,
   * nine brains, infinite arms..." and rendered a three-hearted plush blob;
   * 285 "Axolotl" rendered a frog (Silas, 2026-09-20: "what the hell is with
   * the facets that have recently been generated? Octopus, ocelot, axolotl?
   * The prompts make no sense and the images reflect that").
   */
  'Show one unmistakable full creature with recognizable anatomy, personality, and habitat cues.',
  'Use a character-centered visual metaphor with a clear emotional read.',
  'Use a single clear subject or emblem that makes the concept understandable at thumbnail size.',
]

/*
 * Clause fragments left behind when a REPAIR edits a registered tail.
 *
 * Conductor's repair_negation_art_prompts.py strips the jargon this contract
 * bans -- "unmistakable silhouette", "legible at thumbnail size" -- and those
 * phrases sit INSIDE two registered v4 tails. Stripping them truncated the
 * tail, and an endsWith() match against the full string then failed: 128
 * OCCUPATION/ROLE/ARCHETYPE Facets and 19 more went from recognized to
 * unrecognized without a single edit to this file. The same pass appends
 * "Every surface bare and unmarked." AFTER the tail, which breaks endsWith()
 * from the other end.
 *
 * So the match below is containment, not suffix. A registered clause anywhere
 * in the prompt means the producer wrote it, whatever a later repair trimmed
 * off the end or glued on after it.
 */
export const TRUNCATED_TAIL_PREFIXES: readonly string[] = [
  'Single distinctive figure in action, readable tools',
  'Single clear subject or emblem, immediately',
  'Create a premium collectible emblem or object with a strong rarity read',
]

export function isLegacyGeneratedFacetPrompt(value: unknown): boolean {
  const prompt = clean(value)
  if (!prompt) return false
  if (LEGACY_GENERATED_IDENTITY.test(prompt)) return true
  if (GENERATED_PROMPT_TAILS.some((tail) => prompt.includes(tail))) return true
  return TRUNCATED_TAIL_PREFIXES.some((prefix) => prompt.includes(prefix))
}
/*
 * Card copy is the text Krea paints.
 *
 * Every Facet carries a `description` written as a joke for a human reading a
 * card -- "Builds the thing before establishing whether it should exist", "Knows
 * how this ends and cannot say so". v2 through v6 all pasted it whole into the
 * artPrompt, and on a text specialist that is a caption, not a subject.
 *
 * The scrubber already reached the right policy for the CONTEXT block
 * (utils/kreaSemanticPrompt.ts): narrative fields are cut, "what gets cut here
 * is the sentence-shaped fields, the ones that read as card copy", and one
 * comes back only if dropping them leaves too little to draw. It could never
 * apply that policy here, because by the time the scrubber sees the prompt the
 * card copy IS the art direction and art direction is exactly what it must not
 * touch. So the same judgement has to be made at the point the identity prompt
 * is built.
 *
 * Sentence by sentence, not field by field. Facet 290 "Octopus" is the reason:
 * its description is "Three hearts, nine brains, infinite arms. Has been
 * something else so long they forgot which one they started as." The first
 * sentence is the best art direction in the row; the second is what rendered a
 * plush blob. Dropping the whole field loses a good sentence, keeping it keeps
 * a bad one.
 *
 * Default is KEEP. A sentence is dropped only when it names nothing visible AND
 * trips an aphorism marker, so prose this lexicon does not recognize still
 * reaches the model. This is a floor on obvious card copy, not a classifier --
 * the backstop is still looking at the pictures.
 */

// Second person, modality and epistemic verbs. Card copy talks ABOUT a person;
// a description shows one. None of these can be drawn.
const APHORISM_MARKERS: readonly RegExp[] = [
  /\byou\b|\byour\b|\byours\b/i,
  /\b(?:cannot|can't|won't|would|should|must|might|never quite|no longer)\b/i,
  /\b(?:knows?|knew|understands?|believes?|remembers?|forgot|forgets?|decides?|assumes?|insists?|admits?|means?|matters?|wonders?|explains?|explaining)\b/i,
  /\b(?:whether|unless|one way or the other|either way)\b/i,
  /\b(?:usually|always|every time|somehow|apparently|technically|eventually|already)\b/i,
  /\b(?:stopped|started|began|kept|went on)\s+(?:being|to be|having)\b/i,
]

/*
 * Figurative language, which is the one family that must be dropped EVEN WHEN
 * it names something visible -- because what it names is not what it means.
 *
 * Facet "Mech Operator" reads "Wears a building and moves it like a body." An
 * anchor test passes it: `body` is as concrete a noun as there is. Krea then
 * did precisely what this codebase has been told six times that it does, and
 * painted a man wearing a four-storey apartment block (ArtJob 29108).
 *
 * Silas, 2026-09-21: "we should be very literal ideally about what is presented
 * for this run". A metaphor is the opposite of literal: it is a sentence whose
 * surface reading is wrong on purpose. On a model with no way to reach the
 * intended reading, handing it over is handing over the wrong picture. The
 * taxonomy clause is concrete by construction, so dropping the metaphor loses
 * nothing and removes a guess.
 */
const FIGURATIVE_MARKERS: readonly RegExp[] = [
  /\b(?:like|as if|as though)\s+(?:a|an|the|it|they|someone|something)\b/i,
  /\b(?:reads?|feels?|looks?|plays?|lands?)\s+as\b/i,
  /\b(?:might as well be|a kind of|a sort of|practically a|less a|more a)\b/i,
]

/*
 * Abstract nouns. A sentence built on one of these is a claim about the
 * subject, not a picture of it, however many concrete words surround it.
 *
 * "Discipline practised in darkness until darkness stopped being a limitation"
 * (Shadow Monk, ArtJob 29120) is the case that forced this list: `darkness` is
 * a genuine visual anchor and the sentence is still pure card copy, so anchors
 * alone let it through -- and Krea painted the whole sentence across the top of
 * the frame in bold type.
 */
const ABSTRACT_NOUNS =
  /\b(?:question|conversation|calibration|demonstration|reputation|intention|distinction|consequence|situation|relationship|experience|discipline|limitation|rhythm|defen[cs]e|hobby|instinct|memory|patience|confidence|ambition|doubt|faith|logic|method|technique|practice|principle|purpose|meaning|truth|idea|concept|habit|the thing|the point|the rest)\b/i

/*
 * A floor of plainly imageable vocabulary. Deliberately narrow and deliberately
 * boring: colour, material, light, body, garment, landscape, structure, the
 * everyday objects a scene is built from, and the postures a figure can hold.
 *
 * A sentence with none of these names nothing to put on the canvas. Under the
 * literalness rule above that is enough to drop it on its own -- "Strikes, and
 * is already elsewhere", "The rhythm is the defense" -- rather than waiting for
 * it to also trip a marker.
 */
const VISUAL_ANCHORS: readonly RegExp[] = [
  /\b(?:red|orange|yellow|green|blue|indigo|violet|purple|pink|black|white|grey|gray|brown|gold|golden|silver|copper|brass|bronze|crimson|scarlet|teal|amber|ivory|pale|bright|colour|color)\w*\b/i,
  /\b(?:glass|metal|iron|steel|wood|wooden|stone|marble|paper|cloth|silk|velvet|leather|fur|feather|scale|bone|clay|rust|smoke|water|ice|flame|fire|ash|dust|moss)\w*\b/i,
  /\b(?:light|lit|glow|glowing|shadow|shadows|neon|lantern|lamp|candle|sunlight|moonlight|dawn|dusk|daylight|backlit|silhouetted)\w*\b/i,
  /\b(?:eyes?|eyed|face|hands?|arms?|legs?|hair|teeth|claws?|wings?|tails?|horns?|skin|shoulders?|hearts?|brains?|fingers?|mouth|head)\b/i,
  /\b(?:coat|cloak|hat|mask|armour|armor|robe|dress|uniform|boots?|gloves?|goggles?|helmet|scarf|apron|crown)\b/i,
  /\b(?:forest|mountain|desert|ocean|river|field|street|city|room|kitchen|workshop|library|tower|bridge|road|garden|shore|cave|sky|cloud|rain|snow|storm)\w*\b/i,
  /\b(?:figures?|person|people|crowd|rows?|lines?|table|chair|door|window|wall|floor|tools?|machine|engine|wheel|books?|blades?|sword|knife|staff|rope|bottle|cup|box|bag|ladder|mirror|clock|key|chain|flag|banner|bowl|plate|boat|ship|train|conveyor)\b/i,
  /\b(?:standing|sitting|kneeling|leaning|running|walking|reaching|holding|carrying|crouched|perched|curled|sprawled|hunched|wrapped|covered|surrounded)\b/i,
]

function splitSentences(value: string): string[] {
  return clean(value)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
}

/**
 * True when a sentence is card copy rather than a description of a picture.
 *
 * Three ways to fail, in the order they were learned. A sentence is dropped
 * when it speaks figuratively, when it is built on an abstract noun, or when it
 * names nothing visible at all. Anything that survives says, literally, what is
 * in the frame.
 */
export function readsAsCardCopy(sentence: string): boolean {
  const text = clean(sentence)
  if (!text) return false
  if (FIGURATIVE_MARKERS.some((pattern) => pattern.test(text))) return true
  if (ABSTRACT_NOUNS.test(text)) return true
  if (!VISUAL_ANCHORS.some((pattern) => pattern.test(text))) return true
  return APHORISM_MARKERS.some((pattern) => pattern.test(text))
}

/**
 * The drawable part of a Facet's prose, with its card copy removed. Returns ''
 * when every sentence was card copy -- the taxonomy clause then carries the
 * whole picture, which is what it was written to do.
 */
export function depictableProse(value: unknown): string {
  return splitSentences(clean(value))
    .filter((sentence) => !readsAsCardCopy(sentence))
    .join(' ')
    .trim()
}

export type FacetIdentityInput = {
  title: string
  taxonomy: string
  description?: string | null
  flavorText?: string | null
  examples?: string | null
  /** FacetProfile.metadata.artworkPrompt, already contract-checked by the caller. */
  metadataPrompt?: string | null
  scientificName?: string | null
  category?: string | null
}

/**
 * Build a Facet's identity prompt from its own content.
 *
 * Deliberately caption-shaped. "Surreal Horror" is useful conditioning;
 * "Illustrate the Facet concept named Surreal Horror for Kind Robots" is a
 * pile of extra concrete words that Krea is perfectly capable of painting.
 */
export function buildFacetIdentityPromptFrom(
  input: FacetIdentityInput,
): string {
  const prose = [
    input.description,
    input.flavorText,
    input.examples,
    input.metadataPrompt,
  ]
    .map((value) => depictableProse(value))
    .filter(Boolean)

  /*
   * The frame repair runs on the ASSEMBLED identity, not on the variant prompt,
   * because this string is what gets persisted back to Facet.artPrompt. Repair
   * it later -- at buildFacetVariantPrompt, say -- and the gate passes while the
   * dirty text is still written to the row, which is the silent half of the bug.
   *
   * A Facet's own description can carry the word too: Neonpunk's said "no
   * daylight anywhere in frame" until it was republished.
   */
  return repairFramePrompt(
    [
      `${clean(input.title)}.`,
      clean(input.scientificName) ? `${clean(input.scientificName)}.` : '',
      clean(input.category) ? `${clean(input.category)}.` : '',
      ...prose,
      taxonomyVisualLanguage(input.taxonomy),
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
  )
}
