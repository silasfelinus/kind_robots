import { readFileSync } from 'node:fs'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import { ART_STYLE } from '../crystalStreet/rules'
import {
  duplicateIds,
  validateCompanion,
  validateEncounter,
  validateDeck,
  validateItem,
  validateLocation,
  validateVillain,
} from '../crystalStreet/validate'
import type { Encounter } from '../crystalStreet/types'

const [kind, path] = process.argv.slice(2)
if (!kind || !path) {
  console.error(
    'usage: npx tsx utils/scripts/checkCrystalStreetFile.ts <villains|companions|locations|decks|items|encounters> <file.json>',
  )
  process.exit(2)
}

const data: unknown = JSON.parse(readFileSync(path, 'utf8'))
if (!Array.isArray(data)) {
  console.error(`${path}: top level must be an array`)
  process.exit(1)
}

const problems: string[] = []
const encounters: Encounter[] = []
for (const entry of data) {
  if (kind === 'villains') {
    validateVillain(problems, entry)
    encounters.push(
      ...entry.signature,
      entry.finale,
      ...entry.clues.map((c: { encounter: Encounter }) => c.encounter),
    )
  } else if (kind === 'companions') {
    validateCompanion(problems, entry)
    encounters.push(entry.meet)
  } else if (kind === 'locations') {
    validateLocation(problems, entry)
    encounters.push(...entry.beats)
  } else if (kind === 'decks') {
    validateDeck(problems, entry)
    encounters.push(...entry.encounters)
  } else if (kind === 'encounters') {
    // A bare array of encounters (new signature scenes drafted for a nightmare).
    validateEncounter(problems, `encounter ${entry?.id}`, entry)
    encounters.push(entry)
    const prompts = [
      entry.art,
      ...(entry.choices ?? []).flatMap((c: Encounter['choices'][number]) => [
        c.success?.art,
        c.failure?.art,
      ]),
    ]
    for (const prompt of prompts.filter(Boolean))
      for (const v of checkArtPromptContract({
        prompt: `${prompt}, ${ART_STYLE}`,
        engine: 'krea2',
      }))
        problems.push(`encounter ${entry.id} art: ${v.rule}: ${v.detail}`)
  } else if (kind === 'items') validateItem(problems, entry)
  else {
    console.error(`unknown kind ${kind}`)
    process.exit(2)
  }
}
for (const id of duplicateIds(encounters.filter(Boolean)))
  problems.push(`duplicate encounter id ${id}`)

if (problems.length) {
  console.error(problems.join('\n'))
  console.error(`\n${problems.length} problem(s) in ${path}`)
  process.exit(1)
}
console.log(`${path}: ${data.length} ${kind} OK`)
