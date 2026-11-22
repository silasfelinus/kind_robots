// Spring and Summer's authored Weather calendar (kr-arcade/t-133).
// The original eight-front Weather and Classic Sky modes remain available.
import { WEATHER_FRONTS } from './weather'
import type { FormationSpec, Front, RainMix, Season } from './weather'

export type CalendarFront = Front & {
  month: string
  frontNumber: 1 | 2 | 3
  special: boolean
}

type Recipe = {
  sub: string
  formation: FormationSpec
  rain?: RainMix
}

const original = WEATHER_FRONTS
const grid = original[0]!.formation
const showers = original[2]!.formation
const thunder = original[3]!.formation
const squall = original[4]!.formation
const hail = original[5]!.formation

function month(
  name: string,
  season: Season,
  recipes: readonly [Recipe, Recipe, Recipe],
): CalendarFront[] {
  return recipes.map((recipe, index) => ({
    id: name.toLowerCase() + '-front-' + (index + 1),
    name: name + ' ' + (index + 1) + '/3',
    sub: recipe.sub,
    season,
    month: name,
    frontNumber: (index + 1) as 1 | 2 | 3,
    special: index === 1,
    formation: recipe.formation,
    rain: recipe.rain ?? { straight: 1 },
  }))
}

export const SPRING_SUMMER_FRONTS: readonly CalendarFront[] = [
  ...month('MARCH', 0, [
    {
      sub: 'CUMULUS GRID - THE FIRST RAIN',
      formation: grid,
    },
    {
      sub: 'FIRST SHOOTS - DRIZZLERS WATER THE SOIL',
      formation: original[1]!.formation,
    },
    {
      sub: 'MARCH REMIX - THE GARDEN AWAKENS',
      formation: {
        kind: 'grid',
        cols: 11,
        cellW: 22,
        rows: ['anvil', ['puff', 'drizzler'], 'drizzler', 'grump', 'grump'],
      },
    },
  ]),
  ...month('APRIL', 0, [
    {
      sub: 'SHOWERS - SPLITTER PUFFS',
      formation: showers,
    },
    {
      sub: 'RAINBOW HOUR - CROSSING RAIN CLOUDS',
      formation: {
        kind: 'drift',
        cols: 9,
        cellW: 26,
        rows: ['splitter', 'drizzler', 'puff', 'splitter', 'grump'],
        speeds: [0.8, 1.25, 0.6, 1.1, 0.9],
        descendEvery: 12,
      },
    },
    {
      sub: 'APRIL REMIX - DRIZZLE AND SPLIT',
      formation: {
        kind: 'drift',
        cols: 9,
        cellW: 26,
        rows: [['drizzler', 'splitter'], 'splitter', 'puff', 'grump', 'grump'],
        speeds: [1, 0.75, 1.35, 0.8, 1.1],
        descendEvery: 10,
      },
    },
  ]),
  ...month('MAY', 0, [
    {
      sub: 'KITE DAY - GAPS IN THE CLOUDS',
      formation: {
        kind: 'grid',
        cols: 7,
        cellW: 34,
        rows: ['anvil', 'puff', 'drizzler', 'grump'],
      },
    },
    {
      sub: 'KITE FESTIVAL - FIND THE CLEAR LANES',
      formation: {
        kind: 'drift',
        cols: 7,
        cellW: 34,
        rows: ['splitter', 'puff', 'drizzler', 'grump'],
        speeds: [1, 0.6, 1.2, 0.8],
        descendEvery: 9,
      },
    },
    {
      sub: 'MAY REMIX - SPLITTERS IN THE WIND',
      formation: {
        kind: 'grid',
        cols: 9,
        cellW: 27,
        rows: ['anvil', ['splitter', 'drizzler'], 'puff', 'splitter', 'grump'],
      },
    },
  ]),
  ...month('JUNE', 1, [
    {
      sub: 'THUNDERHEAD ROWS - WATCH THE GROUND',
      formation: thunder,
    },
    {
      sub: 'BROWNOUT - THUNDERHEAD WARNING',
      formation: {
        kind: 'grid',
        cols: 9,
        cellW: 26,
        rows: ['thunderhead', 'puff', ['drizzler', 'thunderhead'], 'grump'],
      },
    },
    {
      sub: 'JUNE REMIX - THE STORM APPROACHES',
      formation: {
        kind: 'grid',
        cols: 11,
        cellW: 22,
        rows: [
          ['anvil', 'thunderhead'],
          'drizzler',
          ['puff', 'thunderhead'],
          'grump',
          'grump',
        ],
      },
    },
  ]),
  ...month('JULY', 1, [
    {
      sub: 'SQUALL LINE - RED EDGES DIVE',
      formation: squall,
    },
    {
      sub: 'PICNIC - KEEP YOUR GARDEN SAFE',
      formation: {
        kind: 'diagonal',
        cols: 9,
        cellW: 26,
        rows: ['diver', 'puff', ['diver', 'drizzler'], 'grump'],
        slope: 4,
      },
    },
    {
      sub: 'JULY REMIX - TWO CROSSING SQUALLS',
      formation: {
        kind: 'diagonal',
        cols: 11,
        cellW: 22,
        rows: [['anvil', 'diver'], 'splitter', 'diver', 'puff', 'grump'],
        slope: 5,
      },
    },
  ]),
  ...month('AUGUST', 1, [
    {
      sub: 'HAILSTORM - ICE BOUNCES ONCE',
      formation: hail,
    },
    {
      sub: 'HEAT HAZE - BEAM THE HAILERS',
      formation: {
        kind: 'grid',
        cols: 9,
        cellW: 24,
        rows: ['hailer', ['thunderhead', 'hailer'], 'puff', 'grump', 'grump'],
      },
    },
    {
      sub: 'AUGUST REMIX - HAIL AND LIGHTNING',
      formation: {
        kind: 'drift',
        cols: 9,
        cellW: 26,
        rows: ['hailer', 'thunderhead', 'hailer', 'splitter', 'grump'],
        speeds: [1, 0.7, 1.25, 0.8, 1.1],
        descendEvery: 10,
      },
    },
  ]),
]

/** The later seasons are their own roadmap slice; replay this authored half-year meanwhile. */
export function calendarFront(wave: number): CalendarFront {
  const index = Math.max(0, Math.floor(wave) - 1) % SPRING_SUMMER_FRONTS.length
  return SPRING_SUMMER_FRONTS[index]!
}
