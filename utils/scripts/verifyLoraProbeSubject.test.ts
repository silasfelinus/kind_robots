// /utils/scripts/verifyLoraProbeSubject.test.ts
//
// A probe is the LoRA's own trigger plus the quality preamble its base model
// requires. Nothing else.
//
// Five scaffold additions were tried and walked back over 2026-09-16/17, each
// distorting the thing the preview grid exists to show:
//
//   'single subject, upper body'   dropped a figure from a two-figure concept
//                                  and cropped the full-body LoRAs
//   'subject centered in frame'    rendered framed pictures hanging on walls
//   '1girl'                        biased pre-teen across nine unrelated LoRAs
//   'adult, mature female'         aged the whole grid to 40-50+
//   a lighting recipe              rendered a style LoRA as a studio photo of
//                                  a vinyl toy
//
// 'simple uncluttered background' is the clearest case for why none of it
// belongs, because it reads as harmless: a maximalist artist style, or a LoRA
// whose concept IS maximalism, is told to undo itself and then scores as weak.
//
// These assertions exist to stop any of it coming back.
import assert from 'node:assert/strict'

import {
  buildLoraProbePrompt,
  capProbeTriggerTags,
  loraNameAsTrigger,
  probeSubjectClause,
  probeTriggerText,
  sanitizeProbeTrigger,
} from '../loraProbe'

const pony = (trigger: string) => buildLoraProbePrompt('pony', trigger)!.prompt
const FAMILIES = ['pony', 'illustrious', 'sdxl', 'sd15', 'flux', 'zimage'] as const

// --- the scaffold adds nothing to the trigger -------------------------------
assert.equal(probeSubjectClause('anna'), 'anna')
assert.equal(probeSubjectClause(''), '')
assert.equal(pony('anna'), 'score_9, score_8_up, score_7_up, anna')
assert.equal(buildLoraProbePrompt('sdxl', 'Batgirl')!.prompt, 'Batgirl')
assert.equal(buildLoraProbePrompt('flux', 'Batgirl')!.prompt, 'Batgirl')
assert.equal(buildLoraProbePrompt('sd15', 'Batgirl')!.prompt, 'best quality, Batgirl')

// No subject, framing, background or art direction, on any lane.
const BANNED =
  /\b(1girl|mature female|adult|centered|uncluttered|background|frame|lighting|sharp focus|single subject|upper body)\b/i
for (const family of FAMILIES) {
  assert.ok(
    !BANNED.test(buildLoraProbePrompt(family, 'Apple - Style')!.prompt),
    `${family} scaffold must add nothing`,
  )
}

// kind-robots/t-105: the concept is a size DIFFERENCE and needs two figures.
assert.equal(
  pony('large male, t1nyg1rlz, very small female'),
  'score_9, score_8_up, score_7_up, large male, t1nyg1rlz, very small female',
)

// A LoRA that names its own subject is not aged, qualified or second-guessed.
assert.ok(pony('1girl, blue hair').includes('1girl, blue hair'))
assert.ok(!/\badult\b/.test(pony('1girl, blue hair')))

// An empty trigger renders the preamble alone; nothing is invented.
assert.equal(buildLoraProbePrompt('sdxl', '')!.prompt, '')

// --- the negative prompt is quality only ------------------------------------
for (const family of ['pony', 'illustrious', 'sdxl', 'sd15'] as const) {
  const negative = buildLoraProbePrompt(family, 'x')!.negativePrompt
  for (const term of ['child', 'loli', 'shota', 'toddler', 'young girl', 'teenager']) {
    assert.ok(!negative.includes(term), `${family} negative must carry no age terms`)
  }
  assert.ok(negative.includes('worst quality'))
  // Composition belongs here rather than in the positive: a positive 'centered'
  // competes with any LoRA that is deliberately off-centre.
  assert.ok(negative.includes('cropped'))
  assert.ok(negative.includes('out of frame'))
}

// --- trigger capping --------------------------------------------------------
assert.equal(capProbeTriggerTags('a, b, c, d, e, f, g, h, i, j, k, l'), 'a, b, c, d, e, f, g, h')
assert.equal(capProbeTriggerTags('a, b, c'), 'a, b, c')
assert.equal(capProbeTriggerTags(''), '')

// The twenty-concept pile caps without mangling its escapes.
const pile = Array.from({ length: 20 }, (_, i) => `mix_(x${i})`).join(', ')
assert.ok(pony(pile).includes('mix_\\(x0\\)'))
assert.ok(!pony(pile).includes('mix_\\(x9\\)'))

// --- sanitizer --------------------------------------------------------------
// ArtJob 28437 rendered 'Realistic Snapshot (Z-Image-Turbo + Krea 2)' verbatim:
// the probe asked for a snapshot of two model names. Every engine added to
// LORA_PROBE_RECIPES needs its name in BASE_NAME_NOISE_PATTERN too.
assert.equal(
  sanitizeProbeTrigger('Realistic Snapshot (Z-Image-Turbo + Krea 2)'),
  'Realistic Snapshot',
)
assert.equal(sanitizeProbeTrigger('Cinematic Look [Z-Image]'), 'Cinematic Look')
assert.equal(sanitizeProbeTrigger('Painterly - Krea2'), 'Painterly')
assert.ok(!/pony/i.test(sanitizeProbeTrigger('Bartolomeobari Style - Pony XL')))
// ...while a real word that merely resembles one survives.
assert.equal(sanitizeProbeTrigger('Turbo Racer'), 'Turbo Racer')
assert.equal(sanitizeProbeTrigger('my little pony, pony girl'), 'my little pony, pony girl')

// --- a trigger that is only invocation syntax -------------------------------
// 17 rows carry nothing but `<lora:NAME:weight>`. That syntax is stripped
// because ComfyUI has no parser for it, which left those probes with an empty
// prompt once the scaffold stopped supplying words. Authors routinely name the
// file after the activation token, so the name inside is the best trigger.
assert.equal(probeTriggerText({ defaultTrigger: '<lora:JesterV2:0.75>' }), 'JesterV2')
assert.equal(probeTriggerText({ defaultTrigger: '<lora:leonard0: >' }), 'leonard0')
assert.equal(
  probeTriggerText({ defaultTrigger: '<lora:inniesbettervaginas_v11:1.0>' }),
  'inniesbettervaginas_v11',
)
// --- a bundle title shared by unrelated LoRAs --------------------------------
// A Civitai "collection" model publishes each of its LoRAs as a version of one
// model row, so scan_loras.py labelled every one of them with the bundle title
// and -- with no trainedWords to override it -- promoted that title to the
// trigger. Resources 2427 and 2429 (the XLabs disney and mjv6 converts) both
// carried 'Flux Lora Collection (xlabs)', so both probed identically and both
// rendered XLabs-branded product packaging (2026-09-19).
//
// Stripped of its packaging words the title leaves a bare attribution, which
// names the publisher rather than a subject, so it empties -- and the filename
// fallback then recovers the one word that tells the two apart.
assert.equal(sanitizeProbeTrigger('Flux Lora Collection (xlabs)'), '')
for (const [stem, expected] of [
  ['disney_lora_comfy_converted', 'disney'],
  ['mjv6_lora_comfy_converted', 'mjv6'],
] as const) {
  assert.equal(
    probeTriggerText({
      defaultTrigger: 'Flux Lora Collection (xlabs)',
      triggerWords: 'Flux Lora Collection (xlabs)',
      localPath: `Flux/SFW/${stem}.safetensors`,
    }),
    expected,
  )
}
// Underscores are only dropped around a packaging word. An activation token
// that happens to hold one is left exactly as the LoRA answers to it, and a
// subject that merely looks like a base-model name survives too.
assert.equal(
  probeTriggerText({ localPath: 'Pony/SFW/my_little_pony.safetensors' }),
  'my_little_pony',
)

// The training-step counter names a checkpoint, not a concept.
assert.equal(probeTriggerText({ defaultTrigger: '<lora:undtoral-000020:1>' }), 'undtoral')
assert.equal(probeTriggerText({ defaultTrigger: '<lora:ppeach-000018:1>' }), 'ppeach')
// The file stem is the last resort.
assert.equal(probeTriggerText({ localPath: 'SD15/SFW/bows1-000015.safetensors' }), 'bows1')
// A real trigger is never displaced.
assert.equal(
  probeTriggerText({
    defaultTrigger: '1girl, blue hair',
    localPath: 'SDXL/SFW/whatever.safetensors',
  }),
  '1girl, blue hair',
)
assert.equal(loraNameAsTrigger('', ''), '')

// --- training methods are not subjects --------------------------------------
// 'Michiking, Artist Style, DoRA' rendered with the method name in it
// (2026-09-17). DoRA/LoHa/LoKr name how the file was TRAINED, exactly as LoRA
// and LoCon do -- but unlike those they cannot be stripped anywhere, because
// `Dora` is also a character name.
assert.equal(sanitizeProbeTrigger('Michiking | Artist Style | PonyXL | DoRA'), 'Michiking, Artist Style')
assert.equal(sanitizeProbeTrigger('Tsuji Santa | Artist Style | DoRA + LoRA'), 'Tsuji Santa, Artist Style')
assert.equal(sanitizeProbeTrigger('Clay Mann Artstyle - LoHa'), 'Clay Mann Artstyle')

// ...and a character called Dora survives, at the start of a trigger where a
// method name never appears.
assert.equal(sanitizeProbeTrigger('Dora the Explorer, backpack'), 'Dora the Explorer, backpack')

// Stripping descriptors never empties a trigger: probing the bare base model is
// worse than rendering the word.
assert.equal(sanitizeProbeTrigger('Dora'), 'Dora')
assert.equal(sanitizeProbeTrigger('Style'), 'Style')

// 'slider' is deliberately absent: it names what the LoRA does, not how it was
// built, and the concept does not survive its removal.
assert.equal(sanitizeProbeTrigger('Blowjob Depth Slider - Pony'), 'Blowjob Depth Slider - Pony')

console.log('verifyLoraProbeSubject: all assertions passed')
