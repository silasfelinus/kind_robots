// /utils/scripts/verifyMusicVideoSong.test.ts
//
// Contract test for music-video/t-010: the ACE-Step 1.5 song graph, the song
// enqueue request, and the two queue guards a song job has to pass.
//
// The assertions that earn their keep:
// - The graph keeps its two linked pairs in step (duration on the encoder and
//   the latent, seed on the encoder and the sampler).
// - A song job's promptString is found among the graph's text candidates, so
//   enrichArtJobPayload does not 400 it at claim. Without the `tags` key in the
//   candidate set every song job died with "workflow prompt does not match".
// - Lyrics never reach promptString, and the claim-time image prompt contract
//   does not judge an audio payload at all.
import assert from 'node:assert/strict'

import { emptyMusicVideoDoc, normalizeMusicVideoDoc } from '../musicVideoDoc.js'
import { buildSongEnqueueRequest, buildSongTags } from '../musicVideoSong.js'
import {
  ACESTEP_INSTRUMENTAL_LYRICS,
  aceStepTimeoutSeconds,
  buildAceStepSongWorkflow,
} from '../../server/api/comfy/acestep/utils/workflow.js'
import {
  enrichArtJobPayload,
  extractWorkflowTextCandidates,
} from '../../server/utils/artJobProvenance.js'
import { assertQueuedArtPromptContract } from '../../server/utils/artJobQueueSettings.js'
import { repairFramePromptDeep } from '../../server/utils/artJobNormalization.js'

function node(
  workflow: ReturnType<typeof buildAceStepSongWorkflow>,
  id: string,
) {
  const found = workflow[id]
  assert.ok(found, `node ${id} exists`)
  return found
}

{
  const workflow = buildAceStepSongWorkflow({
    tags: '  synth rock,\n  bright brass  ',
    lyrics: '[Verse 1]\nHello rooftop',
    durationSeconds: 61.4,
    bpm: 128,
    seed: 4242,
    keyscale: 'F# minor',
    timeSignature: '3/4',
    language: 'EN',
  })
  assert.deepEqual(
    Object.values(workflow).map((n) => n.class_type),
    [
      'UNETLoader',
      'DualCLIPLoader',
      'VAELoader',
      'ModelSamplingAuraFlow',
      'TextEncodeAceStepAudio1.5',
      'ConditioningZeroOut',
      'EmptyAceStep1.5LatentAudio',
      'KSampler',
      'VAEDecodeAudio',
      'SaveAudioAdvanced',
    ],
  )
  const encoder = node(workflow, '5').inputs
  const latent = node(workflow, '7').inputs
  const sampler = node(workflow, '8').inputs
  assert.equal(encoder.tags, 'synth rock, bright brass')
  assert.equal(encoder.lyrics, '[Verse 1]\nHello rooftop')
  assert.equal(encoder.duration, 61)
  assert.equal(latent.seconds, 61, 'duration pair agrees')
  assert.equal(encoder.seed, 4242)
  assert.equal(sampler.seed, 4242, 'seed pair agrees')
  assert.equal(encoder.bpm, 128)
  assert.equal(encoder.keyscale, 'F# minor')
  assert.equal(encoder.timesignature, '3')
  assert.equal(encoder.language, 'en')
  assert.equal(sampler.steps, 8)
  assert.equal(sampler.cfg, 1)
  assert.deepEqual(sampler.negative, ['6', 0])
  assert.equal(node(workflow, '10').inputs.format, 'mp3')
}
console.log(
  '✅ the ACE-Step graph keeps duration and seed pairs in step at 8 steps, cfg 1, mp3',
)

{
  const workflow = buildAceStepSongWorkflow({
    tags: 'lofi',
    lyrics: '   ',
    durationSeconds: 5000,
    bpm: 999,
    keyscale: 'H major',
    timeSignature: '7/8',
    language: 'english',
  })
  const encoder = node(workflow, '5').inputs
  assert.equal(encoder.lyrics, ACESTEP_INSTRUMENTAL_LYRICS)
  assert.equal(encoder.duration, 600)
  assert.equal(node(workflow, '7').inputs.seconds, 600)
  assert.equal(encoder.bpm, 300)
  assert.equal(encoder.keyscale, 'E minor')
  assert.equal(encoder.timesignature, '4')
  assert.equal(encoder.language, 'en')
  assert.equal(
    encoder.seed,
    node(workflow, '8').inputs.seed,
    'random seed is shared',
  )
  assert.throws(() =>
    buildAceStepSongWorkflow({ tags: ' ', lyrics: '', durationSeconds: 60 }),
  )
  assert.ok(aceStepTimeoutSeconds(240) >= 600)
  assert.equal(aceStepTimeoutSeconds(10), 300)
}
console.log(
  '✅ out-of-range song settings clamp to safe values; empty lyrics mean instrumental',
)

const doc = normalizeMusicVideoDoc({
  ...emptyMusicVideoDoc({
    pitch: 'Kind Robots tend a rooftop garden',
    settings: {
      durationSec: 90,
      bpm: 110,
      genre: 'synth rock',
      mood: 'triumphant',
      vocal: 'male',
    },
  }),
  lyrics: {
    sections: [
      {
        id: 'v1',
        kind: 'verse',
        lines: ['If the rain comes we stand tall', 'No frame can hold us'],
        locked: false,
      },
      { id: 'c1', kind: 'chorus', lines: ['Kind robots, rise'], locked: false },
    ],
  },
}).doc

{
  assert.equal(buildSongTags(doc), 'synth rock, triumphant, male lead vocals')
  assert.equal(buildSongTags(doc, '  chiptune ,  8-bit '), 'chiptune , 8-bit')
  const request = buildSongEnqueueRequest(doc, {
    seed: 7,
    projectSlug: 'music-video',
  })
  assert.equal(request.engine, 'acestep')
  assert.equal(request.promptString, 'synth rock, triumphant, male lead vocals')
  assert.ok(request.lyrics.includes('[Verse 1]'))
  assert.ok(request.lyrics.includes('If the rain comes we stand tall'))
  assert.ok(
    !request.promptString.includes('rain'),
    'lyrics never reach promptString',
  )
  assert.equal(request.durationSeconds, 90)
  assert.equal(request.bpm, 110)
  assert.equal(request.seed, 7)
  assert.equal(request.isPublic, false)

  const instrumental = normalizeMusicVideoDoc({
    ...doc,
    settings: { ...doc.settings, vocal: 'instrumental' },
  }).doc
  assert.equal(
    buildSongEnqueueRequest(instrumental, { projectSlug: 'music-video' })
      .lyrics,
    '',
  )
}
console.log(
  '✅ the song request carries tags as promptString and lyrics separately',
)

{
  const request = buildSongEnqueueRequest(doc, {
    seed: 7,
    projectSlug: 'music-video',
  })
  const workflow = buildAceStepSongWorkflow({
    tags: request.promptString,
    lyrics: request.lyrics,
    durationSeconds: request.durationSeconds,
    bpm: request.bpm,
    seed: request.seed,
  })
  const candidates = extractWorkflowTextCandidates(workflow)
  assert.ok(
    candidates.includes(request.promptString),
    'tags are a text candidate',
  )
  assert.ok(
    !candidates.some((candidate) => candidate.includes('stand tall')),
    'lyrics are not a text candidate',
  )
  const payload = {
    workflow,
    promptString: request.promptString,
    engine: 'acestep',
    media: 'audio',
    save: {
      isPublic: false,
      isMature: false,
      designer: 'Music Video',
      artCollectionIds: [],
    },
  }
  const { provenance } = enrichArtJobPayload('COMFY', payload, {
    projectSlug: 'music-video',
  })
  assert.equal(provenance.workflowPromptMatches, true)

  // The lyrics above say "If ... comes" and "No frame": an image job with that
  // text would fail the contract. A song job is not judged by it.
  const lyricPrompt = 'If the rain comes we stand tall, no frame can hold us'
  const songPayload = {
    ...payload,
    promptString: 'frame drum, framed by brass',
  }
  assert.deepEqual(
    repairFramePromptDeep(songPayload),
    songPayload,
    'the claim-time frame rewrite leaves a song payload untouched',
  )
  assert.doesNotThrow(() =>
    assertQueuedArtPromptContract('COMFY', {
      ...payload,
      promptString: lyricPrompt,
    }),
  )
  assert.throws(() =>
    assertQueuedArtPromptContract('COMFY', {
      promptString: lyricPrompt,
      engine: 'krea2',
      steps: 8,
      cfg: 1,
    }),
  )
}
console.log(
  '✅ song jobs pass provenance at claim, and the image prompt contract skips them',
)

console.log('✅ verifyMusicVideoSong: all assertions passed')
