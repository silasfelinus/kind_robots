// GET /api/playbook-forge/gestation
//
// The daily playbook challenge's concepts, read from Conductor: the dated
// dockets in pitches/playbook-challenges (newest MAX_DOCKETS days), editorial
// memory (MEMORY.yaml) and Silas's notes (SILAS-NOTES.yaml). Admin only;
// read-only. The Forge's Gestation screen shows them.
import { defineEventHandler } from 'h3'
import { parse as parseYaml } from 'yaml'
import { requireAdminApiUser } from '~/server/utils/authGuard'
import { conductorGet, conductorList } from '~/server/utils/conductor-github'
import {
  GESTATION_DIR,
  GESTATION_NOTES,
  buildGestation,
} from '~/utils/playbookForge/gestation'

const MAX_DOCKETS = 21
const DATED = /^(\d{4}-\d{2}-\d{2})\.yaml$/

async function readYaml(path: string): Promise<unknown> {
  const file = await conductorGet(path)
  if (!file?.content) return null
  try {
    return parseYaml(file.content)
  } catch {
    return null
  }
}

export default defineEventHandler(async (event) => {
  await requireAdminApiUser(event)
  const entries = (await conductorList(GESTATION_DIR)) ?? []
  const dates = entries
    .flatMap((entry) => {
      const date =
        entry.type === 'file' ? DATED.exec(entry.name)?.[1] : undefined
      return date ? [date] : []
    })
    .sort()
    .slice(-MAX_DOCKETS)
  const [dockets, memory, notes] = await Promise.all([
    Promise.all(
      dates.map(async (date) => ({
        date,
        data: await readYaml(`${GESTATION_DIR}/${date}.yaml`),
      })),
    ),
    readYaml(`${GESTATION_DIR}/MEMORY.yaml`),
    readYaml(GESTATION_NOTES),
  ])
  const concepts = buildGestation(dockets, memory, notes)
  return {
    success: true,
    message: `${concepts.length} concepts from ${dates.length} dockets.`,
    data: { concepts, dockets: dates },
  }
})
