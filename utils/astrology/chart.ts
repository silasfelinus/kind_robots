// /utils/astrology/chart.ts
//
// Pure natal and transit chart calculation. Planet positions come from
// astronomy-engine (VSOP87/ELP-grade accuracy, tropical true ecliptic of
// date); angles and Placidus houses are computed here from sidereal time.

import {
  Body,
  Ecliptic,
  EclipticGeoMoon,
  GeoVector,
  MakeTime,
  SiderealTime,
  e_tilt,
} from 'astronomy-engine'
import {
  ASPECTS,
  type AspectId,
  type ChartPointId,
  PLANET_IDS,
  type PlanetId,
  type ZodiacElement,
  type ZodiacModality,
  type ZodiacSignId,
  signAt,
} from './zodiac'

export type ChartLocation = {
  latitude: number
  longitude: number
}

export type ChartPoint = {
  id: ChartPointId
  longitude: number
  sign: ZodiacSignId
  degreeInSign: number
  house: number | null
  retrograde: boolean
}

export type ChartAspect = {
  a: ChartPointId
  b: ChartPointId
  aspect: AspectId
  orb: number
  applying: boolean | null
}

export type HouseSystem = 'placidus' | 'whole-sign'

export type NatalChart = {
  instant: string
  hasTime: boolean
  houseSystem: HouseSystem | null
  points: ChartPoint[]
  houses: number[] | null
  aspects: ChartAspect[]
  elements: Record<ZodiacElement, number>
  modalities: Record<ZodiacModality, number>
  moonPhaseAngle: number
  /** True when the Moon changes sign during the birth day and the time is unknown. */
  moonSignUncertain: boolean
}

const BODY: Record<PlanetId, Body> = {
  sun: Body.Sun,
  moon: Body.Moon,
  mercury: Body.Mercury,
  venus: Body.Venus,
  mars: Body.Mars,
  jupiter: Body.Jupiter,
  saturn: Body.Saturn,
  uranus: Body.Uranus,
  neptune: Body.Neptune,
  pluto: Body.Pluto,
}

const RAD = Math.PI / 180
const DEG = 180 / Math.PI

export const normalize = (angle: number) => ((angle % 360) + 360) % 360

/** Smallest separation between two longitudes, 0..180. */
export const separation = (a: number, b: number) => {
  const diff = Math.abs(normalize(a) - normalize(b))
  return diff > 180 ? 360 - diff : diff
}

export function planetLongitude(planet: PlanetId, instant: Date): number {
  if (planet === 'moon') return normalize(EclipticGeoMoon(instant).lon)
  return normalize(Ecliptic(GeoVector(BODY[planet], instant, true)).elon)
}

function isRetrograde(planet: PlanetId, instant: Date): boolean {
  if (planet === 'sun' || planet === 'moon') return false
  const before = planetLongitude(planet, new Date(instant.getTime() - 43200000))
  const after = planetLongitude(planet, new Date(instant.getTime() + 43200000))
  let motion = after - before
  if (motion > 180) motion -= 360
  if (motion < -180) motion += 360
  return motion < 0
}

export function obliquity(instant: Date): number {
  return e_tilt(MakeTime(instant)).tobl
}

/** Right ascension of the local meridian, degrees. */
export function localSiderealDegrees(instant: Date, longitude: number) {
  return normalize(SiderealTime(instant) * 15 + longitude)
}

export function chartAngles(instant: Date, location: ChartLocation) {
  const ramc = localSiderealDegrees(instant, location.longitude)
  const eps = obliquity(instant) * RAD
  const phi = location.latitude * RAD
  const theta = ramc * RAD
  const midheaven = normalize(
    Math.atan2(Math.sin(theta), Math.cos(theta) * Math.cos(eps)) * DEG,
  )
  const ascendant = normalize(
    Math.atan2(
      Math.cos(theta),
      -(Math.sin(theta) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)),
    ) * DEG,
  )
  return { ramc, midheaven, ascendant, obliquity: eps * DEG }
}

const raToEcliptic = (ra: number, eps: number) =>
  normalize(
    Math.atan2(Math.sin(ra * RAD), Math.cos(ra * RAD) * Math.cos(eps)) * DEG,
  )

/**
 * Placidus cusps by iterating each intermediate cusp's own semi-arc.
 * Undefined above the polar circles, where whole-sign houses are used instead.
 */
export function placidusCusps(
  ramc: number,
  latitude: number,
  obliquityDeg: number,
  ascendant: number,
  midheaven: number,
): number[] | null {
  if (Math.abs(latitude) >= 66) return null
  const eps = obliquityDeg * RAD
  const phi = latitude * RAD
  const cusp = (fraction: number, above: boolean) => {
    let lon = raToEcliptic(
      above ? ramc + 90 * fraction : ramc + 180 - 90 * fraction,
      eps,
    )
    for (let i = 0; i < 30; i++) {
      const dec = Math.asin(Math.sin(eps) * Math.sin(lon * RAD))
      const x = Math.tan(phi) * Math.tan(dec)
      if (Math.abs(x) >= 1) return null
      const ad = Math.asin(x) * DEG
      const ra = above
        ? ramc + fraction * (90 + ad)
        : ramc + 180 - fraction * (90 - ad)
      const next = raToEcliptic(ra, eps)
      if (separation(next, lon) < 1e-7) return next
      lon = next
    }
    return lon
  }
  const c11 = cusp(1 / 3, true)
  const c12 = cusp(2 / 3, true)
  const c2 = cusp(2 / 3, false)
  const c3 = cusp(1 / 3, false)
  if (c11 === null || c12 === null || c2 === null || c3 === null) return null
  return [
    ascendant,
    c2,
    c3,
    normalize(midheaven + 180),
    normalize(c11 + 180),
    normalize(c12 + 180),
    normalize(ascendant + 180),
    normalize(c2 + 180),
    normalize(c3 + 180),
    midheaven,
    c11,
    c12,
  ]
}

export function wholeSignCusps(ascendant: number): number[] {
  const start = Math.floor(normalize(ascendant) / 30) * 30
  return Array.from({ length: 12 }, (_, index) => normalize(start + index * 30))
}

export function houseOf(longitude: number, cusps: number[]): number {
  const lon = normalize(longitude)
  for (let index = 0; index < 12; index++) {
    const start = cusps[index] ?? 0
    const end = cusps[(index + 1) % 12] ?? 0
    const span = normalize(end - start)
    if (normalize(lon - start) < span) return index + 1
  }
  return 1
}

const LUMINARY = new Set<ChartPointId>(['sun', 'moon'])

export function findAspects(
  points: Pick<ChartPoint, 'id' | 'longitude'>[],
  others?: Pick<ChartPoint, 'id' | 'longitude'>[],
  orbScale = 1,
): ChartAspect[] {
  const aspects: ChartAspect[] = []
  const targets = others ?? points
  points.forEach((a, i) => {
    targets.forEach((b, j) => {
      if (!others && j <= i) return
      if (a.id === b.id && !others) return
      const sep = separation(a.longitude, b.longitude)
      for (const aspect of ASPECTS) {
        const bonus = LUMINARY.has(a.id) || LUMINARY.has(b.id) ? 2 : 0
        const allowed = (aspect.orb + bonus) * orbScale
        const orb = Math.abs(sep - aspect.angle)
        if (orb <= allowed) {
          aspects.push({
            a: a.id,
            b: b.id,
            aspect: aspect.id,
            orb: Math.round(orb * 100) / 100,
            applying: null,
          })
          break
        }
      }
    })
  })
  return aspects.sort((x, y) => x.orb - y.orb)
}

export function computeNatalChart(
  instant: Date,
  location: ChartLocation | null,
  hasTime: boolean,
): NatalChart {
  const planets: ChartPoint[] = PLANET_IDS.map((id) => {
    const longitude = planetLongitude(id, instant)
    return {
      id,
      longitude,
      sign: signAt(longitude).id,
      degreeInSign: longitude % 30,
      house: null,
      retrograde: isRetrograde(id, instant),
    }
  })

  let houses: number[] | null = null
  let houseSystem: HouseSystem | null = null
  const points: ChartPoint[] = [...planets]
  if (hasTime && location) {
    const angles = chartAngles(instant, location)
    houses = placidusCusps(
      angles.ramc,
      location.latitude,
      angles.obliquity,
      angles.ascendant,
      angles.midheaven,
    )
    houseSystem = 'placidus'
    if (!houses) {
      houses = wholeSignCusps(angles.ascendant)
      houseSystem = 'whole-sign'
    }
    const cusps = houses
    for (const [id, longitude] of [
      ['ascendant', angles.ascendant],
      ['midheaven', angles.midheaven],
    ] as const) {
      points.push({
        id,
        longitude,
        sign: signAt(longitude).id,
        degreeInSign: longitude % 30,
        house: null,
        retrograde: false,
      })
    }
    for (const point of points) {
      if (point.id === 'ascendant') point.house = 1
      else if (point.id === 'midheaven') point.house = 10
      else point.house = houseOf(point.longitude, cusps)
    }
  }

  const elements: Record<ZodiacElement, number> = {
    fire: 0,
    earth: 0,
    air: 0,
    water: 0,
  }
  const modalities: Record<ZodiacModality, number> = {
    cardinal: 0,
    fixed: 0,
    mutable: 0,
  }
  const weights: Partial<Record<ChartPointId, number>> = {
    sun: 3,
    moon: 3,
    ascendant: 3,
    mercury: 2,
    venus: 2,
    mars: 2,
    jupiter: 1,
    saturn: 1,
  }
  for (const point of points) {
    const weight = weights[point.id] ?? 0
    if (!weight) continue
    const sign = signAt(point.longitude)
    elements[sign.element] += weight
    modalities[sign.modality] += weight
  }

  const sun = planets.find((p) => p.id === 'sun')?.longitude ?? 0
  const moon = planets.find((p) => p.id === 'moon')?.longitude ?? 0

  let moonSignUncertain = false
  if (!hasTime) {
    const early = planetLongitude(
      'moon',
      new Date(instant.getTime() - 12 * 3600000),
    )
    const late = planetLongitude(
      'moon',
      new Date(instant.getTime() + 12 * 3600000),
    )
    moonSignUncertain = signAt(early).id !== signAt(late).id
  }

  return {
    instant: instant.toISOString(),
    hasTime: hasTime && Boolean(location),
    houseSystem,
    points,
    houses,
    aspects: findAspects(points),
    elements,
    modalities,
    moonPhaseAngle: normalize(moon - sun),
    moonSignUncertain,
  }
}

export type TransitHit = {
  transit: PlanetId
  natal: ChartPointId
  aspect: AspectId
  orb: number
}

export function computeSky(instant: Date) {
  return PLANET_IDS.map((id) => {
    const longitude = planetLongitude(id, instant)
    return {
      id,
      longitude,
      sign: signAt(longitude).id,
      degreeInSign: longitude % 30,
      house: null,
      retrograde: isRetrograde(id, instant),
    } satisfies ChartPoint
  })
}

/** Transiting planets in tight aspect to natal points (orbs scaled down). */
export function computeTransits(
  natal: NatalChart,
  instant: Date,
): { sky: ChartPoint[]; hits: TransitHit[] } {
  const sky = computeSky(instant)
  const hits = findAspects(sky, natal.points, 0.35).map((hit) => ({
    transit: hit.a as PlanetId,
    natal: hit.b,
    aspect: hit.aspect,
    orb: hit.orb,
  }))
  return { sky, hits }
}

export type MoonSignChange = { at: string; sign: ZodiacSignId }

/** Moon sign ingresses over the next `days`, located to the nearest ~minute. */
export function moonIngresses(start: Date, days: number): MoonSignChange[] {
  const changes: MoonSignChange[] = []
  const step = 2 * 3600000
  let previous = signAt(planetLongitude('moon', start)).id
  for (
    let t = start.getTime() + step;
    t <= start.getTime() + days * 86400000;
    t += step
  ) {
    const current = signAt(planetLongitude('moon', new Date(t))).id
    if (current !== previous) {
      let lo = t - step
      let hi = t
      while (hi - lo > 60000) {
        const mid = (lo + hi) / 2
        if (signAt(planetLongitude('moon', new Date(mid))).id === previous)
          lo = mid
        else hi = mid
      }
      changes.push({ at: new Date(hi).toISOString(), sign: current })
      previous = current
    }
  }
  return changes
}
