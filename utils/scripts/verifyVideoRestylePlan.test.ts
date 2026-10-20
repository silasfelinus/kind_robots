import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { checkArtPromptContract } from '../../server/utils/artPromptContract'
import {
  RESTYLE_PREVIEW_CFG,
  RESTYLE_PREVIEW_ENGINE,
  RESTYLE_PREVIEW_HEIGHT,
  RESTYLE_PREVIEW_SCENE,
  RESTYLE_PREVIEW_STEPS,
  RESTYLE_GRAB_BAG,
  RESTYLE_PREVIEW_WIDTH,
  RESTYLE_STYLES,
  RESTYLE_DEFAULT_OVERWRITE_STRENGTH,
  isRestyleOverwriteStrength,
  isRestyleLook,
  isRestyleStyle,
  normalizeGrabBagStyles,
  planRestyleSegments,
  planRestyleStyleSchedule,
  restyleLookLabel,
  restylePreviewPrompt,
  restyleRenderWindowCount,
  restyleScheduleRecipe,
  shuffleRestyleStyles,
} from '../videoRestylePlan'

assert.equal(RESTYLE_DEFAULT_OVERWRITE_STRENGTH, 100)
for (const value of [0, 25, 50, 100])
  assert.ok(isRestyleOverwriteStrength(value))
for (const value of [-1, 101, 0.5, NaN, '50', null]) {
  assert.ok(!isRestyleOverwriteStrength(value))
}
assert.equal(RESTYLE_STYLES.length, 33)
assert.equal(
  new Set(RESTYLE_STYLES.map((style) => style.id)).size,
  RESTYLE_STYLES.length,
)
assert.deepEqual(
  RESTYLE_STYLES.slice(0, 6).map((style) => style.id),
  ['illustrious', 'ink', 'watercolor', 'storybook', 'felt', 'noir'],
)
assert.equal(RESTYLE_PREVIEW_WIDTH % 64, 0)
assert.equal(RESTYLE_PREVIEW_HEIGHT % 64, 0)
assert.ok(RESTYLE_PREVIEW_HEIGHT > RESTYLE_PREVIEW_WIDTH)
for (const style of RESTYLE_STYLES) {
  assert.ok(style.prompt.trim(), `${style.id} needs a video prompt`)
  assert.ok(style.preview.trim(), `${style.id} needs a preview clause`)
  const prompt = restylePreviewPrompt(style.id)
  assert.ok(prompt.includes(RESTYLE_PREVIEW_SCENE))
  assert.deepEqual(
    checkArtPromptContract({
      prompt,
      engine: RESTYLE_PREVIEW_ENGINE,
      steps: RESTYLE_PREVIEW_STEPS,
      cfg: RESTYLE_PREVIEW_CFG,
    }),
    [],
    `${style.id} preview prompt breaks the art prompt contract`,
  )
}
assert.equal(isRestyleStyle('illustrious'), true)
assert.equal(isRestyleStyle('unverified'), false)
assert.throws(() => planRestyleSegments(0))
assert.throws(() => planRestyleSegments(901))
assert.throws(() => planRestyleSegments(10, 1, 1))
for (const duration of [1, 4.5, 5, 17, 30, 332, 900]) {
  const windows = planRestyleSegments(duration)
  assert.ok(windows.length > 0)
  assert.equal(windows[0]?.sourceStartSec, 0)
  assert.equal(windows[0]?.keepFromSec, 0)
  assert.equal(windows.at(-1)?.sourceEndSec, duration)
  assert.equal(windows.at(-1)?.keepToSec, duration)
  for (let index = 1; index < windows.length; index += 1) {
    const previous = windows[index - 1]!
    const current = windows[index]!
    assert.equal(previous.keepToSec, current.keepFromSec)
    assert.ok(previous.sourceEndSec >= current.sourceStartSec)
    assert.ok(current.sourceEndSec > current.sourceStartSec)
  }
}
console.info('Video restyle segment planning verified')

const studio = readFileSync('pages/admin/coat-dance.vue', 'utf8')
const source = readFileSync(
  'server/api/video-restyle/[id]/source.get.ts',
  'utf8',
)
const settings = readFileSync('server/api/video-restyle/[id].patch.ts', 'utf8')
assert.ok(!studio.includes('activePanel'))
assert.ok(studio.includes('Preview saved source'))
assert.ok(studio.includes('Save look & render full film'))
assert.ok(source.includes('requireAdminApiUser'))
assert.ok(source.includes('restyleSourcePath'))
assert.ok(settings.includes('updateRestyleSettings'))
assert.ok(settings.includes('body.overwriteStrength'))
assert.ok(studio.includes('Overwrite strength'))
assert.ok(studio.includes('v-model.number="overwriteStrength"'))
assert.match(studio, /title\.value\s*=\s*sourceFile\.value\.name/)
assert.ok(studio.includes('Save title'))
const renameRoute = readFileSync(
  'server/api/video-restyle/[id]/title.patch.ts',
  'utf8',
)
assert.ok(renameRoute.includes('requireAdminApiUser'))
assert.ok(renameRoute.includes('renameRestyleProject'))
const jobs = readFileSync('server/utils/videoRestyleJobs.ts', 'utf8')
assert.ok(jobs.includes('restyleOverwriteStrength(input.overwriteStrength'))
assert.ok(
  jobs.includes(
    'source.overwriteStrength ?? RESTYLE_DEFAULT_OVERWRITE_STRENGTH',
  ),
)
assert.ok(jobs.includes('renameRestyleProject('))

const pilot = readFileSync(
  'server/api/video-restyle/[id]/pilot.post.ts',
  'utf8',
)
const reconcile = readFileSync(
  'server/api/video-restyle/reconcile.post.ts',
  'utf8',
)
const artjob = readFileSync('server/utils/videoRestyleArtJob.ts', 'utf8')
const queueCard = readFileSync('components/art/artjob-queue-card.vue', 'utf8')
const media = readFileSync('utils/artJobMedia.ts', 'utf8')
assert.equal(
  artjob.match(/\.\.\.speedRecipe\(job\)/g)?.length,
  2,
  'pilot and full ArtJobs both carry the Fast draft speed',
)
assert.ok(media.includes('capabilities.supportsVideoRestyleFast === true'))
{
  const route = readFileSync('server/api/video-restyle/[id].delete.ts', 'utf8')
  assert.ok(route.includes('requireAdminApiUser'), 'delete is admin-only')
  assert.ok(route.includes('deleteRestyleProject(\n      auth.user.id'))
  const body = artjob.slice(
    artjob.indexOf('async function deleteRestyleProject'),
  )
  const refuse = body.indexOf("status: 'RUNNING'")
  const cancel = body.indexOf("status: 'CANCELLED'")
  const move = body.indexOf('await rename(folder, trash)')
  const wipe = body.indexOf('await rm(trash')
  assert.ok(refuse > 0, 'a project KR Relay is rendering is never deleted')
  assert.ok(
    refuse < cancel && cancel < move && move < wipe,
    'withdraw queued ArtJobs, then leave the listing, then remove bytes',
  )
  assert.ok(
    body.includes('`.deleted-${job.id}-'),
    'trash name is not a project id',
  )
  const page = readFileSync('pages/admin/coat-dance.vue', 'utf8')
  assert.ok(page.includes('window.confirm('), 'delete asks before removing')
  assert.ok(
    page.includes(':disabled="store.busy || isRendering(store.selected)"'),
  )
}
assert.ok(pilot.includes('syncRestylePilotArtJob'))
assert.ok(reconcile.includes('requireAdminApiUser'))
assert.ok(reconcile.includes('syncRestylePilotArtJob'))
assert.ok(artjob.includes('attemptFingerprint: fingerprint'))
assert.equal(
  artjob.match(/job\.overwriteStrength/g)?.length,
  6,
  'pilot and full ArtJobs both serialize a non-default overwrite strength',
)
assert.ok(artjob.includes('projectSlug: PROJECT_SLUG'))
assert.ok(artjob.includes('priority: -100'))
const vaceReport = readFileSync(
  'server/api/video-restyle/[id]/pilot/report.post.ts',
  'utf8',
)
const vaceSource = readFileSync(
  'server/api/video-restyle/[id]/pilot/source.get.ts',
  'utf8',
)
const vaceClaim = readFileSync('server/api/art/queue/claim.post.ts', 'utf8')
assert.ok(vaceClaim.includes('supportsVideoRestyle'))
assert.ok(vaceClaim.includes("mode: 'VACE_PILOT'"))
assert.ok(vaceReport.includes('requireClaimedVacePilot'))
assert.ok(vaceReport.includes('sha256'))
assert.ok(vaceSource.includes('requireClaimedVacePilot'))
assert.ok(artjob.includes("executor: 'kr-relay'"))
assert.ok(queueCard.includes('KR Relay will claim this VACE pilot'))

assert.ok(studio.includes('View ArtJob #'))
assert.ok(queueCard.includes('isRestylePilot'))
assert.ok(queueCard.includes('Open Coat Dance Studio'))
assert.ok(media.includes('capabilities.supportsVideoRestyle === true &&'))
assert.ok(media.includes('capabilities.supportsVideoRestyleGrabBag === true'))

const storeSource = readFileSync('stores/videoRestyleStore.ts', 'utf8')
const refreshSource = storeSource.slice(
  storeSource.indexOf('async function refresh()'),
  storeSource.indexOf('async function stage('),
)
assert.match(refreshSource, /['"]\/api\/video-restyle\/reconcile['"]/)
assert.match(refreshSource, /method: 'POST'/)
assert.match(refreshSource, /registrationError\.value/)
assert.ok(
  refreshSource.indexOf('/api/video-restyle/reconcile') <
    refreshSource.indexOf("'/api/video-restyle'"),
)
assert.match(studio, /ArtJob registration failed:/)
assert.match(studio, /Register in ArtJob/)

const artQueueList = readFileSync('server/api/art/queue/index.get.ts', 'utf8')
const artQueueStore = readFileSync('stores/artJobStore.ts', 'utf8')
const artQueueView = readFileSync(
  'components/art/artjob-queue-browser.vue',
  'utf8',
)
assert.ok(artQueueList.includes('where.id = jobId'))
assert.ok(
  artQueueStore.includes("params.set('jobId', String(state.focusedJobId))"),
)
assert.ok(artQueueView.includes('route.query.jobId'))
assert.ok(artQueueView.includes('Showing ArtJob #'))
assert.ok(studio.includes('store.selected.full?.artJobId'))
assert.ok(studio.includes('store.selected.pilot?.artJobId'))

const failedRequeue = readFileSync(
  'server/api/art/queue/reenqueue-failed.post.ts',
  'utf8',
)
const singleRequeue = readFileSync(
  'server/api/art/queue/[id]/requeue.post.ts',
  'utf8',
)
const specialRetry = readFileSync(
  'server/api/video-restyle/[id]/pilot/retry.post.ts',
  'utf8',
)
assert.ok(
  failedRequeue.indexOf('isVideoRestyleArtJobPayload(source.payload)') <
    failedRequeue.indexOf('normalizeQueuedArtJobPayload(source.payload)'),
)
assert.ok(failedRequeue.includes('retryFailedRestyleArtJob(source.id)'))
assert.ok(singleRequeue.includes('retryFailedRestyleArtJob(id)'))
assert.ok(specialRetry.includes('requireAdminApiUser'))
assert.ok(specialRetry.includes('retryFailedRestyleArtJob'))
assert.ok(artjob.includes("found.status === 'FAILED'"))
assert.ok(artjob.includes("status: 'PILOT_QUEUED'"))
assert.ok(artjob.includes("status: 'PENDING'"))
assert.ok(artjob.includes('attempts: 0'))
assert.ok(
  artjob.includes("where: { id, userId: job.userId, status: 'FAILED' }"),
)
assert.ok(!studio.includes('Render 24-second pilot'))
assert.ok(storeSource.includes('/pilot/retry'))

const queueSource = readFileSync('server/utils/videoRestyleJobs.ts', 'utf8')
const resultSource = readFileSync(
  'server/api/video-restyle/[id]/result.get.ts',
  'utf8',
)
assert.ok(queueSource.includes("job.status === 'REVIEW'"))
assert.ok(queueSource.includes('constants.COPYFILE_EXCL'))
assert.ok(queueSource.includes('previousRevision: priorRevision'))
assert.ok(queueSource.includes('revision: job.status'))
assert.ok(artjob.includes('revision === 1'))
assert.ok(artjob.includes(':revision:'))
assert.ok(resultSource.includes('getQuery(event).previous'))
assert.ok(resultSource.includes('previousRevision'))
assert.ok(resultSource.includes('requireAdminApiUser'))
assert.ok(!studio.includes('store.queuePilot('))
assert.ok(studio.includes('Watch previous pilot for comparison'))
assert.ok(studio.includes('▶ Previous pilot'))
assert.ok(storeSource.includes("previous ? '?previous=1' : ''"))

const variantsRoute = readFileSync(
  'server/api/video-restyle/[id]/variants.post.ts',
  'utf8',
)
const restyleJobs = readFileSync('server/utils/videoRestyleJobs.ts', 'utf8')
const newUpload = readFileSync('server/api/video-restyle/index.post.ts', 'utf8')
const settingsRoute = readFileSync(
  'server/api/video-restyle/[id].patch.ts',
  'utf8',
)
assert.ok(variantsRoute.includes('requireAdminApiUser'))
assert.ok(variantsRoute.includes('cloneRestyleVideo'))
assert.ok(restyleJobs.includes('export async function cloneRestyleVideo'))
assert.ok(
  restyleJobs.includes('sourceProjectId: source.sourceProjectId ?? source.id'),
)
assert.ok(restyleJobs.includes('sourceProjectId?: string'))
assert.ok(restyleJobs.includes('await copyFile('))
assert.ok(restyleJobs.includes('restyleSourcePath(source),'))
assert.ok(restyleJobs.includes("status: 'STAGED'"))
assert.ok(restyleJobs.includes('pilot: undefined'))
assert.ok(restyleJobs.includes('isPrivate: restyleFlag'))
assert.ok(restyleJobs.includes('isMature: restyleFlag'))
assert.ok(!restyleJobs.includes("job.style !== 'illustrious'"))
assert.ok(newUpload.includes("isMature: field('isMature')"))
assert.ok(settingsRoute.includes('body.isMature'))
assert.ok(artjob.includes('isPublic: false'))
assert.ok(artjob.includes('isMature: job.isMature ?? false'))
assert.ok(studio.includes('Render this look as a new film'))
assert.ok(studio.includes('How rendering works'))
assert.ok(studio.includes('statusLabel(job.status)'))
assert.ok(studio.includes('v-model="isMature"'))
assert.ok(storeSource.includes('/variants'))
assert.ok(storeSource.includes('isPrivate: boolean'))
assert.ok(storeSource.includes('isMature: boolean'))

const fullQueueRoute = readFileSync(
  'server/api/video-restyle/[id]/full.post.ts',
  'utf8',
)
const fullChunk = readFileSync(
  'server/api/video-restyle/[id]/full/chunk.post.ts',
  'utf8',
)
const fullComplete = readFileSync(
  'server/api/video-restyle/[id]/full/complete.post.ts',
  'utf8',
)
const fullRetry = readFileSync(
  'server/api/video-restyle/[id]/full/retry.post.ts',
  'utf8',
)
const claimedPilot = readFileSync('server/utils/claimedVacePilot.ts', 'utf8')
const planSource = readFileSync('utils/videoRestylePlan.ts', 'utf8')
assert.ok(fullQueueRoute.includes('requireAdminApiUser'))
assert.ok(fullQueueRoute.includes('queueRestyleFull'))
assert.ok(fullQueueRoute.includes('syncRestyleFullArtJob'))
assert.ok(restyleJobs.includes('export async function queueRestyleFull'))
assert.ok(restyleJobs.includes('FULL_QUEUEABLE'))
assert.ok(!restyleJobs.includes('Review the completed pilot before queueing'))
assert.ok(restyleJobs.includes("status: 'FULL_QUEUED'"))
assert.ok(restyleJobs.includes('startSec: 0'))
assert.ok(restyleJobs.includes('restyleRenderWindowCount(durationSec)'))
assert.ok(
  readFileSync('utils/videoRestylePlan.ts', 'utf8').includes(
    'Math.round(durationSec * RESTYLE_RENDER_FPS)',
  ),
)
assert.ok(reconcile.includes('syncRestyleFullArtJob'))
assert.ok(artjob.includes("phase: 'full'"))
assert.ok(artjob.includes('retryFailedRestyleFullArtJob'))
assert.ok(
  artjob.includes(
    "found.status === 'PENDING' && job.status === 'FULL_RUNNING'",
  ),
)
assert.ok(artjob.includes('coat-dance:full:'))
assert.ok(claimedPilot.includes("restyle?.phase === 'full'"))
assert.ok(claimedPilot.includes('plan.artJobId !== artJobId'))
assert.ok(vaceReport.includes("phase === 'full'"))
assert.ok(vaceReport.includes("'FULL_RUNNING'"))
assert.ok(vaceReport.includes("'FULL_FAILED'"))
assert.ok(vaceReport.includes('claimedAt: new Date()'))
assert.ok(
  vaceReport.includes('Math.max(requestedCompleted, plan.completedSegments)'),
)
assert.ok(fullChunk.includes('requireClaimedVacePilot'))
assert.ok(fullChunk.includes("phase !== 'full'"))
assert.ok(fullChunk.includes('4 * 1024 * 1024'))
assert.ok(fullChunk.includes('readRawBody(event, false)'))
assert.ok(fullChunk.includes("getHeader(event, 'content-length')"))
assert.ok(fullChunk.includes("getHeader(event, 'x-vace-chunk-sha256')"))
assert.ok(fullComplete.includes('requireClaimedVacePilot'))
assert.ok(fullComplete.includes("phase !== 'full'"))
assert.ok(fullComplete.includes("hasher.digest('hex') !== expectedSha"))
assert.ok(fullComplete.includes("status: 'DONE'"))
assert.ok(fullComplete.includes("resultFile: 'full.mp4'"))
assert.ok(fullComplete.includes('prisma.artJob.update'))
assert.ok(fullRetry.includes('requireAdminApiUser'))
assert.ok(fullRetry.includes('retryFailedRestyleFullArtJob'))
assert.ok(resultSource.includes("getQuery(event).full === '1'"))
assert.ok(storeSource.includes('async function queueFull('))
assert.ok(storeSource.includes('async function retryFull('))
assert.ok(storeSource.includes("'?full=1'"))
assert.ok(studio.includes('Render full'))
assert.ok(studio.includes('Watch finished full film'))
assert.ok(studio.includes('▶ Full film'))
assert.ok(studio.includes('Resume full film using saved windows'))
assert.ok(planSource.includes("'FULL_QUEUED'"))
assert.ok(planSource.includes("'FULL_RUNNING'"))
assert.ok(planSource.includes("'FULL_FAILED'"))

const previewUtil = readFileSync('server/utils/videoRestylePreviews.ts', 'utf8')
const previewGet = readFileSync(
  'server/api/video-restyle/previews.get.ts',
  'utf8',
)
const previewPost = readFileSync(
  'server/api/video-restyle/previews.post.ts',
  'utf8',
)
assert.ok(previewGet.includes('requireAdminApiUser'))
assert.ok(previewPost.includes('requireAdminApiUser'))
assert.ok(previewPost.includes('body.missing === true'))
assert.ok(previewUtil.includes("'/api/art/enqueue'"))
assert.ok(previewUtil.includes('projectSlug: PROJECT_SLUG'))
assert.ok(previewUtil.includes('restylePreview }'))
assert.ok(previewUtil.includes('/api/art/images/${artImageId}/file'))
assert.ok(storeSource.includes('async function loadStylePreviews('))
assert.ok(storeSource.includes('async function queueStylePreviews('))
assert.ok(studio.includes('store.stylePreviews[look.id]?.imageUrl'))
assert.ok(studio.includes('Generate all missing previews'))
assert.ok(studio.includes('Regenerate preview'))
assert.ok(studio.includes('store.loadStylePreviews()'))
assert.ok(!studio.includes('6 presets'))

// One screen: no Studio/Library tabs, no second project panel. The stage is
// the look picker until something plays, then the same space is the player.
assert.ok(!studio.includes("label: 'Studio'"))
assert.ok(!studio.includes("label: 'Library'"))
assert.ok(!studio.includes('03 / Projects'))
assert.ok(studio.includes("const stageView = ref<'looks' | 'video'>('looks')"))
assert.ok(studio.includes('v-show="stageView === \'video\'"'))
assert.ok(studio.includes('v-if="stageView === \'looks\'"'))
assert.ok(studio.includes('New from video'))
// The player fills the stage box and letterboxes: a grid auto row let the
// video take its intrinsic height and crop the frame and its controls.
assert.ok(
  studio.includes('class="absolute inset-0 h-full w-full object-contain"'),
)
assert.ok(!studio.includes('class="max-h-full w-full object-contain"'))
assert.ok(studio.includes('function cancelUpload()'))
assert.ok(studio.includes('projectOptionLabel(job)'))
assert.ok(studio.includes('rootTitle(store.selected)'))
assert.ok(studio.includes('Current video restyle project'))
assert.ok(studio.includes('selectJobFromPicker'))
assert.ok(studio.includes('Selected look: {{ labelFor(style) }}'))
assert.ok(studio.includes('aria-label="Selected look and next render"'))
assert.ok(studio.includes('Matches the saved'))
assert.ok(studio.includes('Your existing'))
assert.ok(studio.includes('Render settings ·'))
assert.ok(studio.includes('Upload & render full film'))
assert.ok(studio.includes('Available video versions'))
assert.ok(!studio.includes('Choose look / render'))
assert.ok(studio.includes('if (!sourceFile.value) return'))
assert.ok(!studio.includes("activePanel.value = 'source'"))
assert.ok(!studio.includes("activePanel.value = 'jobs'"))
assert.ok(
  !studio.includes('grid-cols-3 gap-1 rounded-xl bg-base-200 p-1 lg:hidden'),
)
assert.ok(!studio.includes('class="block text-[10px] opacity-65"'))

{
  const bag = ['illustrious', 'noir', 'paper-cut', 'watercolor'] as const
  assert.equal(isRestyleLook(RESTYLE_GRAB_BAG.id), true)
  assert.equal(isRestyleStyle(RESTYLE_GRAB_BAG.id), false)
  assert.ok(
    !RESTYLE_STYLES.some((entry) => String(entry.id) === RESTYLE_GRAB_BAG.id),
  )
  assert.equal(restyleLookLabel(RESTYLE_GRAB_BAG.id), 'Grab bag')
  assert.deepEqual(normalizeGrabBagStyles([...bag]), [...bag])
  assert.deepEqual(normalizeGrabBagStyles(bag.join(',')), [...bag])
  assert.equal(normalizeGrabBagStyles(['illustrious']), null)
  assert.equal(normalizeGrabBagStyles(['illustrious', 'illustrious']), null)
  assert.equal(normalizeGrabBagStyles(['illustrious', 'grab-bag']), null)
  assert.equal(normalizeGrabBagStyles(['illustrious', 'unverified']), null)
  const everyLook = RESTYLE_STYLES.map((s) => s.id)
  assert.deepEqual(
    normalizeGrabBagStyles(everyLook),
    everyLook,
    'Grab bag may include every look',
  )
  assert.equal(normalizeGrabBagStyles([...everyLook, everyLook[0]]), null)
  const allWindows = planRestyleStyleSchedule(0, 332, everyLook)
  assert.equal(
    new Set(allWindows.map((window) => window.styleId)).size,
    everyLook.length,
    'a full film with every look shows each of them',
  )

  const workerWindows = (frames: number) => {
    const starts = [0]
    while (starts.at(-1)! + 65 < frames) starts.push(starts.at(-1)! + 57)
    return starts.length
  }
  for (const seconds of [1, 4, 24, 30.4, 332, 900]) {
    assert.equal(
      restyleRenderWindowCount(seconds),
      workerWindows(Math.max(1, Math.round(seconds * 16))),
      `${seconds}s window count must match the VACE worker`,
    )
  }

  const full = planRestyleStyleSchedule(0, 332, bag)
  assert.equal(full.length, 94)
  assert.deepEqual(
    full.slice(0, 6).map((window) => window.styleId),
    ['illustrious', 'noir', 'paper-cut', 'watercolor', 'illustrious', 'noir'],
  )
  full.forEach((window, index) => {
    assert.equal(window.index, index)
    assert.equal(window.styleId, bag[index % bag.length])
  })

  const pilot = planRestyleStyleSchedule(158, 24, bag)
  assert.equal(pilot.length, 7)
  for (const window of pilot) {
    const atSameTime = full.find(
      (candidate) =>
        Math.abs(candidate.sourceStartSec - window.sourceStartSec) <
        57 / 16 / 2,
    )!
    assert.equal(
      window.styleId,
      atSameTime.styleId,
      'pilot shows the look the full film uses at the same source time',
    )
  }
  assert.deepEqual(
    planRestyleStyleSchedule(158, 24, bag),
    pilot,
    're-renders and retries never reshuffle',
  )
  for (let index = 1; index < pilot.length; index += 1) {
    assert.notEqual(pilot[index]!.styleId, pilot[index - 1]!.styleId)
  }

  const recipe = restyleScheduleRecipe(pilot)
  assert.deepEqual(
    recipe.styleSchedule.map((window) => window.styleId),
    pilot.map((window) => window.styleId),
  )
  assert.deepEqual(Object.keys(recipe.stylePrompts).sort(), [...bag].sort())
  assert.equal(
    recipe.stylePrompts.noir,
    RESTYLE_STYLES.find((entry) => entry.id === 'noir')!.prompt,
  )

  let seed = 7
  const seeded = () => (seed = (seed * 9301 + 49297) % 233280) / 233280
  const shuffled = shuffleRestyleStyles(bag, seeded)
  assert.deepEqual([...shuffled].sort(), [...bag].sort())
  assert.deepEqual([...bag], ['illustrious', 'noir', 'paper-cut', 'watercolor'])

  const jobsSource = readFileSync('server/utils/videoRestyleJobs.ts', 'utf8')
  assert.ok(jobsSource.includes('...passSchedule(job, startSec, durationSec)'))
  assert.ok(jobsSource.includes('...passSchedule(job, 0, durationSec)'))
  assert.ok(jobsSource.includes('full: undefined,'))
  const artJobSource = readFileSync(
    'server/utils/videoRestyleArtJob.ts',
    'utf8',
  )
  assert.ok(
    artJobSource.includes('grabBagRecipe(job, job.pilot.styleSchedule)'),
  )
  assert.ok(artJobSource.includes('grabBagRecipe(job, job.full.styleSchedule)'))
  const claimSource = readFileSync('server/api/art/queue/claim.post.ts', 'utf8')
  assert.ok(claimSource.includes('supportsVideoRestyleGrabBag'))
  const page = readFileSync('pages/admin/coat-dance.vue', 'utf8')
  assert.ok(page.includes('Loop in listed order'))
  assert.ok(page.includes('Shuffle once, then lock'))
  assert.ok(page.includes('addAllToGrabBag'))
  assert.ok(page.includes('Rotation order: {{ grabBagSequenceLabel }}'))
}
console.info('Grab bag rotation schedule verified')

{
  const { mkdtempSync, rmSync } = await import('node:fs')
  const { tmpdir } = await import('node:os')
  const { join } = await import('node:path')
  const privateRoot = mkdtempSync(join(tmpdir(), 'coat-dance-full-'))
  const previousRoot = process.env.PRIVATE_PATH
  process.env.PRIVATE_PATH = privateRoot
  try {
    const { stageRestyleVideo, queueRestyleFull } =
      await import('../../server/utils/videoRestyleJobs')
    const mp4 = Buffer.concat([
      Buffer.from([0, 0, 0, 0x18]),
      Buffer.from('ftypmp42'),
      Buffer.alloc(64),
    ])
    const single = await stageRestyleVideo({
      userId: 7,
      data: mp4,
      title: 'One batch',
      style: 'noir',
      quality: '720p',
      durationSec: 332,
    })
    assert.equal(single.status, 'STAGED')
    const queued = await queueRestyleFull(7, single.id)
    assert.equal(queued.status, 'FULL_QUEUED', 'no pilot is required')
    assert.equal(queued.full?.totalSegments, 94)
    assert.equal(queued.full?.styleSchedule, undefined)
    assert.equal(queued.pilot, undefined)
    await assert.rejects(queueRestyleFull(7, single.id), /already rendering/)

    const everyLook = RESTYLE_STYLES.map((entry) => entry.id)
    const bag = await stageRestyleVideo({
      userId: 7,
      data: mp4,
      title: 'Every look',
      style: RESTYLE_GRAB_BAG.id,
      variantStyleIds: everyLook.join(','),
      variantMode: 'cycle',
      quality: '1080p',
      durationSec: 332,
    })
    const bagFull = await queueRestyleFull(7, bag.id)
    assert.equal(bagFull.full?.styleSchedule?.length, 94)
    assert.deepEqual(
      bagFull.full?.styleSchedule
        ?.slice(0, everyLook.length)
        .map((w) => w.styleId),
      everyLook,
      'one batch walks every chosen look in order',
    )

    const { cloneRestyleVideo, updateRestyleSettings } =
      await import('../../server/utils/videoRestyleJobs')
    assert.equal(single.renderSpeed, 'standard')
    const fast = await stageRestyleVideo({
      userId: 7,
      data: mp4,
      title: 'Fast draft',
      style: 'noir',
      quality: '720p',
      durationSec: 332,
      renderSpeed: 'fast',
    })
    assert.equal(fast.renderSpeed, 'fast')
    const slowed = await updateRestyleSettings(
      7,
      fast.id,
      'noir',
      '720p',
      undefined,
      undefined,
      undefined,
      undefined,
      'standard',
    )
    assert.equal(slowed.renderSpeed, 'standard')
    const kept = await updateRestyleSettings(7, fast.id, 'noir', '720p')
    assert.equal(
      kept.renderSpeed,
      'standard',
      'omitted speed keeps the saved one',
    )
    const copy = await cloneRestyleVideo({
      userId: 7,
      id: single.id,
      title: 'Fast copy',
      style: 'noir',
      quality: '720p',
      renderSpeed: 'fast',
    })
    assert.equal(copy.renderSpeed, 'fast', 'a finished film can be redone fast')
    await assert.rejects(
      stageRestyleVideo({
        userId: 7,
        data: mp4,
        title: 'Bad speed',
        style: 'noir',
        quality: '720p',
        durationSec: 332,
        renderSpeed: 'turbo',
      }),
      /Unknown render speed/,
    )
  } finally {
    if (previousRoot === undefined) delete process.env.PRIVATE_PATH
    else process.env.PRIVATE_PATH = previousRoot
    rmSync(privateRoot, { recursive: true, force: true })
  }
}
console.info('One-batch full film from a fresh upload verified')
