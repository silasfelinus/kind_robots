import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { PROJECT_PLACEMENTS } from '../projectPlacements'
import {
  approvedDailyPitchProgress,
  mayVisitPitchFrontend,
  isPublicFacingPitchPage,
  pitchProjectSlug,
  safeProjectPageUrl,
} from '../approvedPitchProgress'
import type {
  ConductorPitch,
  ConductorProject,
} from '../../server/utils/conductorProjection'

function pitch(
  slug: string,
  target = 'new',
  status = 'approved',
  publicReady = false,
): ConductorPitch {
  return {
    slug,
    date: slug.slice(0, 10),
    title: slug,
    status,
    projectTarget: target,
    publicReady,
    idea: '',
    whyDoIt: '',
    effort: '',
  }
}

function project(
  slug: string,
  taskStatuses: Array<[string, string]>,
  liveUrl?: string,
): ConductorProject {
  return {
    slug,
    name: slug,
    kind: 'software',
    milestones: [],
    progress: 0,
    imagePath: '',
    cardPath: '',
    heroPath: '',
    liveUrl,
    tasks: taskStatuses.map(([title, status], index) => ({
      id: 't-' + (index + 1),
      title,
      milestone: 'm1',
      status,
      owner: null,
      passes: 0,
      stakes: 'reversible',
      gateHuman: false,
      softGate: false,
      note: '',
      dependsOn: null,
      approvedByHuman: false,
      updated: null,
    })),
  } as ConductorProject
}

const approved = pitch('2026-10-03-robot-mashup-flipbook')
assert.equal(pitchProjectSlug(approved), 'robot-mashup-flipbook')
assert.equal(
  pitchProjectSlug(pitch('2026-10-08-kr-cabinet-bumper-bubbles', 'kr-arcade')),
  'kr-arcade',
)
assert.equal(safeProjectPageUrl('javascript:alert(1)'), null)
assert.equal(safeProjectPageUrl('//untrusted.example'), null)
assert.equal(safeProjectPageUrl('/admin/sample'), '/admin/sample')
assert.equal(
  safeProjectPageUrl('https://kindrobots.org/play/sample'),
  'https://kindrobots.org/play/sample',
)

const baseTasks: Array<[string, string]> = [
  ['Write the design brief and start building', 'ready'],
  ['Confirm scope with Silas', 'done'],
  ['Build the first playable slice', 'ready'],
]
const records = approvedDailyPitchProgress(
  [
    approved,
    pitch('2026-10-04-robot-sound-garden'),
    pitch('2026-10-05-kind-daily-riddle'),
    pitch('2026-10-06-kind-nonogram-gallery', 'new', 'approved', true),
    pitch('2026-10-08-kr-cabinet-bumper-bubbles', 'kr-arcade'),
    pitch('2026-10-09-rejected-thing', 'new', 'rejected'),
    pitch('2026-06-24-older-proposal'),
  ],
  [
    project('robot-mashup-flipbook', baseTasks),
    project('kind-daily-riddle', [['Build something', 'done']]),
    project(
      'kind-nonogram-gallery',
      [['Build something', 'done']],
      '/play/nonogram',
    ),
    project('kr-arcade', [['Build multiple games', 'done']], '/play/arcade'),
  ],
)
assert.equal(records.length, 5)
const byTitle = (slug: string) =>
  records.find((record) => record.pitch.slug.endsWith(slug))
assert.equal(byTitle('robot-mashup-flipbook')?.stage, 'scaffolded')
assert.equal(byTitle('robot-mashup-flipbook')?.completedBuildTasks, 0)
assert.equal(byTitle('robot-mashup-flipbook')?.totalBuildTasks, 1)
assert.equal(byTitle('robot-sound-garden')?.stage, 'awaiting-intake')
assert.equal(byTitle('kind-daily-riddle')?.stage, 'building')
assert.equal(byTitle('kind-nonogram-gallery')?.stage, 'page-linked')
assert.equal(byTitle('kr-cabinet-bumper-bubbles')?.stage, 'shared-project')
assert.equal(
  byTitle('kr-cabinet-bumper-bubbles')?.pageUrl,
  '/play/arcade?game=bumper-bubbles',
)
assert.equal(
  mayVisitPitchFrontend(byTitle('kr-cabinet-bumper-bubbles')!, true),
  true,
)
assert.equal(
  mayVisitPitchFrontend(byTitle('kr-cabinet-bumper-bubbles')!, false),
  false,
)
assert.equal(
  mayVisitPitchFrontend(byTitle('kind-nonogram-gallery')!, false),
  true,
)
assert.equal(
  mayVisitPitchFrontend(byTitle('robot-mashup-flipbook')!, true),
  false,
)
assert.equal(
  mayVisitPitchFrontend({ pageUrl: '/play/a', publicReady: false }, false),
  false,
)
assert.equal(
  mayVisitPitchFrontend({ pageUrl: '/play/a', publicReady: true }, false),
  true,
)
assert.equal(
  mayVisitPitchFrontend({ pageUrl: '/admin/toy', publicReady: true }, false),
  false,
)
assert.equal(
  mayVisitPitchFrontend({ pageUrl: '/admin/toy', publicReady: false }, true),
  true,
)
assert.equal(isPublicFacingPitchPage('/admin/toy'), false)
assert.equal(isPublicFacingPitchPage('/play/toy'), true)

// Music Mentor predates Daily Dreams and must not be forged into the pitch
// ledger. It is intentionally a discoverable one-off on the same shelf.
const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const gallery = readFileSync(
  file('../../pages/play/daily-pitches/index.vue'),
  'utf8',
)
assert.match(gallery, /One-prompt experiment/)
assert.match(gallery, /to="\/music-mentor"/)
assert.deepEqual(PROJECT_PLACEMENTS['music-mentor'], {
  channelKey: 'admin',
  tabKey: 'daily-pitches',
  route: '/music-mentor',
})
assert.equal(
  existsSync(file('../../content/channels/projects/music-mentor.md')),
  false,
)

console.log(
  'Approved Daily Dream pitch progress and public release access: verified',
)
