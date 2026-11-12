// Every achievement art prompt must survive the claim-time prompt contract.
//
// 2026-11-12: ArtJob 68401 (comet-city-academy "dossiers") was queued
// from the catalog, then failed at claim with a frame-noun violation: "a wall
// of framed villain dossiers ... each frame holding". Nothing checked catalog
// prompts before they became jobs, so the fault surfaced only as a FAILED job
// on the render queue. This builds the real queue payload for every catalog
// prompt and applies the same check the claim endpoint runs.
import assert from 'node:assert/strict'
import { GAME_ACHIEVEMENTS } from '../achievements/gameAchievements'
import { buildAchievementArtPayload } from '../../scripts/generate_achievement_art'
import { assertQueuedArtPromptContract } from '../../server/utils/artJobQueueSettings'

const failures: string[] = []
let checked = 0

GAME_ACHIEVEMENTS.forEach((achievement, index) => {
  const artPrompt = String(achievement.artPrompt || '').trim()
  if (!artPrompt) return
  checked += 1
  const payload = buildAchievementArtPayload({
    id: index + 1,
    triggerCode: `${achievement.game}:${achievement.key}`,
    artPrompt,
  })
  try {
    assertQueuedArtPromptContract('COMFY', payload)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    failures.push(
      `${achievement.game}/${achievement.key}: ${message.slice(0, 400)}`,
    )
  }
})

assert.ok(checked > 300, `expected the full catalog, checked ${checked}`)
assert.deepEqual(
  failures,
  [],
  `${failures.length} achievement art prompt(s) would fail at claim:\n${failures.join('\n')}`,
)

console.log(
  `Achievement art prompts pass the claim-time contract (${checked} checked).`,
)
