// utils/scripts/verifyMusicVideoSpecs.test.ts
// music-video/t-033: the prepared specs import cleanly and every prompt passes
// the checks the server runs before it renders a still.
import assert from 'node:assert/strict'
import { normalizeMusicVideoDoc } from '../musicVideoDoc'
import {
  checkScenePrompt,
  composeScenePrompt,
  findBannedTerms,
} from '../musicVideoScenes'
import {
  MUSIC_VIDEO_SPECS,
  musicVideoSpecByKey,
  specToDoc,
} from '../musicVideoSpecs'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'

assert.deepEqual(
  MUSIC_VIDEO_SPECS.map((spec) => spec.key),
  ['kind-robots-theme', 'kind-robots-theme-classic', 'zuzu-intro'],
)
assert.equal(musicVideoSpecByKey('nope'), null)

for (const spec of MUSIC_VIDEO_SPECS) {
  const raw = specToDoc(spec)
  const { doc, errors } = normalizeMusicVideoDoc(raw)
  assert.deepEqual(errors, [], `${spec.key} normalizes without errors`)
  assert.equal(doc.scenes.length, spec.scenes.length)

  // Back to back from 0:00 to the end, each long enough to read.
  let at = 0
  for (const scene of doc.scenes) {
    assert.equal(scene.startSec, at, `${spec.key} ${scene.id} starts on time`)
    assert.ok(scene.endSec - scene.startSec >= 1, `${scene.id} lasts 1 s+`)
    at = scene.endSec
  }
  assert.equal(at, doc.settings.durationSec, `${spec.key} runs to the end`)

  // The hero shots are marked, each with an animation prompt.
  const heroes = doc.scenes.filter((scene) => scene.motion.kind === 'clip')
  assert.equal(heroes.length, doc.settings.heroShots, `${spec.key} hero count`)
  assert.ok(heroes.every((scene) => scene.motionPrompt?.trim()))

  // Every sung line lands on a scene; every scene ref points at a real line.
  const refs = new Set(
    doc.scenes.flatMap((scene) =>
      scene.lyricRefs.map((ref) => `${ref.sectionId}:${ref.lineIdx}`),
    ),
  )
  for (const section of doc.lyrics.sections) {
    section.lines.forEach((_, index) =>
      assert.ok(refs.has(`${section.id}:${index}`), `${section.id}:${index}`),
    )
  }
  if (doc.settings.vocal === 'instrumental') {
    assert.equal(doc.lyrics.sections.length, 0)
  }

  // Nothing banned anywhere a viewer or a model would see it.
  const texts = [
    spec.title,
    doc.pitch,
    doc.settings.styleBible,
    ...doc.lyrics.sections.flatMap((section) => section.lines),
    ...doc.scenes.flatMap((scene) => [scene.prompt, scene.motionPrompt ?? '']),
  ]
  for (const text of texts) {
    assert.deepEqual(
      findBannedTerms(text, doc.settings.bannedTerms),
      [],
      `${spec.key}: "${text.slice(0, 60)}"`,
    )
  }

  // The prompt rules the render route applies.
  const engine = spec.comicSeriesSlug ? 'comfy' : 'krea2'
  if (engine === 'krea2') {
    assert.deepEqual(checkScenePrompt(doc.settings.styleBible), [])
  }
  for (const scene of doc.scenes) {
    if (engine === 'krea2') {
      assert.deepEqual(checkScenePrompt(scene.prompt), [], scene.prompt)
    }
    const composed = composeScenePrompt(scene.prompt, doc.settings.styleBible)
    assert.deepEqual(
      checkArtPromptContract({
        prompt: composed,
        engine,
        steps: engine === 'krea2' ? 8 : 30,
        cfg: engine === 'krea2' ? 1 : 5,
      }),
      [],
      `${spec.key} ${scene.id}`,
    )
  }
}
console.log('✅ both prepared specs import cleanly and pass the prompt rules')

{
  const zuzu = specToDoc(musicVideoSpecByKey('zuzu-intro')!)
  const keyframes = zuzu.scenes
    .filter((scene) => scene.image.source === 'gallery')
    .map((scene) => scene.image.artImageId)
  assert.deepEqual(
    keyframes,
    [241913, 241899, 241879, 241883, 242435, 241893, 241913, 241920],
  )
  assert.equal(
    musicVideoSpecByKey('zuzu-intro')!.comicSeriesSlug,
    'zuzu-koala-assassin',
  )
  // Before the comic exists, stills still render in the Arthemy western lane.
  assert.equal(zuzu.settings.imageLaneKey, 'il-arthemy')
}
console.log('✅ the Zuzu intro starts from the vetted keyframes')

// Silas, 2026-10-06: our robots are androids, never "a bunch of metal
// robots", and the logo opens and closes the theme song.
{
  const theme = musicVideoSpecByKey('kind-robots-theme')!
  const placed = theme.scenes.flatMap((row, index) =>
    row.siteImage ? [[index, row.siteImage] as const] : [],
  )
  assert.deepEqual(placed, [
    [1, '/images/kindlogo_new.webp'],
    [10, '/images/amibotsquare1.webp'],
    [19, '/images/kindlogo_new.webp'],
  ])
  for (const [, sitePath] of placed) {
    assert.match(sitePath, /^\/images\/[A-Za-z0-9_\-/]+\.(webp|png|jpe?g)$/)
  }
  const doc = specToDoc(theme)
  assert.ok(doc.scenes[19]?.motionPrompt, 'the closing logo shot is animated')
  for (const scene of doc.scenes) {
    assert.doesNotMatch(
      scene.prompt,
      /\b(metal|metallic|scrap|bolts?|rust|wrench)\b/i,
    )
  }
  assert.ok(
    doc.scenes.every((scene) => !/\bAMI\b/.test(scene.prompt)),
    'names stay out of image prompts',
  )
}
console.log('✅ the theme song stars the androids, with the logo twice')

console.log('✅ verifyMusicVideoSpecs: all assertions passed')
