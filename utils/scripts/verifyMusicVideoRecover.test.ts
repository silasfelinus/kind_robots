// utils/scripts/verifyMusicVideoRecover.test.ts
// music-video/t-033: a deleted video's song and stills can be re-adopted by a
// fresh import of the same spec (Silas, 2026-10-06: "restore the classic kind
// robots animation ... using the song we already made and the art being
// processed").
import assert from 'node:assert/strict'
import {
  adoptDeletedStills,
  adoptSong,
  firstStillAt,
  type RecoverableJob,
} from '../musicVideoRecover'
import { musicVideoSpecByKey, specToDoc } from '../musicVideoSpecs'

const classic = specToDoc(musicVideoSpecByKey('kind-robots-theme-classic')!)
const style = classic.settings.styleBible
const at = (minute: number) => new Date(Date.UTC(2026, 9, 6, 7, minute))

function still(
  id: number,
  videoId: number,
  sceneId: string,
  status: string,
  minute: number,
  artImageId: number | null = null,
  prompt?: string,
): RecoverableJob {
  const scene = classic.scenes.find((item) => item.id === sceneId)
  return {
    id,
    status,
    createdAt: at(minute),
    artImageId,
    payload: {
      promptString: prompt ?? `${scene?.prompt ?? 'unknown'}, ${style}`,
      musicVideo: { videoId, sceneId, dedupeKey: `k${id}` },
    },
  }
}

const jobs: RecoverableJob[] = [
  // Deleted video 3: the classic theme, mostly rendered.
  still(101, 3, 's01', 'DONE', 10, 9001),
  still(102, 3, 's02', 'FAILED', 11),
  still(103, 3, 's02', 'DONE', 12, 9003),
  still(104, 3, 's03', 'RUNNING', 13),
  still(105, 3, 's04', 'PENDING', 14),
  // Deleted video 5: the android rewrite; different prompts, never matches.
  still(201, 5, 's01', 'DONE', 30, 9101, 'a cosmic candy-coloured city'),
  // Live video 7 with classic prompts: never touched.
  still(301, 7, 's01', 'DONE', 40, 9201),
]

{
  const recovery = adoptDeletedStills(classic, jobs, new Set([7]))
  assert.equal(recovery.fromVideoId, 3)
  assert.equal(recovery.adopted, 4)
  const byId = new Map(recovery.scenes.map((scene) => [scene.id, scene]))
  assert.deepEqual(byId.get('s01')?.image, {
    source: 'generated',
    jobId: 101,
    artImageId: 9001,
  })
  assert.equal(byId.get('s02')?.image.jobId, 103, 'a finished retry wins')
  assert.equal(byId.get('s03')?.image.jobId, 104, 'a running still is kept')
  assert.equal(byId.get('s03')?.image.artImageId, undefined)
  assert.equal(byId.get('s05')?.image.jobId, undefined, 'untouched scenes')
  assert.equal(firstStillAt(jobs, 3)?.getTime(), at(10).getTime())
}
console.log(
  '✅ the newest matching deleted video lends its stills, live ones never',
)

{
  const none = adoptDeletedStills(classic, jobs.slice(5), new Set([7]))
  assert.equal(none.fromVideoId, null)
  assert.equal(none.adopted, 0)
  assert.equal(none.scenes, classic.scenes)
}
console.log('✅ with no matching deleted copy nothing is adopted')

{
  const song = (
    id: number,
    status: string,
    minute: number,
    tags: string,
    artImageId: number | null,
  ): RecoverableJob => ({
    id,
    status,
    createdAt: at(minute),
    artImageId,
    payload: {
      promptString: tags,
      engine: 'acestep',
      audio: { durationSeconds: 75, bpm: 140, seed: 31 },
    },
  })
  const tags = 'synth rock, heroic, male and female duet vocals'
  const picked = adoptSong(
    [
      song(50, 'DONE', 5, 'something else', 8001),
      song(51, 'DONE', 3, tags, 8002),
      song(52, 'FAILED', 6, tags, null),
    ],
    tags,
  )
  assert.deepEqual(picked, {
    source: 'comfy-acestep',
    jobId: 51,
    artImageId: 8002,
    tags,
    durationSec: 75,
    bpm: 140,
    seed: 31,
  })
  assert.equal(
    adoptSong([song(50, 'DONE', 5, 'something else', 8001)], tags)?.jobId,
    50,
    'without a tag match, the newest finished song',
  )
  assert.equal(adoptSong([song(52, 'FAILED', 6, tags, null)], tags), null)
}
console.log('✅ the song is the finished ACE-Step job with matching tags')

console.log('✅ verifyMusicVideoRecover: all assertions passed')
