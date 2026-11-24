;(function (root) {
  'use strict'

  const COLORS = 6
  const FIXED = { HOLE: 'hole', TANGLE: 'tangle' }

  function makeRng(seed) {
    return { s: seed >>> 0 || 0x9e3779b9 }
  }

  function nextRandom(rng) {
    rng.s = (rng.s + 0x6d2b79f5) >>> 0
    let t = rng.s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  function randInt(rng, n) {
    return Math.floor(nextRandom(rng) * n)
  }

  function hashString(text) {
    let h = 2166136261
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return h >>> 0
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value))
  }

  function inBounds(state, r, c) {
    return r >= 0 && c >= 0 && r < state.rows && c < state.cols
  }

  function isCell(state, r, c) {
    return inBounds(state, r, c) && state.mask[r][c] === 1
  }

  function tileAt(state, r, c) {
    return isCell(state, r, c) ? state.board[r][c] : null
  }

  function isGem(tile) {
    return !!tile && tile.kind === 'gem'
  }

  function isMovable(tile) {
    return (
      !!tile && !tile.ribbon && (tile.kind === 'gem' || tile.kind === 'buddy')
    )
  }

  function matchColor(tile) {
    if (!isGem(tile) || tile.special === 'rainbow') return -1
    return tile.color
  }

  function newGem(state, color, special) {
    return { id: state.nextId++, kind: 'gem', color, special: special || null }
  }

  function randomColor(state) {
    return randInt(state.rng, state.colors)
  }

  function createLevelState(def, options) {
    const opts = options || {}
    const rows = def.rows
    const cols = def.cols
    const mask = def.mask
      ? clone(def.mask)
      : Array.from({ length: rows }, () => Array(cols).fill(1))
    const state = {
      levelId: def.id,
      rows,
      cols,
      colors: Math.max(3, Math.min(COLORS, def.colors || 5)),
      mask,
      board: Array.from({ length: rows }, () => Array(cols).fill(null)),
      gloom: def.gloom
        ? clone(def.gloom)
        : Array.from({ length: rows }, () => Array(cols).fill(0)),
      rng: makeRng(def.seed || hashString(String(def.id))),
      nextId: 1,
      weather: clone(def.weather || null),
      score: 0,
      movesLeft: def.moves + (opts.bonusMoves || 0),
      movesUsed: 0,
      goals: clone(def.goals || []).map((goal) => ({ ...goal, progress: 0 })),
      buddiesToSpawn: 0,
      buddiesOnBoard: 0,
      perk: opts.perk || null,
      perkUses: 0,
      over: false,
      won: false,
      stats: {
        cleared: 0,
        cascadesMax: 0,
        combs: 0,
        bombs: 0,
        rainbows: 0,
        combos: 0,
        gloomCleared: 0,
        tanglesCleared: 0,
        buddiesRescued: 0,
        bigCascades: 0,
        undos: 0,
        hints: 0,
        colorsCleared: Array(COLORS).fill(0),
      },
    }
    for (const goal of state.goals) {
      if (goal.type === 'buddy') state.buddiesToSpawn += goal.target
    }
    const tangles = def.tangles || []
    for (const [r, c, hp] of tangles) {
      if (isCell(state, r, c)) {
        state.board[r][c] = {
          id: state.nextId++,
          kind: FIXED.TANGLE,
          hp: hp || 1,
        }
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!isCell(state, r, c) || state.board[r][c]) continue
        state.board[r][c] = newGem(state, safeColor(state, r, c))
      }
    }
    for (const [r, c, special] of def.startingSpecials || []) {
      const tile = tileAt(state, r, c)
      if (isGem(tile) && ['h', 'v', 'bomb'].includes(special))
        tile.special = special
    }
    const buddyStart = Math.min(state.buddiesToSpawn, def.buddiesAtStart || 0)
    for (let i = 0; i < buddyStart; i++) placeStartBuddy(state, i)
    if (opts.perk === 'rainbow-start') {
      const spot = randomGemCell(state)
      if (spot) state.board[spot[0]][spot[1]].special = 'rainbow'
    }
    if (opts.perk === 'comb-start') {
      for (let i = 0; i < 2; i++) {
        const spot = randomGemCell(state)
        if (spot) state.board[spot[0]][spot[1]].special = i ? 'v' : 'h'
      }
    }
    if (opts.perk === 'bomb-start') {
      const spot = randomGemCell(state)
      if (spot) state.board[spot[0]][spot[1]].special = 'bomb'
    }
    if (opts.perk === 'gentle-gloom') {
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
          if (state.gloom[r][c] > 1) state.gloom[r][c] = 1
      for (const goal of state.goals) {
        if (goal.type === 'gloom') {
          let count = 0
          for (let r = 0; r < rows; r++)
            for (let c = 0; c < cols; c++) if (state.gloom[r][c] > 0) count++
          goal.target = count
        }
      }
    }
    for (const [r, c] of def.ribbons || []) {
      const tile = tileAt(state, r, c)
      if (isGem(tile) && !tile.special) tile.ribbon = true
    }
    ensurePlayable(state)
    return state
  }

  function placeStartBuddy(state, index) {
    const c = (index * 3 + 1) % state.cols
    for (let r = 0; r < state.rows - 2; r++) {
      if (isGem(tileAt(state, r, c))) {
        state.board[r][c] = { id: state.nextId++, kind: 'buddy' }
        state.buddiesToSpawn--
        state.buddiesOnBoard++
        return
      }
    }
  }

  function randomGemCell(state) {
    const cells = []
    for (let r = 0; r < state.rows; r++)
      for (let c = 0; c < state.cols; c++)
        if (
          isGem(tileAt(state, r, c)) &&
          !tileAt(state, r, c).special &&
          !tileAt(state, r, c).ribbon
        )
          cells.push([r, c])
    return cells.length ? cells[randInt(state.rng, cells.length)] : null
  }

  function safeColor(state, r, c) {
    const banned = new Set()
    const left1 = tileAt(state, r, c - 1)
    const left2 = tileAt(state, r, c - 2)
    if (matchColor(left1) >= 0 && matchColor(left1) === matchColor(left2))
      banned.add(left1.color)
    const up1 = tileAt(state, r - 1, c)
    const up2 = tileAt(state, r - 2, c)
    if (matchColor(up1) >= 0 && matchColor(up1) === matchColor(up2))
      banned.add(up1.color)
    const right1 = tileAt(state, r, c + 1)
    const right2 = tileAt(state, r, c + 2)
    if (matchColor(right1) >= 0 && matchColor(right1) === matchColor(right2))
      banned.add(right1.color)
    const down1 = tileAt(state, r + 1, c)
    const down2 = tileAt(state, r + 2, c)
    if (matchColor(down1) >= 0 && matchColor(down1) === matchColor(down2))
      banned.add(down1.color)
    const options = []
    for (let i = 0; i < state.colors; i++) if (!banned.has(i)) options.push(i)
    return options.length
      ? options[randInt(state.rng, options.length)]
      : randomColor(state)
  }

  function findRuns(state) {
    const runs = []
    for (let r = 0; r < state.rows; r++) {
      let c = 0
      while (c < state.cols) {
        const color = matchColor(tileAt(state, r, c))
        let end = c + 1
        if (color >= 0) {
          while (
            end < state.cols &&
            matchColor(tileAt(state, r, end)) === color
          )
            end++
          if (end - c >= 3) {
            const cells = []
            for (let k = c; k < end; k++) cells.push([r, k])
            runs.push({ dir: 'h', color, cells })
          }
        }
        c = end
      }
    }
    for (let c = 0; c < state.cols; c++) {
      let r = 0
      while (r < state.rows) {
        const color = matchColor(tileAt(state, r, c))
        let end = r + 1
        if (color >= 0) {
          while (
            end < state.rows &&
            matchColor(tileAt(state, end, c)) === color
          )
            end++
          if (end - r >= 3) {
            const cells = []
            for (let k = r; k < end; k++) cells.push([k, c])
            runs.push({ dir: 'v', color, cells })
          }
        }
        r = end
      }
    }
    return runs
  }

  function key(r, c) {
    return r * 64 + c
  }

  function groupRuns(runs) {
    const groups = []
    for (const run of runs) {
      const keys = new Set(run.cells.map(([r, c]) => key(r, c)))
      const touching = groups.filter(
        (group) =>
          group.color === run.color &&
          run.cells.some(([r, c]) => group.keys.has(key(r, c))),
      )
      if (!touching.length) {
        groups.push({ color: run.color, runs: [run], keys })
        continue
      }
      const target = touching[0]
      target.runs.push(run)
      for (const k of keys) target.keys.add(k)
      for (const other of touching.slice(1)) {
        target.runs.push(...other.runs)
        for (const k of other.keys) target.keys.add(k)
        groups.splice(groups.indexOf(other), 1)
      }
    }
    return groups
  }

  function specialForGroup(group) {
    const longest = Math.max(...group.runs.map((run) => run.cells.length))
    const dirs = new Set(group.runs.map((run) => run.dir))
    if (longest >= 5) return 'rainbow'
    if (dirs.size > 1) return 'bomb'
    if (longest === 4) return group.runs[0].dir === 'h' ? 'v' : 'h'
    return null
  }

  function effectCells(state, r, c, tile, extra) {
    const cells = []
    const push = (rr, cc) => {
      if (isCell(state, rr, cc)) cells.push([rr, cc])
    }
    const special = tile.special
    if (special === 'h' || special === 'cross') {
      for (let k = 0; k < state.cols; k++) push(r, k)
    }
    if (special === 'v' || special === 'cross') {
      for (let k = 0; k < state.rows; k++) push(k, c)
    }
    if (special === 'bomb') {
      const radius = extra && extra.bigBombs ? 2 : 1
      for (let dr = -radius; dr <= radius; dr++)
        for (let dc = -radius; dc <= radius; dc++) push(r + dr, c + dc)
    }
    if (special === 'rainbow') {
      const color =
        extra && extra.color >= 0 ? extra.color : mostCommonColor(state)
      for (let rr = 0; rr < state.rows; rr++)
        for (let cc = 0; cc < state.cols; cc++)
          if (matchColor(tileAt(state, rr, cc)) === color) push(rr, cc)
    }
    return cells
  }

  function mostCommonColor(state) {
    const counts = Array(COLORS).fill(0)
    for (let r = 0; r < state.rows; r++)
      for (let c = 0; c < state.cols; c++) {
        const color = matchColor(tileAt(state, r, c))
        if (color >= 0) counts[color]++
      }
    let best = 0
    for (let i = 1; i < COLORS; i++) if (counts[i] > counts[best]) best = i
    return best
  }

  function damageCell(state, r, c, fromMatch, phase, touched) {
    const k = key(r, c)
    if (touched.has(k)) return
    touched.add(k)
    if (state.gloom[r][c] > 0) {
      state.gloom[r][c]--
      phase.gloom.push([r, c, state.gloom[r][c]])
      if (state.gloom[r][c] === 0) {
        state.stats.gloomCleared++
        bumpGoal(state, 'gloom', null, 1)
      }
    }
  }

  function hitTangle(state, r, c, phase, hitSet) {
    const tile = tileAt(state, r, c)
    if (!tile || tile.kind !== FIXED.TANGLE) return
    const k = key(r, c)
    if (hitSet.has(k)) return
    hitSet.add(k)
    tile.hp--
    if (tile.hp <= 0) {
      state.board[r][c] = null
      phase.cleared.push({ r, c, id: tile.id, kind: 'tangle' })
      state.stats.tanglesCleared++
      bumpGoal(state, 'tangle', null, 1)
    } else {
      phase.hurt.push({ r, c, id: tile.id, hp: tile.hp })
    }
  }

  function bumpGoal(state, type, color, amount) {
    for (const goal of state.goals) {
      if (goal.type !== type) continue
      if (type === 'collect' && goal.color !== color) continue
      if (type === 'special' && goal.special !== color) continue
      goal.progress = Math.min(goal.target, goal.progress + amount)
    }
  }

  function newPhase(cascade) {
    return {
      cascade,
      cleared: [],
      created: [],
      gloom: [],
      hurt: [],
      fired: [],
      rescued: [],
      score: 0,
      board: null,
      falls: null,
    }
  }

  function resolveClearSet(state, initial, phase, options) {
    const opts = options || {}
    const queue = initial.slice()
    const marked = new Set()
    const gloomTouched = new Set()
    const tangleHits = new Set()
    const keep = new Set((opts.keep || []).map(([r, c]) => key(r, c)))
    while (queue.length) {
      const [r, c, cause] = queue.shift()
      const k = key(r, c)
      if (marked.has(k) || !isCell(state, r, c)) continue
      const tile = state.board[r][c]
      if (tile && tile.kind === FIXED.TANGLE) {
        hitTangle(state, r, c, phase, tangleHits)
        continue
      }
      if (tile && tile.kind === 'buddy' && cause === 'special') {
        marked.add(k)
        state.board[r][c] = null
        phase.rescued.push({ r, c, id: tile.id, beamed: true })
        phase.score += 300
        state.buddiesOnBoard--
        state.stats.buddiesRescued++
        bumpGoal(state, 'buddy', null, 1)
        damageCell(state, r, c, false, phase, gloomTouched)
        continue
      }
      if (!tile || tile.kind === 'buddy') {
        damageCell(state, r, c, false, phase, gloomTouched)
        continue
      }
      marked.add(k)
      damageCell(state, r, c, cause === 'match', phase, gloomTouched)
      if (cause === 'match') {
        for (const [dr, dc] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          hitTangle(state, r + dr, c + dc, phase, tangleHits)
        }
      }
      if (tile.special && !keep.has(k)) {
        phase.fired.push({ r, c, special: tile.special, color: tile.color })
        const extra = {
          color: opts.rainbowColor,
          bigBombs: state.perk === 'big-bombs',
        }
        for (const [rr, cc] of effectCells(state, r, c, tile, extra)) {
          queue.push([rr, cc, 'special'])
        }
      }
    }
    let count = 0
    for (const k of marked) {
      const r = Math.floor(k / 64)
      const c = k % 64
      const tile = state.board[r][c]
      if (!tile || keep.has(k)) continue
      if (tile.kind === 'gem' && tile.special !== 'rainbow') {
        state.stats.colorsCleared[tile.color]++
        bumpGoal(state, 'collect', tile.color, 1)
      }
      phase.cleared.push({
        r,
        c,
        id: tile.id,
        kind: tile.kind,
        color: tile.color,
        special: tile.special,
      })
      state.board[r][c] = null
      count++
    }
    state.stats.cleared += count
    return count
  }

  function applyGravity(state, phase) {
    const falls = []
    for (let c = 0; c < state.cols; c++) {
      const slots = []
      const movers = []
      for (let r = state.rows - 1; r >= 0; r--) {
        if (!isCell(state, r, c)) continue
        const tile = state.board[r][c]
        if (tile && (tile.kind === FIXED.TANGLE || tile.ribbon)) continue
        slots.push(r)
        if (tile) movers.push({ tile, from: r })
        state.board[r][c] = null
      }
      let i = 0
      for (; i < movers.length; i++) {
        const slot = slots[i]
        state.board[slot][c] = movers[i].tile
        if (movers[i].from !== slot)
          falls.push({
            id: movers[i].tile.id,
            from: movers[i].from,
            to: slot,
            c,
          })
      }
      let spawnOffset = 1
      for (; i < slots.length; i++) {
        const slot = slots[i]
        const tile = spawnTile(state)
        state.board[slot][c] = tile
        falls.push({
          id: tile.id,
          from: -spawnOffset,
          to: slot,
          c,
          spawn: true,
        })
        spawnOffset++
      }
    }
    phase.falls = falls
  }

  function spawnTile(state) {
    if (
      state.buddiesToSpawn > 0 &&
      state.buddiesOnBoard < 2 &&
      nextRandom(state.rng) < 0.14
    ) {
      state.buddiesToSpawn--
      state.buddiesOnBoard++
      return { id: state.nextId++, kind: 'buddy' }
    }
    return newGem(state, randomColor(state))
  }

  function lowestCellInColumn(state, c) {
    for (let r = state.rows - 1; r >= 0; r--) {
      if (
        isCell(state, r, c) &&
        !(state.board[r][c] && state.board[r][c].kind === FIXED.TANGLE)
      )
        return r
    }
    return -1
  }

  function rescueBuddies(state, phase) {
    let rescued = 0
    for (let c = 0; c < state.cols; c++) {
      const lowest = lowestCellInColumn(state, c)
      if (lowest < 0) continue
      const rows = [lowest]
      if (state.perk === 'buddy-rescue') {
        for (let up = lowest - 1; up >= 0; up--) {
          if (!isCell(state, up, c)) continue
          const above = state.board[up][c]
          if (above && above.kind === FIXED.TANGLE) continue
          rows.push(up)
          break
        }
      }
      for (const r of rows) {
        const tile = state.board[r][c]
        if (tile && tile.kind === 'buddy') {
          phase.rescued.push({ r, c, id: tile.id })
          state.board[r][c] = null
          state.buddiesOnBoard--
          state.stats.buddiesRescued++
          bumpGoal(state, 'buddy', null, 1)
          rescued++
        }
      }
    }
    return rescued
  }

  function snapshot(state) {
    return state.board.map((row) =>
      row.map((tile) => (tile ? { ...tile } : null)),
    )
  }

  function scoreFor(count, cascade) {
    return Math.round(count * 20 * (1 + cascade * 0.5))
  }

  function cascade(state, firstPhase, swapCells) {
    const phases = []
    let phase = firstPhase
    let depth = 0
    let guard = 0
    while (phase && guard++ < 60) {
      const cleared = phase.cleared.filter(
        (item) => item.kind !== 'tangle',
      ).length
      phase.score += Math.round(
        (scoreFor(cleared, depth) + phase.created.length * 60) *
          (state.perk === 'score-boost' ? 1.25 : 1),
      )
      state.score += phase.score
      applyGravity(state, phase)
      phase.board = snapshot(state)
      phases.push(phase)
      const rescuePhase = newPhase(depth)
      if (rescueBuddies(state, rescuePhase)) {
        rescuePhase.score = rescuePhase.rescued.length * 300
        state.score += rescuePhase.score
        applyGravity(state, rescuePhase)
        rescuePhase.board = snapshot(state)
        phases.push(rescuePhase)
      }
      depth++
      const runs = findRuns(state)
      if (!runs.length) break
      phase = newPhase(depth)
      clearMatches(state, runs, phase, null)
    }
    state.stats.cascadesMax = Math.max(state.stats.cascadesMax, depth)
    if (depth >= 4) state.stats.bigCascades++
    if (state.perk === 'bloom' && depth >= 3 && state.perkUses < 2) {
      state.perkUses++
      state.movesLeft++
      phases.push({
        ...newPhase(depth),
        perk: 'bloom',
        board: snapshot(state),
        falls: [],
      })
    }
    return phases
  }

  function clearMatches(state, runs, phase, swapCells) {
    const groups = groupRuns(runs)
    const initial = []
    const keep = []
    const creations = []
    for (const group of groups) {
      const special = specialForGroup(group)
      for (const k of group.keys)
        initial.push([Math.floor(k / 64), k % 64, 'match'])
      if (!special) continue
      let spot = null
      if (swapCells) {
        for (const [r, c] of swapCells)
          if (group.keys.has(key(r, c))) spot = [r, c]
      }
      if (!spot) {
        const cells = [...group.keys].map((k) => [Math.floor(k / 64), k % 64])
        const existing = cells.filter(([r, c]) => !state.board[r][c].special)
        spot = (existing.length ? existing : cells)[
          Math.floor((existing.length || cells.length) / 2)
        ]
      }
      creations.push({ spot, special, color: group.color })
    }
    for (const { spot } of creations) {
      const tile = state.board[spot[0]][spot[1]]
      if (tile && !tile.special) keep.push(spot)
    }
    resolveClearSet(state, initial, phase, { keep })
    for (const { spot, special, color } of creations) {
      const [r, c] = spot
      const existing = state.board[r][c]
      if (existing && existing.special) continue
      const tile = newGem(state, color, special)
      if (existing) tile.id = existing.id
      state.board[r][c] = tile
      phase.created.push({ r, c, id: tile.id, special, color })
      bumpGoal(
        state,
        'special',
        special === 'h' || special === 'v' ? 'comb' : special,
        1,
      )
      if (special === 'rainbow') state.stats.rainbows++
      else if (special === 'bomb') state.stats.bombs++
      else state.stats.combs++
    }
  }

  function adjacent(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) === 1
  }

  function swapTiles(state, a, b) {
    const t = state.board[a[0]][a[1]]
    state.board[a[0]][a[1]] = state.board[b[0]][b[1]]
    state.board[b[0]][b[1]] = t
  }

  function comboClear(state, a, b, phase) {
    const ta = tileAt(state, a[0], a[1])
    const tb = tileAt(state, b[0], b[1])
    const sa = ta.special
    const sb = tb.special
    const initial = []
    const add = (cells) => {
      for (const [r, c] of cells) initial.push([r, c, 'special'])
    }
    state.stats.combos++
    if (sa && sb) bumpGoal(state, 'combo', null, 1)
    if (sa === 'rainbow' && sb === 'rainbow') {
      for (let r = 0; r < state.rows; r++)
        for (let c = 0; c < state.cols; c++)
          if (isCell(state, r, c)) initial.push([r, c, 'special'])
      ta.special = null
      tb.special = null
      ta.color = 0
      tb.color = 0
      phase.fired.push({ r: a[0], c: a[1], special: 'double-rainbow' })
      resolveClearSet(state, initial, phase)
      return
    }
    if (sa === 'rainbow' || sb === 'rainbow') {
      const [rainbowCell, other, otherCell] =
        sa === 'rainbow' ? [a, tb, b] : [b, ta, a]
      const color = other.color
      const rainbowTile = tileAt(state, rainbowCell[0], rainbowCell[1])
      rainbowTile.special = null
      rainbowTile.color = color
      phase.fired.push({
        r: rainbowCell[0],
        c: rainbowCell[1],
        special: 'rainbow',
        color,
      })
      initial.push([rainbowCell[0], rainbowCell[1], 'special'])
      initial.push([otherCell[0], otherCell[1], 'special'])
      for (let r = 0; r < state.rows; r++)
        for (let c = 0; c < state.cols; c++) {
          const tile = tileAt(state, r, c)
          if (matchColor(tile) !== color) continue
          if (other.special && !tile.special) {
            tile.special =
              other.special === 'bomb' ? 'bomb' : (r + c) % 2 ? 'h' : 'v'
          }
          initial.push([r, c, 'special'])
        }
      resolveClearSet(state, initial, phase)
      return
    }
    const bombs = (sa === 'bomb') + (sb === 'bomb')
    ta.special = null
    tb.special = null
    if (bombs === 2) {
      for (let dr = -2; dr <= 2; dr++)
        for (let dc = -2; dc <= 2; dc++)
          initial.push([b[0] + dr, b[1] + dc, 'special'])
      phase.fired.push({ r: b[0], c: b[1], special: 'mega-bomb' })
    } else if (bombs === 1) {
      for (let d = -1; d <= 1; d++) {
        for (let k = 0; k < state.cols; k++)
          initial.push([b[0] + d, k, 'special'])
        for (let k = 0; k < state.rows; k++)
          initial.push([k, b[1] + d, 'special'])
      }
      phase.fired.push({ r: b[0], c: b[1], special: 'mega-cross' })
    } else {
      for (let k = 0; k < state.cols; k++) initial.push([b[0], k, 'special'])
      for (let k = 0; k < state.rows; k++) initial.push([k, b[1], 'special'])
      phase.fired.push({ r: b[0], c: b[1], special: 'cross' })
    }
    initial.push([a[0], a[1], 'special'], [b[0], b[1], 'special'])
    resolveClearSet(
      state,
      initial.filter(([r, c]) => isCell(state, r, c)),
      phase,
    )
  }

  function isComboSwap(ta, tb) {
    if (!isGem(ta) || !isGem(tb)) return false
    if (ta.special === 'rainbow' || tb.special === 'rainbow') return true
    return !!ta.special && !!tb.special
  }

  function isBuddyStep(ta, tb, a, b) {
    if (ta.kind === 'buddy' && tb.kind === 'gem') return b[0] === a[0] + 1
    if (tb.kind === 'buddy' && ta.kind === 'gem') return a[0] === b[0] + 1
    return false
  }

  function canSwap(state, a, b) {
    if (state.over) return false
    if (
      !isCell(state, a[0], a[1]) ||
      !isCell(state, b[0], b[1]) ||
      !adjacent(a, b)
    )
      return false
    const ta = tileAt(state, a[0], a[1])
    const tb = tileAt(state, b[0], b[1])
    if (!isMovable(ta) || !isMovable(tb)) return false
    if (isComboSwap(ta, tb)) return true
    if (isBuddyStep(ta, tb, a, b)) return true
    swapTiles(state, a, b)
    const ok = findRuns(state).length > 0
    swapTiles(state, a, b)
    return ok
  }

  function advanceWeather(state, phases) {
    const weather = state.weather
    if (!weather || weather.remaining <= 0 || goalsMet(state)) return
    const clearedGloom = phases.some((phase) =>
      phase.gloom.some((cell) => cell[2] === 0),
    )
    if (weather.kind === 'spread' && clearedGloom) return
    if (weather.kind === 'cloud') {
      weather.countdown--
      if (weather.countdown > 0) return
      weather.countdown = 3
    }
    const targets = []
    for (let r = 0; r < state.rows; r++)
      for (let c = 0; c < state.cols; c++) {
        if (
          !isCell(state, r, c) ||
          state.gloom[r][c] ||
          !isGem(tileAt(state, r, c))
        )
          continue
        if (
          weather.kind === 'spread' &&
          ![
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ].some(([dr, dc]) => state.gloom[r + dr]?.[c + dc] > 0)
        )
          continue
        targets.push([r, c])
      }
    if (!targets.length) return
    const [r, c] = targets[randInt(state.rng, targets.length)]
    state.gloom[r][c] = 1
    weather.remaining--
    for (const goal of state.goals) if (goal.type === 'gloom') goal.target++
    phases.push({
      ...newPhase(0),
      weather: weather.kind,
      gloom: [[r, c, 1]],
      board: snapshot(state),
      falls: [],
    })
  }

  function trySwap(state, a, b) {
    if (!canSwap(state, a, b)) return { ok: false, phases: [] }
    const ta = tileAt(state, a[0], a[1])
    const tb = tileAt(state, b[0], b[1])
    const first = newPhase(0)
    first.swap = { a, b, ids: [ta.id, tb.id] }
    state.movesLeft--
    state.movesUsed++
    if (isComboSwap(ta, tb)) {
      swapTiles(state, a, b)
      comboClear(state, b, a, first)
    } else {
      swapTiles(state, a, b)
      const runs = findRuns(state)
      if (runs.length) clearMatches(state, runs, first, [a, b])
      else first.buddyStep = true
    }
    const phases = cascade(state, first, [a, b])
    advanceWeather(state, phases)
    const shuffled = settle(state)
    if (shuffled)
      phases.push({
        ...newPhase(0),
        shuffle: true,
        board: snapshot(state),
        falls: [],
      })
    return { ok: true, phases, outcome: outcome(state) }
  }

  function goalsMet(state) {
    return state.goals.every((goal) => {
      if (goal.type === 'score') return state.score >= goal.target
      return goal.progress >= goal.target
    })
  }

  function outcome(state) {
    for (const goal of state.goals)
      if (goal.type === 'score')
        goal.progress = Math.min(goal.target, state.score)
    if (goalsMet(state)) {
      state.over = true
      state.won = true
      return 'win'
    }
    if (state.movesLeft <= 0) {
      state.over = true
      state.won = false
      return 'fail'
    }
    return 'continue'
  }

  function finishBonus(state) {
    const left = Math.max(0, state.movesLeft)
    if (!state.won || !left) return { movesConverted: 0, bonus: 0, phases: [] }
    const before = state.score
    const phases = []
    let remaining = left
    while (remaining > 0) {
      const phase = newPhase(0)
      const initial = []
      for (let r = 0; r < state.rows && initial.length < remaining; r++)
        for (let c = 0; c < state.cols && initial.length < remaining; c++) {
          const tile = tileAt(state, r, c)
          if (!isGem(tile) || tile.special) continue
          tile.special = (r + c) % 2 ? 'h' : 'v'
          initial.push([r, c, 'special'])
        }
      if (!initial.length) break
      remaining -= initial.length
      resolveClearSet(state, initial, phase)
      phases.push(...cascade(state, phase, null))
    }
    state.score += left * 150
    state.movesLeft = 0
    return { movesConverted: left, bonus: state.score - before, phases }
  }

  function starsFor(state, thresholds) {
    if (!state.won) return 0
    if (state.score >= thresholds[2]) return 3
    if (state.score >= thresholds[1]) return 2
    return 1
  }

  function findMove(state) {
    const moves = allMoves(state)
    return moves.length ? moves[0] : null
  }

  function allMoves(state) {
    const moves = []
    for (let r = 0; r < state.rows; r++)
      for (let c = 0; c < state.cols; c++) {
        for (const [dr, dc] of [
          [0, 1],
          [1, 0],
        ]) {
          const a = [r, c]
          const b = [r + dr, c + dc]
          if (canSwap(state, a, b)) moves.push([a, b])
        }
      }
    return moves
  }

  function settle(state) {
    if (findMove(state)) return false
    for (let attempt = 0; attempt < 40; attempt++) {
      shuffle(state)
      if (!findRuns(state).length && findMove(state)) return true
    }
    for (let r = 0; r < state.rows; r++)
      for (let c = 0; c < state.cols; c++)
        if (isGem(tileAt(state, r, c)) && !state.board[r][c].ribbon)
          state.board[r][c].color = safeColor(state, r, c)
    const spot = randomGemCell(state)
    if (spot) state.board[spot[0]][spot[1]].special = 'rainbow'
    return true
  }

  function shuffle(state) {
    const cells = []
    const tiles = []
    for (let r = 0; r < state.rows; r++)
      for (let c = 0; c < state.cols; c++) {
        const tile = tileAt(state, r, c)
        if (isGem(tile) && !tile.ribbon) {
          cells.push([r, c])
          tiles.push(tile)
        }
      }
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = randInt(state.rng, i + 1)
      const t = tiles[i]
      tiles[i] = tiles[j]
      tiles[j] = t
    }
    cells.forEach(([r, c], i) => (state.board[r][c] = tiles[i]))
  }

  function ensurePlayable(state) {
    let guard = 0
    while ((findRuns(state).length || !findMove(state)) && guard++ < 50) {
      for (let r = 0; r < state.rows; r++)
        for (let c = 0; c < state.cols; c++)
          if (
            isGem(tileAt(state, r, c)) &&
            !state.board[r][c].special &&
            !state.board[r][c].ribbon
          )
            state.board[r][c].color = safeColor(state, r, c)
      if (!findMove(state)) shuffle(state)
    }
  }

  function evaluateMove(state, move) {
    const trial = clone(state)
    const result = trySwap(trial, move[0], move[1])
    if (!result.ok) return -Infinity
    let goalValue = 0
    state.goals.forEach((goal, i) => {
      const before =
        goal.type === 'score'
          ? Math.min(goal.target, state.score)
          : goal.progress
      const after =
        goal.type === 'score'
          ? Math.min(goal.target, trial.score)
          : trial.goals[i].progress
      const weight =
        goal.type === 'score'
          ? 1 / 40
          : ['buddy', 'special', 'combo'].includes(goal.type)
            ? 260
            : 70
      goalValue += (after - before) * weight
    })
    let buddyDepth =
      (trial.stats.buddiesRescued - state.stats.buddiesRescued) *
      (trial.rows + 1)
    for (let r = 0; r < state.rows; r++)
      for (let c = 0; c < state.cols; c++) {
        const tile = tileAt(state, r, c)
        if (tile && tile.kind === 'buddy') buddyDepth -= r + 1
      }
    let gloomPull = 0
    let tanglePull = 0
    let specials = 0
    for (let r = 0; r < trial.rows; r++)
      for (let c = 0; c < trial.cols; c++) {
        const tile = tileAt(trial, r, c)
        if (tile && tile.kind === 'buddy') buddyDepth += r + 1
        if (trial.gloom[r][c] > 0) gloomPull -= trial.gloom[r][c]
        if (tile && tile.kind === FIXED.TANGLE) tanglePull -= tile.hp
        if (tile && tile.special)
          specials +=
            tile.special === 'rainbow' ? 3 : tile.special === 'bomb' ? 2 : 1
      }
    const hasGloomGoal = state.goals.some((goal) => goal.type === 'gloom')
    return (
      goalValue +
      (trial.score - state.score) / 400 +
      buddyDepth * 40 +
      (hasGloomGoal ? gloomPull * 4 : 0) +
      tanglePull * 25 +
      specials * 12 +
      (result.outcome === 'win' ? 1e6 : 0)
    )
  }

  function bestMove(state, limit) {
    const moves = allMoves(state)
    if (!moves.length) return null
    const sample = limit && moves.length > limit ? moves.slice(0, limit) : moves
    let best = sample[0]
    let bestScore = -Infinity
    for (const move of sample) {
      const value = evaluateMove(state, move)
      if (value > bestScore) {
        bestScore = value
        best = move
      }
    }
    return best
  }

  const api = {
    COLORS,
    makeRng,
    nextRandom,
    randInt,
    hashString,
    clone,
    createLevelState,
    findRuns,
    canSwap,
    trySwap,
    findMove,
    allMoves,
    bestMove,
    goalsMet,
    finishBonus,
    starsFor,
    isCell,
    tileAt,
    snapshot,
  }
  root.HopefulHuesEngine = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this)
