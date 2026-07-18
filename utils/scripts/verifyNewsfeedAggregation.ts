// /utils/scripts/verifyNewsfeedAggregation.ts
//
// Regression test for server/utils/newsfeed.ts (conductor projects/newsfeed
// t-005). No network dependency for the parsing assertions -- fixtures cover
// RSS 2.0 and Atom, HTML/CDATA sanitization, category-tag extraction, and
// malformed input. One live-network assertion proves fetchSourceItems never
// throws on an unreachable host (a closed local port), which is the actual
// "one broken source can't blank the homepage" guarantee this module exists
// to provide.
import assert from 'node:assert/strict'
import http from 'node:http'
import type { AddressInfo } from 'node:net'

import {
  aggregateFeed,
  fetchSourceItems,
  normalizeEntry,
  parseFeedXml,
  sanitizeText,
} from '../../server/utils/newsfeed'
import type {
  FeedDefinition,
  FeedSourceDefinition,
} from '../../stores/helpers/newsfeed'

// --- sanitizeText --------------------------------------------------------

assert.equal(
  sanitizeText('<p>Hello &amp; <strong>world</strong></p>'),
  'Hello & world',
  'tags must be stripped and entities decoded',
)
assert.equal(
  sanitizeText('<![CDATA[<em>cdata</em> body]]>'),
  'cdata body',
  'CDATA wrapper must be unwrapped before tag-stripping',
)
assert.equal(
  sanitizeText('a'.repeat(300)),
  `${'a'.repeat(279)}…`,
  'text longer than maxLength must be truncated with an ellipsis',
)

// --- parseFeedXml: RSS 2.0 -------------------------------------------------

const RSS_FIXTURE = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Fixture Feed</title>
    <item>
      <title>First &amp; Best Post</title>
      <link>https://example.com/first</link>
      <guid>urn:uuid:first</guid>
      <description><![CDATA[<p>Summary of the <b>first</b> post.</p>]]></description>
      <pubDate>Mon, 01 Jan 2026 12:00:00 GMT</pubDate>
      <category>ai</category>
      <category>research</category>
    </item>
    <item>
      <title>Second Post</title>
      <link>https://example.com/second</link>
      <description>Plain text summary.</description>
      <pubDate>Tue, 02 Jan 2026 12:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`

const rssEntries = parseFeedXml(RSS_FIXTURE)
assert.equal(rssEntries.length, 2, 'must find both <item> blocks')
const [firstRssEntry, secondRssEntry] = rssEntries
assert.ok(
  firstRssEntry && secondRssEntry,
  'both fixture entries must be present',
)
assert.equal(firstRssEntry.title, 'First & Best Post')
assert.equal(firstRssEntry.link, 'https://example.com/first')
assert.equal(
  firstRssEntry.description,
  '<p>Summary of the <b>first</b> post.</p>',
)
assert.deepEqual(firstRssEntry.categories, ['ai', 'research'])
assert.equal(secondRssEntry.guid, undefined, 'guid is optional')

// --- parseFeedXml: Atom -----------------------------------------------------

const ATOM_FIXTURE = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Atom Entry</title>
    <link href="https://example.com/atom-entry" />
    <id>tag:example.com,2026:atom-entry</id>
    <summary>An atom summary.</summary>
    <updated>2026-01-03T00:00:00Z</updated>
    <category term="engineering" />
  </entry>
</feed>`

const atomEntries = parseFeedXml(ATOM_FIXTURE)
assert.equal(atomEntries.length, 1, 'must find the <entry> block')
const [firstAtomEntry] = atomEntries
assert.ok(firstAtomEntry, 'the fixture entry must be present')
assert.equal(firstAtomEntry.link, 'https://example.com/atom-entry')
assert.equal(firstAtomEntry.pubDate, '2026-01-03T00:00:00Z')
assert.deepEqual(firstAtomEntry.categories, ['engineering'])

// --- parseFeedXml: malformed / empty input must not throw ------------------

assert.deepEqual(parseFeedXml(''), [], 'empty input returns no entries')
assert.deepEqual(
  parseFeedXml('not xml at all'),
  [],
  'non-XML input returns no entries',
)

// --- normalizeEntry ---------------------------------------------------------

const FIXTURE_SOURCE: FeedSourceDefinition = {
  id: 'fixture-source',
  name: 'Fixture Source',
  url: 'https://example.com/feed.xml',
  kind: 'rss',
  verified: false,
}

const normalized = normalizeEntry(firstRssEntry, FIXTURE_SOURCE)
assert.ok(normalized, 'entry with title + link must normalize')
assert.equal(normalized?.source, 'Fixture Source')
assert.equal(
  normalized?.publishedAt,
  new Date('Mon, 01 Jan 2026 12:00:00 GMT').toISOString(),
)
assert.deepEqual(normalized?.category, ['ai', 'research'])

assert.equal(
  normalizeEntry(
    { title: undefined, link: 'https://example.com/x', categories: [] },
    FIXTURE_SOURCE,
  ),
  null,
  'an entry missing a title must be dropped rather than rendered blank',
)
assert.equal(
  normalizeEntry(
    { title: 'No link', link: undefined, categories: [] },
    FIXTURE_SOURCE,
  ),
  null,
  'an entry missing a link must be dropped -- nothing for the user to click through to',
)

const noDateEntry = normalizeEntry(
  { title: 'No date', link: 'https://example.com/no-date', categories: [] },
  FIXTURE_SOURCE,
)
assert.ok(
  noDateEntry && !Number.isNaN(new Date(noDateEntry.publishedAt).getTime()),
  'a missing pubDate must fall back to a valid (epoch) timestamp, never NaN',
)

// --- fetchSourceItems: unreachable host must resolve, never throw ----------

async function run() {
  const unreachableSource: FeedSourceDefinition = {
    id: 'unreachable-fixture',
    name: 'Unreachable Fixture',
    url: 'http://127.0.0.1:1/feed.xml',
    kind: 'rss',
    verified: false,
  }

  const result = await fetchSourceItems(unreachableSource)
  assert.equal(result.sourceId, 'unreachable-fixture')
  assert.deepEqual(
    result.items,
    [],
    'an unreachable source must yield an empty item list',
  )
  assert.ok(
    result.error,
    'an unreachable source must report an error string, not throw',
  )

  // --- aggregateFeed: a feed with only broken sources must still resolve ---

  const feed: FeedDefinition = {
    slug: 'fixture-feed',
    title: 'Fixture Feed',
    description: 'test',
    icon: 'kind-icon:test',
    defaultEnabled: true,
    sourceIds: ['unreachable-fixture'],
    defaultSort: 'recent',
    topicPolitical: false,
  }

  // aggregateFeed resolves sources by id via the real registry, so a source
  // id absent from FEED_SOURCES simply yields zero sources -- this still
  // proves the "no sources / all sources failed" path returns an empty,
  // well-formed AggregatedFeed instead of throwing.
  const aggregated = await aggregateFeed(feed)
  assert.equal(aggregated.slug, 'fixture-feed')
  assert.deepEqual(aggregated.items, [])
  assert.deepEqual(
    aggregated.sourceErrors,
    [],
    'unknown source ids are skipped, not errored',
  )

  // --- fetchSourceItems: stale-source tolerance -----------------------------
  // A source that has previously succeeded, then goes down, must keep serving
  // its last-known-good items (flagged `stale: true`) instead of dropping to
  // zero -- the actual gap t-009 closes on top of t-005's existing "one
  // broken source can't blank the homepage" guarantee.

  const server = http.createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/rss+xml' })
    res.end(RSS_FIXTURE)
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo

  const flakySource: FeedSourceDefinition = {
    id: 'flaky-fixture',
    name: 'Flaky Fixture',
    url: `http://127.0.0.1:${port}/feed.xml`,
    kind: 'rss',
    verified: false,
  }

  const liveResult = await fetchSourceItems(flakySource)
  assert.equal(liveResult.items.length, 2, 'live fetch must parse both items')
  assert.equal(liveResult.stale, undefined, 'a live fetch is never stale')
  assert.equal(liveResult.error, undefined, 'a successful fetch has no error')

  await new Promise<void>((resolve) => server.close(() => resolve()))

  const staleResult = await fetchSourceItems(flakySource)
  assert.deepEqual(
    staleResult.items,
    liveResult.items,
    'once the source goes down, its last successful items must still be served',
  )
  assert.equal(
    staleResult.stale,
    true,
    'items served from the fallback cache must be flagged stale',
  )
  assert.ok(
    staleResult.error,
    'a stale-fallback result must still report the underlying fetch error',
  )

  // A source that has never succeeded has nothing to fall back to -- it must
  // keep the original always-empty behavior, not synthesize items from thin air.
  const neverSucceededResult = await fetchSourceItems(unreachableSource)
  assert.deepEqual(
    neverSucceededResult.items,
    [],
    'a source with no prior success has no stale cache to fall back to',
  )
  assert.equal(neverSucceededResult.stale, undefined)

  console.log(
    'newsfeed aggregation verified: RSS + Atom parsing, sanitization, category ' +
      'extraction, malformed-input safety, unreachable-source resilience, and ' +
      'stale-source fallback.',
  )
}

run()
