// /server/utils/artPromptContract.ts
//
// A hard gate on what may reach an image model, enforced at the enqueue
// boundary so it binds every producer — Conductor scripts, the art workbench,
// narrative beats, backfill jobs — without each having to remember the rules.
//
// Every rule here is a bug that actually shipped and rendered. The first group
// came from the 2026-08-08 art sweep; contextual-wrapper was added after a
// 2026-09-05 Facet screenshot showed Krea faithfully painting the app/taxonomy
// wrapper itself (Kind Robots logo, "Facet", the Facet title, and prompt prose).
// The pattern matters more than any single wording:
//
//   1. A CONDITIONAL instruction. Prompts carried "cast characters naturally
//      across many species...; include robots only when the subject or scene
//      explicitly calls for them". "Only when" needs a reader that can evaluate
//      a condition. Krea 2 is a distilled diffusion transformer: it paints the
//      densest concrete noun phrase it is given. That clause IS a crowd.
//
//   2. FORMAT vocabulary. "treasure card illustration" and "2:3 portrait card
//      composition" mean "the art printed on a card" to a person. To a model
//      trained on captions — Qwen-Image lineage, the strongest open text
//      renderer there is — it means a card. Three rewards came back as literal
//      trading cards with title bars and rules boxes full of invented text.
//
//   3. NEGATION PILES. "no readable text, no lettering, no logos, no watermark,
//      no signature" names text five times. At cfg 1 the ComfyUI negative
//      prompt is inert, so those words land in POSITIVE conditioning.
//
//   4. ENGINE MISMATCH. Krea 2 Turbo is distilled for cfg 1 and an 8-step
//      budget; jobs ran at cfg 7 / 20 steps because the queue builder resolved
//      steps per-engine but hardcoded a single generic cfg.
//
//   6. ART-DIRECTION JARGON. The words an art director uses to ASK for a picture
//      are not words that describe one. "Iconic scene, concrete focal subject"
//      tells a person "make the main thing specific and memorable"; it tells a
//      caption-conditioned model to paint a monument, made of concrete, with a
//      face on it. 154 GENRE/THEME/SETTING Facets came back as the same grey
//      concrete bust in the same grey concrete room -- Office Satire, Body
//      Horror and Aging Protagonist are literally the same head -- because that
//      clause WAS the whole prompt for every Facet with no prose of its own.
//      "Unmistakable silhouette" did it to 50 OCCUPATION/ROLE/ARCHETYPE Facets:
//      Chaos Consultant and Accidental Diplomat are both a black paper cut-out
//      of a man on a desk. Found 2026-09-14 from a Storybook genre-picker
//      screenshot, six weeks after the renders landed.
//
//   5. CONTEXTUAL WRAPPERS. "Illustrate the Facet concept ..." followed by
//      "Create ... for Kind Robots ..." is useful instruction text for a chat
//      model and harmful conditioning for Krea. Krea does not need to know what
//      database entity or application surface an image belongs to. It needs the
//      concrete visual words: subject, scene, medium, composition, lighting,
//      texture. The app words became literal logo/title copy in production.
//
// Cost of catching these in CI or review: nothing. Cost of not catching them:
// wasted renders and owner attention, discovered from screenshots rather than
// tests.
//
// Violations are hard errors, not warnings. A warning on a background pipeline
// is a log line nobody reads; the whole failure mode here was bad art rendering
// unnoticed for hours. Producers that trip a rule should fail loudly at enqueue.
import { createError } from 'h3'
import { cleanArtPrompt } from './artPromptQuality'

export type ArtPromptViolation = {
  rule: string
  detail: string
}

export type ArtPromptContractInput = {
  prompt: string
  engine?: string | null
  steps?: number | null
  cfg?: number | null
}

/**
 * Engines distilled to run at a fixed low guidance. Above it the model leaves
 * the distribution it was trained on: burned contrast, crushed colour, and
 * duplicated subjects. `maxSteps` is a sanity ceiling, not the ideal.
 */
export const DISTILLED_ENGINE_LIMITS: Record<
  string,
  { cfg: number; maxSteps: number }
> = {
  krea2: { cfg: 1, maxSteps: 12 },
  // Z-Image Turbo: the exported ComfyUI template runs 8 steps at cfg 1.
  zimage: { cfg: 1, maxSteps: 12 },
  // The enqueue endpoint normalizes to "flux2"; Conductor's consumer calls the
  // same engine "flux2-klein". Both spellings reach this gate, so both are keyed
  // rather than relying on either side to normalize first.
  flux2: { cfg: 1, maxSteps: 8 },
  'flux2-klein': { cfg: 1, maxSteps: 8 },
  flux: { cfg: 1, maxSteps: 40 },
}

// "only when", "if the scene", "unless", "where appropriate" — anything that
// asks the model to decide. Producers must decide before they enqueue and state
// one outcome. Deliberately not matched inside a quoted subject (see below).
const CONDITIONAL_PATTERNS: Array<{ pattern: RegExp; rule: string }> = [
  { pattern: /\bonly (?:when|if)\b/i, rule: 'conditional-instruction' },
  { pattern: /\bwhen (?:the )?(?:subject|scene|context)\b/i, rule: 'conditional-instruction' },
  { pattern: /\b(?:if|unless) (?:the )?(?:subject|scene|context|prompt)\b/i, rule: 'conditional-instruction' },
  { pattern: /\bwhere (?:appropriate|relevant|applicable)\b/i, rule: 'conditional-instruction' },
  { pattern: /\bas (?:needed|appropriate)\b/i, rule: 'conditional-instruction' },
  // The same bug wearing different words. Every page backdrop carried "...when
  // any figures APPEAR they are small, distant and incidental to the setting",
  // and none of the patterns above match it: the conditional attaches to a cast
  // noun, not to "the subject" or "the scene". All 222 rendered with a cast —
  // crowds in the side windows of voice-lab, a street full of figures in
  // servers — because the model has no way to reach the "when" and simply
  // paints the forty words of people that follow it.
  //
  // Scoped to a cast noun plus a PRESENCE verb, so ordinary prose that happens
  // to say "when" about people is untouched: "a market at dusk when people
  // light the lanterns" describes a scene, "when people appear" hands the model
  // a decision it cannot make.
  {
    pattern:
      /\b(?:when|if|where|whenever|unless)\s+(?:any\s+|some\s+|the\s+|no\s+)?(?:figures?|people|persons?|characters?|humans?|robots?|creatures?|bystanders?|crowds?|onlookers?)\s+(?:do\s+|are\s+|is\s+)?(?:appear|present|shown|show up|included|visible|featured|depicted)\b/i,
    rule: 'conditional-instruction',
  },
]

// Asking for a card, a poster, or a book cover gets you the object, not the art
// printed on it — including its typography.
const FORMAT_PATTERNS: Array<{ pattern: RegExp; rule: string }> = [
  { pattern: /\b(?:trading[- ])?card (?:illustration|artwork|composition|art)\b/i, rule: 'format-vocabulary' },
  { pattern: /\b(?:treasure|ability|item|reward)[- ]card\b/i, rule: 'format-vocabulary' },
  // "poster composition" is framing language (bold, graphic, close-cropped) and
  // the coloring-book lane uses it deliberately; "a movie poster" is an object
  // request. Only the latter is flagged. Note the asymmetry with "card
  // composition" above, which IS flagged: that one is not a guess — "2:3
  // portrait card composition" demonstrably rendered a titled trading card with
  // a rules box. There is no equivalent evidence for poster framing, so the
  // rule stops where the evidence stops.
  {
    pattern:
      /\b(?:movie |film |book )?(?:poster|book cover|magazine cover|album cover)\b(?!\s+(?:composition|framing|layout|crop))/i,
    rule: 'format-vocabulary',
  },
  { pattern: /\bcomic (?:page|panel|strip)\b/i, rule: 'format-vocabulary' },
]

// Rule 6. Deliberately the exact clauses with rendered evidence behind them,
// not a blanket ban on art vocabulary. The neighbouring Facet clause
// "Character-centered visual metaphor, clear emotion through pose..." is NOT
// listed: its 17 Facets rendered correctly, so there is nothing to ban it on.
// Likewise only "unmistakable"/"clean" silhouette are matched -- the phrasings
// this producer emitted -- so artAssetSuggest's "strong silhouette" direction,
// which has never misrendered, keeps working.
const ART_DIRECTION_JARGON_PATTERNS: Array<{ pattern: RegExp; rule: string }> = [
  { pattern: /\bconcrete\s+(?:focal\s+)?subject\b/i, rule: 'art-direction-jargon' },
  { pattern: /\biconic\s+scene\b/i, rule: 'art-direction-jargon' },
  { pattern: /\b(?:unmistakable|clean)\s+silhouette\b/i, rule: 'art-direction-jargon' },
  { pattern: /\bthumbnail\s+readability\b/i, rule: 'art-direction-jargon' },
  { pattern: /\blegible at thumbnail size\b/i, rule: 'art-direction-jargon' },
  { pattern: /\bsubject separation\b/i, rule: 'art-direction-jargon' },
  /*
   * "readable tools", and legibility cues like it, on the strongest open text
   * renderer there is.
   *
   * To a person this asks for props you can identify at a glance. To Krea it
   * is the word `readable` attached to a noun, which is a request for
   * legibility -- and the only thing a diffusion model knows how to make
   * legible is lettering. It sat at the end of the v4 occupation clause and
   * was still reaching live conditioning on 2026-09-21, on Facets whose
   * prompts were otherwise nothing but card copy: ArtJobs 29108, 29109 and
   * 29111 all came back with a caption block painted across the top.
   *
   * Scoped to the legibility adjectives on a noun. Ordinary prose about a
   * readable expression or a legible signature in a scene that really has one
   * is not what this matches, and "readable" describing a person is left
   * alone.
   */
  {
    pattern:
      /\b(?:readable|legible|clearly\s+readable|easily\s+read)\s+(?:tools?|labels?|signs?|instruments?|markings?|details?|iconography|symbols?)\b/i,
    rule: 'art-direction-jargon',
  },
]

// "Kind Robots visual style" gives an image model nothing, and used to be
// rewritten downstream into a block that carried the casting instruction.
const VAGUE_BRAND_STYLE =
  /\b(?:(?:rich|cohesive|friendly)\s+)?Kind Robots\s+(?:visual\s+)?(?:style|language)\b/i

// These are deliberately the *known shipped generator wrappers*, not a blanket
// ban on verbs such as "create" or legitimate scene text containing "Kind
// Robots". The v2/v3 Facet producer attached application context to every Krea
// prompt. In the 2026-09-05 failure Krea rendered those nouns as actual UI/logo
// copy. A caption-conditioned image model should not receive database/app
// instructions in its positive conditioning.
const CONTEXTUAL_WRAPPER_PATTERNS = [
  /\bIllustrate the Facet concept\b/i,
  /\bCreate (?:this as|a) [^.\n]{0,160}\bfor Kind Robots\b/i,
  /*
   * Two more shipped wrappers, found live on 2026-09-20 in 23 queued Facet
   * jobs. Same failure as the one above -- the product name, the builder it
   * belongs to and the catalog group are application context, and a caption
   * model paints them as title text on the card it decides it is drawing.
   *
   *   "Kind Robots premium Builder illustration for Reward Types: Magic."
   *   "Illustrated Bot Type card for a dependable general-purpose bot, ..."
   *
   * The second is matched by the taxonomy word plus "card", not by "card"
   * alone: FORMAT_PATTERNS already owns the generic card nouns, and a scene
   * that genuinely contains a shift card or a recipe card is not this bug.
   */
  /\bKind Robots\b[^.\n]{0,80}\billustration for\b/i,
  /\b(?:Bot|Reward|Dream|Facet|Rarity|Character)\s+Type[s]?\s+card\b/i,
]

// 7. PEOPLE NEGATION. The half of rule 3 that never got written down in code.
//    ART-PROMPTS.md has said since 2026-08-25 that Krea renders the nouns and
//    drops the word holding them off -- "`no face` is how you commission a
//    face" -- but the only negation rule below counts TEXT nouns, so every
//    people negation sailed through. 319 of 351 live Rewards still carry one.
//    Reward 393, "Dr. Eliza Dolittle's Ring", asks for a ring on a leaf and
//    ends "No figure."; it renders as a crowd of Victorian faces and no ring.
//
//    The 2026-08-08 repair is itself the largest producer. The clause written
//    to STOP the crowds -- "an unpeopled frame, the subject stands alone with
//    no bystanders, no onlookers, and no crowd" -- names three kinds of people
//    on an engine whose negative prompt is inert. The word "unpeopled" was
//    doing the work; the three exclusions after it were undoing it. This
//    file's own verifier asserted that prompt returns NO violations, on the
//    reasoning that "three exclusions is under the pile threshold" -- the
//    threshold that only ever counted text. That is the same way the v4
//    taxonomy clause above reached production: a fixture certified it.
//
//    So this rule is not a count. One negated people noun is the bug.

// The damage was specific: FIVE text-related nouns ("no readable text, no
// lettering, no logos, no watermark, no signature") in the POSITIVE prompt of a
// text-specialist model running at cfg 1, where the ComfyUI negative prompt is
// inert. Naming text five times to Qwen-Image lineage produces text.
//
// This rule is deliberately narrow IN WHICH NOUNS IT COUNTS. An earlier version
// counted every "no ..." clause and would have rejected the coloring-book lane,
// which uses eleven exclusions on purpose (no border, no comic, no collage...)
// — and rejected a prompt whose subject text merely read "no matter how
// undocumented". Restricting it to the text nouns below fixed that, and it is
// the noun set, not any count, that does the work.
//
// It is NOT narrow in how many it takes, not any more. It used to allow four,
// which is how a suggested prompt ending "no readable text, no logo, no
// watermark, no collage" passed the gate on 2026-09-19 — three text nouns,
// under the threshold, handed to a text specialist that cannot act on the
// word "no". Silas, reading it: "We shouldn't be telling krea what not to do,
// that should be the job of the automatic negative prompt that we add, right?"
// Right in principle and impossible in fact: krea2 renders at cfg 1
// (KREA2_DEFAULT_CFG), where the ComfyUI negative prompt is inert but wired,
// so there is no channel to move an exclusion to. The only handling that works
// is not to write one. One is too many.
const TEXT_EXCLUSION_NOUNS = new Set([
  'text',
  'lettering',
  'letters',
  'words',
  'wording',
  'logo',
  'logos',
  'watermark',
  'watermarks',
  'signature',
  'signatures',
  'caption',
  'captions',
  'typography',
  'writing',
])
// The optional adjective matters: the exact clause that shipped was "no
// READABLE text", and capturing the first word after "no" caught "readable"
// rather than "text", so the pile went uncounted.
const NEGATION_CLAUSE =
  /\b(?:no|without|free of|devoid of)[ -](?:readable |visible |legible |written |accidental )?([a-z][a-z-]*)/gi

/*
 * Rule 7. Nouns that name a human presence, which a caption-conditioned model
 * will place in the frame the moment the prompt says them -- the negation in
 * front is not conditioning it can act on.
 *
 * Deliberately only nouns that ARE people. "no border", "no text", "no colour"
 * are other rules' business or nobody's; this one exists because the frame
 * came back full of strangers.
 */
const PEOPLE_NOUNS = new Set([
  'figure', 'figures',
  'person', 'persons', 'people', 'peoples',
  'human', 'humans',
  'character', 'characters',
  'face', 'faces',
  'crowd', 'crowds',
  'bystander', 'bystanders',
  'onlooker', 'onlookers',
  'spectator', 'spectators',
  'men', 'woman', 'women',
  'child', 'children',
  'audience', 'audiences',
])

/*
 * Deliberately NOT in that set, because this rule throws a 422 and a false
 * positive blocks a render that was fine:
 *
 *   hand/hands   — "a clock with no hands" is a subject, not a casting note.
 *   body/bodies  — "no body" reads as substance as often as anatomy.
 *   cast         — a verb here as often as a noun ("cast in bronze").
 *   man          — "no man's land" is a place.
 *   portrait     — an aspect ratio in most of this codebase.
 *   silhouette   — already handled, positively, by the jargon rule.
 *
 * Between them they account for three of the 328 live prompts carrying a
 * people negation. The other 325 are covered above.
 */

/*
 * The negation, then the run of words it governs -- checked WORD BY WORD rather
 * than by capturing "the noun", because the live wordings are "no FULL figure",
 * "no CLEAR face", "no MORTAL figure", "no LITERAL person". A capture group
 * with optional leading adjectives does not work here: it matches happily on
 * the adjective, the match succeeds, and the scan moves past the noun. That is
 * the same miss NEGATION_CLAUSE above had with "no readable text".
 *
 * The run stops at any punctuation, so a negation cannot reach across a clause
 * boundary into an unrelated noun ("no rain, the faces of the cliffs" is a
 * cliff face, not a casting note).
 */
/*
 * 8. THE WORD "FRAME". Krea paints the noun, and "frame" is a noun for a
 *    physical object before it is anything else.
 *
 *    Found 2026-09-21 from an ArtJob screenshot of the facet-catalog build.
 *    Facet "Wasted but Working" asked for "A thin frame with prominent
 *    collarbones and hollow cheeks, clothes hanging loose, grip nonetheless
 *    firm" (ArtJob 30116) and came back as a framed portrait hanging on a
 *    wall. "Rebuilt" asked for "An asymmetric frame, one limb visibly
 *    different in length or make" (ArtJob 30117) and came back as a woman
 *    holding an empty gilt picture frame in front of herself. In both, the
 *    body the prompt was describing is gone and a frame is standing where it
 *    was -- and both prompts passed every rule in this file, because none of
 *    them looks at ordinary concrete words.
 *
 *    "Frame" reaches this gate in three senses, and only one of them is safe:
 *
 *      ANATOMY   -- "a thin frame", "an elongated frame", "frame settled and
 *                   shrunken". A person's build. Eleven live Facet prompts
 *                   used it this way; it is the sense that shipped the bug.
 *                   Say "build", "body" or "physique".
 *      COMPOSITION -- "filling the frame", "an unpeopled frame", "the whole
 *                   frame pushed toward a film look". The picture's own
 *                   boundary. A person reads it as framing; Krea reads a
 *                   frame. The house word for this is already "picture" --
 *                   every variant composition in the Facet producer says "A
 *                   square picture with the subject large and centred" -- so
 *                   there is a free rewrite and no reason to keep the risk.
 *      OBJECT    -- "a wicker frame", "a carved frame", "a hand on the
 *                   frame" of a door. A real frame in the scene, which is
 *                   exactly what the model should draw. Five live prompts do
 *                   this correctly and must keep working: the gilding swatch
 *                   card IS a carved frame with gold leaf going onto it.
 *
 *    And it had been seen before, which is what "again" meant. The LoRA probe
 *    scaffold tried 'subject centered in frame' on 2026-09-16/17 and it
 *    "rendered framed pictures hanging on walls" -- recorded in the header of
 *    utils/scripts/verifyLoraProbeSubject.test.ts, walked back for that one
 *    producer, and never generalized into a rule. Five days later the same
 *    noun did the same thing to the Facet catalog. A finding written down in
 *    one producer's test header is a finding every other producer is still
 *    free to repeat.
 *
 *    So this rule does not try to tell anatomy from composition -- both are
 *    wrong and both have the same fix. It flags "frame" UNLESS the sentence
 *    establishes a real frame object, which is the narrow, checkable case.
 *    Validated against all 1,738 live Facet prompts: 21 flagged, every one a
 *    genuine anatomy or composition use, and 7 allowed, every one a genuine
 *    object. No false positives.
 *
 *    This one is why the rule is not a lint. The contract's OWN remedy text
 *    for rule 7 used to advise writing "an unpeopled frame", and
 *    DEFAULT_UNPEOPLED_ART_DIRECTION in artJobNormalization.ts emitted exactly
 *    that onto every object and product prompt -- the fix for the crowds was
 *    manufacturing the frames. A rule that a producer can be talked out of by
 *    the codebase's own guidance is not a gate.
 */

/*
 * A frame that is REALLY IN THE SCENE, in the two ways a prompt says so:
 * a material or craft word touching the noun ("a carved frame", "a riveted
 * steel frame"), or the noun declared and then described ("The frame itself is
 * riveted brushed steel"). One intervening word is allowed on the adjacency
 * side ("a carved gilt frame"); more than that and the adjective is more
 * likely describing a body.
 */
const FRAME_MATERIAL =
  'wicker|carved|gilded|gilt|gold|silver|wooden|oak|pine|timber|bamboo|brass|bronze|iron|steel|aluminium|aluminum|metal|plastic|lacquered|ornate|baroque|antique|riveted|moulded|display|picture|photo'
const FRAME_OBJECT_ADJACENT = new RegExp(
  `\\b(?:${FRAME_MATERIAL}|window|door|bed|climbing|embroidery)(?:[\\s,-]+[a-z][a-z-]*)?[\\s,-]+frames?\\b`,
  'i',
)
const FRAME_OBJECT_DECLARED = new RegExp(
  `\\bframes?\\b[^.]{0,60}?\\b(?:is|are|of|made)\\b[^.]{0,40}?\\b(?:${FRAME_MATERIAL})\\b`,
  'i',
)

/*
 * The thing a frame belongs to. A prompt that really depicts a frame names one
 * of these somewhere -- "a half-open door with a hand on the frame" never
 * repeats the noun, and the gallery mount asset says "picture mount" one
 * sentence before "nothing hangs from the frame".
 *
 * Three words are deliberately NOT here, all for the same reason: in art prose
 * they are far more often a format or a finish than a thing on a wall, and each
 * one, listed, excused a real bug during this rule's own test run.
 *
 *   portrait -- an aspect ratio, exactly as the people-negation exclusions note
 *               two hundred lines up. It excused the page-backdrop framing
 *               string ("Tall 9:16 portrait for a phone ... foreground detail
 *               low in frame").
 *   canvas   -- a medium. "oil on canvas" would excuse any framing language in
 *               the same prompt.
 *   gallery  -- excusable as a wall of pictures, but the one live prompt that
 *               needs it ("a gilded gallery ... a wall of luminous paintings")
 *               is already carried by "paintings".
 *
 * "mirror" stays, because a mirror on a wall really does have a frame, but only
 * as a noun: "its bowl worn to a mirror finish" excused the ladle fixture.
 */
const FRAME_BEARER =
  /\b(?:door|doorway|doorframe|window|windows|painting|paintings|photograph|photographs|photo|photos|mirrors?(?![\s-]+(?:finish|finishes|polish|polished|sheen|smooth|bright|like|image))|mount|moulding|easel|spectacles|eyeglasses|loom|bicycle|bedstead|greenhouse|trellis)\b/i

/*
 * The bare noun, never a hyphenated compound. "Fantasy drawing on the
 * frame-tale tradition of the Arabian Nights" is the name of a literary form
 * and the genre's own description, and a hyphen is a word boundary, so a plain
 * \bframes?\b flagged it (caught by verifyFacetContentQuality, which runs this
 * contract over every Facet description). The same guard covers "frame-story",
 * "frame-rate" and "frame-by-frame".
 */
const FRAME_NOUN = /(?<!-)\bframes?\b(?!-)/i

/*
 * "Frame it as a close still life", "Frame it wide and quiet" -- the imperative
 * VERB, which is what all six MANDARIN_FRAMINGS are and what the narrator seeds
 * use constantly ("Frames the stories of ..."). This rule is about the noun: a
 * body called a frame, or a composition called a frame. There is no rendered
 * evidence against the verb, and flagging it would mean rewriting a deliberate
 * and uniform art-direction set -- one of whose lines names a real window frame.
 *
 * Only a sentence that OPENS with it, and only followed by a pronoun or
 * determiner, because that is the shape a verb takes here. A noun use never
 * starts a sentence that way; it says "A frame of ..." or "An unpeopled frame".
 */
const FRAME_VERB = /^\s*Frames?\s+(?:it|them|this|these|the|your|his|her|their|every|all)\b/i

/**
 * Whether this prompt depicts a real frame, judged over the WHOLE prompt.
 *
 * Prompt-level rather than sentence-level, because a prompt whose subject IS a
 * frame establishes it once and then refers back: the butterfly-gallery mount
 * asset opens with "a single thick industrial display frame or picture mount"
 * and closes with "nothing hangs from the frame", and a sentence-local test
 * rejects that closing line. Nothing is lost by widening the scope, because
 * anatomy and composition uses never name a frame object anywhere -- "bronze
 * filament stitching coral into scar tissue in frame" says bronze but never
 * says the frame is made of it, so it is still caught.
 */
function depictsRealFrame(prompt: string): boolean {
  return (
    FRAME_OBJECT_ADJACENT.test(prompt) ||
    FRAME_OBJECT_DECLARED.test(prompt) ||
    FRAME_BEARER.test(prompt)
  )
}

/** The sentences that put "frame" in front of Krea with no frame to draw. */
function frameNounUses(prompt: string): string[] {
  if (depictsRealFrame(prompt)) return []
  return prompt
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => FRAME_NOUN.test(sentence) && !FRAME_VERB.test(sentence))
}

const PEOPLE_NEGATION_CLAUSE =
  /\b(?:no|not|without|avoid|avoiding|never|free of|devoid of|absent of|excluding|omit|omitting)\s+((?:[a-z][a-z-]*\s+){0,2}[a-z][a-z-]*)/gi

function peopleNegations(prompt: string): string[] {
  const found: string[] = []
  for (const match of prompt.matchAll(PEOPLE_NEGATION_CLAUSE)) {
    const words = (match[1] || '').toLowerCase().split(/\s+/)
    if (words.some((word) => PEOPLE_NOUNS.has(word))) found.push(match[0].trim())
  }
  return found
}

function textExclusions(prompt: string): string[] {
  const found: string[] = []
  for (const match of prompt.matchAll(NEGATION_CLAUSE)) {
    const word = match[1]?.toLowerCase()
    if (word && TEXT_EXCLUSION_NOUNS.has(word)) found.push(match[0])
  }
  return found
}

/**
 * True when the ComfyUI negative prompt cannot act, so every exclusion the
 * author writes lands in positive conditioning instead. Distilled engines run
 * at cfg 1 by design; an explicit cfg of 1 or less says the same thing.
 */
function guidanceIsInert(engine: string, cfg: number | null | undefined): boolean {
  if (Number.isFinite(cfg)) return Number(cfg) <= 1
  return Boolean(DISTILLED_ENGINE_LIMITS[engine])
}

/** A format noun the author is EXCLUDING is not a format request. */
function negated(prompt: string, index: number): boolean {
  const before = prompt.slice(Math.max(0, index - 12), index).toLowerCase()
  return /\b(?:no|not|without|avoid|never)\s+[a-z-]*\s*$/.test(before)
}

export function checkArtPromptContract(
  input: ArtPromptContractInput,
): ArtPromptViolation[] {
  const prompt = cleanArtPrompt(input.prompt)
  const violations: ArtPromptViolation[] = []

  if (!prompt) {
    return [{ rule: 'empty-prompt', detail: 'The prompt is empty.' }]
  }

  for (const { pattern, rule } of CONDITIONAL_PATTERNS) {
    const match = prompt.match(pattern)
    if (!match) continue
    violations.push({
      rule,
      detail:
        `"${match[0]}" asks the model to evaluate a condition. Diffusion models ` +
        `cannot; they render the words. Decide before enqueueing and state one outcome.`,
    })
  }

  for (const { pattern, rule } of FORMAT_PATTERNS) {
    const match = prompt.match(pattern)
    if (!match) continue
    if (typeof match.index !== 'number') continue
    // A format noun the author is excluding ("no comic panel") is the opposite
    // of a format request. Flagging it rejected the coloring-book lane, whose
    // prompts legitimately name the formats they are avoiding.
    if (negated(prompt, match.index)) continue
    violations.push({
      rule,
      detail:
        `"${match[0]}" asks for a physical format, so the model renders the ` +
        `format — frame, title bar, and invented text included. Describe the ` +
        `subject and the aspect ratio instead.`,
    })
  }

  // Scoped to the distilled engines: those are the caption-conditioned ones
  // that paint the jargon. A ChatGPT-targeted prompt elsewhere in the repo may
  // legitimately use art-direction vocabulary, because ChatGPT reads it as
  // direction.
  if (DISTILLED_ENGINE_LIMITS[String(input.engine || '').trim().toLowerCase()]) {
    for (const { pattern, rule } of ART_DIRECTION_JARGON_PATTERNS) {
      const match = prompt.match(pattern)
      if (!match) continue
      if (typeof match.index === 'number' && negated(prompt, match.index)) continue
      violations.push({
        rule,
        detail:
          `"${match[0]}" is how you ask a person for a picture, not how you ` +
          `describe one. A caption-conditioned model renders the words: ` +
          `"concrete" becomes concrete, "iconic" becomes a monument, ` +
          `"silhouette" becomes a black cut-out. Say what is actually visible ` +
          `in the picture instead.`,
      })
    }

    /*
     * Rule 8. Same scope as the jargon rule and for the same reason: these are
     * the caption-conditioned engines that paint the word. A prompt bound for
     * a chat model may say "frame" and be understood.
     */
    for (const sentence of frameNounUses(prompt)) {
      violations.push({
        rule: 'frame-noun',
        detail:
          `"${sentence}" uses "frame" where no frame is meant. Krea paints the ` +
          `noun: a body described as "a thin frame" renders as a picture frame ` +
          `and the body disappears (ArtJobs 30116, 30117). Say "build", ` +
          `"body" or "physique" for anatomy, and "picture" for the ` +
          `composition. Write "frame" only when a real frame is in the scene, ` +
          `and name what it is made of or what it holds.`,
      })
    }
  }

  if (VAGUE_BRAND_STYLE.test(prompt)) {
    violations.push({
      rule: 'vague-brand-style',
      detail:
        '"Kind Robots visual style" carries no visual information. Write the ' +
        'medium, linework, colour, and lighting out explicitly.',
    })
  }

  const engineName = String(input.engine || '').trim().toLowerCase()
  if (engineName === 'krea2') {
    for (const pattern of CONTEXTUAL_WRAPPER_PATTERNS) {
      const match = prompt.match(pattern)
      if (!match) continue
      violations.push({
        rule: 'contextual-wrapper',
        detail:
          `"${match[0]}" is application/prompt-writing context, not image content. ` +
          'Krea is caption-conditioned: give it the visual subject, scene, medium, ' +
          'composition, lighting, and texture without entity/app instructions.',
      })
    }
  }

  /*
   * Checked wherever guidance is inert, the same scope as the text pile: those
   * are the engines that paint the word instead of subtracting it. A prompt
   * bound for ChatGPT may say "no people" and be obeyed.
   */
  if (guidanceIsInert(engineName, input.cfg)) {
    const peopleNos = peopleNegations(prompt)
    if (peopleNos.length) {
      violations.push({
        rule: 'people-negation',
        detail:
          `${peopleNos.join(', ')} names the people you do not want on an engine ` +
          `whose negative prompt is inert, so the noun lands in POSITIVE ` +
          `conditioning and the picture fills with them. Say what the picture ` +
          `IS: "an unpeopled picture", "a deserted street", "the subject alone ` +
          `on a plain ground". Not "frame" -- see the frame-noun rule; this ` +
          `remedy used to say it and Krea drew the frame.`,
      })
    }
  }

  const textNos = textExclusions(prompt)
  if (textNos.length && guidanceIsInert(engineName, input.cfg)) {
    violations.push({
      rule: 'text-exclusion-pile',
      detail:
        `${textNos.join(', ')} names text on an engine whose negative prompt is ` +
        `inert, so the word lands in POSITIVE conditioning on a model from the ` +
        `strongest open text-rendering lineage there is. State the wanted result ` +
        `instead: "every surface bare and unmarked".`,
    })
  }

  const limits = DISTILLED_ENGINE_LIMITS[engineName]
  if (limits) {
    if (Number.isFinite(input.cfg) && Number(input.cfg) > limits.cfg) {
      violations.push({
        rule: 'engine-guidance-mismatch',
        detail:
          `${engineName} is distilled for cfg ${limits.cfg}; got ${input.cfg}. Above it the ` +
          `model leaves its training distribution — burned contrast and duplicated subjects.`,
      })
    }
    if (Number.isFinite(input.steps) && Number(input.steps) > limits.maxSteps) {
      violations.push({
        rule: 'engine-step-mismatch',
        detail:
          `${engineName} runs at roughly ${limits.maxSteps} steps or fewer; got ${input.steps}.`,
      })
    }
  }

  return violations
}

/** Throw a 422 listing every violation, so a producer fixes them in one pass. */
export function assertArtPromptContract(input: ArtPromptContractInput): void {
  const violations = checkArtPromptContract(input)
  if (!violations.length) return

  throw createError({
    statusCode: 422,
    message:
      `Art prompt rejected by the prompt contract (${violations.length} violation` +
      `${violations.length === 1 ? '' : 's'}):\n` +
      violations.map((v) => `  [${v.rule}] ${v.detail}`).join('\n'),
  })
}
