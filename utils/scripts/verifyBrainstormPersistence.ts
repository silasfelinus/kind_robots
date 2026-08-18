import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { BrainstormStoredSessionRow } from '../../server/utils/brainstorm/brainstormPersistence'
import {
  brainstormCandidateCreateData,
  brainstormSessionData,
  normalizeBrainstormSessionSaveRequest,
  storedBrainstormSession,
} from '../../server/utils/brainstorm/brainstormPersistence'

const root = process.cwd()
const schema = readFileSync(resolve(root, 'prisma/brainstorm.prisma'), 'utf8')
const migration = readFileSync(
  resolve(root, 'prisma/migrations/20260810122000_add_brainstorm_persistence/migration.sql'),
  'utf8',
)
const outputDomainMigration = readFileSync(
  resolve(
    root,
    'prisma/migrations/20260818190000_add_brainstorm_output_domain/migration.sql',
  ),
  'utf8',
)
const listRoute = readFileSync(
  resolve(root, 'server/api/brainstorm/sessions/index.get.ts'),
  'utf8',
)
const createRoute = readFileSync(
  resolve(root, 'server/api/brainstorm/sessions/index.post.ts'),
  'utf8',
)
const getRoute = readFileSync(
  resolve(root, 'server/api/brainstorm/sessions/[id].get.ts'),
  'utf8',
)
const putRoute = readFileSync(
  resolve(root, 'server/api/brainstorm/sessions/[id].put.ts'),
  'utf8',
)

assert.match(schema, /model BrainstormSession/)
assert.match(schema, /model BrainstormCandidate/)
assert.match(schema, /userId\s+Int/)
assert.match(schema, /@@index\(\[userId, updatedAt\]\)/)
assert.match(schema, /@@unique\(\[sessionId, clientId\]\)/)
assert.match(schema, /onDelete: Cascade/)
assert.doesNotMatch(schema, /DreamType|PitchSheet|\bPrompt\b|Conductor/i)

assert.match(migration, /CREATE TABLE `BrainstormSession`/)
assert.match(migration, /CREATE TABLE `BrainstormCandidate`/)
assert.match(migration, /ADD CONSTRAINT `BrainstormCandidate_sessionId_fkey`/)
assert.doesNotMatch(
  migration,
  /DROP\s+(?:TABLE|COLUMN|DATABASE)|TRUNCATE|DELETE\s+FROM|UPDATE\s+`|INSERT\s+INTO|RENAME\s+(?:TABLE|COLUMN)|CHANGE\s+COLUMN|MODIFY\s+COLUMN/i,
  'Brainstorm persistence migration must remain additive-only',
)

// conductor brainstorm/t-015: art-prompt output domain column.
assert.match(schema, /outputDomain\s+String\s+@default\("ideas"\)/)
assert.match(
  outputDomainMigration,
  /ALTER TABLE `BrainstormSession` ADD COLUMN `outputDomain`/,
)
assert.doesNotMatch(
  outputDomainMigration,
  /DROP\s+(?:TABLE|COLUMN|DATABASE)|TRUNCATE|DELETE\s+FROM|UPDATE\s+`|INSERT\s+INTO|RENAME\s+(?:TABLE|COLUMN)|CHANGE\s+COLUMN|MODIFY\s+COLUMN/i,
  'the outputDomain migration must remain additive-only',
)

for (const route of [listRoute, createRoute, getRoute, putRoute]) {
  assert.match(route, /requireApiUser\(event\)/)
  assert.match(route, /errorHandler\(error\)/)
}
assert.match(listRoute, /userId: auth\.user\.id/)
assert.match(listRoute, /isActive: true/)
assert.match(getRoute, /id,[\s\S]*userId: auth\.user\.id,[\s\S]*isActive: true/)
assert.match(putRoute, /id,[\s\S]*userId: auth\.user\.id,[\s\S]*isActive: true/)
assert.match(createRoute, /brainstormSessionData\(auth\.user\.id, request\)/)
assert.match(putRoute, /Candidates:[\s\S]*deleteMany: \{\},[\s\S]*create:/)
assert.doesNotMatch(listRoute, /include:\s*\{\s*Candidates:/)

const saveRequest = normalizeBrainstormSessionSaveRequest({
  name: 'Pralines and Glass Lab',
  snapshot: {
    version: 1,
    premise: 'Invent terrible ice cream flavors with an actual comic premise.',
    resultCount: 4,
    constraints: 'Keep each seed short.',
    examples: ['Pralines and Glass'],
    mode: 'darker-funnier',
    outputDomain: 'art-prompts',
    batchShape: 'assortment',
    returnTypes: [
      { id: 'dark-humor', count: 1 },
      { id: 'dry-observation' },
    ],
    source: {
      modelType: 'Character',
      id: 42,
      intent: 'art prompt variations',
    },
    candidates: [
      {
        id: 'candidate-a',
        batchId: 'batch-a',
        title: 'Glass Forecast',
        text: 'A brittle praline shell that comes with a tiny waiver and safety goggles.',
        status: 'kept',
        feedback: '',
        edited: true,
        parentId: null,
        revisions: [
          {
            title: 'Glass Forecast',
            text: 'A brittle praline shell with safety goggles.',
            createdAt: '2026-08-10T12:00:00.000Z',
            reason: 'generated',
            returnType: 'dark-humor',
          },
          {
            title: 'Glass Forecast',
            text: 'A brittle praline shell that comes with a tiny waiver and safety goggles.',
            createdAt: '2026-08-10T12:01:00.000Z',
            reason: 'edited',
            returnType: 'dark-humor',
          },
        ],
        meta: {
          returnType: 'dark-humor',
          source: { modelType: 'Character', id: 42, intent: 'art prompt variations' },
        },
      },
      {
        id: 'candidate-b',
        batchId: 'batch-a',
        title: 'Compliance Vanilla',
        text: 'Vanilla served with a forty-page terms-of-service agreement nobody reads.',
        status: 'pending',
        feedback: '',
        edited: false,
        parentId: 'candidate-a',
        revisions: [
          {
            title: 'Compliance Vanilla',
            text: 'Vanilla served with a forty-page terms-of-service agreement nobody reads.',
            createdAt: '2026-08-10T12:02:00.000Z',
            reason: 'branched',
            returnType: 'dry-observation',
          },
        ],
        meta: {
          returnType: 'dry-observation',
          branchOrigin: {
            candidateId: 'candidate-a',
            revisionIndex: 1,
            title: 'Glass Forecast',
            text: 'A brittle praline shell that comes with a tiny waiver and safety goggles.',
          },
        },
      },
    ],
    batches: [
      {
        id: 'batch-a',
        createdAt: '2026-08-10T12:00:00.000Z',
        premise: 'Invent terrible ice cream flavors with an actual comic premise.',
        request: {
          premise: 'Invent terrible ice cream flavors with an actual comic premise.',
          count: 4,
          constraints: 'Keep each seed short.',
          examples: ['Pralines and Glass'],
          mode: 'darker-funnier',
          outputDomain: 'art-prompts',
          batchShape: 'assortment',
          returnTypes: [
            { id: 'dark-humor', count: 1 },
            { id: 'dry-observation' },
          ],
          source: { modelType: 'Character', id: 42, intent: 'art prompt variations' },
        },
        candidateIds: ['candidate-a', 'candidate-b'],
      },
    ],
    activeBatchId: 'batch-a',
    lastGeneratedAt: '2026-08-10T12:02:00.000Z',
  },
})

assert.equal(saveRequest.name, 'Pralines and Glass Lab')
assert.equal(saveRequest.snapshot.outputDomain, 'art-prompts')
assert.equal(saveRequest.snapshot.candidates.length, 2)
assert.equal(saveRequest.snapshot.candidates[0]?.status, 'kept')
assert.equal(saveRequest.snapshot.candidates[0]?.revisions.length, 2)
assert.equal(
  saveRequest.snapshot.candidates[1]?.meta.branchOrigin?.revisionIndex,
  1,
)

const sessionData = brainstormSessionData(17, saveRequest)
const candidateRows = brainstormCandidateCreateData(saveRequest.snapshot.candidates)
assert.equal(sessionData.userId, 17)
assert.equal(sessionData.outputDomain, 'art-prompts')
assert.equal(candidateRows[0]?.clientId, 'candidate-a')
assert.equal(candidateRows[1]?.parentClientId, 'candidate-a')
assert.equal(candidateRows[1]?.position, 1)

const storedRow: BrainstormStoredSessionRow = {
  id: 9,
  createdAt: new Date('2026-08-10T12:00:00.000Z'),
  updatedAt: new Date('2026-08-10T12:05:00.000Z'),
  name: saveRequest.name,
  premise: sessionData.premise,
  resultCount: sessionData.resultCount,
  constraints: sessionData.constraints,
  examples: sessionData.examples,
  mode: sessionData.mode,
  outputDomain: sessionData.outputDomain,
  batchShape: sessionData.batchShape,
  returnTypes: sessionData.returnTypes,
  source: sessionData.source,
  batches: sessionData.batches,
  activeBatchId: sessionData.activeBatchId,
  lastGeneratedAt: sessionData.lastGeneratedAt,
  Candidates: candidateRows.map((candidate) => ({
    ...candidate,
  })),
}

const reopened = storedBrainstormSession(storedRow)
assert.equal(reopened.id, 9)
assert.equal(reopened.name, 'Pralines and Glass Lab')
assert.equal(reopened.candidateCount, 2)
assert.deepEqual(reopened.snapshot.candidates.map((candidate) => candidate.id), [
  'candidate-a',
  'candidate-b',
])
assert.equal(reopened.snapshot.candidates[0]?.status, 'kept')
assert.equal(reopened.snapshot.candidates[0]?.revisions.length, 2)
assert.equal(
  reopened.snapshot.candidates[1]?.meta.branchOrigin?.candidateId,
  'candidate-a',
)
assert.deepEqual(reopened.snapshot.returnTypes, saveRequest.snapshot.returnTypes)
assert.deepEqual(reopened.snapshot.source, saveRequest.snapshot.source)
assert.equal(reopened.snapshot.activeBatchId, 'batch-a')
assert.equal(
  reopened.snapshot.outputDomain,
  'art-prompts',
  'outputDomain must round-trip through save -> stored row -> reopened snapshot',
)

// A row saved before this column existed (or an unrecognized value) must
// degrade to the default domain, never throw or surface an invalid id.
const legacyRow: BrainstormStoredSessionRow = { ...storedRow, outputDomain: '' }
assert.equal(storedBrainstormSession(legacyRow).snapshot.outputDomain, 'ideas')
const corruptRow: BrainstormStoredSessionRow = {
  ...storedRow,
  outputDomain: 'not-a-real-domain',
}
assert.equal(storedBrainstormSession(corruptRow).snapshot.outputDomain, 'ideas')

assert.throws(
  () =>
    normalizeBrainstormSessionSaveRequest({
      name: 'Broken',
      snapshot: {
        ...saveRequest.snapshot,
        activeBatchId: 'missing-batch',
      },
    }),
  /active Brainstorm batch/i,
)

assert.throws(
  () =>
    normalizeBrainstormSessionSaveRequest({
      name: 'Broken',
      snapshot: {
        ...saveRequest.snapshot,
        candidates: [
          saveRequest.snapshot.candidates[0],
          saveRequest.snapshot.candidates[0],
        ],
      },
    }),
  /candidate ids must be unique/i,
)

console.log('Brainstorm persistence contract passed.')
