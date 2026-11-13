import assert from 'node:assert/strict'
import { isShiftingDesksBackupEnvelope } from '../shiftingDesks/backupValidation'

const valid = {
  game: 'shifting-desks',
  version: 1,
  run: null,
  settings: { textSize: 'normal' },
  discovered: ['orientation'],
  endingsFound: [],
  rewardArchive: { version: 1, runs: [], milestones: {} },
  envelopeOpened: false,
}
assert.equal(isShiftingDesksBackupEnvelope(valid), true)
for (const corrupted of [
  null,
  [],
  {},
  { ...valid, game: 'another-game' },
  { ...valid, version: 2 },
  { ...valid, run: undefined, envelopeOpened: undefined },
  Object.fromEntries(Object.entries(valid).filter(([key]) => key !== 'run')),
  { ...valid, settings: [] },
  { ...valid, rewardArchive: [] },
  { ...valid, rewardArchive: null },
  { ...valid, discovered: [42] },
  { ...valid, endingsFound: [null] },
  { ...valid, envelopeOpened: 'true' },
]) {
  assert.equal(
    isShiftingDesksBackupEnvelope(corrupted),
    false,
    JSON.stringify(corrupted),
  )
}
console.log('Shifting Desks backup envelope contract passed')
