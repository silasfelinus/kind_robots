import assert from 'node:assert/strict'
import {
  DEFAULT_FORUM_CHANNELS,
  FORUM_DUPLICATE_SIMILARITY_THRESHOLD,
  FORUM_HEALTH_CLAIM_ESCALATION_THRESHOLD,
  FORUM_MAX_REPLY_DEPTH,
  buildForumReadFilter,
  buildForumReplyReadFilter,
  canManageForumPost,
  credentialHasForumScope,
  findForumChannel,
  forumAttachmentCanonicalPath,
  forumContentSimilarity,
  forumParentBelongsToThread,
  forumPostIsPubliclyVisible,
  forumReplyDepthAtLimit,
  forumRetryAfterSeconds,
  isForumAttachmentKind,
  isForumNearDuplicate,
  isForumPostEdited,
  isForumPostRemoved,
  isForumThreadRoot,
  isHealthClaimFlagReason,
  normalizeForumContent,
  parseForumChannelRegistryJson,
  parseForumFlagReason,
  parseForumLimit,
  shouldEscalateHealthClaimFlags,
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

  // rainbow-butterflies/t-034 -- every default board carries its drafted
  // one-line posting guidance (projects/rainbow-butterflies/FORUM-LAUNCH-PREP.md
  // §1), not just slug/label/description.
  assert.ok(DEFAULT_FORUM_CHANNELS.every((channel) => channel.postingGuidance.length > 0))

  const configured = parseForumChannelRegistryJson(
    JSON.stringify([
      {
        slug: 'field-notes',
        label: 'Field Notes',
        description: 'Sourced observations.',
        postingGuidance: 'Link your source.',
      },
      { slug: 'field-notes', label: 'Duplicate', description: 'Dropped.' },
      { slug: 'Build Lab', label: 'Invalid slug', description: 'Dropped.' },
    ]),
  )
  assert.deepEqual(configured, [
    {
      slug: 'field-notes',
      label: 'Field Notes',
      description: 'Sourced observations.',
      postingGuidance: 'Link your source.',
    },
  ])

  // A legacy override that omits postingGuidance entirely is still accepted
  // (self-hosters on an older FORUM_CHANNELS_JSON shouldn't break) and
  // defaults it to an empty string rather than dropping the channel.
  const legacyConfigured = parseForumChannelRegistryJson(
    JSON.stringify([
      { slug: 'legacy-board', label: 'Legacy Board', description: 'No guidance set yet.' },
    ]),
  )
  assert.deepEqual(legacyConfigured, [
    {
      slug: 'legacy-board',
      label: 'Legacy Board',
      description: 'No guidance set yet.',
      postingGuidance: '',
    },
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

// rainbow-butterflies/t-032 -- max reply-nesting-depth guard.
{
  assert.equal(forumReplyDepthAtLimit(0), false)
  assert.equal(forumReplyDepthAtLimit(FORUM_MAX_REPLY_DEPTH - 1), false)
  assert.equal(forumReplyDepthAtLimit(FORUM_MAX_REPLY_DEPTH), true)
  assert.equal(forumReplyDepthAtLimit(FORUM_MAX_REPLY_DEPTH + 1), true)
}

{
  assert.equal(parseForumFlagReason('spam'), 'spam')
  assert.equal(parseForumFlagReason(' MISINFORMATION '), 'misinformation')
  assert.equal(parseForumFlagReason('not-real'), null)
  assert.equal(parseForumLimit('30'), 30)
  assert.equal(parseForumLimit('999'), 100)
  assert.equal(parseForumLimit('nope'), 30)
}

// rainbow-butterflies/t-025 -- minimum safe commons controls.
{
  assert.equal(normalizeForumContent('  Hello   World  '), 'hello world')
  assert.equal(normalizeForumContent('SAME'), normalizeForumContent('same'))

  assert.equal(forumContentSimilarity('hello world', 'hello world'), 1)
  assert.equal(forumContentSimilarity('hello world', 'HELLO   WORLD'), 1)
  assert.equal(forumContentSimilarity('', ''), 1)
  assert.equal(forumContentSimilarity('a', 'ab'), 0)

  const nearlyIdentical = forumContentSimilarity(
    'Please check out my new project, it is really cool!',
    'Please check out my new project, it is really cool.',
  )
  assert.ok(
    nearlyIdentical >= FORUM_DUPLICATE_SIMILARITY_THRESHOLD,
    `expected near-identical strings to score >= ${FORUM_DUPLICATE_SIMILARITY_THRESHOLD}, got ${nearlyIdentical}`,
  )
  assert.equal(
    isForumNearDuplicate(
      'Please check out my new project, it is really cool!',
      'Please check out my new project, it is really cool.',
    ),
    true,
  )

  const unrelated = forumContentSimilarity(
    'Please check out my new project, it is really cool!',
    'The weather has been unusually mild this week in the valley.',
  )
  assert.ok(
    unrelated < FORUM_DUPLICATE_SIMILARITY_THRESHOLD,
    `expected unrelated strings to score < ${FORUM_DUPLICATE_SIMILARITY_THRESHOLD}, got ${unrelated}`,
  )
  assert.equal(
    isForumNearDuplicate(
      'Please check out my new project, it is really cool!',
      'The weather has been unusually mild this week in the valley.',
    ),
    false,
  )

  assert.equal(forumRetryAfterSeconds(10_000, 0), 10)
  assert.equal(forumRetryAfterSeconds(1_500, 0), 2)
  assert.equal(forumRetryAfterSeconds(-5_000, 0), 1)
}

{
  const created = new Date('2026-08-01T00:00:00Z')
  assert.equal(isForumPostEdited({ createdAt: created, updatedAt: null }), false)
  assert.equal(isForumPostEdited({ createdAt: created, updatedAt: created }), false)
  assert.equal(
    isForumPostEdited({
      createdAt: created,
      updatedAt: new Date('2026-08-01T00:05:00Z'),
    }),
    true,
  )

  assert.equal(isForumPostRemoved({ isActive: true }), false)
  assert.equal(isForumPostRemoved({ isActive: false }), true)

  assert.deepEqual(buildForumReplyReadFilter(), {
    type: 'ToForum',
    isPublic: true,
    isMature: false,
  })
  assert.deepEqual(buildForumReplyReadFilter({ includeMature: true }), {
    type: 'ToForum',
    isPublic: true,
  })
  assert.equal('isActive' in buildForumReplyReadFilter(), false)
}

{
  assert.equal(isHealthClaimFlagReason('misinformation'), true)
  assert.equal(isHealthClaimFlagReason('unsafe'), true)
  assert.equal(isHealthClaimFlagReason('spam'), false)
  assert.equal(isHealthClaimFlagReason('harassment'), false)
  assert.equal(isHealthClaimFlagReason('other'), false)

  assert.equal(
    shouldEscalateHealthClaimFlags(FORUM_HEALTH_CLAIM_ESCALATION_THRESHOLD - 1),
    false,
  )
  assert.equal(
    shouldEscalateHealthClaimFlags(FORUM_HEALTH_CLAIM_ESCALATION_THRESHOLD),
    true,
  )
  assert.equal(
    shouldEscalateHealthClaimFlags(FORUM_HEALTH_CLAIM_ESCALATION_THRESHOLD + 5),
    true,
  )
}

console.log('verifyForumApi.test.ts: all assertions passed')
