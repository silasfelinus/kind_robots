// /utils/cthulhuquariumSprites.ts
//
// The tank's cut-out, animated fish.
//
// Why this exists. The swim canvas used to draw each species' bestiary CARD
// (t-070) -- a 1024px plate with its paper, glass mount, jar or whole shoal
// still attached -- scaled down to ~60px. Silas, 2026-09-30: "cthulhuquarium
// deserves a real roster of fish, with animation, and invisible background."
// The canon repo (silasfelinus/cthulhuquarium) now carries a second, bespoke
// prompt per species for the thing that actually swims (fish/SCHEMA.md,
// "Sprites"), renders it on a flat backdrop, cuts it out, and ships a
// 320px transparent WebP per species. Those land here under
// assets/images/cthulhuquarium/sprites/ via scripts/sync_cthulhuquarium_canon.mjs.
//
// Animation is played live, not shipped as frames. Each species declares a
// `sprite.motion`; drawAnimatedSprite() slices the static sprite into strips
// and offsets each by the motion's wave -- the SAME maths as the canon's
// scripts/build_sprites.py `deform()`, which bakes the listing previews, so
// the tank and the bestiary never disagree about how a creature moves. Keep
// MOTIONS below in step with MOTIONS there: same keys, same numbers.

import { CTHULHUQUARIUM_SPRITE_MOTIONS } from './cthulhuquariumCanon.generated'

export type SpriteMotion =
  'tailbeat' | 'undulate' | 'ripple' | 'pulse' | 'sway' | 'breathe' | 'rigid'

interface MotionSpec {
  axis: 'x' | 'y' | 'none'
  amp: number
  waves: number
  weight: 'tail' | 'trail' | 'crown' | 'even'
  squash: number
  period: number
}

export const MOTIONS: Record<SpriteMotion, MotionSpec> = {
  tailbeat: {
    axis: 'x',
    amp: 0.055,
    waves: 0.6,
    weight: 'tail',
    squash: 0,
    period: 900,
  },
  undulate: {
    axis: 'x',
    amp: 0.07,
    waves: 1.3,
    weight: 'even',
    squash: 0,
    period: 1400,
  },
  ripple: {
    axis: 'x',
    amp: 0.03,
    waves: 2.2,
    weight: 'even',
    squash: 0,
    period: 800,
  },
  pulse: {
    axis: 'y',
    amp: 0.05,
    waves: 0.9,
    weight: 'trail',
    squash: 0.06,
    period: 1800,
  },
  sway: {
    axis: 'y',
    amp: 0.05,
    waves: 0.4,
    weight: 'crown',
    squash: 0,
    period: 3200,
  },
  breathe: {
    axis: 'none',
    amp: 0,
    waves: 0,
    weight: 'even',
    squash: 0.03,
    period: 3600,
  },
  rigid: {
    axis: 'none',
    amp: 0,
    waves: 0,
    weight: 'even',
    squash: 0,
    period: 1000,
  },
}

const modules = import.meta.glob<string>(
  '../assets/images/cthulhuquarium/sprites/*.webp',
  { eager: true, query: '?url', import: 'default' },
)

const bySlug: Record<string, string> = {}
for (const [path, url] of Object.entries(modules)) {
  const slug = path
    .split('/')
    .pop()
    ?.replace(/\.webp$/, '')
  if (slug) bySlug[slug] = url
}

/** The species' cut-out sprite URL, or null while it has not been rendered yet. */
export function spriteForSpecies(
  slug: string | null | undefined,
): string | null {
  if (!slug) return null
  return bySlug[slug.trim().toLowerCase()] ?? null
}

/** The species' declared body motion (fish bible `sprite.motion`). */
export function motionForSpecies(
  slug: string | null | undefined,
): SpriteMotion {
  const motion = slug ? CTHULHUQUARIUM_SPRITE_MOTIONS[slug] : undefined
  return (motion && motion in MOTIONS ? motion : 'tailbeat') as SpriteMotion
}

function weightAt(profile: MotionSpec['weight'], t: number): number {
  if (profile === 'tail') return (1 - t) ** 2 // sprites face right: tail at t=0
  if (profile === 'trail') return t ** 1.5 // bell on top, trailing parts below
  if (profile === 'crown') return (1 - t) ** 1.5 // rooted at the bottom
  return 0.6
}

const STRIPS = 28

/**
 * Draw one frame of `motion` for `image`, centred on the context origin and
 * fitted into a `width` x `height` box (aspect preserved). `timeMs` is any
 * monotonic clock; `offset` de-syncs individuals of the same species.
 */
export function drawAnimatedSprite(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  motion: SpriteMotion,
  timeMs: number,
  width: number,
  height: number,
  offset = 0,
): void {
  const spec = MOTIONS[motion] ?? MOTIONS.tailbeat
  const iw = image.naturalWidth || image.width
  const ih = image.naturalHeight || image.height
  if (!iw || !ih) return
  const scale = Math.min(width / iw, height / ih)
  const dw = iw * scale
  const dh = ih * scale
  const phase = (timeMs / spec.period + offset) % 1
  const wave = Math.sin(2 * Math.PI * phase)

  context.save()
  if (spec.squash) {
    const s = 1 + spec.squash * wave
    // Same as the baker: pulse stretches vertically only; breathe trades
    // width for height so the silhouette's area barely changes.
    context.scale(spec.axis === 'y' ? 1 : 1 / s, s)
  }

  if (spec.axis === 'none') {
    context.drawImage(image, -dw / 2, -dh / 2, dw, dh)
    context.restore()
    return
  }

  const amp = spec.amp * Math.max(iw, ih) * scale
  if (spec.axis === 'x') {
    const sw = iw / STRIPS
    for (let i = 0; i < STRIPS; i++) {
      const t = (i + 0.5) / STRIPS
      const shift =
        amp *
        weightAt(spec.weight, t) *
        Math.sin(2 * Math.PI * (phase - spec.waves * (1 - t)))
      // +1px overlap hides the seam between neighbouring strips.
      context.drawImage(
        image,
        i * sw,
        0,
        sw,
        ih,
        -dw / 2 + i * sw * scale,
        -dh / 2 + shift,
        sw * scale + 1,
        dh,
      )
    }
  } else {
    const sh = ih / STRIPS
    for (let i = 0; i < STRIPS; i++) {
      const t = (i + 0.5) / STRIPS
      const shift =
        amp *
        weightAt(spec.weight, t) *
        Math.sin(2 * Math.PI * (phase - spec.waves * t))
      context.drawImage(
        image,
        0,
        i * sh,
        iw,
        sh,
        -dw / 2 + shift,
        -dh / 2 + i * sh * scale,
        dw,
        sh * scale + 1,
      )
    }
  }
  context.restore()
}
