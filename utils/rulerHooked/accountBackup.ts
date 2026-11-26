import { AXIS_KEYS, type RunSave } from '~/types/ruler-hooked'
import type { RoyalScrapbook } from './scrapbook'
import { validClassicCheckpoint } from './fishingCheckpoint'

export const ROYAL_BACKUP_KIND = 'kind-robots-ruler-hooked'
const MAX_BYTES = 2 * 1024 * 1024

export interface RoyalBackup {
  kind: typeof ROYAL_BACKUP_KIND
  version: 1
  reigns: RunSave[]
  scrapbook: RoyalScrapbook
}

const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const text = (v: unknown): v is string => typeof v === 'string'
const number = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v)
const count = (v: unknown): v is number =>
  number(v) && Number.isSafeInteger(v) && v >= 0
const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every(text)
const record = (v: unknown, check: (item: unknown) => boolean): boolean =>
  object(v) && Object.values(v).every(check)
const id = (v: unknown): v is string =>
  text(v) && /^sv_[a-zA-Z0-9_-]{1,80}$/.test(v)
const date = (v: unknown): v is string =>
  text(v) && Number.isFinite(Date.parse(v))
function safeKeys(v: unknown, depth = 0): boolean {
  if (depth > 32) return false
  if (Array.isArray(v)) return v.every((item) => safeKeys(item, depth + 1))
  if (!object(v)) return true
  return Object.entries(v).every(
    ([key, item]) =>
      !['__proto__', 'constructor', 'prototype'].includes(key) &&
      safeKeys(item, depth + 1),
  )
}
const fish = (v: unknown): boolean =>
  object(v) &&
  text(v.fishSlug) &&
  count(v.firstCaughtTurn) &&
  count(v.countCaught) &&
  number(v.bestSizeCm) &&
  number(v.bestQualityScore)
const reward = (v: unknown): boolean =>
  object(v) && text(v.slug) && text(v.rarity)
const choice = (v: unknown): boolean =>
  object(v) &&
  count(v.turn) &&
  text(v.cardId) &&
  text(v.prompt) &&
  text(v.choiceText) &&
  object(v.effects) &&
  (v.resultText === undefined || text(v.resultText))

function validReign(v: unknown): v is RunSave {
  if (!object(v)) return false
  const ruler = v.ruler
  const deck = v.deckState
  const inventory = v.inventory
  const health = v.kingdomHealth
  return (
    count(v.schemaVersion) &&
    v.schemaVersion >= 4 &&
    v.schemaVersion <= 6 &&
    id(v.saveId) &&
    text(v.name) &&
    v.dreamSlug === 'ruler-hooked' &&
    text(v.contentVersion) &&
    text(v.seed) &&
    ['ACTIVE', 'COMPLETE', 'ABANDONED'].includes(String(v.status)) &&
    count(v.turnCount) &&
    count(v.cyclePosition) &&
    date(v.createdAt) &&
    date(v.updatedAt) &&
    (v.endingKey === null || text(v.endingKey)) &&
    (v.pendingCardId === undefined || text(v.pendingCardId)) &&
    (v.pendingFinaleKey === undefined || text(v.pendingFinaleKey)) &&
    (v.pendingClassicFishing === undefined ||
      validClassicCheckpoint(v.pendingClassicFishing)) &&
    typeof v.openingSeen === 'boolean' &&
    object(ruler) &&
    text(ruler.name) &&
    (ruler.honorific === undefined || text(ruler.honorific)) &&
    (ruler.characterSlug === undefined || text(ruler.characterSlug)) &&
    (ruler.cosmetics === undefined || object(ruler.cosmetics)) &&
    object(health) &&
    AXIS_KEYS.every((key) => {
      const n = health[key]
      return number(n) && n >= 0 && n <= 100
    }) &&
    record(v.counters, number) &&
    record(v.flags, (item) => typeof item === 'boolean') &&
    record(v.regionStates, text) &&
    record(v.regionOverrides, text) &&
    record(v.fishopedia, fish) &&
    object(deck) &&
    strings(deck.seenCardIds) &&
    strings(deck.drawBag) &&
    record(deck.cooldowns, count) &&
    record(
      deck.activeArcs,
      (arc) =>
        object(arc) &&
        text(arc.step) &&
        record(arc.flags, (item) => typeof item === 'boolean'),
    ) &&
    object(inventory) &&
    Array.isArray(inventory.skills) &&
    inventory.skills.every(reward) &&
    Array.isArray(inventory.items) &&
    inventory.items.every(reward) &&
    Array.isArray(v.choiceLog) &&
    v.choiceLog.every(choice)
  )
}

function validScrapbook(v: unknown): v is RoyalScrapbook {
  return (
    object(v) &&
    Object.entries(v).every(
      ([key, entry]) =>
        id(key) &&
        object(entry) &&
        entry.saveId === key &&
        text(entry.name) &&
        count(entry.turnCount) &&
        strings(entry.endingKeys) &&
        strings(entry.characters) &&
        record(entry.fish, fish),
    )
  )
}

export function parseRoyalBackup(source: string): RoyalBackup {
  if (
    typeof source !== 'string' ||
    source.length > MAX_BYTES ||
    new TextEncoder().encode(source).byteLength > MAX_BYTES
  )
    throw new Error('Invalid or oversized royal archive (2 MB limit).')
  const value: unknown = JSON.parse(source)
  if (
    !object(value) ||
    !safeKeys(value) ||
    value.kind !== ROYAL_BACKUP_KIND ||
    value.version !== 1 ||
    !Array.isArray(value.reigns) ||
    !value.reigns.every(validReign) ||
    new Set(value.reigns.map((reign) => reign.saveId)).size !==
      value.reigns.length ||
    !validScrapbook(value.scrapbook)
  )
    throw new Error('Invalid or incompatible royal archive.')

  const reigns = value.reigns as RunSave[]
  for (const reign of reigns) {
    const cosmetics = reign.ruler.cosmetics
    if (cosmetics) {
      reign.ruler.cosmetics = text(cosmetics.presetId)
        ? { presetId: cosmetics.presetId }
        : {}
    }
  }
  return {
    kind: ROYAL_BACKUP_KIND,
    version: 1,
    reigns,
    scrapbook: value.scrapbook,
  }
}

export function royalBackup(
  reigns: RunSave[],
  scrapbook: RoyalScrapbook,
): RoyalBackup {
  return parseRoyalBackup(
    JSON.stringify({ kind: ROYAL_BACKUP_KIND, version: 1, reigns, scrapbook }),
  )
}

export function mergeRoyalScrapbooks(
  local: RoyalScrapbook,
  incoming: RoyalScrapbook,
): RoyalScrapbook {
  const merged = { ...local }
  for (const [key, entry] of Object.entries(incoming)) {
    const old = merged[key]
    if (!old) {
      merged[key] = entry
      continue
    }
    const fish = { ...old.fish }
    for (const [slug, caught] of Object.entries(entry.fish)) {
      const prior = Object.hasOwn(fish, slug) ? fish[slug] : undefined
      fish[slug] = {
        fishSlug: slug,
        firstCaughtTurn: Math.min(
          prior?.firstCaughtTurn ?? caught.firstCaughtTurn,
          caught.firstCaughtTurn,
        ),
        countCaught: Math.max(prior?.countCaught ?? 0, caught.countCaught),
        bestSizeCm: Math.max(prior?.bestSizeCm ?? 0, caught.bestSizeCm),
        bestQualityScore: Math.max(
          prior?.bestQualityScore ?? 0,
          caught.bestQualityScore,
        ),
      }
    }
    merged[key] = {
      saveId: key,
      name: entry.turnCount > old.turnCount ? entry.name : old.name,
      turnCount: Math.max(old.turnCount, entry.turnCount),
      endingKeys: [...new Set([...old.endingKeys, ...entry.endingKeys])].sort(),
      characters: [...new Set([...old.characters, ...entry.characters])].sort(),
      fish,
    }
  }
  return merged
}

export function mergeRoyalBackups(
  local: RoyalBackup,
  incoming: RoyalBackup,
): RoyalBackup {
  const reigns = new Map(local.reigns.map((reign) => [reign.saveId, reign]))
  for (const reign of incoming.reigns) {
    const old = reigns.get(reign.saveId)
    if (!old || Date.parse(reign.updatedAt) > Date.parse(old.updatedAt))
      reigns.set(reign.saveId, reign)
  }
  return royalBackup(
    [...reigns.values()],
    mergeRoyalScrapbooks(local.scrapbook, incoming.scrapbook),
  )
}
