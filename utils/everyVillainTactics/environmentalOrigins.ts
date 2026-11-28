import type { Point } from './combat'

type EnvironmentalOrigin = {
  lead: string
  flag: string
  target: Point
  range: number
  family: 'undertow' | 'strike' | 'analyze' | 'blaze' | 'bulwark' | 'glide'
  even: boolean
  fire: boolean
  msg: string
}

const ORIGINS: Readonly<Record<string, EnvironmentalOrigin>> = {
  'overdue-thunder': {
    lead: 'magic-air',
    flag: 'thunder-cloud-folded',
    target: { x: 5, y: 2 },
    range: 4,
    family: 'glide',
    even: false,
    fire: false,
    msg: "The Weathervane folds the thundercloud between the book's pages. Both readers can now leave.",
  },
  'bell-and-the-door': {
    lead: 'magic-discipline',
    flag: 'bell-ward-unbound',
    target: { x: 4, y: 3 },
    range: 1,
    family: 'strike',
    even: false,
    fire: true,
    msg: 'The Abbess breaks the obedience spell at the safe-room threshold. Both trapped people can now evacuate.',
  },
  'orchard-under-asphalt': {
    lead: 'magic-earth',
    flag: 'orchard-arch-stitched',
    target: {
      x: 4,
      y: 2,
    },
    range: 0,
    family: 'bulwark',
    even: false,
    fire: false,
    msg: 'Granny Mayhem stitches the roots into a shelter arch. The trapped gardeners can now leave.',
  },
  'future-in-the-glass': {
    lead: 'magic-water',
    flag: 'glass-future-reframed',
    target: {
      x: 5,
      y: 3,
    },
    range: 3,
    family: 'undertow',
    even: false,
    fire: true,
    msg: 'Reflection turns the silver bowl toward an alternate future. The patient and nurse can now evacuate.',
  },
  'candle-that-wouldnt-die': {
    lead: 'magic-fire',
    flag: 'vigil-flame-bound',
    target: {
      x: 4,
      y: 3,
    },
    range: 1,
    family: 'blaze',
    even: false,
    fire: true,
    msg: 'Lanternwitch binds the possessed candle inside a bronze lantern. The mourners can now be evacuated.',
  },
  'hydrant-blue': {
    lead: 'accident-water',
    flag: 'hydrant-main-flowing',
    target: {
      x: 4,
      y: 2,
    },
    range: 1,
    family: 'undertow',
    even: false,
    fire: true,
    msg: 'Tidewarden redirects the broken water main. Both crews can now evacuate.',
  },
  'clocktower-collapse': {
    lead: 'accident-discipline',
    flag: 'clock-lift-caught',
    target: {
      x: 4,
      y: 3,
    },
    range: 1,
    family: 'strike',
    even: true,
    fire: true,
    msg: 'The Second Hand catches the lift between gear teeth. The technician can evacuate.',
  },
  'equation-that-escaped': {
    lead: 'accident-genius',
    flag: 'equation-drone-rewritten',
    target: {
      x: 5,
      y: 2,
    },
    range: 4,
    family: 'analyze',
    even: false,
    fire: false,
    msg: "Eureka rewrites the faulty drone's proof into an emergency shield. Both witnesses can evacuate.",
  },
}

export function environmentalOrigin(
  stage: string | null | undefined,
): EnvironmentalOrigin | undefined {
  return stage && Object.hasOwn(ORIGINS, stage) ? ORIGINS[stage] : undefined
}
