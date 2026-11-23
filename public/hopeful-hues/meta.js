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
      id: 'wins-130',
      name: 'Every Single Hue',
      text: 'Win all 130 levels.',
      check: (s) => countWon(s) >= 130,
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
      id: 'salon',
      name: 'Open for Business',
      text: 'Finish Sunrise Salon Street.',
      check: (s) => hasLevel(s, 'salon-18'),
    },
    {
      id: 'tier1',
      name: 'Fork in the Road',
      text: 'Finish Glitter Grove or Gear Garden.',
      check: (s) => hasLevel(s, 'grove-18') || hasLevel(s, 'garden-18'),
    },
    {
      id: 'both-tier1',
      name: 'Both Ways',
      text: 'Finish both Glitter Grove and Gear Garden.',
      check: (s) => hasLevel(s, 'grove-18') && hasLevel(s, 'garden-18'),
    },
    {
      id: 'ending-1',
      name: 'Happily Ever',
      text: 'Reach an ending.',
      check: (s) => s.endings.length >= 1,
    },
    {
      id: 'ending-4',
      name: 'Four Bright Lights',
      text: 'Reach all four route endings.',
      check: (s) =>
        ['lullaby', 'parade', 'highscore', 'letters'].every((e) =>
          s.endings.includes(e),
        ),
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
      text: 'Win a level with every character.',
      check: (s) =>
        ['kate', 'sprocket', 'juniper', 'marigold'].every((id) =>
          s.scrapbook.includes('friend:' + id),
        ),
    },
    {
      id: 'scrapbook-half',
      name: 'Memory Keeper',
      text: 'Fill half of the scrapbook.',
      check: (s, total) => s.scrapbook.length * 2 >= total,
    },
  ]

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
      route: { tier1: null, tier2: null },
      levels: {},
      sparkles: 50,
      endings: [],
      scrapbook: [],
      achievements: {},
      seenBeats: [],
      totals: emptyTotals(),
      quests: { dailyKey: '', daily: [], weeklyKey: '', weekly: [] },
      boosters: { moves: 1, shuffle: 1 },
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
    merged.route = { ...base.route, ...(slot.route || {}) }
    merged.totals = { ...base.totals, ...(slot.totals || {}) }
    merged.quests = { ...base.quests, ...(slot.quests || {}) }
    merged.boosters = { ...base.boosters, ...(slot.boosters || {}) }
    for (const key of ['endings', 'scrapbook', 'seenBeats'])
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

  function refreshQuests(slot, now) {
    const date = now instanceof Date ? now : new Date(now || Date.now())
    const dk = dayKey(date)
    const wk = weekKey(date)
    let changed = false
    if (slot.quests.dailyKey !== dk) {
      slot.quests.dailyKey = dk
      slot.quests.daily = pick(DAILY_POOL, 'daily:' + dk, 3).map((q) => ({
        id: q.id,
        progress: 0,
        claimed: false,
      }))
      changed = true
    }
    if (slot.quests.weeklyKey !== wk) {
      slot.quests.weeklyKey = wk
      slot.quests.weekly = pick(WEEKLY_POOL, 'weekly:' + wk, 3).map((q) => ({
        id: q.id,
        progress: 0,
        claimed: false,
      }))
      changed = true
    }
    return changed
  }

  function questDef(id) {
    return (
      DAILY_POOL.find((q) => q.id === id) ||
      WEEKLY_POOL.find((q) => q.id === id) ||
      null
    )
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
        const routeEndings = ['lullaby', 'parade', 'highscore', 'letters']
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
    const list = levelsApi.routeLevels(slot.route)
    for (const id of list) if (!hasLevel(slot, id)) return id
    return list[list.length - 1]
  }

  function pendingFork(slot, levelsApi) {
    if (!slot.route.tier1 && hasLevel(slot, 'salon-18')) return 'salon'
    if (
      slot.route.tier1 &&
      !slot.route.tier2 &&
      hasLevel(slot, slot.route.tier1 + '-18')
    )
      return slot.route.tier1
    return null
  }

  function chooseRoute(slot, levelsApi, regionId) {
    const region = levelsApi.REGIONS[regionId]
    if (!region || !regionUnlocked(slot, levelsApi, regionId)) return false
    if (region.tier === 0) {
      slot.route = { tier1: null, tier2: null }
    } else if (region.tier === 1) {
      slot.route = { tier1: regionId, tier2: null }
    } else {
      slot.route = { tier1: levelsApi.parentOf(regionId), tier2: regionId }
    }
    return true
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
    countStars,
    countWon,
  }
  root.HopefulHuesMeta = api
  if (typeof module !== 'undefined' && module.exports) module.exports = api
})(typeof globalThis !== 'undefined' ? globalThis : this)
