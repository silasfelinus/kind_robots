import assert from 'node:assert/strict'
import { access } from 'node:fs/promises'
import {
  forumAgentOpenApiRouteFiles,
  forumAgentOpenApiSpec,
} from '../forumOpenApi.js'

const methods = new Set(['get', 'post', 'patch', 'delete', 'put'])
const actualOperations = new Map<string, unknown>()
const operationIds = new Set<string>()

for (const [path, pathItem] of Object.entries(forumAgentOpenApiSpec.paths)) {
  for (const [method, operation] of Object.entries(pathItem)) {
    if (!methods.has(method)) continue

    const key = `${method.toUpperCase()} ${path}`
    actualOperations.set(key, operation)

    const operationId = (operation as { operationId?: string }).operationId
    assert.ok(operationId, `${key} must define operationId`)
    assert.equal(operationIds.has(operationId), false, `duplicate operationId: ${operationId}`)
    operationIds.add(operationId)
  }
}

assert.deepEqual(
  [...actualOperations.keys()].sort(),
  Object.keys(forumAgentOpenApiRouteFiles).sort(),
  'OpenAPI operations must exactly match the implemented public v1 forum/agent route set.',
)

for (const [operation, routeFile] of Object.entries(forumAgentOpenApiRouteFiles)) {
  await access(routeFile)
  assert.ok(actualOperations.has(operation), `${operation} is missing from OpenAPI`)
}

const schemas = forumAgentOpenApiSpec.components.schemas as Record<string, any>

for (const name of [
  'CreateThreadRequest',
  'CreateReplyRequest',
  'UpdatePostRequest',
  'FlagPostRequest',
]) {
  const schema = schemas[name]
  assert.ok(schema, `${name} schema is required`)
  assert.equal(
    schema.additionalProperties,
    false,
    `${name} must reject undeclared client fields`,
  )

  for (const forbidden of [
    'authorId',
    'userId',
    'botId',
    'sender',
    'originId',
    'previousEntryId',
  ]) {
    assert.equal(
      forbidden in (schema.properties ?? {}),
      false,
      `${name} must not expose spoofable field ${forbidden}`,
    )
  }
}

{
  const reference = schemas.ForumAttachmentReference
  assert.ok(reference, 'ForumAttachmentReference schema is required')
  assert.equal(reference.additionalProperties, false)
  assert.deepEqual(reference.required, ['kind', 'id'])
  assert.deepEqual(reference.properties.kind.enum, ['ART_IMAGE', 'PROJECT'])
  assert.equal(reference.properties.id.minimum, 1)

  const preview = schemas.ForumAttachmentPreview
  assert.ok(preview, 'ForumAttachmentPreview schema is required')
  assert.equal(preview.additionalProperties, false)
  assert.ok(preview.required.includes('canonicalUrl'))
  assert.ok(preview.required.includes('imageUrl'))

  for (const name of ['CreateThreadRequest', 'CreateReplyRequest', 'UpdatePostRequest']) {
    const attachments = schemas[name].properties.attachments
    assert.ok(attachments, `${name} must expose typed attachments`)
    assert.equal(attachments.type, 'array')
    assert.equal(attachments.maxItems, 2)
    assert.equal(
      attachments.items.$ref,
      '#/components/schemas/ForumAttachmentReference',
    )
  }

  const postAttachments = schemas.ForumPost.properties.attachments
  assert.ok(schemas.ForumPost.required.includes('attachments'))
  assert.equal(postAttachments.type, 'array')
  assert.equal(postAttachments.maxItems, 2)
  assert.equal(
    postAttachments.items.$ref,
    '#/components/schemas/ForumAttachmentPreview',
  )
}

const profile = actualOperations.get('GET /api/v1/profile') as {
  'x-kind-robots-scopes'?: string[]
}
assert.deepEqual(profile['x-kind-robots-scopes'], ['profile:read'])

for (const [key, operation] of actualOperations) {
  if (!key.includes('/api/v1/forum/')) continue
  const typed = operation as {
    security?: unknown[]
    'x-kind-robots-scopes'?: string[]
  }

  if (key === 'GET /api/v1/forum/channels') {
    assert.deepEqual(typed.security, [])
    continue
  }

  const expectedScope = key.startsWith('GET ') ? 'forum:read' : 'forum:write'
  assert.ok(
    typed['x-kind-robots-scopes']?.includes(expectedScope),
    `${key} must declare ${expectedScope}`,
  )
}

assert.equal(forumAgentOpenApiSpec.openapi, '3.1.0')
assert.equal(forumAgentOpenApiSpec.servers[0]?.url, 'https://kindrobots.org')
assert.equal(forumAgentOpenApiSpec.info.version, '1.1.0')

console.log('verifyForumOpenApi.test.ts: all assertions passed')
