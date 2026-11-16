import { appendFileSync } from 'node:fs'
import {
  CRAWLER_AGENTS,
  arcadeShareTargets,
  namesThisCabinet,
  readShareTags,
  unfurlProblems,
  type ArcadeShareTarget,
} from '../arcade/shareCheck'

const args = process.argv.slice(2)
const base =
  args.find((arg) => arg.startsWith('--base='))?.slice(7) ??
  process.env.ARCADE_BASE_URL ??
  'https://kindrobots.org'
const checkUnfurls = args.includes('--unfurl')
const strictUnfurls = args.includes('--strict-unfurl')
const showcaseOnly = args.includes('--showcase')

async function fetchWithTimeout(url: string, init: RequestInit = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 20_000)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function artProblem(target: ArcadeShareTarget) {
  try {
    const res = await fetchWithTimeout(target.artUrl)
    const type = res.headers.get('content-type') ?? ''
    if (!res.ok) return `title art ${res.status}`
    if (!type.startsWith('image/')) return `title art served as ${type}`
    return ''
  } catch (err) {
    return `title art unreachable (${(err as Error).name})`
  }
}

async function unfurlReport(target: ArcadeShareTarget) {
  const problems: string[] = []
  for (const agent of CRAWLER_AGENTS) {
    const bot = agent.match(/(facebookexternalhit|Discordbot|Twitterbot)/)![1]
    try {
      const res = await fetchWithTimeout(target.pageUrl, {
        headers: { 'user-agent': agent },
      })
      if (!res.ok) {
        problems.push(`${bot}: page ${res.status}`)
        continue
      }
      const tags = readShareTags(await res.text())
      for (const problem of unfurlProblems(tags))
        problems.push(`${bot}: ${problem}`)
      if (!namesThisCabinet(tags, target))
        problems.push(`${bot}: og:title is "${tags['og:title'] ?? ''}"`)
      const image = tags['og:image']
      if (image && /^https?:\/\//.test(image)) {
        const img = await fetchWithTimeout(image)
        if (!img.ok) problems.push(`${bot}: og:image ${img.status}`)
      }
    } catch (err) {
      problems.push(`${bot}: unreachable (${(err as Error).name})`)
    }
  }
  return [...new Set(problems)]
}

const targets = arcadeShareTargets(base).filter(
  (target) => !showcaseOnly || target.shelf === 'showcase',
)
const rows: string[] = []
let missingArt = 0
let badUnfurls = 0
for (const target of targets) {
  const art = await artProblem(target)
  if (art) missingArt++
  const unfurl = checkUnfurls ? await unfurlReport(target) : []
  if (unfurl.length) badUnfurls++
  const status = art || unfurl.length ? 'FIX' : 'ok'
  rows.push(
    `| ${target.title} | ${target.shelf} | ${art || 'ok'} | ${
      checkUnfurls ? unfurl.join('; ') || 'ok' : 'not checked'
    } | ${status} |`,
  )
}

const report = [
  `## Arcade share check: ${base}`,
  '',
  `${targets.length} cabinets · ${missingArt} missing title art` +
    (checkUnfurls ? ` · ${badUnfurls} unfurl problems` : ''),
  '',
  '| Cabinet | Shelf | Title art | Unfurl | |',
  '| --- | --- | --- | --- | --- |',
  ...rows,
  '',
].join('\n')
console.log(report)
if (process.env.GITHUB_STEP_SUMMARY)
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, report)

if (missingArt || (strictUnfurls && badUnfurls)) process.exit(1)
