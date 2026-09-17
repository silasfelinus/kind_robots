export type LoraProbeFamily =
  'pony' | 'illustrious' | 'sdxl' | 'sd15' | 'flux' | 'zimage' | 'unsupported'

export type LoraProbeEngine = 'comfy' | 'flux' | 'zimage'

export type LoraProbeRecipe = {
  engine: LoraProbeEngine
  /*
   * Where the base model comes from.
   *
   * 'catalog-checkpoint' picks a registered CHECKPOINT Resource and sends it as
   * `checkpoint`. 'engine-default' means the lane does not accept one: the flux
   * builder resolves a fixed UNet through fluxModelByVariant (flux1-dev-Q8_0)
   * and never reads `checkpoint`, so naming a Flux checkpoint there would
   * record a base on the ArtImage that had no part in the render.
   */
  basePolicy: 'catalog-checkpoint' | 'engine-default'
  width: number
  height: number
  loraStrength: number
  positive: (trigger: string) => string
  negative: string
}

/*
 * A1111 invocation syntax. ComfyUI has no parser for it, so `<lora:foo:1>`
 * left in a prompt is rendered as literal text rather than loading anything.
 */
const LORA_INVOCATION_PATTERN = /<(?:lora|lyco|lycoris|hypernet):[^>]*>/gi

/*
 * Platform and packaging words that describe the FILE rather than the image.
 * Many catalog rows have no real trigger at all and carry their own title in
 * defaultTrigger -- 'Aka6 [PonyXL] Style Lora', 'Almualim | Style LoRA | SDXL
 * Pony' -- so probing them unsanitized asks the model to depict the words
 * "Style Lora" instead of the style. Stripped, not rejected: whatever is left
 * ('Aka6', 'Almualim') is usually the real trigger token.
 */
const PACKAGING_NOISE_PATTERN =
  /\b(?:lora|loras|locon|lycon|lycoris|lyco|hypernetwork|checkpoint|safetensors|comfyui|comfy|a1111|webui|forge|model|version|\d+[- ]?step|for\s+comfyui)\b/gi

/*
 * Base-model names. A trigger reading 'Grey Impact - Illustrious/PonyXL' is
 * naming its own compatibility, not asking for anything to be drawn.
 */
/*
 * Bounded on [\w-] rather than \b, because \b matches at a hyphen and these
 * names appear INSIDE filename-shaped triggers. `sadakage-v1-sdxl-10ep` came
 * out as `sadakage-v1- -10ep`, a token no LoRA responds to, and the same
 * happened to `vintage-ads-sdxl-1350` and `blowjob-sdxl-3-000008`. A bracketed
 * or space-separated `[PonyXL]` still matches, which is the case this exists
 * for.
 */
const BASE_NAME_NOISE_PATTERN =
  /(?<![\w-])(?:pony\s*xl|pony\s*diffusion(?:\s*xl)?|pdxl|sdxl|sd\s*1\.5|sd15|illustrious|ilxl|noobai|flux[0-9.]*(?:\s*d(?:ev)?)?|schnell|kontext|klein|wan|ltx|qwen)(?![\w-])/gi

/*
 * Left behind once the words above are gone: '[PonyXL]' becomes '[ ]', and
 * 'Style Lora' becomes a stranded 'Style'. Neither names a subject, and an
 * empty bracket pair is itself weighting syntax.
 */
// Also matches a group left holding only punctuation: 'Margot Robbie (FLUX+SDXL)'
// strips to 'Margot Robbie ( + )', which is still weighting syntax wrapped
// around nothing.
/*
 * A bracket group whose entire contents is a platform name -- `Style [Pony]`,
 * `[Pony XL]`, `(SDXL)` -- names the file's compatibility, not anything to
 * draw. Handled here rather than by widening BASE_NAME_NOISE_PATTERN, because
 * bare `pony` outside brackets is a legitimate subject (My Little Pony LoRAs)
 * and must survive.
 */
const BASE_NAME_GROUP_PATTERN =
  /[[(]\s*(?:pony(?:\s*xl)?|sdxl|sd\s*1\.?5|illustrious|noobai|flux[\d.]*|xl|locon|lycoris|lora)\s*[\])]/gi

const EMPTY_GROUP_PATTERN = /[[(][\s+,\-/|&]*[\])]/g
/*
 * Includes the bare base-model words, but ONLY as a standalone tag. `Almualim |
 * Style LoRA | SDXL Pony` sanitized to `Almualim, Pony` and that lone `Pony`
 * renders a horse. Matching at comma boundaries keeps it surgical: a My Little
 * Pony LoRA triggering on `my little pony` or `pony girl` is untouched, because
 * there the word is part of a phrase rather than the whole tag.
 */
const DANGLING_DESCRIPTOR_PATTERN =
  /(^|,)\s*(?:style|styles|concept|concepts|character|pack|mix|merge|pony|sdxl|xl|sd15|flux|illustrious|v\d+(?:\.\d+)?)\s*(?=,|$)/gi

// A probe prompt is a caption, not a scene description. A 400-character tag
// soup drowns the framing that makes the grid comparable.
const MAX_TRIGGER_CHARS = 240

/**
 * Turn stored trigger text into something safe to render.
 *
 * `defaultTrigger` is not reliably a prompt. It is a byte-identical copy of
 * `artPrompt` on every row, and across the catalog it holds three different
 * things: real tag lists, A1111 invocation syntax, and -- most often for rows
 * with no trigger at all -- the LoRA's own marketing title. Only the first is
 * a prompt, so the other two are stripped down toward whatever real token they
 * contain, and an empty result is fine: the probe still shows what the LoRA
 * does to a neutral prompt, which is the correct read for a style LoRA that
 * has no trigger word.
 */
/**
 * Remove brackets that have no partner, keeping the ones that do.
 *
 * A stray `(` or `[` is not cosmetic: both are attention-weighting syntax, so an
 * unmatched opener silently re-weights the whole remainder of the prompt.
 */
function dropUnmatchedBrackets(value: string): string {
  const drop = new Set<number>()
  const stack: Array<{ ch: string; i: number }> = []
  const pair: Record<string, string> = { ')': '(', ']': '[' }
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i]
    if (ch === '(' || ch === '[') stack.push({ ch, i })
    else if (ch === ')' || ch === ']') {
      const top = stack[stack.length - 1]
      if (top && top.ch === pair[ch]) stack.pop()
      else drop.add(i)
    }
  }
  for (const left of stack) drop.add(left.i)
  if (!drop.size) return value
  return [...value]
    .filter((_, i) => !drop.has(i))
    .join('')
    .replace(/\s*,\s*(?:,\s*)+/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .trim()
}

export function sanitizeProbeTrigger(value: string): string {
  const cleaned0 = value
    /*
     * Un-escape FIRST. Catalog triggers are often stored already escaped in the
     * A1111 style -- `medusa \(dota 2\)`, `ranni the witch \(elden ring\)`, the
     * canonical danbooru disambiguator -- and the separator rule below treats a
     * backslash as punctuation, because it is there for `Style LoRA | SDXL /
     * Pony`. That turned every `\(` into `, (`, escapeSdPromptWeighting then
     * re-escaped the bare parens, and `mix_\(spring\)` came out as three
     * meaningless tags: `mix_`, `\(spring`, `\)`. 18 queued probes carried a
     * shredded trigger this way (2026-09-16). Stripping the escapes up front
     * leaves one clean pass: unescape, sanitize, escape exactly once.
     */
    .replace(/\\([()[\]])/g, '$1')
    .replace(LORA_INVOCATION_PATTERN, ' ')
    .replace(PACKAGING_NOISE_PATTERN, ' ')
    .replace(BASE_NAME_NOISE_PATTERN, ' ')
    .replace(BASE_NAME_GROUP_PATTERN, ' ')
    .replace(EMPTY_GROUP_PATTERN, ' ')
    // Separators left stranded by the removals above: '| Style LoRA |' becomes
    // '|  |', and a run of punctuation renders as punctuation.
    // Backslash is NOT in this class: it is the SD escape character, not a
    // separator. See the un-escape note above.
    .replace(/[|/]+/g, ', ')
    .replace(/\s*,\s*(?:,\s*)+/g, ', ')
    .replace(DANGLING_DESCRIPTOR_PATTERN, '$1')
    .replace(/\s*,\s*(?:,\s*)+/g, ', ')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[\s,\-–—:;.]+|[\s,\-–—:;.]+$/g, '')
    // 'Invincible Comic for PonyXL' loses its object and ends on 'for'.
    .replace(/\s+(?:for|with|by|from|of|in|on)\s*$/i, '')
    .replace(/^[\s,\-–—:;.]+|[\s,\-–—:;.]+$/g, '')
    .trim()
    /*
     * Drop tags left holding no word characters at all. Stripping a base-model
     * name out of `Style \[Pony XL\]` leaves a lone `\]`; other rows ended on a
     * bare `+` or `:>=`. None of them name anything, and an unmatched bracket is
     * itself weighting syntax.
     */
    .split(',')
    .filter((tag) => /[0-9A-Za-z\u00c0-\uffff]/.test(tag))
    .join(',')
    .replace(/\s*,\s*/g, ', ')
    .trim()

  // Dropping those tags can strand a bracket's other half -- `Style [Pony, ]`
  // loses the ` ]` and leaves `Style [Pony`, and a lone opener re-weights
  // everything after it. Balance last, once nothing else will move.
  const balanced = dropUnmatchedBrackets(cleaned0)

  if (balanced.length <= MAX_TRIGGER_CHARS) return balanced

  // Cut on a tag boundary so the prompt never ends mid-token.
  const clipped = balanced.slice(0, MAX_TRIGGER_CHARS)
  const lastComma = clipped.lastIndexOf(',')
  // Re-balance AFTER clipping: the cut can land between an opener and its
  // closer, putting back the very imbalance the pass above removed.
  return dropUnmatchedBrackets(
    (lastComma > 40 ? clipped.slice(0, lastComma) : clipped).trim(),
  )
}

/*
 * Parentheses and square brackets are attention-weighting syntax in the SD
 * prompt parsers, not literal characters. Catalog triggers carry them often --
 * '(Imminent) Reversed Gangbang (Concept)' is a real defaultTrigger -- and left
 * raw they silently re-weight the probe, so a LoRA would be judged on a prompt
 * nobody wrote. Flux reads prose through T5 and needs no escaping.
 */
export function escapeSdPromptWeighting(value: string): string {
  return value.replace(/([()[\]])/g, '\\$1')
}

/*
 * Hosts whose previews are gone. img.genur.art has no DNS record at all, so
 * every Resource still pointing at it renders the shared fallback and is being
 * triaged blind. Treated as "no preview" rather than as art.
 */
export const DEAD_PREVIEW_HOSTS = ['genur.art']

/*
 * One fixed probe per family, with the trigger injected. Identical scaffolding
 * across a family is the point: when every Pony LoRA renders the same subject
 * and the same framing, whatever differs in the output is the LoRA itself --
 * which is what makes "lackluster" and "wrongly matched" legible when the grid
 * is scanned. A per-LoRA prompt would hide exactly that signal.
 *
 * The scaffold names SUBJECT and FRAMING only, never medium. An earlier version
 * ended 'plain neutral background, soft even lighting, sharp focus', which is a
 * product-photography recipe: on cyberrealisticPony it rendered an Adventure
 * Time STYLE LoRA as a studio photograph of a vinyl toy (ArtImage 24472,
 * 2026-09-15). The LoRA was working and correctly matched; the prompt was
 * asking for a photo. Anything that implies a medium -- lighting, focus, lens,
 * render, 'photo', 'illustration' -- fights the very thing being probed and
 * does not belong in this scaffold.
 *
 * Steps, cfg, sampler and scheduler are deliberately absent. The comfy lane
 * resolves them through sdxlSamplerProfile(), which detects distilled/turbo
 * checkpoints and tunes accordingly; hardcoding 28 steps here would mis-render
 * every Lightning and Turbo base in the catalog.
 */
const NEGATIVE_SD = [
  'worst quality',
  'low quality',
  'blurry',
  'jpeg artifacts',
  'watermark',
  'signature',
  'text',
  'cropped',
  /*
   * 'cropped' alone did not hold. Both figures in the 2026-09-16 Pony strip
   * came back cut off at the mouth -- the model scales a standing figure to
   * fill a 1:1 frame and the head is what leaves it. Naming the specific
   * failure works where the general word did not, and it does this without
   * asserting a shot size in the positive prompt, which is what broke the
   * full-body LoRAs the last time framing was tightened.
   */
  'head out of frame',
  'cropped head',
  /*
   * Ages the subject explicitly, on every probe, alongside the adult qualifier
   * in PROBE_DEFAULT_SUBJECT. Belt and braces deliberately: the positive
   * qualifier steers and this forecloses, because ~450 probes pair an injected
   * subject with a LoRA from an NSFW directory and a bare `1girl` was returning
   * pre-teen subjects. Not optional, and not per-probe.
   *
   * Kept deliberately narrow. `teenager` was here and was removed (Silas,
   * 2026-09-17): the catalog holds LoRAs of characters who are canonically
   * eighteen or nineteen and legitimately depicted as adults, and the word
   * covers them as much as it covers a minor. The terms that remain name
   * children only, so none of them is ambiguous in that way.
   */
  'child',
  'children',
  'loli',
  'shota',
  'toddler',
  'infant',
  'young girl',
  'extra limbs',
  'deformed hands',
].join(', ')

/*
 * Framing for the probe, and deliberately NOT "single subject, upper body".
 *
 * That phrasing broke any LoRA whose concept needs more than one body or more
 * than a head-and-shoulders crop. ArtJob 25398 is the worked example
 * (kind-robots/t-105, 2026-09-16): the "Very Small Women" Pony LoRA's own
 * trigger words are "large male, t1nyg1rlz, very small female" -- a size
 * DIFFERENCE concept that cannot show at all without two figures in frame --
 * and "single subject" sat six tokens away contradicting them. The render
 * dropped the woman and returned one man, which reads in the triage grid as a
 * broken LoRA when it was a broken probe.
 *
 * "upper body" fails the same LoRAs a second way: even with both figures
 * present, a head-and-shoulders crop cannot show relative scale. It also
 * clipped outfit, pose, and full-body LoRAs.
 *
 * Neutral framing lets the LoRA and its own triggers decide how many subjects
 * the concept needs and how tight the crop should be, which is the whole point
 * of a preview grid. Most Pony/Illustrious character LoRAs already carry `solo`
 * or `1girl` in their triggers, so they stay single-subject on their own.
 *
 * It still says "subject", though, and that word is load-bearing in the other
 * direction. A pure STYLE LoRA -- aidmaHyperrealism, "Western Cartoon The
 * Legend of Vox Machina style" -- contributes no subject of its own, so a
 * framing with no noun at all leaves it nothing to render and the preview
 * becomes arbitrary. That is the same failure as the Z-Image mannequin: a
 * prompt with no subject gets an image of nothing in particular. "subject
 * centered in frame" gives a style LoRA something to style without asserting
 * how many subjects there are or how close the camera is.
 */
/*
 * "in frame" IS A LITERAL INSTRUCTION TO THE MODEL, not a photography term.
 *
 * This scaffold read 'subject centered in frame, simple uncluttered
 * background', and a Batgirl probe came back as a framed picture hanging on a
 * textured wall (ArtJob 26318, 2026-09-16). It did exactly as asked: 'frame'
 * supplied the picture frame and 'simple uncluttered background' supplied the
 * wall to hang it on. Introduced by #2776 earlier the same day -- the phrasing
 * it replaced, 'single subject, upper body, centered', contained no such word.
 *
 * The word 'subject' goes with it, and that is the point rather than a
 * side-effect. It existed only so a pure style LoRA contributing no subject of
 * its own had SOMETHING to render; PROBE_DEFAULT_SUBJECT now gives those rows a
 * real one, so the placeholder noun that was inviting this reading is no longer
 * load-bearing. What is left says only where to put the thing and what to put
 * behind it.
 */
const PROBE_FRAMING_TAGS = 'centered, simple uncluttered background'
const PROBE_FRAMING_PROSE = 'Centered against a simple uncluttered background.'

/*
 * THE SCAFFOLD NAMES A SUBJECT WHEN THE LORA DOES NOT.
 *
 * Measured across all 2,658 probe jobs on 2026-09-16: 81.2% carried no subject
 * noun at all, and for 49.4% the entire prompt body was a single tag. The
 * median prompt was two tags. `anna`, `Apple - Style`, `pumpkinspicelatte
 * Style` -- that is the whole instruction, and eleven rows were empty.
 *
 * A prompt with no subject does not render nothing; it renders something
 * arbitrary, differently every time, which is worse. It is the same failure as
 * the Z-Image mannequin, and at this scale it means the style half of the
 * triage grid was never comparable LoRA-to-LoRA: each style LoRA invented its
 * own subject, so the one variable the grid exists to isolate was never
 * isolated.
 *
 * Injected CONDITIONALLY, which is the whole design. PROBE_FRAMING_TAGS above
 * documents why an unconditional subject is wrong: 'single subject' contradicted
 * the "Very Small Women" LoRA's own 'large male, very small female' triggers and
 * the render dropped a figure. So a LoRA that names any subject of its own keeps
 * it untouched and this adds nothing. Only the 81% that name none get a subject,
 * and they are exactly the rows that currently render pot luck.
 *
 * `1girl` rather than a neutral phrase, chosen by Silas 2026-09-16: it is the
 * highest-frequency tag in the Danbooru-derived training sets these families
 * come from, so it is the most reliable subject token available, and the probe
 * grid is his own LoRA library rather than user-facing output. Change this one
 * constant to change the default for every SD-lineage probe.
 *
 * THE ADULT QUALIFIER IS NOT COSMETIC AND MUST NOT BE REMOVED.
 *
 * `1girl` is a Danbooru tag spanning every age, and on these bases it biases
 * strongly young: nine consecutive probes across nine unrelated LoRAs (paste
 * fairy tale, shroom, leaf, Dixit, diterlizzi, desert, Deadpool, Dave McKean,
 * cyberpunk) returned six pre-teen subjects on the bare tag, 2026-09-17. The
 * only thing those renders shared was this constant.
 *
 * This default is applied to EVERY probe that names no subject of its own, and
 * 449 of those were queued against LoRAs under an NSFW/ directory. A subject
 * token that skews child-like, paired with an NSFW LoRA, generates child
 * sexual abuse material. That is the failure mode this qualifier and the
 * matching negative terms exist to prevent, and it is why neither is
 * adjustable per-probe.
 */
const PROBE_DEFAULT_SUBJECT = '1girl, adult, mature female'

/*
 * Flux and Z-Image read prose through T5, where `1girl` is a Danbooru token
 * with no meaning. Same decision, spelled for a different text encoder.
 */
const PROBE_DEFAULT_SUBJECT_PROSE = 'an adult woman'

/*
 * Does the trigger text already name something to draw?
 *
 * Framing words are deliberately absent: 'upper body', 'portrait' and 'face'
 * say how to frame a subject, not what the subject is, and counting them as
 * subjects is what would let `portrait` alone through as a complete prompt.
 *
 * So are two words that look like subjects and are not, each caught by this
 * running against the live queue after the first pass:
 *
 *   'pony'      -- almost always the BASE MODEL. 'Bartolomeobari Style - Pony
 *                  XL', 'Custom Pony Styles Collection' and 'Sky ( Artist
 *                  Style ) Pony' all counted as having a subject and so were
 *                  left without one. A genuine My Little Pony LoRA triggers on
 *                  'my little pony, pony girl' and is still caught, by 'girl'.
 *   'character' -- 'character sheet' and 'character design' are formats. A
 *                  LoRA whose only noun is 'character' is better served by
 *                  getting a subject than by being counted as having one.
 */
const SUBJECT_NOUN_PATTERN =
  /(?:^|[\s,([])(?:\d*(?:girl|boy)s?|girls?|boys?|wo?m[ae]n|male|female|person|people|couple|child|children|lady|guy|robot|mecha|animal|cat|dog|horse|dragon|creature|monster|knight|warrior|witch|wizard|elf|orc|mermaid|angel|demon|vampire|ghost)(?:$|[\s,)\]])/i

export function triggerNamesSubject(trigger: string): boolean {
  return SUBJECT_NOUN_PATTERN.test(String(trigger || ''))
}

/*
 * A trigger list, not a scene. 10.2% of probes dumped 12+ raw tags in -- the
 * Marge Simpson row sends 'the simpsons, source cartoon, round eyes, dot
 * pupils, marge simpson' and one row sends twenty `mix_(x)` concepts from a
 * multi-concept LoRA. Past roughly eight tags they compete rather than compose,
 * and the scaffold that makes the grid comparable is what gets drowned.
 *
 * Kept from the FRONT: catalog trigger fields lead with the activation token
 * (`msp3yt0n`, `mlgswtch`) and trail off into descriptive filler, so the front
 * is the part that actually invokes the LoRA.
 */
const MAX_TRIGGER_TAGS = 8

export function capProbeTriggerTags(trigger: string): string {
  const tags = String(trigger || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
  return tags.slice(0, MAX_TRIGGER_TAGS).join(', ')
}

/**
 * The trigger text as it should appear in a probe: capped, and given a subject
 * if it names none.
 */
/*
 * An age term already present in the trigger. `1girl` is not one: it spans
 * every age on these bases.
 */
const AGE_STATED_PATTERN =
  /\b(?:adult|mature|milf|wo?m[ae]n|older|elderly|aged|\d{2}\s*years?\s*old)\b/i

/*
 * Age the subject even when the LoRA supplied it.
 *
 * triggerNamesSubject deliberately leaves a LoRA's own subject untouched, which
 * is right for composition and wrong for this: 47 pending probes carried a
 * `1girl` that came from the LoRA's OWN trigger rather than from injection, 36
 * of them against a LoRA under NSFW/. Those never passed through the injected
 * path and so never picked up the adult qualifier.
 *
 * Only the age is added, never a gender -- a `1boy` trigger must not acquire
 * `mature female` -- and nothing is added when the trigger already states an
 * age.
 */
const AGE_ONLY_QUALIFIER = 'adult'

export function probeSubjectClause(trigger: string, prose = false): string {
  const capped = capProbeTriggerTags(trigger)
  const subject = prose ? PROBE_DEFAULT_SUBJECT_PROSE : PROBE_DEFAULT_SUBJECT
  if (!capped) return subject
  if (!triggerNamesSubject(capped)) return `${capped}, ${subject}`
  if (AGE_STATED_PATTERN.test(capped)) return capped
  return `${capped}, ${prose ? 'an adult' : AGE_ONLY_QUALIFIER}`
}

export const LORA_PROBE_RECIPES: Record<
  Exclude<LoraProbeFamily, 'unsupported'>,
  LoraProbeRecipe
> = {
  pony: {
    engine: 'comfy',
    basePolicy: 'catalog-checkpoint',
    width: 1024,
    height: 1024,
    loraStrength: 0.8,
    positive: (trigger) =>
      [
        'score_9, score_8_up, score_7_up',
        escapeSdPromptWeighting(probeSubjectClause(trigger)),
        PROBE_FRAMING_TAGS,
      ]
        .filter(Boolean)
        .join(', '),
    negative: `score_6, score_5, score_4, ${NEGATIVE_SD}`,
  },
  illustrious: {
    engine: 'comfy',
    basePolicy: 'catalog-checkpoint',
    width: 1024,
    height: 1024,
    loraStrength: 0.8,
    positive: (trigger) =>
      [
        'masterpiece, best quality, very aesthetic, absurdres',
        escapeSdPromptWeighting(probeSubjectClause(trigger)),
        PROBE_FRAMING_TAGS,
      ]
        .filter(Boolean)
        .join(', '),
    negative: NEGATIVE_SD,
  },
  sdxl: {
    engine: 'comfy',
    basePolicy: 'catalog-checkpoint',
    width: 1024,
    height: 1024,
    loraStrength: 0.8,
    positive: (trigger) =>
      [
        escapeSdPromptWeighting(probeSubjectClause(trigger)),
        PROBE_FRAMING_TAGS,
      ]
        .filter(Boolean)
        .join(', '),
    negative: NEGATIVE_SD,
  },
  /*
   * 768x768 rather than 1024: SD 1.5 was trained at 512 and degrades into
   * duplicated subjects and stretched anatomy well before 1024, which would
   * read as a bad LoRA in the triage grid when it is really a bad resolution.
   */
  sd15: {
    engine: 'comfy',
    basePolicy: 'catalog-checkpoint',
    width: 768,
    height: 768,
    loraStrength: 0.8,
    positive: (trigger) =>
      [
        'best quality',
        escapeSdPromptWeighting(probeSubjectClause(trigger)),
        PROBE_FRAMING_TAGS,
      ]
        .filter(Boolean)
        .join(', '),
    negative: NEGATIVE_SD,
  },
  /*
   * Flux reads natural language and takes no negative prompt -- a comma-tag
   * string scaffolded for SD would waste most of its conditioning.
   */
  /*
   * Z-Image Turbo. Like flux this lane loads a fixed set of weights
   * (z_image_turbo_bf16 + qwen_3_4b + ae.safetensors) rather than a catalog
   * checkpoint, and it takes no negative prompt -- the graph derives one by
   * zeroing the positive conditioning. See
   * server/api/comfy/zimage/utils/workflow.ts.
   */
  zimage: {
    engine: 'zimage',
    basePolicy: 'engine-default',
    width: 1024,
    height: 1024,
    loraStrength: 0.8,
    positive: (trigger) =>
      `${probeSubjectClause(trigger, true)}. ${PROBE_FRAMING_PROSE}`,
    negative: '',
  },
  flux: {
    engine: 'flux',
    basePolicy: 'engine-default',
    width: 1024,
    height: 1024,
    loraStrength: 0.8,
    positive: (trigger) =>
      `${probeSubjectClause(trigger, true)}. ${PROBE_FRAMING_PROSE}`,
    negative: '',
  },
}

function normalize(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

/**
 * The base family a LoRA must be rendered against.
 *
 * `generation` is the primary signal because it carries the Civitai baseModel
 * string ('Pony', 'SDXL 1.0', 'Flux.1 D') for rows resolved by scan_loras.py.
 * `supportedServer` is only a fallback: it buckets Pony, Illustrious and
 * SDXL-base together as SDXL, and a Pony LoRA applied to an SDXL-base
 * checkpoint renders mush rather than failing, so it can never be the primary
 * key for this decision.
 */
export function classifyLoraFamily(
  generation: unknown,
  supportedServer?: unknown,
): LoraProbeFamily {
  const value = normalize(generation)

  if (value) {
    if (value.includes('pony')) return 'pony'
    if (value.includes('illustrious') || value.includes('noob'))
      return 'illustrious'
    // Kontext is an edit model: it needs a source image, not a text probe.
    if (value.includes('kontext')) return 'unsupported'
    /*
     * Flux.2 and Flux.2 Klein are a different architecture from Flux.1, and the
     * flux lane renders on a fixed Flux.1 dev UNet. This is not a cosmetic
     * mismatch: on 2026-09-15 ArtJob 22837 applied
     * Flux/SFW/Flux_2-Turbo-LoRA_comfyui.safetensors through that lane and hung
     * ComfyUI for 90+ minutes, blowing through two 1800s soft timeouts and
     * wedging the relay's only slot until it was restarted by hand. The whole
     * render queue stopped behind it.
     *
     * conductor/t-147 closed the mirror-image case as mitigated by
     * kind_robots#2435, which blocks Flux.1 LoRAs from the Flux.2 lane. That
     * guard is directional and does not cover this way round.
     */
    if (
      value.includes('flux.2') ||
      value.includes('flux2') ||
      value.includes('klein')
    )
      return 'unsupported'
    if (value.includes('flux')) return 'flux'
    if (value.includes('zimage') || value.includes('z-image')) return 'zimage'
    if (value.includes('sdxl')) return 'sdxl'
    if (value.includes('sd 1.5') || value === '1.5' || value.includes('sd1.5'))
      return 'sd15'
    // SD 2.1, Wan, LTX, Qwen, Z-Image, Anima, Krea and friends: either no base
    // on hand or a video/audio lane that a still probe cannot serve.
    if (value !== 'other' && value !== 'none' && value !== 'unknown')
      return 'unsupported'
  }

  switch (normalize(supportedServer)) {
    case 'sdxl':
      return 'sdxl'
    case 'sd15':
      return 'sd15'
    case 'flux':
      return 'flux'
    default:
      return 'unsupported'
  }
}

/*
 * Checkpoint family comes from the localPath DIRECTORY, not from `generation`.
 * The catalog files checkpoints on disk the way ComfyUI loads them
 * (Pony/, SDXL/, Illustrious/, SD15/, Flux/), and that filing is reliable
 * where `generation` is not: cyberrealisticPony_v61 carries generation
 * 'ARCHIVE', cartoonArcadiaSDXLSD1_v2 carries 'base', and
 * duchaitenStylelikeme (filed under SD15/) carries 'SDXL'. Directory first,
 * generation only as a fallback for a row filed somewhere unhelpful.
 */
const CHECKPOINT_DIR_FAMILY: Record<string, LoraProbeFamily> = {
  pony: 'pony',
  illustrious: 'illustrious',
  sdxl: 'sdxl',
  sd15: 'sd15',
  flux: 'flux',
}

/*
 * Not text-to-image checkpoints, whatever they are filed as. v3_sd15_mm is an
 * AnimateDiff motion module that happens to sit in SD15/; loading it through
 * CheckpointLoaderSimple fails at render time rather than at plan time.
 */
const CHECKPOINT_EXCLUDE_PATTERN = /(_mm|motion_module|animatediff)\./i

/*
 * Preferred probe base per family, most preferred first, matched as a
 * case-insensitive substring of localPath.
 *
 * Without this the tie-break among same-family, same-maturity candidates was
 * alphabetical, which is arbitrary and turned out to be consequential:
 * 'cyberrealisticPony_v61' won 61 of the first batch's 205 renders purely
 * because 'c' sorts before 'p' and 'r', and it is a PHOTOREALISTIC merge, so
 * every style LoRA routed through it was fighting its base.
 *
 * The ordering favours bases that let a LoRA's own look through over bases
 * with a strong look of their own. That is an aesthetic judgement made from
 * model names and it is meant to be edited -- it is the one knob that most
 * changes what the triage grid looks like. Anything not listed falls back to
 * the deterministic alphabetical order below.
 */
const PROBE_BASE_PREFERENCE: Record<
  Exclude<LoraProbeFamily, 'unsupported' | 'flux' | 'zimage'>,
  string[]
> = {
  /*
   * ponyFaetality is DELIBERATELY ABSENT. It was first here, and it wedged the
   * relay: ArtJob 22838 was claimed three times, hung on the model load every
   * time, and ended FAILED at attempts 3 with errorMessage null -- a hang, not
   * a rejection, the same signature as the Flux.2 Klein checkpoint in
   * conductor/t-165. Do not re-add it without evidence it loads.
   *
   * realcartoonPony leads on aesthetics (it lets a style LoRA through where the
   * photorealistic cyberrealisticPony fights it). cyberrealisticPony is the
   * fallback because it is the one Pony base observed to load successfully
   * here (ArtJob 22835, slowly at 12m30s, but it finished).
   */
  pony: ['realcartoonPony', 'cyberrealisticPony'],
  illustrious: ['illustrij', 'ntrMIXIllustriousXL', 'furrytoonmix'],
  sdxl: ['dreamshaperXL', 'duskMixXLIllustration', 'sdxlUnstableDiffusers'],
  sd15: ['duchaitenStylelikeme', 'revAnimated'],
}

export type ProbeCheckpointCandidate = {
  id: number
  name: string
  localPath: string | null
  generation: string | null
  isMature: boolean
}

export function classifyCheckpointFamily(
  candidate: Pick<ProbeCheckpointCandidate, 'localPath' | 'generation'>,
): LoraProbeFamily {
  const localPath = String(candidate.localPath || '')
  if (CHECKPOINT_EXCLUDE_PATTERN.test(localPath)) return 'unsupported'

  const dir = normalize(localPath.split('/')[0])
  const byDir = CHECKPOINT_DIR_FAMILY[dir]
  if (byDir) return byDir

  return classifyLoraFamily(candidate.generation)
}

/**
 * The base to render a LoRA against.
 *
 * Maturity is a preference, not a filter. A mature LoRA prefers a base that can
 * actually render it, and an SFW LoRA prefers an SFW base -- but a family match
 * always outranks a maturity match, because the wrong base produces a broken
 * image while a mature-capable base given a neutral prompt simply produces a
 * neutral image.
 */
/*
 * Families whose preferred base is used regardless of the LoRA's maturity.
 *
 * Normally a mature LoRA prefers a mature-flagged base, which for Pony meant
 * falling back to the photorealistic cyberrealisticPony and reintroducing the
 * studio-photo framing the probe exists to avoid. Silas, 2026-09-15, having
 * reviewed the first 133 renders: "I actually think realcartoonpony is a great
 * default. It's highly consistent in my tests and one of my favorites." The
 * base being SFW-flagged does not suppress a mature LoRA -- the flag describes
 * the checkpoint's own training, not a filter on what it will render.
 */
const PREFERENCE_OVERRIDES_MATURITY: ReadonlySet<LoraProbeFamily> = new Set([
  'pony',
])

export function selectProbeCheckpoint(
  family: LoraProbeFamily,
  isMature: boolean,
  candidates: ProbeCheckpointCandidate[],
): ProbeCheckpointCandidate | null {
  if (family === 'unsupported') return null
  // The lane supplies its own base; there is nothing in the catalog to pick.
  if (LORA_PROBE_RECIPES[family].basePolicy === 'engine-default') return null

  const inFamily = candidates.filter(
    (candidate) => classifyCheckpointFamily(candidate) === family,
  )
  if (!inFamily.length) return null

  const preferred = inFamily.filter(
    (candidate) => Boolean(candidate.isMature) === isMature,
  )
  const pool = PREFERENCE_OVERRIDES_MATURITY.has(family)
    ? inFamily
    : preferred.length
      ? preferred
      : inFamily

  const ranked = [...pool].sort((a, b) =>
    String(a.localPath || a.name).localeCompare(String(b.localPath || b.name)),
  )

  const order =
    family === 'flux' || family === 'zimage'
      ? []
      : (PROBE_BASE_PREFERENCE[family] ?? [])
  for (const wanted of order) {
    const hit = ranked.find((candidate) =>
      String(candidate.localPath || candidate.name)
        .toLowerCase()
        .includes(wanted.toLowerCase()),
    )
    if (hit) return hit
  }

  return ranked[0] as ProbeCheckpointCandidate
}

export function probeTriggerText(resource: {
  defaultTrigger?: string | null
  triggerWords?: string | null
}): string {
  const trigger = sanitizeProbeTrigger(String(resource.defaultTrigger || ''))
  if (trigger) return trigger
  return sanitizeProbeTrigger(String(resource.triggerWords || ''))
}

export function buildLoraProbePrompt(
  family: LoraProbeFamily,
  trigger: string,
): { prompt: string; negativePrompt: string } | null {
  if (family === 'unsupported') return null
  const recipe = LORA_PROBE_RECIPES[family]
  return {
    prompt: recipe.positive(trigger.trim()),
    negativePrompt: recipe.negative,
  }
}

/**
 * Whether a Resource has no usable preview and is therefore being triaged
 * blind -- no generated ArtImage, no stored path, and either no remote preview
 * or one on a host that no longer resolves.
 */
export function hasBlindPreview(resource: {
  artImageId?: number | null
  imagePath?: string | null
  previewImageUrl?: string | null
  ArtImage?: { id?: number | null } | null
}): boolean {
  /*
   * Both shapes have to be accepted. resourceGallerySelect carries artImageId,
   * but the catalog listing the triage page actually loads (resourceListSelect,
   * via /api/resources) carries only the nested ArtImage and no id column -- so
   * checking artImageId alone would count every already-rendered LoRA as blind
   * on the one screen this count is for.
   */
  if (resource.artImageId) return false
  if (resource.ArtImage?.id) return false
  if (String(resource.imagePath || '').trim()) return false

  const url = String(resource.previewImageUrl || '').trim()
  if (!url) return true

  return DEAD_PREVIEW_HOSTS.some((host) => url.includes(host))
}
