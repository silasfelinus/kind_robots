/**
 * List every Memory Dungeon image the game can display, check which ones the
 * media host already serves (ranged GET; the host answers HEAD with 404), and
 * write the missing ones as art requests for Conductor's ledger.
 *
 *   npx tsx utils/scripts/exportMemoryArtRequests.ts <out.json>
 *
 * Covers e03-e12 overworld scenes and choices, every hand-written dungeon's
 * rooms and choices (including e07's Red Oven), the illustrated opening and
 * the 32 core endings. Prompts are contract-safe: no text-negation piles.
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { OVERWORLD_EVENT_CATALOG } from '../memoryDungeon/overworldEventCatalog'
import { INTRO_PANELS } from '../memoryDungeon/introPanels'
import { MEMORY_CORE_ENDINGS } from '../memoryDungeon/reimaginerCampaign'
import { HOSHIMORI_OVEN_ROOMS } from '../memoryDungeon/hoshimoriWarm'
import {
  coreEndingArtPath,
  dungeonChoiceArtPath,
  dungeonRoomArtPath,
} from '../memoryDungeon/authoredDungeon/art'
import { SUBLEVEL_B } from '../memoryDungeon/sublevelB'
import { DROWNED_ARCHIVE } from '../memoryDungeon/drownedArchive'
import { BREATHING_WORKS } from '../memoryDungeon/breathingWorks'
import { CHOKING_WORKS } from '../memoryDungeon/chokingWorks'
import { FURNACE_OF_NAMES } from '../memoryDungeon/furnaceOfNames'
import { BRIAR_VAULT } from '../memoryDungeon/briarVault'
import { SPECIMEN_STACKS } from '../memoryDungeon/specimenStacks'
import { WELL_OF_RECORDS } from '../memoryDungeon/wellOfRecords'
import { BRINE_TUNNEL } from '../memoryDungeon/brineTunnel'

export interface MemoryArtRequest {
  id: string
  path: string
  prompt: string
  label: string
  priority: number
}

const FINISH =
  'cinematic staging, legible expressions and physical action, every surface bare and unmarked.'
const DUNGEON_STYLE: Record<string, string> = {
  SB: 'hand-painted gouache of a mundane after-hours research archive basement, strip lights and cold concrete',
  DA: 'hand-painted gouache of a flooding municipal archive, rising water and soaked paper under emergency light',
  GT: 'painted dark-fairytale undersea palace service tunnels, bioluminescent coral and brass pipes',
  CW: 'painted dark-fairytale horror of warped undersea service works, choking currents and corroded brass',
  FN: 'ink-wash yokai horror inside an enormous bakery oven, embers and paper names',
  OV: 'warm Ghibli-toned painting inside a village bakery oven of memories, lantern light and flour dust',
  BV: 'painted dark-fairytale interior of a living memory house merged with an office, briar roots and fluorescent light',
  SP: 'painted dark-fairytale archive stair of filing drawers among pine roots beneath a research lab',
  WR: 'painted dark-fairytale sealed undersea well of records, shelves of drowned documents and silt',
  BT: 'painted Hoshimori night horror, a flooded railway tunnel of coral bells and transfer carts',
}

function dungeonRequests(dungeon: {
  def: { prefix: string }
  rooms: Readonly<
    Record<
      string,
      {
        id: string
        title: string
        artSubject: string
        choices: readonly { id: string; label: string; artSubject: string }[]
      }
    >
  >
}): MemoryArtRequest[] {
  const prefix = dungeon.def.prefix
  const style = DUNGEON_STYLE[prefix] ?? 'painted dark-fairytale dungeon'
  return Object.values(dungeon.rooms).flatMap((room) => [
    {
      id: `dungeon-${room.id.toLowerCase()}`,
      path: dungeonRoomArtPath(prefix, room.id),
      prompt: `${room.artSubject}. Original ${style}. Wide establishing shot of the room, ${FINISH}`,
      label: `${room.id} ${room.title}`,
      priority: 30,
    },
    ...room.choices.map((choice) => ({
      id: `dungeon-${room.id.toLowerCase()}-${choice.id}`,
      path: dungeonChoiceArtPath(prefix, room.id, choice.id),
      prompt: `${choice.artSubject}. Original ${style}. The moment after the choice, ${choice.label}, medium shot, ${FINISH}`,
      label: `${room.id} ${room.title}: ${choice.label}`,
      priority: 20,
    })),
  ])
}

/**
 * Keep every prompt inside the server's art prompt contract: state what is in
 * the picture, never what is absent; no conditions; no "frame" as a noun.
 */
export function cleanArtPrompt(prompt: string): string {
  return prompt
    .replace(/\b(?:only (?:if|when))\b[^,.;]*/gi, '')
    .replace(/(?:,\s*|\s+)(?:no|not|without|never)\s[^,.;]*/gi, '')
    .replace(/\bwalking frame\b/gi, 'walking stick')
    .replace(/\b(?:gilt-)?framed\b/gi, 'gilt-edged')
    .replace(/\bframes\b/gi, 'borders')
    .replace(/\bframe\b/gi, 'border')
    .replace(/\s+([,.;])/g, '$1')
    .replace(/([.!?])\s*\./g, '$1')
    .replace(/,\s*\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function memoryArtRequests(): MemoryArtRequest[] {
  const all: MemoryArtRequest[] = []
  for (const panel of INTRO_PANELS)
    all.push({
      id: `intro-${panel.id}`,
      path: panel.artPath,
      prompt: panel.artPrompt,
      label: `Opening: ${panel.title}`,
      priority: 60,
    })
  MEMORY_CORE_ENDINGS.forEach((ending, id) =>
    all.push({
      id: `ending-core-${String(id + 1).padStart(2, '0')}`,
      path: coreEndingArtPath(id),
      prompt: `${ending.title}. ${ending.closing} Original painted dark-fairytale epilogue tableau of forest, city, sea and lantern village at peace, Rowan, Morrow, Char, Scylla, Vesper, Pip and Oren among the people, wide shot, ${FINISH}`,
      label: `Ending ${id + 1}: ${ending.title}`,
      priority: 60,
    }),
  )
  const late = new Set([
    'e03',
    'e04',
    'e05',
    'e06',
    'e07',
    'e08',
    'e09',
    'e10',
    'e11',
    'e12',
  ])
  for (const event of OVERWORLD_EVENT_CATALOG) {
    if (!late.has(event.experience)) continue
    all.push({
      id: `scene-${event.experience}-${event.key.replace(',', '-')}`,
      path: event.sceneArt.path,
      prompt: event.sceneArt.prompt,
      label: `${event.experience} ${event.key} ${event.title}`,
      priority: 60,
    })
    for (const choice of event.choices)
      all.push({
        id: `choice-${event.experience}-${event.key.replace(',', '-')}-${choice.id}`,
        path: choice.art.path,
        prompt: choice.art.prompt,
        label: `${event.experience} ${event.key} ${event.title}: ${choice.label}`,
        priority: 40,
      })
  }
  for (const dungeon of [
    SUBLEVEL_B,
    DROWNED_ARCHIVE,
    BREATHING_WORKS,
    CHOKING_WORKS,
    FURNACE_OF_NAMES,
    BRIAR_VAULT,
    SPECIMEN_STACKS,
    WELL_OF_RECORDS,
    BRINE_TUNNEL,
  ])
    all.push(
      ...dungeonRequests(
        dungeon as unknown as Parameters<typeof dungeonRequests>[0],
      ),
    )
  for (const room of HOSHIMORI_OVEN_ROOMS) {
    all.push({
      id: `dungeon-${room.id.toLowerCase()}`,
      path: dungeonRoomArtPath('OV', room.id),
      prompt: `${room.title}: ${room.opening} Original ${DUNGEON_STYLE.OV}. Wide establishing shot of the room, ${FINISH}`,
      label: `${room.id} ${room.title}`,
      priority: 30,
    })
    for (const choice of room.choices)
      all.push({
        id: `dungeon-${room.id.toLowerCase()}-${choice.id}`,
        path: dungeonChoiceArtPath('OV', room.id, choice.id),
        prompt: `${choice.outcome} Original ${DUNGEON_STYLE.OV}. The moment after the choice, ${choice.label}, medium shot, ${FINISH}`,
        label: `${room.id} ${room.title}: ${choice.label}`,
        priority: 20,
      })
  }
  const seen = new Set<string>()
  return all
    .filter((request) => {
      if (seen.has(request.path)) return false
      seen.add(request.path)
      return true
    })
    .map((request) => ({ ...request, prompt: cleanArtPrompt(request.prompt) }))
}

async function served(path: string): Promise<boolean> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch('https://kindrobots.org' + path, {
        headers: { Range: 'bytes=0-63' },
      })
      await response.body?.cancel()
      if (response.status === 404) return false
      if (response.status === 200 || response.status === 206)
        return (response.headers.get('content-type') ?? '').startsWith('image/')
    } catch {
      // retry
    }
  }
  return false
}

async function main(out: string): Promise<void> {
  const all = memoryArtRequests()
  const missing: MemoryArtRequest[] = []
  let next = 0
  await Promise.all(
    Array.from({ length: 16 }, async () => {
      while (next < all.length) {
        const request = all[next++]!
        if (!(await served(request.path))) missing.push(request)
      }
    }),
  )
  missing.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
  writeFileSync(out, JSON.stringify(missing, null, 1))
  console.log(
    `${missing.length} of ${all.length} Memory Dungeon images still to paint`,
  )
}

if (
  process.argv[2] &&
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
)
  await main(process.argv[2])
