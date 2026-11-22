import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { startFullAcademy, finishAcademy, restoreAcademy } from '../cometAcademy/rules'
import {
  TERM_ARCHIVE_KEY,
  addCompletedTerm,
  completedTermPage,
  readTermArchive,
} from '../cometAcademy/termArchive'

const time = 1_799_000_000_000
const starter = startFullAcademy(
  'kinetic',
  76_243,
  'accident-fire',
  'shelter',
)
const protectedRun = finishAcademy(
  { ...starter, day: 30, phase: 'finale' },
  'protect',
)
assert.equal(protectedRun.phase, 'ending')
const first = completedTermPage(protectedRun, time)!
assert.ok(first)
assert.equal(first.signature, 'accident-fire')
assert.equal(first.seed, starter.seed)
assert.equal(first.ending, protectedRun.ending)
assert.equal(first.day, 30)
assert.equal(first.finalChoice, 'protect')
assert.equal(first.mastermind, starter.mastermind)
assert.equal(first.form, 'student')
assert.equal(first.completedAt, time)

let archive = addCompletedTerm([], protectedRun, time)
assert.equal(archive.length, 1, 'finished term gets a permanent page')
archive = addCompletedTerm(archive, protectedRun, time + 9000)
assert.deepEqual(archive, [first], 'repeated autosave is idempotent')
const resumed = restoreAcademy(JSON.parse(JSON.stringify(protectedRun)))
assert.ok(resumed)
archive = addCompletedTerm(archive, resumed, time + 10_000)
assert.equal(archive.length, 1, 'importing the same save cannot duplicate pages')

const otherRun = finishAcademy(
  { ...starter, day: 30, phase: 'finale' },
  'command',
)
archive = addCompletedTerm(archive, otherRun, time + 12_000)
assert.equal(archive.length, 2, 'different conclusions on one seed are distinct')
assert.notEqual(archive[0]!.id, archive[1]!.id)
assert.equal(archive[0]!.ending, otherRun.ending)
assert.equal(archive[0]!.completedAt, time + 12_000)
const unrelated = startFullAcademy('kinetic', 18, 'accident-fire', 'shelter')
assert.equal(completedTermPage(unrelated, time), null)
assert.equal(addCompletedTerm(archive, unrelated, time).length, 2)
assert.deepEqual(
  readTermArchive(JSON.parse(JSON.stringify(archive))),
  archive,
  'reload retains ordered pages',
)
assert.deepEqual(readTermArchive([first, first]), [first])
assert.deepEqual(readTermArchive(null), [])
assert.deepEqual(readTermArchive('not an archive'), [])
assert.deepEqual(readTermArchive([{ ...first, ending: 'FAKE ENDING' }]), [])
assert.deepEqual(readTermArchive([{ ...first, losses: -2 }]), [])
assert.deepEqual(readTermArchive([{ ...first, signature: 'invented-canon' }]), [])
assert.deepEqual(readTermArchive([{ ...first, romance: 'invented-student' }]), [])
assert.deepEqual(readTermArchive([{ ...first, completedAt: Infinity }]), [])

const battleLoss = {
  ...protectedRun,
  reports: [
    { caseId: 'a', title: 'First night', grade: 'failed' as const, text: '', names: '' },
  ],
  patrolHistory: [],
  missionClues: ['one', 'two'],
  contacts: ['mina' as const],
}
const lossPage = completedTermPage(battleLoss, time)!
assert.equal(lossPage.losses, 1)
assert.equal(lossPage.contacts, 1)
assert.equal(lossPage.secrets, 2)

const base = new URL('../../', import.meta.url)
const store = readFileSync(new URL('stores/cometAcademyStore.ts', base), 'utf8')
const opening = readFileSync(
  new URL('components/play/cometAcademy/AcademyOpening.vue', base),
  'utf8',
)
const consoleScreen = readFileSync(
  new URL('components/play/cometAcademy/AcademyConsoleScreens.vue', base),
  'utf8',
)
const gallery = readFileSync(
  new URL('components/play/cometAcademy/AcademyTermArchive.vue', base),
  'utf8',
)
assert.ok(store.includes('TERM_ARCHIVE_KEY'))
assert.ok(store.includes('readTermArchive'))
assert.ok(store.includes('addCompletedTerm(termArchive.value, run.value, Date.now())'))
assert.ok(store.includes('localStorage.setItem(TERM_ARCHIVE_KEY'))
assert.ok(store.includes('termArchive,'))
assert.ok(store.includes('function importSave('))
assert.ok(store.includes('function restart('))
assert.ok(opening.includes('<AcademyTermArchive :pages="store.termArchive" />'))
assert.ok(consoleScreen.includes(':pages="store.termArchive"'))
assert.ok(gallery.includes('data-testid="academy-completed-term-page"'))
assert.ok(gallery.includes('endingArtKey(page.ending)'))
assert.ok(gallery.includes('page.losses'))
assert.equal(TERM_ARCHIVE_KEY, 'comet-city-academy-terms-v1')
console.log('Prom of Doom permanent term archive: passed')
