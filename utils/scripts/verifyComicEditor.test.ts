// /utils/scripts/verifyComicEditor.test.ts
//
// Contract test for the Comic Studio's adversarial editor (utils/comicEditor.ts).
// What it protects: the JSON schema sent to Claude and the validator that reads the
// reply agree field for field (strict structured output rejects a schema whose
// `required` drifts from `properties`), a reply without a known verdict or headline
// is refused rather than stored as a pass, secrets reach the editor marked as
// secrets, and a cosmetic notes edit does not spend a model call.
import assert from 'node:assert/strict'

import {
  COMIC_EDITOR_SCHEMA,
  COMIC_EDITOR_SYSTEM,
  COMIC_EDITOR_VERDICTS,
  comicNotesChangedEnough,
  composeComicEditorRequest,
  normalizeComicEditorCritique,
} from '../comicEditor.js'

{
  const properties = Object.keys(
    COMIC_EDITOR_SCHEMA.properties as Record<string, unknown>,
  ).sort()
  assert.deepEqual(
    [...(COMIC_EDITOR_SCHEMA.required as string[])].sort(),
    properties,
  )
  assert.equal(COMIC_EDITOR_SCHEMA.additionalProperties, false)
  const problem = (
    COMIC_EDITOR_SCHEMA.properties as Record<
      string,
      { items: Record<string, unknown> }
    >
  ).problems!.items
  assert.deepEqual(
    [...(problem.required as string[])].sort(),
    Object.keys(problem.properties as object).sort(),
  )
  assert.ok(COMIC_EDITOR_SYSTEM.includes('GREAT'))
}
console.log('✅ the verdict schema is strict and self-consistent')

{
  assert.equal(
    normalizeComicEditorCritique({ verdict: 'fine', headline: 'x' }),
    null,
  )
  assert.equal(
    normalizeComicEditorCritique({ verdict: 'great', headline: '' }),
    null,
  )
  assert.equal(normalizeComicEditorCritique('great'), null)
  const critique = normalizeComicEditorCritique({
    verdict: 'not-yet',
    headline: 'The convent betrayal is telegraphed.',
    strengths: ['The hyena bargain has teeth', 3],
    problems: [
      {
        area: 'plot',
        severity: 'high',
        issue: 'The sisters are sinister from their first panel.',
      },
      { area: 'nonsense', severity: 'extreme', issue: 'Coerced to defaults' },
      { area: 'plot', severity: 'low', issue: '' },
    ],
    questions: ['Why would Zuzu trust them?'],
    bar: 'Make the reader trust the sisters more than Zuzu does.',
  })
  assert.ok(critique)
  assert.equal(critique!.verdict, 'not-yet')
  assert.deepEqual(critique!.strengths, ['The hyena bargain has teeth'])
  assert.equal(critique!.problems.length, 2)
  assert.deepEqual(critique!.problems[1], {
    area: 'plot',
    severity: 'medium',
    issue: 'Coerced to defaults',
  })
  assert.ok(COMIC_EDITOR_VERDICTS.includes(critique!.verdict))
}
console.log('✅ unreadable replies are refused, sloppy fields are cleaned')

{
  const request = composeComicEditorRequest({
    context: {
      seriesTitle: 'Zuzu',
      seriesNotes: 'Action over exposition.',
      style: null,
      entities: [
        {
          name: 'Human ruins',
          kind: 'twist',
          notes: 'Humans existed.',
          secretUntil: 'end of issue 3',
        },
        { name: 'Zuzu', kind: 'character', notes: null, secretUntil: null },
      ],
      issues: [{ number: 1, title: 'Issue 1', notes: 'The massacre.' }],
      recent: [
        {
          verdict: 'reject',
          headline: 'Too much talk.',
          targetName: 'Issue 1',
        },
      ],
    },
    targetLabel: 'a new pitch',
    material: 'Zuzu finds a PHARMACY sign on page 2.',
    thread: [{ role: 'creator', text: 'earlier pitch' }],
  })
  assert.ok(request.includes('[SECRET until end of issue 3]'))
  assert.ok(request.includes('Zuzu (character)\n(no notes yet)'))
  assert.ok(request.includes('REJECT (Issue 1): Too much talk.'))
  assert.ok(request.includes('CREATOR: earlier pitch'))
  assert.ok(request.trim().endsWith('Zuzu finds a PHARMACY sign on page 2.'))
}
console.log(
  '✅ the editor sees what is established, what is secret, and its own recent verdicts',
)

{
  assert.equal(
    comicNotesChangedEnough('The kids are fennecs.', 'The kids are fennecs!'),
    false,
  )
  assert.equal(comicNotesChangedEnough('a', `a ${'new beat '.repeat(6)}`), true)
  assert.equal(comicNotesChangedEnough('something', ''), false)
  assert.equal(comicNotesChangedEnough(null, 'x'.repeat(41)), true)
}
console.log('✅ only a real notes change wakes the editor')
