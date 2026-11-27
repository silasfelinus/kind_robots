import type { Point } from './combat'

type EnvironmentalOrigin = {
  lead: string
  flag: string
  target: Point
  range: number
  family: 'undertow' | 'strike' | 'analyze'
  even: boolean
  fire: boolean
  msg: string
}

const ORIGINS: Readonly<Record<string, EnvironmentalOrigin>> = {
  'hydrant-blue': {
    "lead": "accident-water",
    "flag": "hydrant-main-flowing",
    "target": {
      "x": 4,
      "y": 2
    },
    "range": 1,
    "family": "undertow",
    "even": false,
    "fire": true,
    "msg": "Tidewarden redirects the broken water main. Both crews can now evacuate."
  },
  'clocktower-collapse': {
    "lead": "accident-discipline",
    "flag": "clock-lift-caught",
    "target": {
      "x": 4,
      "y": 3
    },
    "range": 1,
    "family": "strike",
    "even": true,
    "fire": true,
    "msg": "The Second Hand catches the lift between gear teeth. The technician can evacuate."
  },
  'equation-that-escaped': {
    "lead": "accident-genius",
    "flag": "equation-drone-rewritten",
    "target": {
      "x": 5,
      "y": 2
    },
    "range": 4,
    "family": "analyze",
    "even": false,
    "fire": false,
    "msg": "Eureka rewrites the faulty drone's proof into an emergency shield. Both witnesses can evacuate."
  },
}

export function environmentalOrigin(stage: string | null | undefined): EnvironmentalOrigin | undefined {
  return stage && Object.hasOwn(ORIGINS, stage) ? ORIGINS[stage] : undefined
}
