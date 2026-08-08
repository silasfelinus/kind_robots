// Contract test for server/utils/artPromptContract.ts.
//
// Every case below is a prompt that actually rendered on 2026-08-08 and produced
// a wrong image. This file is the regression net for that day: if a rule is
// weakened, the exact prompt that caused the damage stops being rejected here.
import assert from 'node:assert/strict'
import {
  checkArtPromptContract,
  assertArtPromptContract,
  DISTILLED_ENGINE_LIMITS,
} from '../../server/utils/artPromptContract'

function rules(input: Parameters<typeof checkArtPromptContract>[0]): string[] {
  return checkArtPromptContract(input).map((violation) => violation.rule)
}

// ── The prompts that broke production ───────────────────────────────────────

// item-tidefortune-ladle: rendered as fifteen strangers and no ladle.
const LADLE_AS_SHIPPED =
  'iconic treasure-card illustration of Tidefortune Ladle (ITEM): stirred through ' +
  'any dish, it surfaces the hidden fortune buried in a person or object, ' +
  'atmospheric background, world of The Lucky Ladle, detailed mature western ' +
  'animation with multidimensional worldbuilding, expressive anatomy and faces; ' +
  'cast characters naturally across many species, ages, body sizes, body shapes, ' +
  'gender presentations, and levels of conventional attractiveness; include robots ' +
  'only when the subject or scene explicitly calls for them, cinematic light with ' +
  'intent, no readable text, no logos, no watermark'

const ladleRules = rules({ prompt: LADLE_AS_SHIPPED, engine: 'krea2' })
assert.ok(
  ladleRules.includes('conditional-instruction'),
  'the "include robots only when..." clause must be rejected',
)
assert.ok(
  ladleRules.includes('format-vocabulary'),
  '"treasure-card illustration" must be rejected',
)

// skill-ghost-ring-reading: rendered as a trading card with a rules box.
assert.ok(
  rules({ prompt: 'a rare-tier ability card illustration of Ghost-Ring Reading' })
    .includes('format-vocabulary'),
  '"ability card illustration" must be rejected',
)
assert.ok(
  rules({ prompt: 'subject here, 2:3 portrait card composition, lit warmly' })
    .includes('format-vocabulary'),
  '"card composition" must be rejected — it asks for the object, not the ratio',
)

// The five-noun text pile that landed in positive conditioning at cfg 1.
assert.ok(
  rules({
    prompt:
      'a brass tuning fork on a dark ground, no readable text, no lettering, ' +
      'no logos, no watermark, no signature',
    engine: 'krea2',
  }).includes('text-exclusion-pile'),
  'five text exclusions on an inert-negative engine must be rejected',
)

// The rule is scoped on purpose. These three cases are working pipelines that a
// broader "count every no-clause" version rejected outright.
assert.deepEqual(
  rules({
    prompt:
      'inked coloring-book design master, bold clean black ink linework, ' +
      'No border, no comic panel, no collage, no contact sheet, no greyscale, ' +
      'no shading, no gradient',
    engine: 'krea2',
  }),
  [],
  'the coloring-book lane excludes many NON-text formats on purpose',
)
assert.deepEqual(
  rules({
    prompt:
      'a bureaucratic form for any creature, species, or spirit, no matter how ' +
      'undocumented, luminous starlight ink',
    engine: 'krea2',
  }),
  [],
  '"no matter" is prose — a real SKILL prompt was rejected by an earlier version',
)
assert.deepEqual(
  rules({
    prompt: 'a quiet study, no comic panel, no poster on the wall',
    engine: 'krea2',
  }),
  [],
  'a format noun the author EXCLUDES is not a format request',
)

// "poster composition" is framing language the coloring-book lane uses on
// purpose; "a movie poster" is an object request. The asymmetry with "card
// composition" is deliberate and evidence-led: that one demonstrably rendered a
// titled trading card, and there is no equivalent evidence for poster framing.
assert.deepEqual(
  rules({
    prompt: 'Extreme close-up poster composition, mostly face and one raised hand',
    engine: 'krea2',
  }),
  [],
  'poster COMPOSITION is framing, not a request for a poster',
)
assert.ok(
  rules({ prompt: 'a vintage movie poster for a lost film', engine: 'krea2' })
    .includes('format-vocabulary'),
  'a movie poster as an OBJECT must still be rejected',
)

// Guidance scoping: the same five exclusions are tolerable where the negative
// prompt can actually act on them.
assert.deepEqual(
  rules({
    prompt:
      'a brass tuning fork, no readable text, no lettering, no logos, ' +
      'no watermark, no signature',
    engine: 'comfy',
    cfg: 7,
  }),
  [],
  'at cfg 7 the negative prompt works, so exclusions are not pathological',
)

// The phrase that used to be rewritten downstream into the casting block.
assert.ok(
  rules({ prompt: 'a ladle, cohesive Kind Robots visual style' })
    .includes('vague-brand-style'),
  '"Kind Robots visual style" must be rejected',
)

// ── Engine parameters ───────────────────────────────────────────────────────

const cooked = rules({
  prompt: 'a dented tin ladle alone on a bare surface',
  engine: 'krea2',
  steps: 20,
  cfg: 7,
})
assert.ok(
  cooked.includes('engine-guidance-mismatch'),
  'krea2 at cfg 7 must be rejected — it is distilled for cfg 1',
)
assert.ok(
  cooked.includes('engine-step-mismatch'),
  'krea2 at 20 steps must be rejected',
)
assert.deepEqual(
  rules({
    prompt: 'a dented tin ladle alone on a bare surface',
    engine: 'krea2',
    steps: 8,
    cfg: 1,
  }),
  [],
  'krea2 at its designed 8 steps / cfg 1 must pass',
)

// Both spellings of the same engine are covered: /api/art/enqueue normalizes to
// "flux2" while Conductor's consumer says "flux2-klein".
for (const engine of ['flux2', 'flux2-klein']) {
  assert.ok(
    DISTILLED_ENGINE_LIMITS[engine],
    `${engine} must carry distilled limits — an unkeyed spelling silently skips the gate`,
  )
}

// A non-distilled engine keeps normal guidance.
assert.deepEqual(
  rules({ prompt: 'a portrait of a knight', engine: 'comfy', steps: 30, cfg: 7 }),
  [],
  'SDXL-class engines must not be held to cfg 1',
)

// ── Prompts that must NOT trip the gate ─────────────────────────────────────

assert.deepEqual(
  rules({
    prompt:
      'a single Tidefortune Ladle, one object alone in frame, a dented tin ladle ' +
      'the length of a forearm, its bowl worn to a mirror finish, the handle ' +
      'wrapped in salt-stiffened cord, vertical 2:3 portrait composition, museum ' +
      'product shot, an unpeopled frame — the subject stands alone with no ' +
      'bystanders, no onlookers, and no crowd, unmarked surfaces, free of text',
    engine: 'krea2',
    steps: 8,
    cfg: 1,
  }),
  [],
  'the repaired ladle prompt must pass — three exclusions is under the pile threshold',
)

// A dream whose subject genuinely is a card catalog must still be renderable.
assert.deepEqual(
  rules({
    prompt:
      'a single half-eaten index card held to a raking sodium light, towering ' +
      'mahogany card drawers behind it, vertical 2:3 portrait composition',
    engine: 'krea2',
  }),
  [],
  'authored subject matter containing the word "card" must not be rejected',
)

// Prose that merely contains "no ..." is not an exclusion list.
assert.deepEqual(
  rules({ prompt: 'a lighthouse keeper who is no longer waiting, at dawn' }),
  [],
  '"no longer" is prose, not an exclusion',
)

assert.deepEqual(
  rules({ prompt: '' }).length ? rules({ prompt: '' }) : ['unexpected'],
  ['empty-prompt'],
  'an empty prompt must be rejected',
)

// ── The thrown error ────────────────────────────────────────────────────────

let thrown: unknown = null
try {
  assertArtPromptContract({ prompt: LADLE_AS_SHIPPED, engine: 'krea2', cfg: 7 })
} catch (error: unknown) {
  thrown = error
}
assert.ok(thrown, 'assertArtPromptContract must throw on a violating prompt')
assert.equal(
  (thrown as { statusCode?: number }).statusCode,
  422,
  'the gate must throw 422 so callers can distinguish it from a 500',
)
assert.match(
  String((thrown as { message?: string }).message),
  /conditional-instruction/,
  'the error must name every rule so a producer fixes them in one pass',
)

assert.doesNotThrow(
  () =>
    assertArtPromptContract({
      prompt: 'a brass tuning fork alone on a bare dark surface',
      engine: 'krea2',
      steps: 8,
      cfg: 1,
    }),
  'a clean prompt must pass through untouched',
)

console.log(
  'Art prompt contract passed: conditionals, format vocabulary, negation piles, ' +
    'vague brand style, and distilled-engine parameters are all rejected at enqueue.',
)
