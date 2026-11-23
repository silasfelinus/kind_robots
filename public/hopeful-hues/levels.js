;(function (root) {
  'use strict'

  const LEVELS_PER_REGION = 18

  const registry = root.HopefulHuesWorlds || { list: () => [], get: () => null }
  const WORLDS = registry.list()
  const REGIONS = {}
  const LINES = {}
  const ROUTE_ORDER = []
  const ENDINGS = {}
  const STORY_BEATS = {}
  const CHARACTERS = []

  for (const world of WORLDS) {
    LINES[world.id] = world.regions.map((region) => region.id)
    world.regions.forEach((region, tier) => {
      REGIONS[region.id] = {
        id: region.id,
        name: region.name,
        world: world.id,
        line: world.id,
        tier,
        blurb: region.blurb,
        palette: region.palette,
        sky: region.sky,
        motif: region.motif,
        music: world.music,
        ending: tier === world.regions.length - 1 ? world.ending.id : undefined,
      }
      ROUTE_ORDER.push(region.id)
      STORY_BEATS[region.id] = region.beats
    })
    ENDINGS[world.ending.id] = {
      id: world.ending.id,
      title: world.ending.title,
      text: world.ending.text,
      region: world.regions[world.regions.length - 1].id,
      world: world.id,
    }
    CHARACTERS.push({
      ...world.hero,
      line: world.id,
      world: world.id,
      lineTitle: world.name,
      lineBlurb: world.blurb,
      colors: world.jewels.map((jewel) => jewel.main),
    })
  }

  ENDINGS.everyone = {
    id: 'everyone',
    title: "Everyone's Rainbow",
    region: null,
    secret: true,
    text: 'With every world shining again, the Grey Drizzle finally shows its face: a lonely little cloud that only wanted to be part of the picture. Every hero you met crowds around it with dye, gears, roses, sequins, crayons, seeds, sparks, glow sticks and lanterns, and gives it the most colorful welcome anyone has ever had. It becomes the first cloud that rains color. Nobody is left out of the rainbow. Not ever.',
  }

  const MASKS = {
    full: null,
    corners: (rows, cols) =>
      grid(
        rows,
        cols,
        (r, c) => !((r === 0 || r === rows - 1) && (c === 0 || c === cols - 1)),
      ),
    diamond: (rows, cols) =>
      grid(rows, cols, (r, c) => {
        const cr = (rows - 1) / 2
        const cc = (cols - 1) / 2
        return Math.abs(r - cr) / (cr + 1) + Math.abs(c - cc) / (cc + 1) <= 1.05
      }),
    heart: (rows, cols) =>
      grid(rows, cols, (r, c) => {
        const x = (c - (cols - 1) / 2) / (cols / 2)
        const y = ((rows - 1) / 2 - r) / (rows / 2) + 0.02
        const v = Math.pow(x * x + y * y - 0.62, 3) - x * x * y * y * y
        return v <= 0.02
      }),
    hourglass: (rows, cols) =>
      grid(rows, cols, (r, c) => {
        const mid = (rows - 1) / 2
        const pinch = Math.floor((1 - Math.abs(r - mid) / mid) * 1.6)
        return c >= pinch && c < cols - pinch
      }),
    window: (rows, cols) =>
      grid(
        rows,
        cols,
        (r, c) =>
          !(
            r >= 3 &&
            r <= rows - 4 &&
            c >= 3 &&
            c <= cols - 4 &&
            (r + c) % 2 === 0
          ),
      ),
    bridge: (rows, cols) =>
      grid(
        rows,
        cols,
        (r, c) =>
          !(c === Math.floor(cols / 2) && r > 1 && r < rows - 2 && r % 2 === 0),
      ),
  }

  function grid(rows, cols, fn) {
    return Array.from({ length: rows }, (_, r) =>
      Array.from({ length: cols }, (_, c) => (fn(r, c) ? 1 : 0)),
    )
  }

  function hashString(text) {
    let h = 2166136261
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    return h >>> 0
  }

  function rng(seed) {
    let s = seed >>> 0
    return () => {
      s = (s + 0x6d2b79f5) >>> 0
      let t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  function regionLevelCount(regionId) {
    return REGIONS[regionId].tier === 2
      ? LEVELS_PER_REGION + 1
      : LEVELS_PER_REGION
  }

  function levelId(regionId, n) {
    return regionId + '-' + n
  }

  function parseLevelId(id) {
    const [region, n] = String(id).split('-')
    return { region, n: Number(n) }
  }

  function globalIndex(regionId, n) {
    const tier = REGIONS[regionId].tier
    return tier * LEVELS_PER_REGION + n
  }

  // Each world has four drawn set pieces. The three regional chapters turn
  // the first three designs through quarter turns; the finale has its own board.
  // . = jewel, # = gap, g = gloom, t = tangle, h/v = comb, b = bomb.
  const SET_PIECES = {
    paradise: [
      ['.g.g.', 'g...g', '..h..', 'g...g', '.g.g.'],
      ['g...g', '.t.t.', '..b..', '.t.t.', 'g...g'],
      ['..g..', '.ggg.', 'g.h.g', '.t.t.', '..g..'],
      ['.g.g.', 'gg.gg', 'g.b.g', '.ggg.', '..v..'],
    ],
    clanktown: [
      ['g.g.g', '.t.t.', '..v..', '.t.t.', 'g.g.g'],
      ['g...g', 'g.#.g', 'g.b.g', 'g.#.g', 'g...g'],
      ['t.g.t', '.g.g.', 'g.h.g', '.g.g.', 't.g.t'],
      ['gg.gg', 'g.t.g', 't.b.t', 'g.t.g', 'gg.gg'],
    ],
    rosewood: [
      ['g...g', '.g.g.', '..h..', '.g.g.', 'g...g'],
      ['.g.g.', 'g.t.g', '.tbt.', 'g.t.g', '.g.g.'],
      ['g.g.g', '.#.#.', '..v..', '.g.g.', 'g.t.g'],
      ['g.g.g', 'gg.gg', 'g.b.g', '.t.t.', '..h..'],
    ],
    corsair: [
      ['..g..', '.g.g.', 'g.v.g', '.g.g.', '..g..'],
      ['g...g', '.g.g.', 't.b.t', '.g.g.', 'g...g'],
      ['g.#.g', '.g.g.', 'g.h.g', '.t.t.', 'g...g'],
      ['g.g.g', '.ggg.', 'g.b.g', '.ggg.', 'g.v.g'],
    ],
    sketchbook: [
      ['ggg..', 'g.h..', 'g....', '..g.g', '..ggg'],
      ['..ggg', '..g.g', '..b.g', 't....', 'ttt..'],
      ['g...g', '.g.g.', '..h..', '.t.t.', 'g...g'],
      ['ggg.g', 'g...g', 'g.b.g', 'g...g', 'g.ggg'],
    ],
    wildflower: [
      ['..g..', 'g...g', '.ghg.', 'g...g', '..g..'],
      ['.t.t.', 'g.g.g', '..b..', 'g.g.g', '.t.t.'],
      ['g.g.g', '.g.g.', 't.v.t', '.g.g.', 'g.g.g'],
      ['..g..', '.ggg.', 'ggbgg', '.ggg.', '..h..'],
    ],
    circus: [
      ['g...g', '.....', '.ghg.', '.....', 'g...g'],
      ['.g.g.', 't...t', 'g.b.g', 't...t', '.g.g.'],
      ['g.g.g', 'g.#.g', '..h..', 'g.#.g', 'g.g.g'],
      ['g.g.g', 'gg.gg', 't.b.t', 'gg.gg', 'g.v.g'],
    ],
    dustneon: [
      ['g.g.g', '.....', '..v..', '.....', 'g.g.g'],
      ['gg..g', '.t.t.', '..b..', '.t.t.', 'g..gg'],
      ['g...g', 'g.#.g', 'g.h.g', 'g.#.g', 'g...g'],
      ['gg.gg', '.ggg.', 'g.b.g', '.t.t.', 'ggvgg'],
    ],
    lagoon: [
      ['..g..', '.g.g.', 'g.h.g', '.....', 'g.g.g'],
      ['g.g.g', 'g...g', 't.b.t', 'g...g', 'g.g.g'],
      ['g...g', '.t.t.', '..v..', '.g.g.', 'g...g'],
      ['g.g.g', '.ggg.', 'g.b.g', '.ggg.', 'g.h.g'],
    ],
  }

  function authoredLevel(def, region) {
    const index = def.finale ? 3 : [6, 12, 18].indexOf(def.n)
    const design = SET_PIECES[region.world]?.[index]
    if (!design) return def

    const mask = grid(def.rows, def.cols, () => true)
    const gloom = grid(def.rows, def.cols, () => false)
    const tangles = []
    const startingSpecials = []
    const offset = Math.floor((def.rows - 5) / 2)
    let gloomCells = 0
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        let rr = r
        let cc = c
        for (let turn = 0; turn < region.tier; turn++) [rr, cc] = [cc, 4 - rr]
        rr += offset
        cc += offset
        const symbol = design[r][c]
        if (symbol === '#') mask[rr][cc] = 0
        if (symbol === 'g') {
          gloom[rr][cc] = 1
          gloomCells++
        }
        if (symbol === 't') tangles.push([rr, cc, region.tier === 2 ? 2 : 1])
        if (['h', 'v', 'b'].includes(symbol)) {
          const special =
            symbol === 'b'
              ? 'bomb'
              : region.tier % 2
                ? symbol === 'h'
                  ? 'v'
                  : 'h'
                : symbol
          startingSpecials.push([rr, cc, special])
        }
      }
    }
    const goals = [{ type: 'gloom', target: gloomCells }]
    if (tangles.length) goals.push({ type: 'tangle', target: tangles.length })
    if (def.finale) goals.push({ type: 'buddy', target: 3 })
    else if (index === 1) goals.push({ type: 'collect', color: 0, target: 14 })
    for (const goal of def.goals)
      if (goal.type === 'special' || goal.type === 'combo') goals.push(goal)

    return {
      ...def,
      authored: true,
      shape: 'set-piece',
      mask,
      gloom,
      tangles,
      startingSpecials,
      goals,
      moves: Math.min(50, Math.max(def.moves, 32 + region.tier * 5)),
      buddiesAtStart: def.finale ? 1 : 0,
    }
  }

  function buildLevel(regionId, n) {
    const region = REGIONS[regionId]
    if (!region) throw new Error('unknown region ' + regionId)
    const count = regionLevelCount(regionId)
    if (n < 1 || n > count)
      throw new Error('level out of range ' + regionId + ' ' + n)
    const id = levelId(regionId, n)
    const g = globalIndex(regionId, n)
    const random = rng(hashString('hopeful-hues:' + id))
    const finale = region.tier === 2 && n === count
    const regionFinale = n === count
    const rows = finale ? 9 : g < 8 ? 7 : g < 20 ? 8 : 9
    const cols = rows
    const colors = g < 5 ? 4 : g < 40 ? 5 : g % 7 === 0 ? 6 : 5
    const shapeNames = ['full', 'corners', 'diamond', 'hourglass', 'bridge']
    let shape = 'full'
    if (finale) shape = 'heart'
    else if (g >= 6 && n % 4 === 2)
      shape = shapeNames[1 + Math.floor(random() * (shapeNames.length - 1))]
    else if (g >= 10 && n % 5 === 0) shape = 'corners'
    const mask = MASKS[shape] ? MASKS[shape](rows, cols) : null
    const cellOn = (r, c) => !mask || mask[r][c] === 1

    const pool = ['collect']
    if (g >= 3) pool.push('gloom')
    if (g >= 9) pool.push('tangle')
    if (g >= 12) pool.push('buddy')
    let kinds = []
    if (g <= 2) kinds = [g === 1 ? 'score' : 'collect']
    else {
      const primary = pool[Math.floor(random() * pool.length)]
      kinds.push(regionFinale ? 'gloom' : primary)
      if (g >= 16 && random() < 0.55) {
        const second = pool.filter((k) => k !== kinds[0])
        kinds.push(second[Math.floor(random() * second.length)])
      }
      if (finale && !kinds.includes('buddy')) kinds.push('buddy')
    }

    const gloom = Array.from({ length: rows }, () => Array(cols).fill(0))
    const tangles = []
    const goals = []
    const difficulty = Math.min(1, g / 70)
    let gloomCells = 0
    let gloomLayers = 0
    let tangleCount = 0
    let moves = 16 + Math.floor(random() * 4)

    for (const kind of kinds) {
      if (kind === 'score') {
        goals.push({ type: 'score', target: 3000 })
      } else if (kind === 'collect') {
        const firstColor = Math.floor(random() * colors)
        const target =
          14 + Math.floor(difficulty * 18) + Math.floor(random() * 6)
        goals.push({ type: 'collect', color: firstColor, target })
        if (g >= 6 && random() < 0.5) {
          const secondColor =
            (firstColor + 1 + Math.floor(random() * (colors - 1))) % colors
          goals.push({
            type: 'collect',
            color: secondColor,
            target: Math.max(10, target - 6),
          })
          moves += 3
        }
      } else if (kind === 'gloom') {
        const pattern = Math.floor(random() * 4)
        const doubleChance =
          g < 20 || colors === 6 ? 0 : 0.12 + difficulty * 0.23
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            if (!cellOn(r, c)) continue
            const mid = (rows - 1) / 2
            let on = false
            if (pattern === 0) on = r >= rows - 3
            if (pattern === 1)
              on = Math.abs(r - mid) <= 1.2 || Math.abs(c - mid) <= 0.6
            if (pattern === 2) on = (r + c) % 2 === 0 && r >= 2
            if (pattern === 3) on = Math.abs(r - mid) + Math.abs(c - mid) <= 2.6
            if (regionFinale && !finale) on = on || r === 0 || r === rows - 1
            if (finale) on = true
            if (!on) continue
            gloom[r][c] = random() < doubleChance ? 2 : 1
            gloomCells++
            gloomLayers += gloom[r][c]
          }
        goals.push({ type: 'gloom', target: gloomCells })
      } else if (kind === 'tangle') {
        const count = 5 + Math.floor(difficulty * 7)
        const placed = new Set()
        const usedCols = new Set()
        const withBuddies = kinds.includes('buddy')
        let guard = 0
        while (tangles.length < count && guard++ < 200) {
          const r = 2 + Math.floor(random() * (rows - 3))
          const c = Math.floor(random() * cols)
          const k = r * 32 + c
          if (!cellOn(r, c) || placed.has(k)) continue
          if (withBuddies && usedCols.has(c)) continue
          placed.add(k)
          usedCols.add(c)
          tangles.push([
            r,
            c,
            g >= 30 && !withBuddies && random() < 0.3 ? 2 : 1,
          ])
        }
        tangleCount = tangles.length
        goals.push({ type: 'tangle', target: tangleCount })
      } else if (kind === 'buddy') {
        goals.push({
          type: 'buddy',
          target: finale ? 4 : 2 + Math.floor(difficulty * 2),
        })
      }
    }

    moves += Math.ceil(gloomLayers / 3) + Math.ceil(tangleCount * 0.9)
    if (colors === 6) moves += 3
    for (const goal of goals)
      if (goal.type === 'buddy') moves += goal.target * 4
    moves += kinds.length > 1 ? 2 : 0
    if (finale) moves += 6
    moves = Math.min(moves, 50)

    const base = 2600 + g * 65 + gloomCells * 40 + tangleCount * 80
    const stars = [
      0,
      Math.round((base * 1.5) / 50) * 50,
      Math.round((base * 2.4) / 50) * 50,
    ]
    if (goals.some((goal) => goal.type === 'score')) {
      stars[1] = 4500
      stars[2] = 6500
    }

    const freeTangles = tangles.filter(([r, c]) => gloom[r][c] === 0)
    for (const goal of goals)
      if (goal.type === 'tangle') goal.target = freeTangles.length
    for (let i = goals.length - 1; i >= 0; i--)
      if (goals[i].type === 'tangle' && goals[i].target === 0)
        goals.splice(i, 1)

    const beat = (STORY_BEATS[regionId] || []).find((b) => b.at === n) || null

    return authoredLevel(
      {
        id,
        region: regionId,
        n,
        g,
        seed: hashString('board:' + id),
        rows,
        cols,
        colors,
        shape,
        mask,
        gloom,
        tangles: freeTangles,
        goals,
        moves,
        stars,
        buddiesAtStart: goals.some((goal) => goal.type === 'buddy') ? 1 : 0,
        finale,
        regionFinale,
        beat,
      },
      region,
    )
  }

  function lineOf(regionId) {
    return REGIONS[regionId] ? REGIONS[regionId].line : null
  }

  function worldOfHero(heroId) {
    const hero = CHARACTERS.find((c) => c.id === heroId)
    return hero ? hero.world : null
  }

  function lineKey(line) {
    if (typeof line === 'string') {
      if (LINES[line]) return line
      const viaHero = worldOfHero(line)
      if (viaHero) return viaHero
    }
    if (line && LINES[line.world]) return line.world
    if (line && worldOfHero(line.character)) return worldOfHero(line.character)
    return WORLDS[0] ? WORLDS[0].id : null
  }

  function routeRegions(line) {
    return LINES[lineKey(line)].slice()
  }

  function routeLevels(line) {
    const list = []
    for (const regionId of routeRegions(line)) {
      const count = regionLevelCount(regionId)
      for (let n = 1; n <= count; n++) list.push(levelId(regionId, n))
    }
    return list
  }

  function allLevels() {
    const list = []
    for (const regionId of ROUTE_ORDER) {
      const count = regionLevelCount(regionId)
      for (let n = 1; n <= count; n++) list.push(levelId(regionId, n))
    }
    return list
  }

  function parentOf(regionId) {
    const line = LINES[lineOf(regionId)]
    if (!line) return null
    const index = line.indexOf(regionId)
    return index > 0 ? line[index - 1] : null
  }

  function nextOf(regionId) {
    const line = LINES[lineOf(regionId)]
    if (!line) return null
    const index = line.indexOf(regionId)
    return index >= 0 && index < line.length - 1 ? line[index + 1] : null
  }

  const api = {
    LEVELS_PER_REGION,
    WORLDS,
    REGIONS,
    LINES,
    ROUTE_ORDER,
    ENDINGS,
    CHARACTERS,
    STORY_BEATS,
    buildLevel,
    levelId,
    parseLevelId,
    regionLevelCount,
    routeRegions,
    routeLevels,
    allLevels,
    parentOf,
    nextOf,
    lineOf,
    lineKey,
    worldOfHero,
  }
  root.HopefulHuesLevels = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this)
