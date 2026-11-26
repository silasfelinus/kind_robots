import { decodeChronicle, decodeSaves } from './chronicle'
import type { Chronicle, SaveFile } from './chronicle'
import { decodeKitSave, type KitSave } from '../playbookKit/settings'

export interface DeepheartBackup {
  kind: 'deepheart'
  version: 1
  chronicle: Chronicle
  saves: SaveFile
  kit?: KitSave
}

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const strings = (value: unknown): boolean =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')
const count = (value: unknown): boolean =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0

function safeTree(value: unknown, depth = 0): boolean {
  if (depth > 32) return false
  if (Array.isArray(value))
    return value.every((item) => safeTree(item, depth + 1))
  if (!object(value)) return true
  return Object.entries(value).every(
    ([key, item]) =>
      !['__proto__', 'constructor', 'prototype'].includes(key) &&
      safeTree(item, depth + 1),
  )
}

function validHero(value: unknown): boolean {
  return (
    object(value) &&
    typeof value.presetId === 'string' &&
    typeof value.name === 'string' &&
    ['w', 'm', 'n'].includes(String(value.gender)) &&
    strings(value.drawnTo) &&
    typeof value.boon === 'string'
  )
}

function validRun(value: unknown): boolean {
  return (
    object(value) &&
    value.version === 1 &&
    typeof value.seed === 'number' &&
    Number.isSafeInteger(value.seed) &&
    typeof value.rng === 'number' &&
    validHero(value.hero) &&
    strings(value.companions) &&
    Array.isArray(value.party) &&
    value.party.length >= 2 &&
    value.party.length <= 4 &&
    value.party.every(
      (member) =>
        object(member) &&
        typeof member.id === 'string' &&
        typeof member.hp === 'number' &&
        typeof member.down === 'boolean',
    ) &&
    ['affinity', 'bonds', 'boons', 'flags'].every((key) =>
      object(value[key]),
    ) &&
    [
      'partners',
      'oaths',
      'seenEvents',
      'log',
      'moments',
      'reveals',
      'choices',
      'riddlesUsed',
    ].every((key) => strings(value[key])) &&
    Array.isArray(value.rooms) &&
    value.rooms.length === 7 &&
    value.rooms.every((layer) => Array.isArray(layer) && layer.every(object)) &&
    Array.isArray(value.notices) &&
    count(value.layer) &&
    Number(value.layer) < 3 &&
    count(value.depth) &&
    typeof value.mercy === 'number' &&
    Number.isFinite(value.mercy) &&
    [
      'map',
      'fight',
      'puzzle',
      'treasure',
      'choice',
      'camp',
      'loot',
      'finale',
      'court',
      'ended',
    ].includes(String(value.phase)) &&
    [
      'gold',
      'potions',
      'turns',
      'fights',
      'puzzlesSolved',
      'puzzlesFailed',
      'chests',
      'mimics',
      'deepening',
      'cleanLayers',
      'peakGold',
    ].every((key) => count(value[key]))
  )
}

export function parseDeepheartBackup(source: string): DeepheartBackup {
  if (
    typeof source !== 'string' ||
    new TextEncoder().encode(source).byteLength > 2 * 1024 * 1024
  )
    throw new Error('Invalid or oversized Deepheart archive.')
  const raw: unknown = JSON.parse(source)
  if (
    !object(raw) ||
    !safeTree(raw) ||
    raw.kind !== 'deepheart' ||
    raw.version !== 1 ||
    !object(raw.chronicle) ||
    !object(raw.saves) ||
    !Array.isArray(raw.saves.slots) ||
    raw.saves.slots.length > 4 ||
    !raw.saves.slots.every(
      (slot) =>
        object(slot) &&
        ['auto', 1, 2, 3].includes(slot.slot as string | number) &&
        typeof slot.savedAt === 'string' &&
        Number.isFinite(Date.parse(slot.savedAt)) &&
        typeof slot.label === 'string' &&
        validRun(slot.run),
    ) ||
    new Set(raw.saves.slots.map((slot) => slot.slot)).size !==
      raw.saves.slots.length
  )
    throw new Error('Invalid or incompatible Deepheart archive.')
  const c = raw.chronicle
  if (
    !Array.isArray(c.runs) ||
    c.runs.length > 60 ||
    !c.runs.every(
      (page) =>
        object(page) &&
        typeof page.id === 'string' &&
        validHero(page.hero) &&
        strings(page.companions) &&
        strings(page.partners) &&
        strings(page.oaths) &&
        strings(page.choices),
    ) ||
    !['met', 'supports', 'romances', 'endings', 'awarded'].every((key) =>
      strings(c[key]),
    ) ||
    !object(c.values) ||
    !Object.values(c.values).every(strings) ||
    !count(c.delves) ||
    !count(c.puzzles) ||
    (c.lastHero !== null && !validHero(c.lastHero))
  )
    throw new Error('Invalid Deepheart chronicle.')
  const chronicle = decodeChronicle(JSON.stringify(c))
  const saves = decodeSaves(JSON.stringify(raw.saves))
  if (!chronicle || !saves)
    throw new Error('Unsupported Deepheart save version.')
  if (raw.kit === undefined)
    return { kind: 'deepheart', version: 1, chronicle, saves }

  const kit = raw.kit
  if (
    !object(kit) ||
    kit.version !== 1 ||
    !object(kit.settings) ||
    !object(kit.progress) ||
    typeof kit.progress.trailerSeen !== 'boolean' ||
    !['moments', 'reveals', 'endings'].every((key) => {
      const entries = (kit.progress as Record<string, unknown>)[key]
      return object(entries) && Object.values(entries).every(
        (entry) => typeof entry === 'string',
      )
    })
  )
    throw new Error('Invalid Deepheart scrapbook or settings.')
  const decoded = decodeKitSave(JSON.stringify(kit))
  if (!decoded) throw new Error('Unsupported Deepheart kit save.')
  return { kind: 'deepheart', version: 1, chronicle, saves, kit: decoded }
}
