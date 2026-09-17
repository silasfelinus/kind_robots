/*
 * A probe is the LoRA's own trigger plus the quality preamble its base model
 * requires. Nothing else.
 *
 * Five scaffold additions were tried and walked back over 2026-09-16/17, each
 * distorting the thing the grid exists to show: 'single subject, upper body'
 * dropped a figure from a two-figure concept; 'subject centered in frame'
 * rendered framed pictures on walls; '1girl' biased pre-teen; 'adult, mature
 * female' aged the grid to 40-50+; a lighting recipe turned a style LoRA into a
 * studio photo of a vinyl toy. These tests exist to stop any of it coming back.
 */
import { describe, expect, it } from 'vitest'
import {
  buildLoraProbePrompt,
  capProbeTriggerTags,
  probeSubjectClause,
  sanitizeProbeTrigger,
} from '../loraProbe'

const FAMILIES = ['pony', 'illustrious', 'sdxl', 'sd15', 'flux', 'zimage'] as const

describe('the scaffold adds nothing to the trigger', () => {
  it('is the preamble and the trigger, exactly', () => {
    expect(buildLoraProbePrompt('pony', 'Batgirl')!.prompt)
      .toBe('score_9, score_8_up, score_7_up, Batgirl')
    expect(buildLoraProbePrompt('sdxl', 'Batgirl')!.prompt).toBe('Batgirl')
    expect(buildLoraProbePrompt('flux', 'Batgirl')!.prompt).toBe('Batgirl')
    expect(buildLoraProbePrompt('sd15', 'Batgirl')!.prompt).toBe('best quality, Batgirl')
  })

  it('adds no subject, framing, background or art direction', () => {
    const banned =
      /\b(1girl|mature female|adult|centered|uncluttered|background|frame|lighting|sharp focus|single subject|upper body)\b/i
    for (const family of FAMILIES) {
      expect(buildLoraProbePrompt(family, 'Apple - Style')!.prompt).not.toMatch(banned)
    }
  })

  it('leaves a multi-figure concept exactly as the LoRA wrote it', () => {
    expect(buildLoraProbePrompt('pony', 'large male, t1nyg1rlz, very small female')!.prompt)
      .toBe('score_9, score_8_up, score_7_up, large male, t1nyg1rlz, very small female')
  })

  it('renders an empty trigger as the preamble alone, inventing nothing', () => {
    expect(buildLoraProbePrompt('sdxl', '')!.prompt).toBe('')
    expect(probeSubjectClause('')).toBe('')
  })
})

describe('the negative prompt is quality only', () => {
  it('carries no content or age terms', () => {
    for (const family of ['pony', 'illustrious', 'sdxl', 'sd15'] as const) {
      const n = buildLoraProbePrompt(family, 'x')!.negativePrompt
      for (const term of ['child', 'loli', 'shota', 'toddler', 'young girl', 'teenager'])
        expect(n).not.toContain(term)
      expect(n).toContain('worst quality')
    }
  })
})

describe('trigger capping', () => {
  it('caps a dump from the front, adding nothing', () => {
    expect(capProbeTriggerTags('a, b, c, d, e, f, g, h, i, j, k, l')).toBe('a, b, c, d, e, f, g, h')
  })

  it('caps the twenty-concept pile without mangling its escapes', () => {
    const pile = Array.from({ length: 20 }, (_, i) => `mix_(x${i})`).join(', ')
    const out = buildLoraProbePrompt('pony', pile)!.prompt
    expect(out).toContain('mix_\\(x0\\)')
    expect(out).not.toContain('mix_\\(x9\\)')
  })

  it('leaves a short trigger list untouched', () => {
    expect(capProbeTriggerTags('a, b, c')).toBe('a, b, c')
  })
})

describe('sanitizer', () => {
  it('strips a spaced "Pony XL" the way it strips "PonyXL"', () => {
    expect(sanitizeProbeTrigger('Bartolomeobari Style - Pony XL')).not.toMatch(/pony/i)
  })
})
