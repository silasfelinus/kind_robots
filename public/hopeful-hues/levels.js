;(function (root) {
  'use strict'

  const LEVELS_PER_REGION = 18

  const REGIONS = {
    salon: {
      id: 'salon',
      name: 'Sunrise Salon Street',
      tier: 0,
      blurb:
        'The Grey Drizzle rolled in overnight and rinsed every color off the block. Superkate unlocks the salon, rolls up her sleeves and mixes the first batch of hope.',
      palette: ['#ff8fc7', '#ffd36e', '#ffb38a'],
      sky: ['#ffe3f1', '#ffd7b5'],
      music: { root: 60, mode: 'major', tempo: 96 },
      motif: 'scissors',
      next: ['grove', 'garden'],
    },
    grove: {
      id: 'grove',
      name: 'Glitter Grove',
      tier: 1,
      blurb:
        'A forest where the leaves used to shimmer. The butterflies remember every color and want to help paint them back, one wing at a time.',
      palette: ['#7be0a6', '#ffe56b', '#c59bff'],
      sky: ['#dcffe9', '#f3e4ff'],
      music: { root: 62, mode: 'lydian', tempo: 88 },
      motif: 'butterfly',
      next: ['meadow', 'carnival'],
    },
    garden: {
      id: 'garden',
      name: 'Gear Garden',
      tier: 1,
      blurb:
        'The kind robots grow sunflowers out of spare springs here. Their workshop went grey and quiet. A little oil, a little color, and they will hum again.',
      palette: ['#6fd6ff', '#ffc75f', '#ff8fb1'],
      sky: ['#dff6ff', '#fff1d6'],
      music: { root: 57, mode: 'mixolydian', tempo: 104 },
      motif: 'gear',
      next: ['arcade', 'lighthouse'],
    },
    meadow: {
      id: 'meadow',
      name: 'Moonbeam Meadow',
      tier: 2,
      blurb:
        'Fireflies, lullabies and a sleepy moon who forgot how to glow. Night is not scary when you bring friends and a lantern full of color.',
      palette: ['#9aa8ff', '#ffe08a', '#ff9bd6'],
      sky: ['#d9ddff', '#ffe6f6'],
      music: { root: 55, mode: 'dorian', tempo: 76 },
      motif: 'moon',
      ending: 'lullaby',
    },
    carnival: {
      id: 'carnival',
      name: 'Coral Carnival',
      tier: 2,
      blurb:
        'A seaside carnival of carousels and kindness booths. The Ferris wheel is stuck on grey. Every match turns another light back on.',
      palette: ['#ff7aa8', '#4fe0d6', '#ffd56b'],
      sky: ['#ffe1ec', '#d6fffb'],
      music: { root: 64, mode: 'major', tempo: 112 },
      motif: 'wave',
      ending: 'parade',
    },
    arcade: {
      id: 'arcade',
      name: 'Cloud Arcade',
      tier: 2,
      blurb:
        'High above the city, a cloud full of games where every high score is shared. The Drizzle jammed the coin slots. Time to play nice and play bright.',
      palette: ['#b388ff', '#5ef2ff', '#ff86c8'],
      sky: ['#efe3ff', '#dafcff'],
      music: { root: 59, mode: 'major', tempo: 120 },
      motif: 'cloud',
      ending: 'highscore',
    },
    lighthouse: {
      id: 'lighthouse',
      name: 'Lighthouse of Lost Letters',
      tier: 2,
      blurb:
        'Every kind note anyone ever meant to send washed up here. The lighthouse lamp is dim. Deliver the letters and the light comes back.',
      palette: ['#ffb36b', '#7fd4ff', '#ff8fa3'],
      sky: ['#fff0dc', '#ddf2ff'],
      music: { root: 53, mode: 'major', tempo: 84 },
      motif: 'letter',
      ending: 'letters',
    },
  }

  const ROUTE_ORDER = [
    'salon',
    'grove',
    'garden',
    'meadow',
    'carnival',
    'arcade',
    'lighthouse',
  ]

  const ENDINGS = {
    lullaby: {
      id: 'lullaby',
      title: 'The Moon Learns to Glow',
      region: 'meadow',
      text: 'The sleepy moon yawns, stretches, and lights up in seven soft colors. Every night from now on, the sky gets a little rainbow tuck-in. The Grey Drizzle curls up and becomes a gentle silver dew that only falls on flowers that need a drink.',
    },
    parade: {
      id: 'parade',
      title: 'The Coral Carnival Parade',
      region: 'carnival',
      text: 'The Ferris wheel spins pink, then orange, then every color at once. A parade bursts down the boardwalk: dancers, drummers, a whale-shaped float and a crowd that keeps getting bigger because everyone is invited.',
    },
    highscore: {
      id: 'highscore',
      title: 'Everybody Gets the High Score',
      region: 'arcade',
      text: 'The Cloud Arcade lights up and the leaderboard rewrites itself: every name is in first place. The kind robots decide that from now on, the best score is the one you share. The Drizzle becomes a cloud you can bounce on.',
    },
    letters: {
      id: 'letters',
      title: 'Every Letter Delivered',
      region: 'lighthouse',
      text: 'The lighthouse lamp blazes with rainbow light and every lost letter finds its way home. Somewhere, someone opens an envelope that just says: you matter, and you always did. The Drizzle reads one too, and cries happy color.',
    },
    everyone: {
      id: 'everyone',
      title: "Everyone's Rainbow",
      region: null,
      secret: true,
      text: 'With all four lights shining, the Grey Drizzle finally shows its face: a lonely little cloud that only wanted to be part of the picture. Superkate gives it a fresh rainbow dye job. It becomes the first cloud that rains color. Nobody is left out of the rainbow. Not ever.',
    },
  }

  const CHARACTERS = [
    {
      id: 'kate',
      name: 'Superkate',
      title: 'Rainbow Hair Hero',
      perk: 'rainbow-start',
      perkName: 'Color Theory',
      perkText: 'Starts every level with a Rainbow Dye already on the board.',
      colors: [
        '#ff5fa2',
        '#ffb347',
        '#ffe066',
        '#6be3a4',
        '#5cc8ff',
        '#b38bff',
      ],
      cheer: [
        'Gorgeous!',
        'That color is SO you!',
        'Fresh dye, fresh start!',
        'Glowing!',
        'We did that together!',
      ],
      epilogue:
        'Kate opens the salon doors wide. The first appointment of the day is for anyone who needs a little color, no charge.',
    },
    {
      id: 'sprocket',
      name: 'Sprocket',
      title: 'Kind Robot Helper',
      perk: 'extra-moves',
      perkName: 'Patience Protocol',
      perkText: 'Gets two extra moves on every level.',
      colors: ['#6fd6ff', '#a3f7ff', '#ffd36e'],
      cheer: [
        'Kindness detected!',
        'Beep boop, beautiful!',
        'Joy levels rising!',
        'Calculating... wonderful!',
        'Friendship.exe running!',
      ],
      epilogue:
        'Sprocket installs a new feature in every kind robot: a little light on the chest that glows rainbow whenever someone is helped.',
    },
    {
      id: 'juniper',
      name: 'Juniper',
      title: 'Dreamer With a Sketchbook',
      perk: 'big-bombs',
      perkName: 'Big Imagination',
      perkText: 'Glitter Bombs sparkle twice as wide (5x5).',
      colors: ['#ffe066', '#ff9bd6', '#7be0a6'],
      cheer: [
        'I am drawing this!',
        'Sparkle sparkle!',
        'Best day ever!',
        'Wow wow WOW!',
        'You make the world brighter!',
      ],
      epilogue:
        'Juniper fills the last page of the sketchbook with everyone they met, then starts a new one. There is always more to draw.',
    },
    {
      id: 'marigold',
      name: 'Marigold',
      title: 'Gardener of Good Vibes',
      perk: 'bloom',
      perkName: 'Bloom Where You Are',
      perkText:
        'Big cascades (3 or more chains) give a bonus move, twice per level.',
      colors: ['#ff9f43', '#7be0a6', '#c59bff'],
      cheer: [
        'Growing beautifully!',
        'Look at you bloom!',
        'Rooted and radiant!',
        'Soft and strong!',
        'Hope sprouts here!',
      ],
      epilogue:
        'Marigold plants a garden where every flower is a different color and nobody has to match to belong.',
    },
  ]

  const STORY_BEATS = {
    salon: [
      {
        at: 1,
        title: 'Opening Day',
        text: 'Superkate flips the sign to OPEN. Outside, the whole street is grey. "Well," she says, snapping on her gloves, "nobody said hope was a small job."',
      },
      {
        at: 6,
        title: 'A Robot at the Door',
        text: 'A little kind robot rolls in, dripping grey. "Please," it beeps, "my sensors cannot find blue." Kate smiles. "Sit. I know exactly what you need."',
      },
      {
        at: 12,
        title: 'The Neighbors Return',
        text: 'One by one, neighbors peek out. The bakery is pink again. The bookstore is lavender. Someone starts a playlist and the whole block dances.',
      },
      {
        at: 18,
        title: 'The Crossroads',
        text: 'At the end of the street the Drizzle splits in two: one stream flows toward the glittering woods, the other toward the hum of the robot workshop. Where will hope go first?',
      },
    ],
    grove: [
      {
        at: 1,
        title: 'Wings of Every Color',
        text: 'The butterflies of Glitter Grove are clear as glass. Each one lands on a match and drinks a single color, then flutters off singing.',
      },
      {
        at: 9,
        title: 'The Old Willow',
        text: 'An old willow whispers: "Color is not something you have. It is something you share." The leaves around it begin to shine.',
      },
      {
        at: 18,
        title: 'Two Paths of Light',
        text: 'Past the grove, a path of moonbeams climbs into the night, and a path of seashells runs down to a sleepy carnival. Both are waiting for you.',
      },
    ],
    garden: [
      {
        at: 1,
        title: 'The Quiet Workshop',
        text: 'Gear Garden is silent. Spring-sunflowers droop. The robots are standing still, each one holding a tiny paintbrush, waiting for someone to begin.',
      },
      {
        at: 9,
        title: 'The First Hum',
        text: 'One robot starts to hum. Then three. Then a whole choir of clicks and whirs, painting gears in candy stripes.',
      },
      {
        at: 18,
        title: 'Up or Out',
        text: 'A cloud elevator offers a ride up to the Cloud Arcade. A mail cart offers a ride out to the coast, where a lighthouse blinks very faintly.',
      },
    ],
    meadow: [
      {
        at: 1,
        title: 'Fireflies',
        text: 'Moonbeam Meadow glows in tiny patches. The fireflies have been carrying colors in their lanterns all along.',
      },
      {
        at: 10,
        title: 'A Lullaby for Everyone',
        text: 'The meadow sings to whoever is having a hard day. Tonight, it sings to the moon.',
      },
      {
        at: 19,
        title: 'The Sleepy Moon',
        text: 'The moon is so tired. It forgot how to glow. Maybe it just needs someone to stay up with it a little while.',
      },
    ],
    carnival: [
      {
        at: 1,
        title: 'Booths of Kindness',
        text: 'The Coral Carnival has no prize booths. Only kindness booths, where you win a compliment and give one back.',
      },
      {
        at: 10,
        title: 'Carousel Friends',
        text: 'The carousel horses are actually seahorses and they are very excited to meet you.',
      },
      {
        at: 19,
        title: 'The Stuck Ferris Wheel',
        text: 'The great wheel is frozen on grey. Everyone on the boardwalk holds hands and looks up. This one is for all of us.',
      },
    ],
    arcade: [
      {
        at: 1,
        title: 'Insert Kindness',
        text: 'Cloud Arcade machines take only one kind of coin: a kind word. Luckily you have plenty.',
      },
      {
        at: 10,
        title: 'Co-op Mode',
        text: 'Every cabinet up here is two-player. There is no single-player mode in the clouds.',
      },
      {
        at: 19,
        title: 'The Jammed Leaderboard',
        text: 'The giant scoreboard is stuck, flashing a grey HIGH SCORE with no name. Time to fill it with everyone.',
      },
    ],
    lighthouse: [
      {
        at: 1,
        title: 'The Mail Tide',
        text: 'Letters wash up with every wave. "Thank you." "I am proud of you." "Sorry I never said it." The lighthouse keeper is a very old robot with very gentle hands.',
      },
      {
        at: 10,
        title: 'Sorting by Heart',
        text: 'There is no address on most of the letters. The keeper says that is fine. They go to whoever needs them most.',
      },
      {
        at: 19,
        title: 'Light the Lamp',
        text: 'Up the spiral stairs, the great lamp waits, grey as a stone. One last batch of color and every letter can find its way home.',
      },
    ],
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

    const beat = (STORY_BEATS[regionId] || []).find((b) => b.at === n) || null

    return {
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
    }
  }

  function routeRegions(route) {
    const regions = ['salon']
    if (route && route.tier1) regions.push(route.tier1)
    if (route && route.tier2) regions.push(route.tier2)
    return regions
  }

  function routeLevels(route) {
    const list = []
    for (const regionId of routeRegions(route)) {
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
    for (const id of ROUTE_ORDER) {
      if ((REGIONS[id].next || []).includes(regionId)) return id
    }
    return null
  }

  const api = {
    LEVELS_PER_REGION,
    REGIONS,
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
  }
  root.HopefulHuesLevels = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this)
