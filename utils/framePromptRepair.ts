// /utils/framePromptRepair.ts
//
// One rewrite table for every shipped "frame" phrasing that means no frame at
// all, in `utils/` rather than `server/utils/` so BOTH the enqueue normalizer
// and the Krea workflow scrubber can reach it.
//
// That placement is the actual finding. The first cut of this lived in
// server/utils/artJobNormalization.ts, wired only into repairLegacyArtPrompt --
// and verifyEnqueuePromptGate caught the gap immediately: Reward 233's stored
// prompt ends "An unpeopled frame, the subject alone, the space around it bare
// and deserted.", and the string that actually reaches CLIP is built by
// buildKreaSemanticPrompt(), which never called the normalizer. So the repair
// existed and the prompt Krea saw still said "frame".
//
// This is the same lesson utils/facetVisualLanguage.ts opens with, one module
// later: art direction only one producer can import is art direction only one
// producer applies. Anything here must be reachable from every path a prompt
// takes, or the next repair misses a cohort the same way.
//
// No imports on purpose -- pure string work, safe in a client bundle.

/*
 * The "frame" migration (2026-09-21).
 *
 * Krea paints "frame" as a physical picture frame in every sense but one, so
 * server/utils/artPromptContract.ts now rejects it. That gate applies to
 * REQUEUES too, and the phrases below are already sitting in stored rows --
 * DEFAULT_UNPEOPLED_ART_DIRECTION alone put one on every object and product
 * prompt in the app. Without this table those rows fail at claim time forever,
 * which is the exact failure mode LEGACY_ASSET_ART_DIRECTION above exists to
 * prevent.
 *
 * Two groups, and the split is the whole reason this is a table and not a
 * global "frame" -> "picture" replace. Such a replace would rewrite the corn
 * dolly's wicker frame, the gilding card's carved frame and the gallery mount
 * asset -- three prompts whose subject IS a frame and which render correctly
 * today.
 *
 *   COMPOSITION: generic, producer-generated, and safe to match anywhere,
 *   because none of these phrasings can describe a frame that is really in the
 *   scene. "picture" is the house word already used by every variant
 *   composition ("A square picture with the subject large and centred").
 *
 *   ANATOMY: the eleven curated embodiment prompts that described a body as a
 *   "frame" and rendered an empty frame instead (ArtJobs 30116 "Wasted but
 *   Working" and 30117 "Rebuilt" are the two Silas caught it from). Listed
 *   exactly, not by pattern, for the reason the comment on
 *   LEGACY_ASSET_ART_DIRECTION gives: these are the strings that shipped.
 *   utils/seeds/facetEmbodimentValues.ts carries the same corrections, so a
 *   seed re-run and a requeue arrive at the same text.
 */
const LEGACY_FRAME_COMPOSITION: Array<[RegExp, string]> = [
  /*
   * "in frame" with no article is the film idiom and nothing else -- a frame
   * that is really in the scene is always "THE frame" or "A frame" ("a hand on
   * the frame", "nothing hangs from the frame"). That one pattern covers
   * "one object alone in frame", "every surface in frame", "anywhere in frame"
   * and "foreground detail low in frame" together.
   */
  [/\bin frame\b/gi, 'in the picture'],
  [/\ban unpeopled frame\b/gi, 'an unpeopled picture'],
  [/\bfilling the frame\b/gi, 'filling the picture'],
  [/\balone in the frame\b/gi, 'alone in the picture'],
  [/\bthe whole frame\b/gi, 'the whole picture'],
  [/\bthe same frame\b/gi, 'the same picture'],
  [/\bedge of the frame\b/gi, 'edge of the picture'],
  [/\bedges of the frame\b/gi, 'edges of the picture'],
]

const LEGACY_FRAME_ANATOMY: Array<[string, string]> = [
  [
    'A thin frame with prominent collarbones',
    'A thin body with prominent collarbones',
  ],
  [
    'An asymmetric frame, one limb visibly different',
    'An asymmetric body, one limb visibly different',
  ],
  [
    'A wide, softly rounded frame, full upper arms',
    'A wide, softly rounded body, full upper arms',
  ],
  [
    'A short, deep-bodied frame planted wide',
    'A short, deep-bodied build planted wide',
  ],
  [
    'An elongated frame with prominent elbows',
    'An elongated body with prominent elbows',
  ],
  [
    'An unremarkable sturdy frame, visible forearm tendon',
    'An unremarkable sturdy body, visible forearm tendon',
  ],
  [
    'A rounded, unmuscled frame, sloped shoulders',
    'A rounded, unmuscled body, sloped shoulders',
  ],
  [
    'An adolescent face on an outsized frame',
    'An adolescent face on an outsized body',
  ],
  ['frame settled and shrunken', 'body settled and shrunken'],
  [
    'shoulders and frame giving nothing away',
    'shoulders and body giving nothing away',
  ],
]

/**
 * Rewrite every shipped "frame" phrasing that means no frame at all.
 *
 * The composition patterns match case-insensitively but their replacements are
 * written lowercase, so the first letter is carried over from whatever was
 * matched. Without that, "An unpeopled frame." at the start of a sentence came
 * back as "an unpeopled picture." mid-paragraph -- and since this text is
 * persisted back to Facet.artPrompt, the repair would have left a visible
 * defect in the row it just fixed.
 */
export function repairFramePrompt(value: string): string {
  let out = value
  for (const [from, to] of LEGACY_FRAME_ANATOMY) out = out.split(from).join(to)
  for (const [pattern, replacement] of LEGACY_FRAME_COMPOSITION) {
    out = out.replace(pattern, (match) =>
      /^[A-Z]/.test(match)
        ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
        : replacement,
    )
  }
  return out
}
