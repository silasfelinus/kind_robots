import assert from 'node:assert/strict'
import {
  approvedDailyPitchProgress,
  pitchProjectSlug,
  safeProjectPageUrl,
} from '../approvedPitchProgress'
import type { ConductorPitch, ConductorProject } from '../../server/utils/conductorProjection'

function pitch(slug: string, target = 'new', status = 'approved'): ConductorPitch {
  return { slug, date: slug.slice(0, 10), title: slug, status, projectTarget: target, idea: '', whyDoIt: '', effort: '' }
}

function project(slug: string, taskStatuses: Array<[string, string]>, liveUrl?: string): ConductorProject {
  return {
    slug, name: slug, kind: 'software', milestones: [], progress: 0,
    imagePath: '', cardPath: '', heroPath: '', liveUrl,
    tasks: taskStatuses.map(([title, status], index) => ({
      id: 't-' + (index + 1), title, milestone: 'm1', status, owner: null, passes: 0,
      stakes: 'reversible', gateHuman: false, softGate: false, note: '', dependsOn: null,
      approvedByHuman: false, updated: null,
    })),
  } as ConductorProject
}

const approved = pitch('2026-10-03-robot-mashup-flipbook')
assert.equal(pitchProjectSlug(approved), 'robot-mashup-flipbook')
assert.equal(pitchProjectSlug(pitch('2026-10-08-kr-cabinet-bumper-bubbles', 'kr-arcade')), 'kr-arcade')
assert.equal(safeProjectPageUrl('javascript:alert(1)'), null)
assert.equal(safeProjectPageUrl('//untrusted.example'), null)
assert.equal(safeProjectPageUrl('/admin/sample'), '/admin/sample')
assert.equal(safeProjectPageUrl('https://kindrobots.org/play/sample'), 'https://kindrobots.org/play/sample')

const baseTasks: Array<[string, string]> = [['Write the design brief and start building', 'ready'], ['Confirm scope with Silas', 'done'], ['Build the first playable slice', 'ready']]
const records = approvedDailyPitchProgress([
  approved,
  pitch('2026-10-04-robot-sound-garden'),
  pitch('2026-10-05-kind-daily-riddle'),
  pitch('2026-10-06-kind-nonogram-gallery'),
  pitch('2026-10-08-kr-cabinet-bumper-bubbles', 'kr-arcade'),
  pitch('2026-10-09-rejected-thing', 'new', 'rejected'),
  pitch('2026-06-24-older-proposal'),
], [
  project('robot-mashup-flipbook', baseTasks),
  project('kind-daily-riddle', [['Build something', 'done']]),
  project('kind-nonogram-gallery', [['Build something', 'done']], '/admin/nonogram'),
  project('kr-arcade', [['Build multiple games', 'done']], '/play/arcade'),
])
assert.equal(records.length, 5)
const byTitle = (slug: string) => records.find((record) => record.pitch.slug.endsWith(slug))
assert.equal(byTitle('robot-mashup-flipbook')?.stage, 'scaffolded')
assert.equal(byTitle('robot-mashup-flipbook')?.completedBuildTasks, 0)
assert.equal(byTitle('robot-mashup-flipbook')?.totalBuildTasks, 1)
assert.equal(byTitle('robot-sound-garden')?.stage, 'awaiting-intake')
assert.equal(byTitle('kind-daily-riddle')?.stage, 'building')
assert.equal(byTitle('kind-nonogram-gallery')?.stage, 'page-linked')
assert.equal(byTitle('kr-cabinet-bumper-bubbles')?.stage, 'shared-project')
console.log('Approved Daily Dream pitch progress: 13 assertions passed')
