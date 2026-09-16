/*
 * The probe scaffold must name a subject when the LoRA does not -- and must not
 * when it does.
 *
 * Measured across all 2,658 probe jobs (2026-09-16): 81.2% carried no subject
 * noun, 49.4% were a single tag, the median prompt was two tags, and 11 were
 * empty. Those render something arbitrary rather than nothing, which is why the
 * style half of the triage grid was never comparable LoRA-to-LoRA.
 *
 * The opposite error is already documented in loraProbe.ts and cost a real
 * misread: an unconditional 'single subject' contradicted the "Very Small
 * Women" LoRA's own two-figure triggers and the render dropped a figure, which
 * scanned as a broken LoRA. Both directions are pinned here.
 */
import { describe, expect, it } from 'vitest'
import {
  buildLoraProbePrompt,
  capProbeTriggerTags,
  probeSubjectClause,
  sanitizeProbeTrigger,
  triggerNamesSubject,
} from '../loraProbe'

const pony = (trigger: string) => buildLoraProbePrompt('pony', trigger)!.prompt

describe('probe subject injection', () => {
  it('gives a subject to the 81% that name none', () => {
    expect(pony('anna')).toContain('anna, 1girl')
    expect(pony('Apple - Style')).toContain('Apple - Style, 1girl')
    expect(pony('')).toContain('score_7_up, 1girl')
  })

  it('leaves a multi-figure concept alone', () => {
    // kind-robots/t-105: the concept is a size DIFFERENCE and cannot render
    // without two figures. Adding `1girl` here is the bug, not the fix.
    const out = pony('large male, t1nyg1rlz, very small female')
    expect(triggerNamesSubject('large male, t1nyg1rlz, very small female')).toBe(true)
    expect(out).not.toContain('1girl')
    expect(out).toContain('large male, t1nyg1rlz, very small female')
  })

  it('leaves an explicit subject alone rather than stacking another', () => {
    expect(pony('1girl, blue hair')).toContain('1girl, blue hair')
    expect(pony('1girl, blue hair')).not.toContain('1girl, blue hair, 1girl')
    expect(pony('1boy, armor')).not.toContain('1girl')
  })

  it('treats framing words as framing, not as a subject', () => {
    // 'portrait'/'upper body'/'face' say how to frame a subject, not what it is.
    expect(triggerNamesSubject('portrait')).toBe(false)
    expect(triggerNamesSubject('upper body')).toBe(false)
    expect(pony('portrait')).toContain('portrait, 1girl')
  })

  it('does not mistake the base model for a subject', () => {
    // Found by running this against the live queue after the first pass: these
    // four counted as having a subject and so were left without one.
    for (const t of [
      'Bartolomeobari Style - Pony XL',
      'Deadflow (Bee) Style Pony XL',
      'Custom Pony Styles Collection',
      'Sky ( Artist Style ) Pony',
    ]) {
      expect(triggerNamesSubject(sanitizeProbeTrigger(t))).toBe(false)
    }
    // ...while a genuine My Little Pony LoRA is still caught, by `girl`.
    expect(triggerNamesSubject('my little pony, pony girl')).toBe(true)
  })

  it('strips a spaced "Pony XL" the way it strips "PonyXL"', () => {
    expect(sanitizeProbeTrigger('Bartolomeobari Style - Pony XL')).not.toMatch(/pony/i)
  })

  it('treats "character sheet" as a format, not a subject', () => {
    expect(triggerNamesSubject('character sheet, multiple views, expressions')).toBe(false)
  })

  it('still detects plurals, monsters and creatures', () => {
    expect(triggerNamesSubject('multiple girls, harem, 3girls')).toBe(true)
    expect(triggerNamesSubject('Piranha Plant [Set3], Tentacle Monster')).toBe(true)
    expect(triggerNamesSubject('Fantastic Dragon')).toBe(true)
  })
})

describe('trigger capping', () => {
  it('caps a trigger dump from the front', () => {
    const dump = 'a, b, c, d, e, f, g, h, i, j, k, l'
    expect(capProbeTriggerTags(dump)).toBe('a, b, c, d, e, f, g, h')
  })

  it('caps the twenty-concept pile without mangling its escapes', () => {
    const pile = Array.from({ length: 20 }, (_, i) => `mix_(x${i})`).join(', ')
    const out = pony(pile)
    expect(out).toContain('mix_\\(x0\\)')
    expect(out).not.toContain('mix_\\(x9\\)')
  })

  it('leaves a short trigger list untouched', () => {
    expect(capProbeTriggerTags('a, b, c')).toBe('a, b, c')
    expect(capProbeTriggerTags('')).toBe('')
  })
})

describe('prose lanes', () => {
  it('uses a prose subject, not a Danbooru token, where T5 reads the prompt', () => {
    // `1girl` is meaningless to T5.
    expect(buildLoraProbePrompt('flux', 'anna')!.prompt).toContain('a woman')
    expect(buildLoraProbePrompt('flux', 'anna')!.prompt).not.toContain('1girl')
    expect(buildLoraProbePrompt('zimage', '')!.prompt).toContain('a woman')
  })
})

describe('negative prompt', () => {
  it('names the specific crop failure, not just "cropped"', () => {
    // Both figures in the 2026-09-16 Pony strip came back cut off at the mouth
    // with 'cropped' already present.
    const neg = buildLoraProbePrompt('pony', 'x')!.negativePrompt
    expect(neg).toContain('head out of frame')
    expect(neg).toContain('cropped head')
  })
})

describe('subject clause is shared by every SD-lineage family', () => {
  it.each(['pony', 'illustrious', 'sdxl', 'sd15'] as const)('%s', (family) => {
    expect(buildLoraProbePrompt(family, 'anna')!.prompt).toContain('anna, 1girl')
  })
})

describe('probeSubjectClause', () => {
  it('is the single place the default lives', () => {
    expect(probeSubjectClause('')).toBe('1girl')
    expect(probeSubjectClause('', true)).toBe('a woman')
  })
})

describe('framing scaffold', () => {
  it('never says "frame" -- the model reads it as a picture frame', () => {
    // ArtJob 26318: a Batgirl probe came back as a framed picture on a wall.
    // 'frame' supplied the frame, 'simple uncluttered background' the wall.
    for (const family of ['pony', 'illustrious', 'sdxl', 'sd15', 'flux', 'zimage'] as const) {
      expect(buildLoraProbePrompt(family, 'Batgirl')!.prompt).not.toMatch(/\bframe\b/i)
    }
  })

  it('still places the subject and clears the background', () => {
    const out = buildLoraProbePrompt('sdxl', 'Batgirl')!.prompt
    expect(out).toContain('centered')
    expect(out).toContain('simple uncluttered background')
  })
})
