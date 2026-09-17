/*
 * The probe scaffold adds no subject, and caps a trigger dump.
 *
 * A subject WAS injected here for a day. The history is pinned because each
 * repair made it worse: `1girl` (81.2% of 2,658 probes named no subject) biased
 * pre-teen across nine unrelated LoRAs; `adult, mature female` aged it to a
 * uniform 40-50+. Every scaffold noun competed with the LoRA being previewed.
 * These tests exist to stop a global default being reinstated.
 */
import { describe, expect, it } from 'vitest'
import {
  buildLoraProbePrompt,
  capProbeTriggerTags,
  probeSubjectClause,
  sanitizeProbeTrigger,
} from '../loraProbe'

const pony = (trigger: string) => buildLoraProbePrompt('pony', trigger)!.prompt

describe('the scaffold adds no subject', () => {
  it('renders the trigger and nothing more', () => {
    expect(probeSubjectClause('anna')).toBe('anna')
    expect(probeSubjectClause('')).toBe('')
    expect(pony('anna')).toBe(
      'score_9, score_8_up, score_7_up, anna, centered, simple uncluttered background',
    )
  })

  it('injects no noun on any lane', () => {
    for (const family of ['pony', 'illustrious', 'sdxl', 'sd15', 'flux', 'zimage'] as const) {
      const out = buildLoraProbePrompt(family, 'Apple - Style')!.prompt
      expect(out).not.toMatch(/\b1girl\b/)
      expect(out).not.toMatch(/mature female/)
      expect(out).not.toMatch(/\ban adult woman\b/)
    }
  })

  it('leaves a multi-figure concept exactly as the LoRA wrote it', () => {
    // kind-robots/t-105: the concept is a size DIFFERENCE and needs two figures.
    expect(pony('large male, t1nyg1rlz, very small female')).toContain(
      'large male, t1nyg1rlz, very small female',
    )
  })

  it('adds no age term to a trigger that carries its own subject', () => {
    const out = pony('1girl, blue hair')
    expect(out).toContain('1girl, blue hair')
    expect(out).not.toMatch(/\badult\b/)
  })
})

describe('trigger capping', () => {
  it('caps a trigger dump from the front', () => {
    expect(capProbeTriggerTags('a, b, c, d, e, f, g, h, i, j, k, l')).toBe(
      'a, b, c, d, e, f, g, h',
    )
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

describe('framing scaffold', () => {
  it('never says "frame" -- the model reads it as a picture frame', () => {
    // ArtJob 26318: a Batgirl probe came back as a framed picture on a wall.
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

describe('sanitizer', () => {
  it('strips a spaced "Pony XL" the way it strips "PonyXL"', () => {
    expect(sanitizeProbeTrigger('Bartolomeobari Style - Pony XL')).not.toMatch(/pony/i)
  })
})

describe('minor-exclusion negatives', () => {
  /*
   * These stay although the positive injection is gone: a negative constrains
   * what must not appear without pulling the subject anywhere, and it is the
   * guard that has to hold when a LoRA supplies its own young-reading trigger.
   */
  it('forecloses minors on every lane that takes a negative', () => {
    for (const family of ['pony', 'illustrious', 'sdxl', 'sd15'] as const) {
      const n = buildLoraProbePrompt(family, 'x')!.negativePrompt
      for (const term of ['child', 'loli', 'shota', 'toddler', 'young girl'])
        expect(n).toContain(term)
    }
  })

  it('omits "teenager", which covers legitimately adult characters', () => {
    // Silas, 2026-09-17: the catalog holds canonically 18-19 year old characters.
    expect(buildLoraProbePrompt('pony', 'x')!.negativePrompt).not.toMatch(/\bteenager\b/)
  })
})
