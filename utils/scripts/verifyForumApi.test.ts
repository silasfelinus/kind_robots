import assert from 'node:assert/strict'
import {
  DEFAULT_FORUM_CHANNELS,
  buildForumReadFilter,
  canManageForumPost,
  credentialHasForumScope,
  findForumChannel,
  forumAttachmentCanonicalPath,
  forumParentBelongsToThread,
  forumPostIsPubliclyVisible,
  isForumAttachmentKind,
  isForumThreadRoot,
  parseForumChannelRegistryJson,
  parseForumFlagReason,
  parseForumLimit,
} from '../forumApiContract.js'

const expectedSlugs = [
  'introductions',
  'news',
  'humanitarian-goals',
  'creativity',
  'memes',
  'just-because',
]

{
  assert.deepEqual(
    DEFAULT_FORUM_CHANNELS.map((channel) => channel.slug),
    expectedSlugs,
  )
  assert.equal(findForumChannel(DEFAULT_FORUM_CHANNELS, 'Creativity')?.slug, 'creativity')
  assert.equal(findForumChannel(DEFAULT_FORUM_CHANNELS, 'not-a-board'), null)

  const configured = parseForumChannelRegistryJson(
    JSON.stringify([
      { slug: 'field-notes', label: 'Field Notes', description: 'Sourced observations.' },
      { slug: 'field-notes', label: 'Duplicate', description: 'Dropped.' },
      { slug: 'Build Lab', label: 'Invalid slug', description: 'Dropped.' },
    ]),
  )
  assert.deepEqual(configured, [
    { slug: 'field-notes', label: 'Field Notes', description: 'Sourced observations.' },
  ])

  assert.deepEqual(
    parseForumChannelRegistryJson('not-json').map((channel) => channel.slug),
    expectedSlugs,
  )
}

{
  assert.equal(isForumAttachmentKind('ART_IMAGE'), true)
  assert.equal(isForumAttachmentKind('PROJECT'), true)
  assert.equal(isForumAttachmentKind('CHARACTER'), true)
  assert.equal(isForumAttachmentKind('BOT'), false)
  assert.equal(
    forumAttachmentCanonicalPath({ kind: 'ART_IMAGE', id: 17 }),
    '/art?art=17',
  )
  assert.equal(
    forumAttachmentCanonicalPath({ kind: 'PROJECT', id: 23 }),
    '/conductor?project=23',
  )
  assert.equal(
    forumAttachmentCanonicalPath({ kind: 'CHARACTER', id: 9 }),
    '/characters?character=9',
  )
}

{
  const visible = {
    type: 'ToForum',
    isPublic: true,
    isActive: true,
    isMature: false,
  }
  assert.equal(forumPostIsPubliclyVisible(visible), true)
  assert.equal(forumPostIsPubliclyVisible({ ...visible, isPublic: false }), false)
  assert.equal(forumPostIsPubliclyVisible({ ...visible, isActive: false }), false)
  assert.equal(forumPostIsPubliclyVisible({ ...visible, type: 'ToUser' }), false)
  assert.equal(forumPostIsPubliclyVisible({ ...visible, isMature: true }), false)
  assert.equal(forumPostIsPubliclyVisible({ ...visible, isMature: true }, true), true)

  assert.deepEqual(buildForumReadFilter(), {
    type: 'ToForum',
    isPublic: true,
    isActive: true,
    isMature: false,
  })
  assert.deepEqual(
    buildForumReadFilter({
      channel: 'news',
      includeMature: true,
      rootOnly: true,
      cursor: 50,
      order: 'recent',
    }),
    {
      type: 'ToForum',
      isPublic: true,
      isActive: true,
      channel: 'news',
      previousEntryId: null,
      id: { lt: 50 },
    },
  )
  assert.deepEqual(buildForumReadFilter({ cursor: 50, order: 'chronological' }).id, {
    gt: 50,
  })
}

{
  assert.equal(credentialHasForumScope('jwt', undefined, 'forum:write'), true)
  assert.equal(
    credentialHasForumScope('agent-credential', ['forum:read'], 'forum:write'),
    false,
  )
  assert.equal(
    credentialHasForumScope(
      'agent-credential',
      ['profile:read', 'forum:read', 'forum:write'],
      'forum:write',
    ),
    true,
  )
}

{
  const human = { kind: 'jwt', userId: 7, botId: null, isAdmin: false }
  const admin = { kind: 'jwt', userId: 1, botId: null, isAdmin: true }
  const agent = { kind: 'agent-credential', userId: 7, botId: 42, isAdmin: false }

  assert.equal(canManageForumPost(human, { userId: 7, botId: null }), true)
  assert.equal(canManageForumPost(human, { userId: 8, botId: null }), false)
  assert.equal(canManageForumPost(admin, { userId: 8, botId: 99 }), true)
  assert.equal(canManageForumPost(agent, { userId: 7, botId: 42 }), true)
  assert.equal(canManageForumPost(agent, { userId: 7, botId: 43 }), false)
  assert.equal(
    canManageForumPost(
      { kind: 'agent-credential', userId: 7, botId: null, isAdmin: false },
      { userId: 7, botId: null },
    ),
    false,
  )
  assert.equal(canManageForumPost(agent, { userId: 8, botId: 42 }), false)
}

{
  assert.equal(
    isForumThreadRoot({ id: 10, type: 'ToForum', originId: 10, previousEntryId: null }),
    true,
  )
  assert.equal(
    isForumThreadRoot({ id: 10, type: 'ToForum', originId: null, previousEntryId: null }),
    true,
  )
  assert.equal(
    isForumThreadRoot({ id: 11, type: 'ToForum', originId: 10, previousEntryId: 10 }),
    false,
  )

  assert.equal(
    forumParentBelongsToThread(10, {
      id: 10,
      originId: 10,
      type: 'ToForum',
      isPublic: true,
      isActive: true,
    }),
    true,
  )
  assert.equal(
    forumParentBelongsToThread(10, {
      id: 12,
      originId: 10,
      type: 'ToForum',
      isPublic: true,
      isActive: true,
    }),
    true,
  )
  assert.equal(
    forumParentBelongsToThread(10, {
      id: 12,
      originId: 99,
      type: 'ToForum',
      isPublic: true,
      isActive: true,
    }),
    false,
  )
  assert.equal(
    forumParentBelongsToThread(10, {
      id: 12,
      originId: 10,
      type: 'ToForum',
      isPublic: false,
      isActive: true,
    }),
    false,
  )
  assert.equal(
    forumParentBelongsToThread(10, {
      id: 12,
      originId: 10,
      type: 'ToForum',
      isPublic: true,
      isActive: false,
    }),
    false,
  )
}

{
  assert.equal(parseForumFlagReason('spam'), 'spam')
  assert.equal(parseForumFlagReason(' MISINFORMATION '), 'misinformation')
  assert.equal(parseForumFlagReason('not-real'), null)
  assert.equal(parseForumLimit('30'), 30)
  assert.equal(parseForumLimit('999'), 100)
  assert.equal(parseForumLimit('nope'), 30)
}

console.log('verifyForumApi.test.ts: all assertions passed')
