import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import { allArtPrompts } from '../crystalStreet/artPrompts'
import {
  ART_STYLE,
  AVATARS,
  CHARACTERS,
  COMPANIONS,
  DECKS,
  ITEMS,
  LOCATIONS,
  TITLE_ART,
  VILLAINS,
} from '../crystalStreet/rules'

const prompts = allArtPrompts({
  villains: VILLAINS,
  companions: COMPANIONS,
  locations: LOCATIONS,
  decks: DECKS,
  items: ITEMS,
  avatars: AVATARS,
  characters: CHARACTERS,
  title: TITLE_ART,
})
let bad = 0
for (const { key, prompt } of prompts) {
  const violations = checkArtPromptContract({
    prompt: `${prompt}, ${ART_STYLE}`,
    engine: 'krea2',
  })
  if (!violations.length) continue
  bad++
  console.log(
    `${key}\t${violations.map((v) => `${v.rule}: ${v.detail}`).join(' | ')}\t${prompt}`,
  )
}
console.error(
  `${prompts.length} prompts, ${bad} violate the art prompt contract`,
)
process.exit(bad ? 1 : 0)
