// /utils/scripts/verifySiteStats.test.ts
//
// Pins the privacy-first site counter: key normalization, the kind whitelist,
// bot detection, the Pacific day and the admin summary shape. DB-free.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  SITE_STAT_DIRECT,
  clampSiteStatDays,
  isSiteStatBot,
  normalizeEventName,
  normalizeReferrerHost,
  normalizeSitePath,
  normalizeSiteStat,
  shiftSiteStatDay,
  siteStatDay,
  summarizeSiteStats,
} from '../siteStats'

assert.equal(normalizeSitePath('/'), '/')
assert.equal(normalizeSitePath('/art/12345'), '/art/:id')
assert.equal(normalizeSitePath('/art/12345?tab=x#top'), '/art/:id')
assert.equal(normalizeSitePath('/Arcade/Pinball/'), '/arcade/pinball')
assert.equal(normalizeSitePath('/art//7/edit'), '/art/:id/edit')
assert.equal(
  normalizeSitePath('/dreams/3f2504e0-4f89-11d3-9a0c-0305e82c3301'),
  '/dreams/:id',
)
assert.equal(normalizeSitePath('/u/cl9ebqhxk00003b600tymydho'), '/u/:id')
assert.equal(
  normalizeSitePath('/play/emperor-of-dust'),
  '/play/emperor-of-dust',
)
assert.equal(normalizeSitePath('/a/b/c/d/e/f/g/h'), '/a/b/c/d/e/f/g/h')
assert.equal(normalizeSitePath('/a/b/c/d/e/f/g/h/i'), null, 'too many segments')
assert.equal(normalizeSitePath('https://evil.example/x'), null)
assert.equal(normalizeSitePath('//evil.example/x'), null)
assert.equal(normalizeSitePath('/has space'), null)
assert.equal(normalizeSitePath('/<script>'), null)
assert.equal(normalizeSitePath('/' + 'z'.repeat(200)), null, 'over 191 chars')
assert.equal(
  normalizeSitePath('/' + 'a'.repeat(200)),
  '/:id',
  'long hex is an id',
)
assert.equal(normalizeSitePath(42), null)

assert.equal(normalizeReferrerHost(''), SITE_STAT_DIRECT)
assert.equal(normalizeReferrerHost('direct'), SITE_STAT_DIRECT)
assert.equal(
  normalizeReferrerHost('https://www.Google.com/search?q=kind+robots'),
  'google.com',
)
assert.equal(
  normalizeReferrerHost('news.ycombinator.com'),
  'news.ycombinator.com',
)
assert.equal(
  normalizeReferrerHost('https://kindrobots.org/art'),
  SITE_STAT_DIRECT,
)
assert.equal(
  normalizeReferrerHost('https://www.kindrobots.org/'),
  SITE_STAT_DIRECT,
)
assert.equal(normalizeReferrerHost('http://localhost:3000/'), SITE_STAT_DIRECT)
assert.equal(normalizeReferrerHost('not a host!'), SITE_STAT_DIRECT)
assert.equal(normalizeReferrerHost(null), SITE_STAT_DIRECT)

assert.equal(normalizeEventName('support:shown'), 'support:shown')
assert.equal(normalizeEventName('arcade_play-start'), 'arcade_play-start')
assert.equal(normalizeEventName('Support:Shown'), null)
assert.equal(normalizeEventName(''), null)
assert.equal(normalizeEventName('a'.repeat(65)), null)
assert.equal(normalizeEventName('support shown'), null)

assert.deepEqual(normalizeSiteStat({ kind: 'view', key: '/art/9?x=1' }), {
  kind: 'view',
  key: '/art/:id',
})
assert.deepEqual(
  normalizeSiteStat({ kind: 'visit', key: 'https://t.co/abc' }),
  { kind: 'visit', key: 't.co' },
)
assert.deepEqual(normalizeSiteStat({ kind: 'event', key: 'support:give' }), {
  kind: 'event',
  key: 'support:give',
})
assert.equal(
  normalizeSiteStat({ kind: 'view', key: '/admin/site-stats' }),
  null,
)
assert.equal(normalizeSiteStat({ kind: 'view', key: '/admin' }), null)
assert.ok(normalizeSiteStat({ kind: 'view', key: '/administrator-guide' }))
assert.equal(normalizeSiteStat({ kind: 'click', key: '/' }), null)
assert.equal(normalizeSiteStat({ kind: 'event', key: 'BAD NAME' }), null)
assert.equal(normalizeSiteStat({ kind: 'view', key: 'x'.repeat(500) }), null)
assert.equal(normalizeSiteStat({ kind: 'view' }), null)
assert.equal(normalizeSiteStat(null), null)
assert.equal(normalizeSiteStat(['view', '/']), null)

assert.ok(isSiteStatBot('Googlebot/2.1 (+http://www.google.com/bot.html)'))
assert.ok(isSiteStatBot('Mozilla/5.0 HeadlessChrome/120.0'))
assert.ok(isSiteStatBot('facebookexternalhit/1.1 Slack-LinkExpanding Preview'))
assert.ok(isSiteStatBot(''))
assert.ok(isSiteStatBot(undefined))
assert.ok(
  !isSiteStatBot(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Safari/605.1.15',
  ),
)

assert.equal(siteStatDay(new Date('2026-10-26T06:30:00Z')), '2026-10-25')
assert.equal(siteStatDay(new Date('2026-10-26T08:30:00Z')), '2026-10-26')
assert.equal(siteStatDay(new Date('2026-01-01T07:59:00Z')), '2025-12-31')
assert.equal(shiftSiteStatDay('2026-03-01', -1), '2026-02-28')
assert.equal(shiftSiteStatDay('2026-12-31', 1), '2027-01-01')
assert.equal(clampSiteStatDays(undefined), 30)
assert.equal(clampSiteStatDays('7'), 7)
assert.equal(clampSiteStatDays('0'), 30)
assert.equal(clampSiteStatDays('365'), 90)
assert.equal(clampSiteStatDays('2.5'), 30)

const summary = summarizeSiteStats(
  [
    { day: new Date('2026-10-26T00:00:00Z'), kind: 'view', key: '/', count: 5 },
    { day: '2026-10-26', kind: 'view', key: '/arcade', count: 7 },
    { day: '2026-10-25', kind: 'view', key: '/', count: 2 },
    { day: '2026-10-25', kind: 'visit', key: 'direct', count: 3 },
    { day: '2026-10-26', kind: 'visit', key: 'google.com', count: 4 },
    { day: '2026-10-26', kind: 'event', key: 'support:shown', count: 6 },
    { day: '2026-10-01', kind: 'view', key: '/old', count: 99 },
    { day: '2026-10-26', kind: 'mystery', key: '/', count: 50 },
  ],
  7,
  '2026-10-26',
)
assert.equal(summary.from, '2026-10-20')
assert.equal(summary.to, '2026-10-26')
assert.equal(summary.daily.length, 7)
assert.deepEqual(summary.daily[6], { day: '2026-10-26', views: 12, visits: 4 })
assert.deepEqual(summary.daily[5], { day: '2026-10-25', views: 2, visits: 3 })
assert.deepEqual(summary.daily[0], { day: '2026-10-20', views: 0, visits: 0 })
assert.deepEqual(summary.totals, { views: 14, visits: 7, events: 6 })
assert.deepEqual(
  summary.topPaths,
  [
    { key: '/', count: 7 },
    { key: '/arcade', count: 7 },
  ],
  'ties rank alphabetically and out-of-range days are excluded',
)
assert.deepEqual(summary.topReferrers[0], { key: 'google.com', count: 4 })
assert.deepEqual(summary.topEvents, [{ key: 'support:shown', count: 6 }])

const schema = readFileSync('prisma/site-stats.prisma', 'utf8')
for (const forbidden of ['ip', 'userAgent', 'userId', 'cookie'])
  assert.ok(
    !new RegExp(`^\\s+${forbidden}\\b`, 'im').test(schema),
    `SiteStatDaily must never gain a ${forbidden} column`,
  )
const store = readFileSync('stores/siteStatsStore.ts', 'utf8')
assert.ok(
  /function trackEvent\(name: string\): void/.test(store),
  'trackEvent(name: string): void is a public contract other features call',
)
assert.ok(
  store.includes("navigator.doNotTrack === '1'"),
  'honours Do Not Track',
)

console.log('site stats normalization, summary and privacy contracts ok')
