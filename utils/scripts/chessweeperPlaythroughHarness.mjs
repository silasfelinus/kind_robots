// Shared harness for the Chessweeper real-browser playthrough tests.
//
// Serves public/ on a loopback port (Chessweeper is a static page) and, when
// CHESSWEEPER_ART_ORIGIN is set, proxies /images/chessweeper/* to that origin so
// screenshots show the delivered painted art. Without it, image requests 404 and
// the game must stay fully playable on its code-drawn fallbacks.
//
// The bot drives the game through real DOM clicks on the mode buttons and board
// squares. It reads engine state only to choose a move, never to change it.

import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const PUBLIC_DIR = fileURLToPath(new URL('../../public/', import.meta.url))
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.wav': 'audio/wav',
  '.svg': 'image/svg+xml',
}

export async function startServer({ artOrigin = '' } = {}) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost')
      if (artOrigin && url.pathname.startsWith('/images/chessweeper/')) {
        const upstream = await fetch(artOrigin + url.pathname)
        res.writeHead(upstream.status, {
          'content-type':
            upstream.headers.get('content-type') || 'application/octet-stream',
        })
        res.end(Buffer.from(await upstream.arrayBuffer()))
        return
      }
      const path = normalize(join(PUBLIC_DIR, decodeURIComponent(url.pathname)))
      if (!path.startsWith(PUBLIC_DIR)) throw new Error('outside public')
      const info = await stat(path)
      if (!info.isFile()) throw new Error('not a file')
      res.writeHead(200, {
        'content-type': TYPES[extname(path)] || 'application/octet-stream',
      })
      res.end(await readFile(path))
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' })
      res.end('not found')
    }
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return { origin: `http://127.0.0.1:${port}`, close: () => server.close() }
}

// Runs inside the page: choose the next white action for a strategy.
// Returns { kind: 'move', from, to, promote } | { kind: 'probe', square } | null.
export function chooseAction(strategy) {
  const api = window.__fusionTest
  const s = api.get()
  const chess = window.ChessweeperChess
  if (!s || s.over || s.busy || s.chess.t !== 1 || s.promotion) return null
  const legal = chess.legalMoves(s.chess)
  if (!legal.length) return null
  const inCheck = chess.inCheck(s.chess)
  const mineZone = (i) => i >> 4 >= 2 && i >> 4 <= 5
  const hidden = []
  for (let i = 0; i < 128; i++)
    if (!(i & 0x88) && mineZone(i) && !s.shown.has(i) && !s.flags.has(i))
      hidden.push(i)
  const nextBlade = new Set()
  for (const d of s.discs) {
    if (!d.active) continue
    const n = window.ChessweeperSeeded.stepDisc(d)
    nextBlade.add(n.y * 16 + n.x)
  }
  const values = { p: 1, n: 3, b: 3.2, r: 5, q: 9, k: 0 }
  const material = (board) => {
    let total = 0
    for (let i = 0; i < 128; i++) {
      if (i & 0x88 || board[i] === '.') continue
      const v = values[board[i].toLowerCase()]
      total += board[i] === board[i].toUpperCase() ? v : -v
    }
    return total
  }
  const dangerous = (to) =>
    nextBlade.has(to) || (mineZone(to) && !s.shown.has(to) && s.mines.has(to))
  if (strategy === 'fallen' && !inCheck) {
    const mine = hidden.find((i) => s.mines.has(i))
    if (mine !== undefined && s.firstProbeUsed)
      return { kind: 'probe', square: mine }
    const any = hidden.find((i) => !s.mines.has(i))
    if (any !== undefined && !s.firstProbeUsed)
      return { kind: 'probe', square: any }
  }
  if (strategy === 'sweep' && !inCheck) {
    const safe = hidden.find((i) => !s.mines.has(i))
    if (safe !== undefined) return { kind: 'probe', square: safe }
  }
  // Chess play: two-ply search with blade and known-mine avoidance.
  let best = -Infinity
  let chosen = legal[0]
  for (const m of legal) {
    const next = chess.makePosition(s.chess, m)
    const replies = chess.legalMoves(next)
    let score
    if (!replies.length) score = chess.inCheck(next) ? 1000 : -50
    else {
      let worst = Infinity
      for (const r of replies) {
        const after = chess.makePosition(next, r)
        let v = material(after.b)
        if (!chess.legalMoves(after).length && chess.inCheck(after)) v -= 1000
        worst = Math.min(worst, v)
      }
      score = worst
      if (chess.inCheck(next)) score += strategy === 'mate' ? 0.9 : 0.4
      if (strategy === 'mate')
        score += (30 - Math.min(30, replies.length)) * 0.04
    }
    if (strategy === 'arena') {
      // Keep pieces home and let the arena work: prefer quiet, safe moves.
      score = material(next.b) - (mineZone(m[1]) ? 2 : 0)
    }
    if (strategy !== 'fallen' && dangerous(m[1])) score -= 6
    if (strategy === 'fallen') score = -score
    score += ((m[0] * 31 + m[1] * 17 + s.turns * 7) % 13) / 100
    if (score > best) {
      best = score
      chosen = m
    }
  }
  return {
    kind: 'move',
    from: chosen[0],
    to: chosen[1],
    promote: chosen[2] || '',
  }
}

// Perform one action through the visible UI.
export async function act(page, action) {
  if (!action) return false
  if (action.kind === 'probe') {
    await page.click('#probe-mode')
    await page.click(`[data-square="${action.square}"]`)
    const over = await page.evaluate(() => window.__fusionTest.get().over)
    if (!over) await page.click('#move-mode')
    return true
  }
  await page.click(`[data-square="${action.from}"]`)
  await page.click(`[data-square="${action.to}"]`)
  if (action.promote) {
    const button = page.locator('#promotion-buttons button').first()
    if (await button.isVisible().catch(() => false)) await button.click()
  }
  return true
}

// Play one battle to completion. Returns the engine's end reason and type.
export async function playBattle(page, strategy, { maxActions = 220 } = {}) {
  for (let step = 0; step < maxActions; step++) {
    const over = await page.evaluate(() => window.__fusionTest.get().over)
    if (over) break
    const action = await page.evaluate(chooseAction, strategy)
    if (action) {
      const before = await page.evaluate(() => window.__fusionTest.get().turns)
      await act(page, action)
      const after = await page.evaluate(() => ({
        turns: window.__fusionTest.get().turns,
        over: window.__fusionTest.get().over,
      }))
      if (!after.over && after.turns === before) {
        // A click that did not take (e.g. probe while in check): fall back to chess.
        const fallback = await page.evaluate(chooseAction, 'mate')
        if (fallback && fallback.kind === 'move') await act(page, fallback)
      }
    }
    await page.clock.runFor(900)
  }
  return page.evaluate(() => {
    const s = window.__fusionTest.get()
    return {
      over: s.over,
      ended: s.ended,
      turns: s.turns,
      score: s.score,
      hp: s.hp[1],
      realm: document.documentElement.dataset.realm,
    }
  })
}
