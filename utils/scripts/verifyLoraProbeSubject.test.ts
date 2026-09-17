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
  loraNameAsTrigger,
  probeSubjectClause,
  probeTriggerText,
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

describe('a LoRA whose only trigger is invocation syntax', () => {
  /*
   * 17 rows carry nothing but `<lora:NAME:weight>`. That syntax is stripped
   * because ComfyUI has no parser for it, which left those probes with an
   * entirely empty prompt once the scaffold stopped supplying words. Authors
   * routinely name the file after the activation token, so the name inside is
   * the best available trigger.
   */
  it('recovers the name from the invocation', () => {
    expect(probeTriggerText({ defaultTrigger: '<lora:JesterV2:0.75>' })).toBe('JesterV2')
    expect(probeTriggerText({ defaultTrigger: '<lora:leonard0: >' })).toBe('leonard0')
    expect(probeTriggerText({ defaultTrigger: '<lora:inniesbettervaginas_v11:1.0>' }))
      .toBe('inniesbettervaginas_v11')
  })

  it('drops the training-step counter, which names no concept', () => {
    expect(probeTriggerText({ defaultTrigger: '<lora:undtoral-000020:1>' })).toBe('undtoral')
    expect(probeTriggerText({ defaultTrigger: '<lora:ppeach-000018:1>' })).toBe('ppeach')
  })

  it('falls back to the file stem when there is no invocation either', () => {
    expect(probeTriggerText({ localPath: 'SD15/SFW/bows1-000015.safetensors' })).toBe('bows1')
  })

  it('never displaces a real trigger', () => {
    expect(probeTriggerText({
      defaultTrigger: '1girl, blue hair',
      localPath: 'SDXL/SFW/whatever.safetensors',
    })).toBe('1girl, blue hair')
  })

  it('returns empty when there is genuinely nothing', () => {
    expect(loraNameAsTrigger('', '')).toBe('')
  })
})

describe('composition lives in the negative prompt', () => {
  /*
   * Silas, 2026-09-17: "centered should really be handled by proper negative
   * prompt data, not specific to what we want in the prompt." A positive
   * 'centered' competes with any LoRA that is deliberately off-centre; a
   * negative only rules out the subject being sliced by the frame edge.
   */
  it('keeps the subject in frame without asserting a composition', () => {
    for (const family of ['pony', 'illustrious', 'sdxl', 'sd15'] as const) {
      const r = buildLoraProbePrompt(family, 'Batgirl')!
      expect(r.negativePrompt).toContain('cropped')
      expect(r.negativePrompt).toContain('out of frame')
      expect(r.prompt).not.toMatch(/\bcentered\b/)
    }
  })
})

describe('base-model names in a marketing title', () => {
  /*
   * ArtJob 28437 rendered 'Realistic Snapshot (Z-Image-Turbo + Krea 2)'
   * verbatim -- the probe asked for a snapshot of two model names, because
   * neither engine was in BASE_NAME_NOISE_PATTERN. Every engine added to
   * LORA_PROBE_RECIPES needs its name added there too.
   */
  it('strips engine names the lanes actually use', () => {
    expect(sanitizeProbeTrigger('Realistic Snapshot (Z-Image-Turbo + Krea 2)'))
      .toBe('Realistic Snapshot')
    expect(sanitizeProbeTrigger('Cinematic Look [Z-Image]')).toBe('Cinematic Look')
    expect(sanitizeProbeTrigger('Painterly - Krea2')).toBe('Painterly')
  })

  it('leaves a real word that merely resembles one alone', () => {
    expect(sanitizeProbeTrigger('Turbo Racer')).toBe('Turbo Racer')
    expect(sanitizeProbeTrigger('my little pony, pony girl')).toBe('my little pony, pony girl')
  })
})
