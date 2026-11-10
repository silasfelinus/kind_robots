import assert from 'node:assert/strict'
import { letterProgressFromEarthChoices } from '../memoryDungeon/earthLetterBinding'
import { letterArchiveEcho, restoreLetterProgress } from '../memoryDungeon/earthLetters'

const choices = ['care', 'risk', 'forged', undefined] as const
for (const first of choices)
  for (const second of choices) {
    const e03 = first ? { '3,3': first } : {}
    const e04 = second ? { '3,3': second } : {}
    const ledger = letterProgressFromEarthChoices(e03, e04)
    assert.deepEqual(restoreLetterProgress(ledger), ledger)
    assert.equal(
      ledger.decisions.e03Letter,
      first === 'care'
        ? 'earth-letter-shelve'
        : first === 'risk'
          ? 'earth-letter-copy'
          : undefined,
    )
    assert.equal(
      ledger.decisions.e04Archive,
      second === 'care'
        ? 'earth-archive-seal'
        : second === 'risk'
          ? 'earth-archive-release'
          : undefined,
    )
    assert.equal(ledger.decisions.e03Witness, undefined)
    assert.equal(ledger.decisions.e04Return, undefined)
    assert.equal(
      letterArchiveEcho(ledger),
      first === 'care'
        ? 'A date stamped on paper repeats every three days.'
        : first === 'risk'
          ? 'Your phone shows an envelope you never opened.'
          : 'The cabinet offers no explanation of what you missed.',
    )
    assert.deepEqual(
      letterProgressFromEarthChoices(e03, e04),
      ledger,
      'projection is deterministic across save restoration',
    )
  }
