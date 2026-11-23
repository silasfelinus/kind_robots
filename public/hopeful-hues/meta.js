;(function (root) {
  'use strict'

  const STORAGE_KEY = 'hopeful-hues:v1'
  const SLOT_COUNT = 3
  const COLOR_NAMES = ['Rose', 'Tangerine', 'Lemon', 'Mint', 'Sky', 'Violet']

  const DEFAULT_SETTINGS = {
    music: 0.5,
    sfx: 0.8,
    reducedMotion: false,
    highContrast: false,
    symbols: true,
    backLimit: 'unlimited',
    hints: true,
    largeText: false,
  }

  const DAILY_POOL = [
    { id: 'd-tools', text: 'Use 2 helper tools', stat: 'toolsUsed', target: 2, reward: 30 },
    {
      id: 'd-clear',
      text: 'Clear 180 tiles',
      stat: 'cleared',
      target: 180,
      reward: 30,
    },
    { id: 'd-wins', text: 'Win 3 levels', stat: 'wins', target: 3, reward: 30 },
    {
      id: 'd-stars',
      text: 'Earn 6 stars',
      stat: 'stars',
      target: 6,
      reward: 35,
    },
    {
      id: 'd-combs',
      text: 'Make 4 Rainbow Combs',
      stat: 'combs',
      target: 4,
      reward: 30,
    },
    {
      id: 'd-bombs',
      text: 'Make 2 Glitter Bombs',
      stat: 'bombs',
      target: 2,
      reward: 30,
    },
    {
      id: 'd-rainbow',
      text: 'Mix a Rainbow Dye',
      stat: 'rainbows',
      target: 1,
      reward: 40,
    },
    {
      id: 'd-gloom',
      text: 'Wash away 20 Gloom',
      stat: 'gloomCleared',
      target: 20,
      reward: 35,
    },
    {
      id: 'd-buddies',
      text: 'Rescue 3 robot buddies',
      stat: 'buddiesRescued',
      target: 3,
      reward: 40,
    },
    {
      id: 'd-tangle',
      text: 'Untie 8 Tangles',
      stat: 'tanglesCleared',
      target: 8,
      reward: 35,
    },
    {
      id: 'd-cascade',
      text: 'Make a 4-chain cascade',
      stat: 'bigCascades',
      target: 1,
      reward: 40,
    },
    {
      id: 'd-combo',
      text: 'Swap two specials together',
      stat: 'combos',
      target: 1,
      reward: 40,
    },
    {
      id: 'd-three',
      text: 'Get 3 stars on a level',
      stat: 'threeStars',
      target: 1,
      reward: 35,
    },
    {
      id: 'd-rose',
      text: 'Collect 60 Rose hearts',
      stat: 'color0',
      target: 60,
      reward: 25,
    },
    {
      id: 'd-sky',
      text: 'Collect 60 Sky drops',
      stat: 'color4',
      target: 60,
      reward: 25,
    },
    {
      id: 'd-mint',
      text: 'Collect 60 Mint leaves',
      stat: 'color3',
      target: 60,
      reward: 25,
    },
  ]

  const WEEKLY_POOL = [
    {
      id: 'w-wins',
      text: 'Win 15 levels',
      stat: 'wins',
      target: 15,
      reward: 150,
    },
    {
      id: 'w-clear',
      text: 'Clear 1,200 tiles',
      stat: 'cleared',
      target: 1200,
      reward: 150,
    },
    {
      id: 'w-stars',
      text: 'Earn 35 stars',
      stat: 'stars',
      target: 35,
      reward: 160,
    },
    {
      id: 'w-rainbow',
      text: 'Mix 6 Rainbow Dyes',
      stat: 'rainbows',
      target: 6,
      reward: 170,
    },
    {
      id: 'w-buddies',
      text: 'Rescue 15 robot buddies',
      stat: 'buddiesRescued',
      target: 15,
      reward: 170,
    },
    {
      id: 'w-gloom',
      text: 'Wash away 150 Gloom',
      stat: 'gloomCleared',
      target: 150,
      reward: 160,
    },
    {
      id: 'w-combo',
      text: 'Swap specials together 8 times',
      stat: 'combos',
      target: 8,
      reward: 170,
    },
    {
      id: 'w-three',
      text: 'Get 3 stars on 8 levels',
      stat: 'threeStars',
      target: 8,
      reward: 180,
    },
    {
      id: 'w-noback',
      text: 'Win 5 levels without using Back',
      stat: 'noBackWins',
      target: 5,
      reward: 150,
    },
  ]

  const ACHIEVEMENTS = [
    {
      id: 'first-win',
      name: 'First Splash',
      text: 'Win your first level.',
      check: (s) => s.totals.wins >= 1,
    },
    {
      id: 'wins-25',
      name: 'Steady Glow',
      text: 'Win 25 levels.',
      check: (s) => s.totals.wins >= 25,
    },
    {
      id: 'wins-60',
      name: 'Color Marathon',
      text: 'Win 60 levels.',
      check: (s) => s.totals.wins >= 60,
    },
    {
      id: 'wins-all',
      name: 'Every Single Hue',
      text: 'Win every level in every world.',
      check: (s) => countWon(s) >= totalLevels(),
    },
    {
      id: 'stars-50',
      name: 'Starry Eyed',
      text: 'Earn 50 stars.',
      check: (s) => countStars(s) >= 50,
    },
    {
      id: 'stars-150',
      name: 'Constellation',
      text: 'Earn 150 stars.',
      check: (s) => countStars(s) >= 150,
    },
    {
      id: 'three-10',
      name: 'Perfect Ten',
      text: 'Get 3 stars on 10 levels.',
      check: (s) => countThree(s) >= 10,
    },
    {
      id: 'comb-1',
      name: 'Comb Through',
      text: 'Make a Rainbow Comb.',
      check: (s) => s.totals.combs >= 1,
    },
    {
      id: 'bomb-1',
      name: 'Glitter Everywhere',
      text: 'Make a Glitter Bomb.',
      check: (s) => s.totals.bombs >= 1,
    },
    {
      id: 'rainbow-1',
      name: 'Rainbow Dye Job',
      text: 'Mix a Rainbow Dye.',
      check: (s) => s.totals.rainbows >= 1,
    },
    {
      id: 'rainbow-25',
      name: 'Master Colorist',
      text: 'Mix 25 Rainbow Dyes.',
      check: (s) => s.totals.rainbows >= 25,
    },
    {
      id: 'combo-1',
      name: 'Better Together',
      text: 'Swap two specials together.',
      check: (s) => s.totals.combos >= 1,
    },
    {
      id: 'combo-30',
      name: 'Dream Team',
      text: 'Swap specials together 30 times.',
      check: (s) => s.totals.combos >= 30,
    },
    {
      id: 'cascade-5',
      name: 'Joy Avalanche',
      text: 'Make a 5-chain cascade.',
      check: (s) => s.totals.cascadesMax >= 5,
    },
    {
      id: 'clear-5000',
      name: 'Five Thousand Smiles',
      text: 'Clear 5,000 tiles.',
      check: (s) => s.totals.cleared >= 5000,
    },
    {
      id: 'gloom-300',
      name: 'Sunshine Squad',
      text: 'Wash away 300 Gloom.',
      check: (s) => s.totals.gloomCleared >= 300,
    },
    {
      id: 'tangle-100',
      name: 'Untangler',
      text: 'Untie 100 Tangles.',
      check: (s) => s.totals.tanglesCleared >= 100,
    },
    {
      id: 'buddy-1',
      name: 'Hello, Buddy',
      text: 'Rescue a robot buddy.',
      check: (s) => s.totals.buddiesRescued >= 1,
    },
    {
      id: 'buddy-50',
      name: 'Robot Rescuer',
      text: 'Rescue 50 robot buddies.',
      check: (s) => s.totals.buddiesRescued >= 50,
    },
    {
      id: 'back-1',
      name: 'Take Two',
      text: 'Use the Back button. Mistakes are allowed here.',
      check: (s) => s.totals.undos >= 1,
    },
    {
      id: 'noback-20',
      name: 'Confident Colors',
      text: 'Win 20 levels without Back.',
      check: (s) => s.totals.noBackWins >= 20,
    },
    {
      id: 'worlds-2',
      name: 'World Traveler',
      text: 'Win a level in two different worlds.',
      check: (s) => worldsStarted(s) >= 2,
    },
    {
      id: 'worlds-all',
      name: 'Passport Full of Color',
      text: 'Win a level in every world.',
      check: (s) => worldsStarted(s) >= worldList().length,
    },
    {
      id: 'ending-1',
      name: 'Happily Ever',
      text: 'Reach an ending.',
      check: (s) => s.endings.length >= 1,
    },
    {
      id: 'ending-3',
      name: 'Three Bright Lights',
      text: 'Reach the endings of three worlds.',
      check: (s) =>
        worldEndingIds().filter((e) => s.endings.includes(e)).length >= 3,
    },
    {
      id: 'ending-secret',
      name: "Everyone's Rainbow",
      text: 'Find the secret ending.',
      check: (s) => s.endings.includes('everyone'),
    },
    {
      id: 'quests-10',
      name: 'Helpful Hands',
      text: 'Complete 10 quests.',
      check: (s) => s.totals.questsDone >= 10,
    },
    {
      id: 'quests-50',
      name: 'Neighborhood Hero',
      text: 'Complete 50 quests.',
      check: (s) => s.totals.questsDone >= 50,
    },
    {
      id: 'sparkles-1000',
      name: 'Glitter Bank',
      text: 'Earn 1,000 sparkles in total.',
      check: (s) => s.totals.sparklesEarned >= 1000,
    },
    {
      id: 'all-friends',
      name: 'Whole Crew',
      text: 'Win a level with every hero.',
      check: (s) =>
        worldList().every((w) => s.scrapbook.includes('friend:' + w.hero.id)),
    },
    {
      id: 'scrapbook-half',
      name: 'Memory Keeper',
      text: 'Fill half of the scrapbook.',
      check: (s, total) => s.scrapbook.length * 2 >= total,
    },
  ]

  function worldList() {
    return root.HopefulHuesWorlds ? root.HopefulHuesWorlds.list() : []
  }

  function levelsApi0() {
    return root.HopefulHuesLevels || null
  }

  function totalLevels() {
    const L = levelsApi0()
    return L ? L.allLevels().length : Infinity
  }

  function worldEndingIds() {
    return worldList().map((w) => w.ending.id)
  }

  function regionWorld(regionId) {
    const L = levelsApi0()
    return L && L.REGIONS[regionId] ? L.REGIONS[regionId].world : null
  }

  function worldOfLevel(levelId) {
    return regionWorld(String(levelId).split('-')[0])
  }

  function worldsStarted(slot) {
    const seen = new Set()
    for (const [id, record] of Object.entries(slot.levels))
      if (record.stars > 0) seen.add(worldOfLevel(id))
    seen.delete(null)
    return seen.size
  }

  function worldAchievements() {
    const out = []
    for (const w of worldList()) {
      for (const a of w.achievements || []) {
        const id = w.id + '-' + a.key
        let check = () => false
        const regions = w.regions.map((r) => r.id)
        if (a.key === 'start')
          check = (s) =>
            Object.entries(s.levels).some(
              ([lid, r]) => r.stars > 0 && regions.includes(lid.split('-')[0]),
            )
        if (a.key === 'middle') check = (s) => hasLevel(s, regions[1] + '-18')
        if (a.key === 'ending') check = (s) => s.endings.includes(w.ending.id)
        if (a.key === 'stars')
          check = (s) =>
            Object.entries(s.levels).filter(
              ([lid, r]) => r.stars >= 3 && regions.includes(lid.split('-')[0]),
            ).length >= 10
        if (a.key === 'signature')
          check = (s) =>
            ((s.worldTotals && s.worldTotals[w.id]) || {})[a.stat] >= a.target
        out.push({ id, world: w.id, name: a.name, text: a.text, check })
      }
    }
    return out
  }

  for (const a of worldAchievements()) ACHIEVEMENTS.push(a)

  function countWon(slot) {
    return Object.values(slot.levels).filter((l) => l.stars > 0).length
  }
  function countStars(slot) {
    return Object.values(slot.levels).reduce(
      (sum, l) => sum + (l.stars || 0),
      0,
    )
  }
  function countThree(slot) {
    return Object.values(slot.levels).filter((l) => l.stars >= 3).length
  }
  function hasLevel(slot, id) {
    return !!slot.levels[id] && slot.levels[id].stars > 0
  }

  function emptyTotals() {
    return {
      wins: 0,
      plays: 0,
      cleared: 0,
      combs: 0,
      bombs: 0,
      rainbows: 0,
      combos: 0,
      cascadesMax: 0,
      bigCascades: 0,
      gloomCleared: 0,
      tanglesCleared: 0,
      buddiesRescued: 0,
      undos: 0,
      noBackWins: 0,
      questsDone: 0,
      sparklesEarned: 0,
      colors: [0, 0, 0, 0, 0, 0],
    }
  }

  function createSlot(characterId, now) {
    const time = now || Date.now()
    return {
      version: 1,
      created: time,
      updated: time,
      character: characterId,
      world: levelsApi0() ? levelsApi0().worldOfHero(characterId) : null,
      worldTotals: {},
      levels: {},
      sparkles: 50,
      endings: [],
      scrapbook: [],
      achievements: {},
      seenBeats: [],
      tutorialDone: false,
      tips: [],
      totals: emptyTotals(),
      quests: { dailyKey: '', daily: [], weeklyKey: '', weekly: [] },
      boosters: { moves: 1, shuffle: 1, wand: 1, swap: 1, brush: 1, bomb: 1, rainbow: 1 },
      giftDay: '',
    }
  }

  function defaultData() {
    return {
      version: 1,
      settings: { ...DEFAULT_SETTINGS },
      activeSlot: null,
      slots: Array(SLOT_COUNT).fill(null),
    }
  }

  function normalizeSlot(slot) {
    if (!slot || typeof slot !== 'object') return null
    const base = createSlot(slot.character || 'kate', slot.created)
    const merged = { ...base, ...slot }
    delete merged.route
    if (!merged.worldTotals || typeof merged.worldTotals !== 'object')
      merged.worldTotals = {}
    const L = levelsApi0()
    if (L && (!merged.world || !L.LINES[merged.world]))
      merged.world =
        L.worldOfHero(merged.character) ||
        (L.WORLDS[0] && L.WORLDS[0].id) ||
        null
    merged.totals = { ...base.totals, ...(slot.totals || {}) }
    merged.quests = { ...base.quests, ...(slot.quests || {}) }
    merged.boosters = { ...base.boosters, ...(slot.boosters || {}) }
    for (const key of Object.keys(base.boosters)) {
      const value = Number(merged.boosters[key])
      merged.boosters[key] = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : base.boosters[key]
    }
    for (const key of ['endings', 'scrapbook', 'seenBeats', 'tips'])
      if (!Array.isArray(merged[key])) merged[key] = []
    if (!merged.levels || typeof merged.levels !== 'object') merged.levels = {}
    return merged
  }

  function normalizeData(raw) {
    const data = defaultData()
    if (!raw || typeof raw !== 'object') return data
    data.settings = { ...DEFAULT_SETTINGS, ...(raw.settings || {}) }
    data.activeSlot = Number.isInteger(raw.activeSlot) ? raw.activeSlot : null
    if (Array.isArray(raw.slots)) {
      for (let i = 0; i < SLOT_COUNT; i++)
        data.slots[i] = normalizeSlot(raw.slots[i])
    }
    if (data.activeSlot !== null && !data.slots[data.activeSlot])
      data.activeSlot = null
    return data
  }

  function load(storage) {
    try {
      const text = storage && storage.getItem(STORAGE_KEY)
      return normalizeData(text ? JSON.parse(text) : null)
    } catch (error) {
      return defaultData()
    }
  }

  function save(storage, data) {
    try {
      if (data.activeSlot !== null && data.slots[data.activeSlot])
        data.slots[data.activeSlot].updated = Date.now()
      storage && storage.setItem(STORAGE_KEY, JSON.stringify(data))
      return true
    } catch (error) {
      return false
    }
  }

  function toBase64(text) {
    if (typeof btoa === 'function')
      return btoa(unescape(encodeURIComponent(text)))
    return Buffer.from(text, 'utf8').toString('base64')
  }

  function fromBase64(text) {
    if (typeof atob === 'function')
      return decodeURIComponent(escape(atob(text)))
    return Buffer.from(text, 'base64').toString('utf8')
  }

  function exportSlot(slot) {
    return 'HH1.' + toBase64(JSON.stringify(slot))
  }

  function importSlot(code) {
    const trimmed = String(code || '').trim()
    if (!trimmed.startsWith('HH1.')) return null
    try {
      return normalizeSlot(JSON.parse(fromBase64(trimmed.slice(4))))
    } catch (error) {
      return null
    }
  }

  function seeded(seedText) {
    let h = 2166136261
    for (let i = 0; i < seedText.length; i++) {
      h ^= seedText.charCodeAt(i)
      h = Math.imul(h, 16777619)
    }
    let s = h >>> 0
    return () => {
      s = (s + 0x6d2b79f5) >>> 0
      let t = s
      t = Math.imul(t ^ (t >>> 15), t | 1)
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }

  function pad(n) {
    return String(n).padStart(2, '0')
  }

  function dayKey(date) {
    return (
      date.getFullYear() +
      '-' +
      pad(date.getMonth() + 1) +
      '-' +
      pad(date.getDate())
    )
  }

  function weekKey(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const day = (d.getDay() + 6) % 7
    d.setDate(d.getDate() - day + 3)
    const firstThursday = new Date(d.getFullYear(), 0, 4)
    const week =
      1 +
      Math.round(
        ((d - firstThursday) / 86400000 -
          3 +
          ((firstThursday.getDay() + 6) % 7)) /
          7,
      )
    return d.getFullYear() + '-W' + pad(week)
  }

  function nextReset(date, weekly) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
    if (weekly) {
      while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
    }
    return d
  }

  function pick(pool, seedText, count) {
    const random = seeded(seedText)
    const items = pool.slice()
    const out = []
    while (out.length < count && items.length) {
      out.push(items.splice(Math.floor(random() * items.length), 1)[0])
    }
    return out
  }

  function worldQuests(worldId, list) {
    const w = worldList().find((x) => x.id === worldId)
    return w && w.quests && w.quests[list]
      ? w.quests[list].map((q) => ({ ...q, world: w.id }))
      : []
  }

  function slotWorld(slot) {
    const L = levelsApi0()
    return L ? L.lineKey(slot) : null
  }

  function refreshQuests(slot, now) {
    const date = now instanceof Date ? now : new Date(now || Date.now())
    const dk = dayKey(date)
    const wk = weekKey(date)
    const world = slotWorld(slot)
    let changed = false
    if (slot.giftDay !== dk) {
      slot.giftDay = dk
      for (const key of ['wand', 'swap', 'brush']) slot.boosters[key]++
      changed = true
    }
    if (slot.quests.dailyKey !== dk) {
      slot.quests.dailyKey = dk
      const themed = pick(worldQuests(world, 'daily'), 'daily-world:' + dk, 1)
      slot.quests.daily = [
        ...pick(DAILY_POOL, 'daily:' + dk, 3 - themed.length),
        ...themed,
      ].map((q) => ({
        id: q.id,
        progress: 0,
        claimed: false,
      }))
      changed = true
    }
    if (slot.quests.weeklyKey !== wk) {
      slot.quests.weeklyKey = wk
      const themed = pick(worldQuests(world, 'weekly'), 'weekly-world:' + wk, 1)
      slot.quests.weekly = [
        ...pick(WEEKLY_POOL, 'weekly:' + wk, 3 - themed.length),
        ...themed,
      ].map((q) => ({
        id: q.id,
        progress: 0,
        claimed: false,
      }))
      changed = true
    }
    return changed
  }

  function questDef(id) {
    const base =
      DAILY_POOL.find((q) => q.id === id) ||
      WEEKLY_POOL.find((q) => q.id === id)
    if (base) return base
    for (const w of worldList()) {
      for (const list of ['daily', 'weekly']) {
        const q = ((w.quests || {})[list] || []).find((x) => x.id === id)
        if (q) return { ...q, world: w.id }
      }
    }
    return null
  }

  function statValue(result, stat) {
    if (stat.startsWith('color'))
      return (result.stats.colorsCleared || [])[Number(stat.slice(5))] || 0
    if (stat === 'wins') return result.won ? 1 : 0
    if (stat === 'stars') return result.newStars || 0
    if (stat === 'threeStars') return result.won && result.stars >= 3 ? 1 : 0
    if (stat === 'noBackWins') return result.won && !result.stats.undos ? 1 : 0
    return result.stats[stat] || 0
  }

  function claimQuest(slot, list, index) {
    const entry = slot.quests[list][index]
    const def = entry && questDef(entry.id)
    if (!def || entry.claimed || entry.progress < def.target) return 0
    entry.claimed = true
    slot.sparkles += def.reward
    slot.totals.sparklesEarned += def.reward
    slot.totals.questsDone++
    slot.boosters[list === 'weekly' ? 'rainbow' : 'bomb']++
    return def.reward
  }

  function scrapbookCatalog(levelsApi) {
    const entries = []
    for (const regionId of levelsApi.ROUTE_ORDER) {
      for (const beat of levelsApi.STORY_BEATS[regionId]) {
        entries.push({
          id: 'beat:' + regionId + ':' + beat.at,
          group: 'story',
          region: regionId,
          title: beat.title,
          text: beat.text,
        })
      }
      entries.push({
        id: 'postcard:' + regionId,
        group: 'postcards',
        region: regionId,
        title: levelsApi.REGIONS[regionId].name,
        text: levelsApi.REGIONS[regionId].blurb,
      })
    }
    for (const character of levelsApi.CHARACTERS) {
      entries.push({
        id: 'friend:' + character.id,
        group: 'friends',
        character: character.id,
        title: character.name,
        text: character.title + '. ' + character.perkText,
      })
    }
    for (const ending of Object.values(levelsApi.ENDINGS)) {
      entries.push({
        id: 'ending:' + ending.id,
        group: 'endings',
        ending: ending.id,
        title: ending.title,
        text: ending.text,
      })
    }
    for (const achievement of ACHIEVEMENTS) {
      entries.push({
        id: 'sticker:' + achievement.id,
        group: 'stickers',
        achievement: achievement.id,
        title: achievement.name,
        text: achievement.text,
      })
    }
    return entries
  }

  function addScrapbook(slot, id, unlocked) {
    if (slot.scrapbook.includes(id)) return
    slot.scrapbook.push(id)
    unlocked.push(id)
  }

  function checkAchievements(slot, catalogSize, now) {
    const unlocked = []
    for (const achievement of ACHIEVEMENTS) {
      if (slot.achievements[achievement.id]) continue
      if (achievement.check(slot, catalogSize)) {
        slot.achievements[achievement.id] = now || Date.now()
        unlocked.push(achievement)
        slot.boosters.wand++
      }
    }
    return unlocked
  }

  function commitLevel(slot, result, levelsApi, now) {
    const time = now || Date.now()
    refreshQuests(slot, new Date(time))
    const totals = slot.totals
    const stats = result.stats
    totals.plays++
    for (const key of [
      'cleared',
      'combs',
      'bombs',
      'rainbows',
      'combos',
      'bigCascades',
      'gloomCleared',
      'tanglesCleared',
      'buddiesRescued',
      'undos',
    ]) {
      totals[key] += stats[key] || 0
    }
    result.world = result.world || worldOfLevel(result.levelId)
    if (result.world) {
      if (!slot.worldTotals) slot.worldTotals = {}
      const wt = (slot.worldTotals[result.world] =
        slot.worldTotals[result.world] || {})
      for (const key of [
        'cleared',
        'combs',
        'bombs',
        'rainbows',
        'combos',
        'bigCascades',
        'gloomCleared',
        'tanglesCleared',
        'buddiesRescued',
      ])
        wt[key] = (wt[key] || 0) + (stats[key] || 0)
      wt.wins = (wt.wins || 0) + (result.won ? 1 : 0)
    }
    totals.cascadesMax = Math.max(totals.cascadesMax, stats.cascadesMax || 0)
    ;(stats.colorsCleared || []).forEach((n, i) => (totals.colors[i] += n))
    let sparklesEarned = 0
    const previous = slot.levels[result.levelId] || { stars: 0, best: 0 }
    result.newStars = 0
    if (result.won) {
      totals.wins++
      if (!stats.undos) totals.noBackWins++
      result.newStars = Math.max(0, result.stars - previous.stars)
      sparklesEarned += 5 + result.newStars * 10
      slot.levels[result.levelId] = {
        stars: Math.max(previous.stars, result.stars),
        best: Math.max(previous.best, result.score),
      }
    }
    slot.sparkles += sparklesEarned
    totals.sparklesEarned += sparklesEarned
    const questsReady = []
    for (const list of ['daily', 'weekly']) {
      for (const entry of slot.quests[list]) {
        const def = questDef(entry.id)
        if (!def || entry.claimed) continue
        const before = entry.progress
        if (def.world && def.world !== result.world) continue
        entry.progress = Math.min(
          def.target,
          entry.progress + statValue(result, def.stat),
        )
        if (before < def.target && entry.progress >= def.target)
          questsReady.push(def)
      }
    }
    const scrapbookUnlocked = []
    if (result.won) {
      addScrapbook(slot, 'friend:' + slot.character, scrapbookUnlocked)
      const parsedId = levelsApi.parseLevelId(result.levelId)
      const region = parsedId.region
      const n = parsedId.n
      if (n === levelsApi.regionLevelCount(region))
        addScrapbook(slot, 'postcard:' + region, scrapbookUnlocked)
    }
    let ending = null
    if (result.won) {
      const parsed = levelsApi.parseLevelId(result.levelId)
      const def = levelsApi.buildLevel(parsed.region, parsed.n)
      if (def.finale) {
        ending = levelsApi.REGIONS[def.region].ending
        if (!slot.endings.includes(ending)) slot.endings.push(ending)
        addScrapbook(slot, 'ending:' + ending, scrapbookUnlocked)
        const routeEndings = worldEndingIds()
        if (
          routeEndings.every((e) => slot.endings.includes(e)) &&
          !slot.endings.includes('everyone')
        ) {
          slot.endings.push('everyone')
          addScrapbook(slot, 'ending:everyone', scrapbookUnlocked)
          result.secretEnding = true
        }
      }
    }
    const catalogSize = scrapbookCatalog(levelsApi).length
    const achievements = checkAchievements(slot, catalogSize, time)
    for (const a of achievements)
      addScrapbook(slot, 'sticker:' + a.id, scrapbookUnlocked)
    const late = checkAchievements(slot, catalogSize, time)
    for (const a of late) {
      achievements.push(a)
      addScrapbook(slot, 'sticker:' + a.id, scrapbookUnlocked)
    }
    slot.updated = time
    return {
      sparklesEarned,
      questsReady,
      achievements,
      scrapbookUnlocked,
      ending,
      secretEnding: !!result.secretEnding,
    }
  }

  function markBeat(slot, regionId, at) {
    const id = 'beat:' + regionId + ':' + at
    if (!slot.seenBeats.includes(id)) slot.seenBeats.push(id)
    if (!slot.scrapbook.includes(id)) {
      slot.scrapbook.push(id)
      return true
    }
    return false
  }

  function regionUnlocked(slot, levelsApi, regionId) {
    const parent = levelsApi.parentOf(regionId)
    if (!parent) return true
    if (!regionUnlocked(slot, levelsApi, parent)) return false
    return hasLevel(
      slot,
      levelsApi.levelId(parent, levelsApi.regionLevelCount(parent)),
    )
  }

  function levelUnlocked(slot, levelsApi, id) {
    const { region, n } = levelsApi.parseLevelId(id)
    if (!regionUnlocked(slot, levelsApi, region)) return false
    if (n === 1) return true
    return hasLevel(slot, levelsApi.levelId(region, n - 1))
  }

  function currentLevel(slot, levelsApi) {
    const list = levelsApi.routeLevels(slot)
    for (const id of list) if (!hasLevel(slot, id)) return id
    return list[list.length - 1]
  }

  function pendingFork() {
    return null
  }

  function chooseRoute(slot, levelsApi, target) {
    const worldId = levelsApi.LINES[target]
      ? target
      : levelsApi.REGIONS[target]
        ? levelsApi.REGIONS[target].world
        : levelsApi.worldOfHero(target)
    const world = worldList().find((w) => w.id === worldId)
    if (!world) return false
    slot.world = world.id
    slot.character = world.hero.id
    return true
  }

  function switchWorld(slot, levelsApi, worldId) {
    return chooseRoute(slot, levelsApi, worldId)
  }

  const api = {
    STORAGE_KEY,
    SLOT_COUNT,
    COLOR_NAMES,
    DEFAULT_SETTINGS,
    DAILY_POOL,
    WEEKLY_POOL,
    ACHIEVEMENTS,
    createSlot,
    defaultData,
    normalizeData,
    load,
    save,
    exportSlot,
    importSlot,
    dayKey,
    weekKey,
    nextReset,
    refreshQuests,
    questDef,
    claimQuest,
    commitLevel,
    markBeat,
    scrapbookCatalog,
    regionUnlocked,
    levelUnlocked,
    currentLevel,
    pendingFork,
    chooseRoute,
    switchWorld,
    worldsStarted,
    countStars,
    countWon,
  }
  root.HopefulHuesMeta = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this)
