import { readFileSync } from 'node:fs'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import { ART_STYLE, villainById } from '../crystalStreet/rules'
import {
  duplicateIds,
  validateCompanion,
  validateEncounter,
  validateDeck,
  validateItem,
  validateLocation,
  validateVillain,
} from '../crystalStreet/validate'
import type { Choice, Encounter } from '../crystalStreet/types'

const [kind, path, villainId] = process.argv.slice(2)
if (!kind || !path) {
  console.error(
    'usage: npx tsx utils/scripts/checkCrystalStreetFile.ts <villains|companions|locations|decks|items|encounters> <file.json> | edges <file.json> <villain-id>',
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
const contract = (where: string, prompt: string | undefined) => {
  if (!prompt) return
  for (const v of checkArtPromptContract({
    prompt: `${prompt}, ${ART_STYLE}`,
    engine: 'krea2',
  }))
    problems.push(`${where} art: ${v.rule}: ${v.detail}`)
}
if (kind === 'edges') {
  // Drafted finale edge choices for one nightmare: validated as part of its
  // finale, with the art contract on every outcome.
  const villain = villainById(villainId ?? '')
  if (!villain) {
    console.error(`unknown villain ${villainId}`)
    process.exit(2)
  }
  const draft = {
    ...villain,
    finale: {
      ...villain.finale,
      choices: [...villain.finale.choices, ...(data as Choice[])],
    },
  }
  validateVillain(problems, draft)
  const ids = draft.finale.choices.map((c) => c.id)
  if (new Set(ids).size !== ids.length)
    problems.push('duplicate finale choice id')
  for (const c of data as Choice[]) {
    contract(`edge ${c.id} success`, c.success?.art)
    contract(`edge ${c.id} failure`, c.failure?.art)
  }
  if (problems.length) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
  console.log(`${path}: ${data.length} edges OK for ${villainId}`)
  process.exit(0)
}
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
