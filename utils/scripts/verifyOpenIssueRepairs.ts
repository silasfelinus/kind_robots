import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  MYSQL_SIGNED_INT_MAX,
  MYSQL_SIGNED_INT_MIN,
  isPersistableArtImageSeed,
  resolvePersistedArtImageSeed,
} from '../../server/utils/artImageSeed'

const characterEditor = readFileSync(
  'components/characters/add-character.vue',
  'utf8',
)
const superForm = readFileSync('components/pages/super-form.vue', 'utf8')
const receiptStore = readFileSync(
  'stores/superkateReceiptStore.ts',
  'utf8',
)
const receiptEndpoint = readFileSync(
  'server/api/stylist/receipt-email.post.ts',
  'utf8',
)
const completionRoute = readFileSync(
  'server/api/art/queue/[id]/complete.post.ts',
  'utf8',
)

assert.match(characterEditor, /useCharacterStore/)
assert.match(characterEditor, /characterStore\.characterForm\.name/)
assert.match(characterEditor, /characterStore\.saveCharacter\(\)/)
assert.match(characterEditor, /Character Identity/)
assert.doesNotMatch(characterEditor, /usePromptStore|promptStore|Promote to Dream/)

assert.match(superForm, /useSuperkateReceiptStore/)
assert.match(superForm, /receiptStore\.sendReceiptEmail/)
assert.doesNotMatch(superForm, /BREVO_API_KEY|api\.brevo\.com|process\.env/)
assert.match(receiptStore, /performFetch<ReceiptEmailResponse>/)
assert.match(receiptEndpoint, /requireApiUser/)
assert.match(receiptEndpoint, /sendTransactionalEmail/)
assert.match(receiptEndpoint, /INTERNAL_RECIPIENTS/)

assert.equal(isPersistableArtImageSeed(MYSQL_SIGNED_INT_MIN), true)
assert.equal(isPersistableArtImageSeed(MYSQL_SIGNED_INT_MAX), true)
assert.equal(isPersistableArtImageSeed(MYSQL_SIGNED_INT_MAX + 1), false)
assert.equal(resolvePersistedArtImageSeed(-1, 840009), 840009)
assert.equal(
  resolvePersistedArtImageSeed(-1, MYSQL_SIGNED_INT_MAX + 1),
  -1,
  'an unrepresentable workflow seed must not be written into ArtImage.seed',
)
assert.equal(
  resolvePersistedArtImageSeed(null, MYSQL_SIGNED_INT_MAX + 1),
  null,
)

const normalTransaction = completionRoute.indexOf(
  'const normalResult = await prisma.$transaction',
)
const normalImageUpdate = completionRoute.indexOf(
  'await tx.artImage.update',
  normalTransaction,
)
const normalJobUpdate = completionRoute.indexOf(
  'const completed = await tx.artJob.update',
  normalImageUpdate,
)

assert.ok(normalTransaction >= 0, 'normal completion must use a transaction')
assert.ok(
  normalImageUpdate > normalTransaction,
  'normal completion must update the ArtImage inside the transaction',
)
assert.ok(
  normalJobUpdate > normalImageUpdate,
  'the ArtJob must not become DONE before the ArtImage update succeeds',
)

console.log('Open issue repair contracts passed.')
