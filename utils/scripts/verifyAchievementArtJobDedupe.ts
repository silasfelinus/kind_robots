import assert from 'node:assert/strict'
import {
  ACHIEVEMENT_ART_ENGINE,
  ACHIEVEMENT_ART_VERSION,
  achievementArtVersionMarker,
  achievementEntityMarker,
  buildAchievementArtPayload,
} from '../../scripts/generate_achievement_art'

const payloadFor = (id: number) =>
  buildAchievementArtPayload({
    id,
    triggerCode: `achievement-${id}`,
    artPrompt: 'A friendly robot achievement emblem',
  })

const serializedPayloadFor = (id: number) => JSON.stringify(payloadFor(id))

assert.ok(serializedPayloadFor(9).includes(achievementEntityMarker(9)))
assert.ok(!serializedPayloadFor(978).includes(achievementEntityMarker(9)))
assert.ok(!serializedPayloadFor(10).includes(achievementEntityMarker(1)))
assert.ok(serializedPayloadFor(978).includes(achievementEntityMarker(978)))
assert.ok(serializedPayloadFor(9).includes(achievementArtVersionMarker()))

const payload = payloadFor(9)
const workflow = payload.workflow as Record<
  string,
  { class_type?: string; inputs?: Record<string, unknown> }
>
const provenance = payload.provenance as Record<string, unknown>

assert.equal(ACHIEVEMENT_ART_ENGINE, 'COMFY')
assert.equal(payload.achievementArtVersion, ACHIEVEMENT_ART_VERSION)
assert.equal(workflow['1']?.class_type, 'UnetLoaderGGUF')
assert.equal(workflow['1']?.inputs?.unet_name, 'Krea-2-Turbo-Q5_K_S.gguf')
assert.equal(workflow['2']?.inputs?.clip_name, 'qwen3vl_4b_fp8_scaled.safetensors')
assert.equal(workflow['5']?.inputs?.vae_name, 'qwen_image_vae.safetensors')
assert.equal(workflow['9']?.class_type, 'SaveImage')
assert.equal(provenance.requireCompletionProof, true)
assert.equal(provenance.workflowPromptMatches, true)
assert.equal(
  provenance.idempotencyKey,
  `achievement:9:${ACHIEVEMENT_ART_VERSION}`,
)
assert.ok(String(payload.attemptFingerprint || '').length > 0)

console.log('Achievement ArtJob Comfy + exact-ID dedupe contract passed.')
