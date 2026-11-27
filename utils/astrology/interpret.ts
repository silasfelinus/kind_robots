// /utils/astrology/interpret.ts
//
// Assembles readable chart analysis from the short authored building blocks in
// zodiac.ts. Warm, second person and never fatalistic: astrology here is a
// mirror for reflection, the same voice as the Kind Oracle readings.

import type { ChartAspect, ChartPoint, NatalChart, TransitHit } from './chart'
import {
  ASPECTS,
  CHART_POINTS,
  type ChartPointId,
  ELEMENT_NOTES,
  HOUSE_DOMAINS,
  MODALITY_NOTES,
  type ZodiacElement,
  type ZodiacModality,
  decanCardKey,
  moonPhaseFor,
  ordinal,
  signAt,
  signById,
} from './zodiac'

export type PlacementReading = {
  point: ChartPointId
  title: string
  summary: string
  detail: string
}

export type BirthCard = {
  role: string
  cardKey: string
  reason: string
}

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export function placementReading(point: ChartPoint): PlacementReading {
  const info = CHART_POINTS[point.id]
  const sign = signById(point.sign)
  const housePart = point.house
    ? ` It plays out most in your ${ordinal(point.house)} house of ${HOUSE_DOMAINS[point.house - 1]}.`
    : ''
  const retro = point.retrograde
    ? ` Retrograde at birth, this energy tends to turn inward first, reflecting and revisiting before it acts.`
    : ''
  return {
    point: point.id,
    title: `${info.name} in ${sign.name}${point.house ? ` · ${ordinal(point.house)} house` : ''}`,
    summary: `${capital(info.theme)}, expressed ${sign.style}.`,
    detail: `Your ${info.name} carries ${sign.keywords.join(', ')}. Its gift is ${sign.gift}; its growing edge is ${sign.growth}.${housePart}${retro} ${info.question}`,
  }
}

export function aspectReading(aspect: ChartAspect): string {
  const info = ASPECTS.find((entry) => entry.id === aspect.aspect)
  const a = CHART_POINTS[aspect.a]
  const b = CHART_POINTS[aspect.b]
  if (!info) return ''
  return `${a.name} ${info.glyph} ${b.name} (${aspect.orb.toFixed(1)}°): ${a.theme} and ${b.theme} ${info.meaning}.`
}

const topKey = <T extends string>(record: Record<T, number>): T =>
  (Object.entries(record) as [T, number][]).sort((x, y) => y[1] - x[1])[0]![0]

const lowKey = <T extends string>(record: Record<T, number>): T =>
  (Object.entries(record) as [T, number][]).sort((x, y) => x[1] - y[1])[0]![0]

export function balanceReading(chart: NatalChart): string[] {
  const element: ZodiacElement = topKey(chart.elements)
  const quiet: ZodiacElement = lowKey(chart.elements)
  const modality: ZodiacModality = topKey(chart.modalities)
  return [
    `Your chart leans ${element}: ${ELEMENT_NOTES[element]} come naturally to you.`,
    `${capital(quiet)} is your quietest element, so ${ELEMENT_NOTES[quiet]} may be something you seek out in friends, places and practices.`,
    `With a ${modality} emphasis you are at your best ${MODALITY_NOTES[modality]}.`,
  ]
}

export function chartRulerReading(chart: NatalChart): string | null {
  const asc = chart.points.find((point) => point.id === 'ascendant')
  if (!asc) return null
  const sign = signById(asc.sign)
  const ruler = chart.points.find((point) => point.id === sign.modernRuler)
  if (!ruler) return null
  const rulerSign = signById(ruler.sign)
  const house = ruler.house
    ? ` in your ${ordinal(ruler.house)} house of ${HOUSE_DOMAINS[ruler.house - 1]}`
    : ''
  return `With ${sign.name} rising, ${CHART_POINTS[ruler.id].name} is your chart ruler. It sits in ${rulerSign.name}${house}, so ${CHART_POINTS[ruler.id].theme} quietly steer the whole chart.`
}

export function moonPhaseReading(chart: NatalChart): string {
  const phase = moonPhaseFor(chart.moonPhaseAngle)
  return `You were born under a ${phase.name}: ${phase.note}.`
}

export function birthCards(chart: NatalChart): BirthCard[] {
  const cards: BirthCard[] = []
  const find = (id: ChartPointId) =>
    chart.points.find((point) => point.id === id)
  const sun = find('sun')
  const moon = find('moon')
  const asc = find('ascendant')
  if (sun) {
    const sign = signById(sun.sign)
    cards.push({
      role: 'Sun card',
      cardKey: sign.tarotKey,
      reason: `Your Sun in ${sign.name} walks with this major arcanum.`,
    })
    cards.push({
      role: 'Sun decan',
      cardKey: decanCardKey(sun.longitude),
      reason: `The ten degrees of ${sign.name} holding your Sun belong to this minor card.`,
    })
  }
  if (moon) {
    const sign = signById(moon.sign)
    cards.push({
      role: 'Moon card',
      cardKey: sign.tarotKey,
      reason: `Your Moon in ${sign.name} speaks through this card.`,
    })
  }
  if (asc) {
    const sign = signById(asc.sign)
    cards.push({
      role: 'Rising card',
      cardKey: sign.tarotKey,
      reason: `${sign.name} rising greets the world with this card's face.`,
    })
  }
  return cards
}

const TRANSIT_TONE: Record<string, string> = {
  conjunction: 'turns up the volume on',
  sextile: 'opens a friendly door for',
  square: 'stirs up useful friction around',
  trine: 'brings an easy tailwind to',
  opposition: 'asks you to balance',
}

const TRANSIT_PACE: Record<string, string> = {
  sun: 'today',
  moon: 'for the next few hours',
  mercury: 'over the coming days',
  venus: 'over the coming days',
  mars: 'this week',
  jupiter: 'through this season',
  saturn: 'through this longer chapter',
  uranus: 'through this longer chapter',
  neptune: 'through this longer chapter',
  pluto: 'through this longer chapter',
}

export function transitReading(hit: TransitHit): string {
  const transit = CHART_POINTS[hit.transit]
  const natal = CHART_POINTS[hit.natal]
  return `Transiting ${transit.name} ${TRANSIT_TONE[hit.aspect] ?? 'touches'} your natal ${natal.name} ${TRANSIT_PACE[hit.transit] ?? ''}: ${transit.theme} meet ${natal.theme}.`
}

export function dailyHoroscope(
  chart: NatalChart,
  sky: ChartPoint[],
  hits: TransitHit[],
): { headline: string; lines: string[] } {
  const sunSign = signById(
    chart.points.find((point) => point.id === 'sun')?.sign ?? 'aries',
  )
  const moonNow = sky.find((point) => point.id === 'moon')
  const sunNow = sky.find((point) => point.id === 'sun')
  const moonSign = moonNow ? signAt(moonNow.longitude) : sunSign
  const phase = moonPhaseFor(
    (moonNow?.longitude ?? 0) - (sunNow?.longitude ?? 0),
  )
  const lines: string[] = [
    `The Moon is in ${moonSign.name} (${phase.name}), so the day's mood favors ${moonSign.keywords[0]} and ${moonSign.keywords[1]}.`,
  ]
  const natalMoon = chart.points.find((point) => point.id === 'moon')
  if (natalMoon && natalMoon.sign === moonSign.id) {
    lines.push(
      'The Moon is visiting its birth sign for you: a good day to tend your own needs first.',
    )
  }
  const ranked = [...hits]
    .sort((a, b) => a.orb - b.orb)
    .filter((hit) => hit.transit !== 'moon' || hit.orb < 2)
    .slice(0, 4)
  for (const hit of ranked) lines.push(transitReading(hit))
  if (ranked.length === 0) {
    lines.push(
      'No tight transits touch your chart today: a calm, open day to set your own rhythm.',
    )
  }
  const retrogrades = sky
    .filter((point) => point.retrograde)
    .map((point) => CHART_POINTS[point.id].name)
  if (retrogrades.length) {
    lines.push(
      `Retrograde now: ${retrogrades.join(', ')}. Revisiting and revising goes well under these.`,
    )
  }
  return {
    headline: `${sunSign.name}, ${sunSign.gift} is your strength today.`,
    lines,
  }
}
