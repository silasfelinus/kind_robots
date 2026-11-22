/* Chessweeper cabinet profile: local-device progress, endings, archive and settings. */
;(() => {
  const engine = window.__fusionTest
  if (!engine) return
  const KEY = 'kindrobots:chessweeper:profile:v1'
  const NAMES = {
    sugar: 'Sugarbomb Kingdom',
    ashen: 'Ashen Checkmate',
    jackpot: 'Jackpot Apocalypse',
  }
  const WORLD_ART = {
    sugar: '/images/chessweeper/sugarbomb-kingdom.webp',
    ashen: '/images/chessweeper/ashen-checkmate.webp',
    jackpot: '/images/chessweeper/jackpot-apocalypse.webp',
  }
  const ENDING_API = window.ChessweeperEndings
  const ENDINGS = {}
  for (const world of ['sugar', 'ashen', 'jackpot'])
    ENDINGS[world] = (ENDING_API?.CATALOG?.[world] || []).map((ending) => [
      ending.id,
      ending.title,
      ending.prose.join(' '),
      ending.hint,
    ])
  const TOTAL_ENDINGS = 12
  const ACHIEVEMENTS = [
    ['first', 'First Move', 'Take your first turn.', '♟'],
    ['veteran', 'Arena Veteran', 'Survive twenty turns in one run.', '⚔'],
    ['sapper', 'Careful Hands', 'Reveal twelve safe minefield cells.', '✦'],
    ['flags', 'Flag Collector', 'Place four flags in one run.', '🚩'],
    ['points', 'High Roller', 'Score at least 500 points.', '★'],
    ['dash', 'Escape Artist', 'Use your dash shield in a battle.', '⚡'],
    ['sugar', 'Sugar Rush!', 'Freeze the lollipop sawblades.', '🌈'],
    ['ashen', 'Last Stand', 'Survive a mortal blow in Ashen Checkmate.', '🔥'],
    [
      'jackpot',
      'Double or Nothing',
      'Risk fifty chips in Jackpot Apocalypse.',
      '🎰',
    ],
    ['winner', 'Royal Victor', 'Win your first battle.', '♔'],
    ['explorer', 'Three Dangerous Worlds', 'Play in all three worlds.', '🗺'],
    ['collector', 'Ending Collector', 'Discover four different endings.', '📖'],
    ['checkmate', 'Checkmate Artist', 'Win a battle by checkmate.', '♛'],
    [
      'cartographer',
      'Minefield Cartographer',
      'Win by revealing every safe square.',
      '🗺',
    ],
    [
      'clean',
      'Clean Hands',
      'Win a battle without setting off a single mine.',
      '🧤',
    ],
    [
      'arena',
      'Let the Blades Decide',
      'Win when the arena destroys the enemy king.',
      '💿',
    ],
    ['survivor', 'Blade Dancer', 'Survive thirty turns in one battle.', '🌀'],
    ['castle', 'Castle Keep', 'Castle your king during a battle.', '🏰'],
    ['promote', 'Royal Promotion', 'Promote a pawn.', '👑'],
    [
      'mastery',
      'Master of a World',
      'Earn all four mastery stars in one world.',
      '⭐',
    ],
    [
      'campaign-sugar',
      'Sugar Crown Restored',
      'Complete the Sugarbomb Kingdom campaign.',
      '🍭',
    ],
    [
      'campaign-ashen',
      'Ember Keeper',
      'Complete the Ashen Checkmate campaign.',
      '🕯',
    ],
    [
      'campaign-jackpot',
      'House Breaker',
      'Complete the Jackpot Apocalypse campaign.',
      '💰',
    ],
    ['scrapbook', 'Complete Scrapbook', 'Discover all twelve endings.', '📚'],
  ]
  const DEFAULTS = {
    sound: true,
    music: true,
    musicVolume: 0.32,
    effectsVolume: 0.58,
    motion: true,
    contrast: false,
    telegraph: true,
  }
  function read() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
      return {
        records:
          raw.records && typeof raw.records === 'object' ? raw.records : {},
        endings: Array.isArray(raw.endings) ? raw.endings : [],
        achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
        visited: Array.isArray(raw.visited) ? raw.visited : [],
        runs: Number(raw.runs) || 0,
        settings: { ...DEFAULTS, ...(raw.settings || {}) },
        saves: raw.saves && typeof raw.saves === 'object' ? raw.saves : {},
        history: Array.isArray(raw.history) ? raw.history.slice(0, 12) : [],
      }
    } catch {
      return {
        records: {},
        endings: [],
        achievements: [],
        visited: [],
        runs: 0,
        settings: { ...DEFAULTS },
        saves: {},
        history: [],
      }
    }
  }
  const profile = read()
  const $$ = (id) => document.getElementById(id)
  const currentWorld = () => document.documentElement.dataset.realm || 'jackpot'
  const esc = (v) =>
    String(v).replace(
      /[&<>"']/g,
      (c) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[c],
    )
  const seen = new WeakSet()
  let saveSignature = ''
  const write = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(profile))
    } catch {}
  }
  function tone(frequency = 600) {
    if (!profile.settings.sound) return
    window.dispatchEvent(
      new CustomEvent('chessweeper:sound', {
        detail: { kind: 'achievement', frequency },
      }),
    )
  }
  function notify(message) {
    const existing = document.querySelector('.meta-toast')
    if (existing) existing.remove()
    const el = document.createElement('div')
    el.className = 'meta-toast'
    el.setAttribute('role', 'status')
    el.textContent = message
    document.body.append(el)
    setTimeout(() => el.remove(), 2900)
  }
  function award(id) {
    if (profile.achievements.includes(id)) return
    const achievement = ACHIEVEMENTS.find((a) => a[0] === id)
    if (!achievement) return
    profile.achievements.push(id)
    write()
    notify('Achievement unlocked: ' + achievement[1])
    tone(790)
  }
  function endingFor(world, type, reason) {
    if (ENDING_API) return ENDING_API.classify(type, reason)
    return type === 'win' ? 'mate' : 'fallen'
  }
  const runEvents = new WeakMap()
  function eventsFor(s) {
    if (!s) return {}
    if (!runEvents.has(s))
      runEvents.set(s, { rush: 0, laststand: 0, wager: 0, jackpot: 0 })
    return runEvents.get(s)
  }
  function showEnding(world, id, extra = {}) {
    if (!ENDING_API) return
    ENDING_API.present({
      world,
      ending: id,
      discovered: profile.endings.length,
      onNext: () => engine.reset(),
      onScrapbook: () => openPanel('scrapbook'),
      ...extra,
    })
  }
  function recordEnding(type, reason) {
    const world = currentWorld()
    const s = engine.get()
    if (!s || seen.has(s)) return
    seen.add(s)
    const endingId = endingFor(world, type, reason)
    const id = world + ':' + endingId
    const entry = ENDINGS[world].find((e) => e[0] === endingId)
    const isNew = !profile.endings.includes(id)
    if (isNew) profile.endings.push(id)
    profile.runs++
    const record = profile.records[world] || { best: 0, wins: 0, runs: 0 }
    record.runs++
    if (type === 'win') record.wins++
    record.best = Math.max(record.best, Number(s.score) || 0)
    profile.records[world] = record
    profile.history.unshift({
      world,
      ending: endingId,
      type,
      score: Math.max(0, Math.floor(Number(s.score) || 0)),
      turns: Math.max(0, Math.floor(Number(s.turns) || 0)),
      at: Date.now(),
    })
    profile.history = profile.history.slice(0, 12)
    profile.saves[world] = undefined
    write()
    if (type === 'win') {
      award('winner')
      if (endingId === 'mate') award('checkmate')
      if (endingId === 'sweep') award('cartographer')
      if (endingId === 'arena') award('arena')
      if (!(s.exploded instanceof Set) || s.exploded.size === 0) award('clean')
    }
    if (profile.endings.length >= 4) award('collector')
    if (profile.endings.length >= TOTAL_ENDINGS) award('scrapbook')
    if (entry) {
      const box = $$('end-desc')
      if (box)
        box.textContent =
          entry[1] + ': ' + entry[2] + ' Final score: ' + s.score + '.'
      notify('Scrapbook: ' + entry[1])
    }
    const campaign = window.__chessweeperCampaign?.current?.(world) || null
    showEnding(world, endingId, {
      type,
      isNew,
      state: s,
      campaign,
      events: eventsFor(s),
    })
  }
  function encodeState(s) {
    const json = JSON.stringify(s, (_, v) =>
      v instanceof Set ? { $set: Array.from(v) } : v,
    )
    return JSON.parse(json)
  }
  function decodeState(s) {
    return JSON.parse(JSON.stringify(s), (_, v) =>
      v && typeof v === 'object' && Array.isArray(v.$set) ? new Set(v.$set) : v,
    )
  }
  function saveCheckpoint(s) {
    if (s.over || s.busy || s.promotion || s.chess.t !== 1 || s.turns < 2)
      return
    const world = currentWorld()
    const signature =
      world +
      ':' +
      s.turns +
      ':' +
      s.score +
      ':' +
      s.shown.size +
      ':' +
      s.flags.size
    if (signature === saveSignature) return
    saveSignature = signature
    profile.saves[world] = {
      version: 1,
      savedAt: Date.now(),
      state: encodeState(s),
    }
    write()
  }
  function continueRun() {
    const world = currentWorld()
    const save = profile.saves[world]
    if (!save || save.version !== 1) return
    engine.setRealm(world)
    const live = engine.get()
    const restored = decodeState(save.state)
    if (
      !restored ||
      !restored.chess ||
      !Array.isArray(restored.chess.b) ||
      restored.chess.b.length !== 128 ||
      !(restored.mines instanceof Set) ||
      !(restored.shown instanceof Set) ||
      !Array.isArray(restored.discs)
    ) {
      notify('Save is unavailable; start a new run.')
      return
    }
    Object.assign(live, restored, {
      busy: false,
      selected: -1,
      promotion: null,
      last: null,
      protectedAt: -1,
    })
    engine.refresh()
    notify('Resumed your ' + NAMES[world] + ' run.')
    tone(500)
  }
  function sync() {
    const s = engine.get()
    if (!s) return
    const world = currentWorld()
    if (!profile.visited.includes(world)) {
      profile.visited.push(world)
      write()
    }
    if (s.turns > 0) award('first')
    if (s.turns >= 20) award('veteran')
    if (s.turns >= 30) award('survivor')
    const lastWhite = (s.feed || []).find((line) =>
      String(line).startsWith('White: '),
    )
    if (lastWhite) {
      if (/^White: O-O/.test(lastWhite)) award('castle')
      if (/=[QRBN]/.test(lastWhite)) award('promote')
    }
    if (s.shown.size >= 44) award('sapper')
    if (s.flags.size >= 4) award('flags')
    if (s.score >= 500) award('points')
    if (s.dashCooldown > 0) award('dash')
    if (world === 'sugar' && s.freeze > 0) award('sugar')
    if (world === 'ashen' && s.lastStandUsed) award('ashen')
    if (world === 'jackpot' && s.wager > 0) award('jackpot')
    if (profile.visited.length >= 3) award('explorer')
    saveCheckpoint(s)
    const resume = $$('meta-continue')
    if (resume) resume.hidden = !profile.saves[world] || s.turns > 0
  }
  const safeVolume = (value, fallback) =>
    Number.isFinite(Number(value))
      ? Math.max(0, Math.min(1, Number(value)))
      : fallback
  function applySettings() {
    document.documentElement.classList.toggle(
      'meta-motion-off',
      !profile.settings.motion,
    )
    document.documentElement.classList.toggle(
      'meta-contrast',
      profile.settings.contrast,
    )
    document.documentElement.classList.toggle(
      'meta-hints-off',
      !profile.settings.telegraph,
    )
    window.dispatchEvent(
      new CustomEvent('chessweeper:settings', {
        detail: {
          sound: !!profile.settings.sound,
          music: !!profile.settings.music,
          musicVolume: safeVolume(profile.settings.musicVolume, 0.32),
          effectsVolume: safeVolume(profile.settings.effectsVolume, 0.58),
        },
      }),
    )
  }
  function card(icon, title, detail, unlocked) {
    return (
      '<article class="meta-card' +
      (unlocked ? '' : ' locked') +
      '"><div class="meta-icon">' +
      icon +
      '</div><strong>' +
      esc(unlocked ? title : '??? · ' + title) +
      '</strong><span>' +
      esc(unlocked ? detail : 'Locked · ' + detail) +
      '</span></article>'
    )
  }
  const ACTION_ART = {
    sugar: [
      'sugar',
      'Sugar Rush',
      '/images/chessweeper/sugar-rush-action-scene.webp',
    ],
    ashen: [
      'ashen',
      'Last Stand',
      '/images/chessweeper/ashen-laststand-action-scene.webp',
    ],
    jackpot: [
      'jackpot',
      'Double or Nothing',
      '/images/chessweeper/jackpot-double-or-nothing-action-scene.webp',
    ],
  }
  const PIECE_ART = {
    sugar: '/images/chessweeper/sugarbomb-piece-atlas.webp',
    ashen: '/images/chessweeper/ashen-piece-atlas.webp',
    jackpot: '/images/chessweeper/jackpot-piece-atlas.webp',
  }
  const ENDING_TITLES = {}
  for (const world of Object.keys(ENDINGS))
    for (const ending of ENDINGS[world])
      ENDING_TITLES[world + ':' + ending[0]] = ending[1]
  function artCard(src, title, detail, unlocked, attrs = '', fallback = '') {
    const tag = unlocked && attrs ? 'button' : 'article'
    return (
      '<' +
      tag +
      (tag === 'button' ? ' type="button"' : '') +
      ' class="meta-ending-card' +
      (unlocked ? '' : ' locked') +
      '"' +
      attrs +
      '><img src="' +
      esc(src) +
      '" alt="' +
      esc(unlocked ? title : 'Locked scrapbook page') +
      '" loading="lazy" data-scrapbook-art' +
      (fallback ? ' data-fallback="' + esc(fallback) + '"' : '') +
      ' /><strong>' +
      esc(unlocked ? title : '??? · Locked') +
      '</strong><span>' +
      esc(detail) +
      '</span></' +
      tag +
      '>'
    )
  }
  function renderArchive() {
    const found = profile.endings.length
    let html =
      '<p class="meta-intro">' +
      found +
      ' of ' +
      TOTAL_ENDINGS +
      ' endings discovered · ' +
      profile.achievements.length +
      ' of ' +
      ACHIEVEMENTS.length +
      ' achievements · ' +
      profile.runs +
      ' battles fought. The scrapbook lives on this device.</p>'
    const campaignApi = window.__chessweeperCampaign
    for (const world of ['sugar', 'ashen', 'jackpot']) {
      const r = profile.records[world] || { best: 0, wins: 0, runs: 0 }
      html += `<section class="meta-scrapbook-world" data-scrapbook-world="${world}"><img data-world-art="${world}" src="${WORLD_ART[world]}" alt="${NAMES[world]} illustrated chessboard" loading="lazy" /><h3>${NAMES[world]} · ${r.wins} wins of ${r.runs} · best ${r.best}</h3></section>`
      const progress = campaignApi?.current?.(world)
      if (progress) {
        html += '<div class="meta-milestones" aria-label="Campaign milestones">'
        for (let chapter = 0; chapter < 4; chapter++) {
          const cleared = progress.cleared || progress.chapter > chapter
          const star = progress.mastery & (1 << chapter) ? ' ★' : ''
          html +=
            '<span class="' +
            (cleared ? 'done' : '') +
            '">Chapter ' +
            (chapter + 1) +
            (cleared ? ' cleared' : '') +
            star +
            '</span>'
        }
        html +=
          '<span class="' +
          (progress.cleared ? 'done' : '') +
          '">' +
          (progress.cleared ? 'Campaign complete' : 'Campaign in progress') +
          '</span></div>'
      }
      html += '<div class="meta-grid">'
      for (const ending of ENDINGS[world]) {
        const unlocked = profile.endings.includes(world + ':' + ending[0])
        html += artCard(
          ENDING_API ? ENDING_API.plate(world, ending[0]) : WORLD_ART[world],
          ending[1],
          unlocked ? 'Replay this ending scene.' : 'Hint: ' + ending[3],
          unlocked,
          unlocked
            ? ` data-replay-world="${world}" data-replay-ending="${ending[0]}"`
            : '',
          WORLD_ART[world],
        )
      }
      const action = ACTION_ART[world]
      html += artCard(
        action[2],
        action[1],
        profile.achievements.includes(action[0])
          ? 'Signature move illustration.'
          : 'Hint: trigger this world’s signature move.',
        profile.achievements.includes(action[0]),
      )
      html += artCard(
        PIECE_ART[world],
        NAMES[world] + ' pieces',
        profile.visited.includes(world)
          ? 'The painted army of this world.'
          : 'Hint: visit this world.',
        profile.visited.includes(world),
      )
      html += '</div>'
    }
    html += '<h3>Recent battles</h3>'
    if (!profile.history.length) {
      html +=
        '<p class="meta-intro">Your last twelve battles will be listed here.</p>'
    } else {
      html +=
        '<table class="meta-history"><thead><tr><th>World</th><th>Ending</th><th>Turns</th><th>Score</th></tr></thead><tbody>'
      for (const run of profile.history)
        html +=
          '<tr><td>' +
          esc(NAMES[run.world] || run.world) +
          '</td><td>' +
          esc(ENDING_TITLES[run.world + ':' + run.ending] || run.ending) +
          '</td><td>' +
          esc(run.turns) +
          '</td><td>' +
          esc(run.score) +
          '</td></tr>'
      html += '</tbody></table>'
    }
    return html
  }
  // Transfer code: progress is device-local for guests and signed-in players
  // alike. The code carries the cabinet profile and campaign archive, and an
  // import merges (never discards) what the receiving device already has.
  const CAMPAIGN_KEY = 'kindrobots:chessweeper:campaign:v1'
  function transferCode() {
    let campaign = {}
    try {
      campaign = JSON.parse(localStorage.getItem(CAMPAIGN_KEY) || '{}')
    } catch {}
    const payload = {
      v: 1,
      game: 'chessweeper',
      profile: {
        records: profile.records,
        endings: profile.endings,
        achievements: profile.achievements,
        visited: profile.visited,
        runs: profile.runs,
        history: profile.history,
      },
      campaign: campaign && campaign.v === 1 ? campaign.worlds || {} : {},
    }
    const bytes = new TextEncoder().encode(JSON.stringify(payload))
    let binary = ''
    for (const byte of bytes) binary += String.fromCharCode(byte)
    return 'CW1.' + btoa(binary)
  }
  const KNOWN_ENDINGS = new Set(Object.keys(ENDING_TITLES))
  const KNOWN_ACHIEVEMENTS = new Set(ACHIEVEMENTS.map((a) => a[0]))
  function mergeTransfer(code) {
    const text = String(code || '').trim()
    if (!text.startsWith('CW1.')) throw new Error('not a Chessweeper code')
    const binary = atob(text.slice(4))
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
    const data = JSON.parse(new TextDecoder().decode(bytes))
    if (!data || data.v !== 1 || data.game !== 'chessweeper')
      throw new Error('unsupported code')
    const incoming = data.profile || {}
    for (const id of Array.isArray(incoming.endings) ? incoming.endings : [])
      if (KNOWN_ENDINGS.has(id) && !profile.endings.includes(id))
        profile.endings.push(id)
    for (const id of Array.isArray(incoming.achievements)
      ? incoming.achievements
      : [])
      if (KNOWN_ACHIEVEMENTS.has(id) && !profile.achievements.includes(id))
        profile.achievements.push(id)
    for (const world of Array.isArray(incoming.visited) ? incoming.visited : [])
      if (NAMES[world] && !profile.visited.includes(world))
        profile.visited.push(world)
    for (const world of Object.keys(NAMES)) {
      const theirs = incoming.records?.[world]
      if (!theirs) continue
      const mine = profile.records[world] || { best: 0, wins: 0, runs: 0 }
      const n = (v) =>
        Number.isSafeInteger(v) && v >= 0 ? Math.min(v, 99999999) : 0
      profile.records[world] = {
        best: Math.max(n(mine.best), n(theirs.best)),
        wins: Math.max(n(mine.wins), n(theirs.wins)),
        runs: Math.max(n(mine.runs), n(theirs.runs)),
      }
    }
    profile.runs = Math.max(
      profile.runs,
      Number.isSafeInteger(incoming.runs) ? incoming.runs : 0,
    )
    let campaign = {}
    try {
      const stored = JSON.parse(localStorage.getItem(CAMPAIGN_KEY) || '{}')
      if (stored.v === 1 && stored.worlds) campaign = stored.worlds
    } catch {}
    for (const world of Object.keys(NAMES)) {
      const theirs = data.campaign?.[world]
      if (!theirs || typeof theirs !== 'object') continue
      const mine = campaign[world] || {}
      const chapter = (v) =>
        Number.isInteger(v) ? Math.max(0, Math.min(3, v)) : 0
      campaign[world] = {
        chapter: Math.max(chapter(mine.chapter), chapter(theirs.chapter)),
        cleared: mine.cleared === true || theirs.cleared === true,
        mastery:
          ((Number.isInteger(mine.mastery) ? mine.mastery : 0) |
            (Number.isInteger(theirs.mastery) ? theirs.mastery : 0)) &
          15,
        pact: mine.pact === 1 ? 1 : 0,
        best: Math.max(
          Number.isSafeInteger(mine.best) ? mine.best : 0,
          Number.isSafeInteger(theirs.best)
            ? Math.min(theirs.best, 99999999)
            : 0,
        ),
      }
    }
    try {
      localStorage.setItem(
        CAMPAIGN_KEY,
        JSON.stringify({ v: 1, worlds: campaign }),
      )
    } catch {}
    write()
    if (profile.endings.length >= 4) award('collector')
    if (profile.endings.length >= TOTAL_ENDINGS) award('scrapbook')
    for (const world of Object.keys(NAMES))
      if (campaign[world]?.cleared) award('campaign-' + world)
    if (Object.values(campaign).some((w) => (w?.mastery & 15) === 15))
      award('mastery')
  }
  function renderAchievements() {
    let html =
      '<p class="meta-intro">' +
      profile.achievements.length +
      ' / ' +
      ACHIEVEMENTS.length +
      ' achievements earned. Unlocks persist across all three worlds on this browser.</p><div class="meta-grid">'
    for (const a of ACHIEVEMENTS)
      html += card(a[3], a[1], a[2], profile.achievements.includes(a[0]))
    return html + '</div>'
  }
  function renderSettings() {
    let html =
      '<p class="meta-intro">Accessibility and audio preferences are saved on this device.</p>'
    const opts = [
      ['sound', 'Sound effects'],
      ['music', 'Original background music'],
      ['motion', 'Animated sawblades and transitions'],
      ['contrast', 'High contrast'],
      ['telegraph', 'Show predicted blade paths'],
    ]
    for (const [key, label] of opts)
      html +=
        '<label class="meta-line"><span>' +
        esc(label) +
        '</span><input type="checkbox" data-setting="' +
        key +
        '"' +
        (profile.settings[key] ? ' checked' : '') +
        ' /></label>'
    for (const [key, label] of [
      ['musicVolume', 'Music volume'],
      ['effectsVolume', 'Effects volume'],
    ]) {
      html +=
        '<label class="meta-line"><span>' +
        esc(label) +
        '</span><input type="range" data-volume="' +
        key +
        '" min="0" max="1" step="0.05" value="' +
        safeVolume(profile.settings[key], key === 'musicVolume' ? 0.32 : 0.58) +
        '" /></label>'
    }
    return (
      html +
      '<p class="meta-warning">Saving: Chessweeper keeps your scrapbook, achievements, campaign chapters and the current run on this device, whether you play as a guest or signed in to Kind Robots. It is not attached to your account, and clearing browser data erases it. Use a transfer code to carry progress to another device.</p>' +
      '<section class="meta-transfer" aria-label="Transfer progress"><h3>Transfer progress</h3>' +
      '<textarea id="meta-transfer-code" aria-label="Transfer code" spellcheck="false" placeholder="Paste a CW1 transfer code here to merge it into this device."></textarea>' +
      '<div class="meta-transfer-actions"><button type="button" data-transfer="export">Create transfer code</button><button type="button" data-transfer="import">Merge pasted code</button></div>' +
      '<p class="meta-transfer-status" id="meta-transfer-status" role="status"></p></section>'
    )
  }
  function renderGuide() {
    return (
      '<h3>The cursed rules</h3><p class="meta-intro">Move any white chess piece legally, reveal numbered minesweeper clues using PROBE, and keep one eye on the blades. Each move or probe advances the arena and hands a response to Black.</p>' +
      '<div class="meta-grid">' +
      card(
        '♟',
        'Chess',
        'Move your army. Checkmate wins immediately. Castling, en passant and promotion are legal.',
        true,
      ) +
      card(
        '💣',
        'Mines',
        'Probe unknown squares. Clues count neighboring mines. Flags do not cost turns.',
        true,
      ) +
      card(
        '💿',
        'Discs',
        'Sawblades move after every turn. The dashed square forecasts the next sweep.',
        true,
      ) +
      card(
        '⚡',
        'Dash',
        'Arm the shield before moving. Your moved piece survives its next collision.',
        true,
      ) +
      card(
        '🌈',
        'Sugar Rush',
        'Build combos to freeze blades for two turns.',
        true,
      ) +
      card(
        '🔥',
        'Last Stand',
        'Ashen Checkmate allows one desperate resurrection.',
        true,
      ) +
      card(
        '🎰',
        'Double or Nothing',
        'Wager 50 chips to unleash multiball and chase the jackpot.',
        true,
      ) +
      '</div>'
    )
  }
  function openPanel(which) {
    const d = $$('meta-dialog')
    $$('meta-title').textContent =
      {
        scrapbook: 'The Scrapbook',
        achievements: 'Achievements',
        settings: 'Settings',
        guide: 'How to Play',
      }[which] || 'Chessweeper'
    $$('meta-body').innerHTML =
      which === 'scrapbook'
        ? renderArchive()
        : which === 'achievements'
          ? renderAchievements()
          : which === 'settings'
            ? renderSettings()
            : renderGuide()
    if (typeof d.showModal === 'function') d.showModal()
    else d.setAttribute('open', '')
  }
  const actions = document.createElement('nav')
  actions.className = 'meta-actions'
  actions.setAttribute('aria-label', 'Chessweeper extras')
  actions.innerHTML =
    '<button type="button" data-panel="scrapbook">📖 Scrapbook</button>' +
    '<button type="button" data-panel="achievements">🏆 Achievements</button>' +
    '<button type="button" data-panel="settings">⚙ Settings</button>' +
    '<button type="button" id="meta-continue" hidden>↩ Continue saved run</button>'
  const layout = document.querySelector('.layout')
  if (layout) layout.before(actions)
  const dialog = document.createElement('dialog')
  dialog.className = 'meta-dialog'
  dialog.id = 'meta-dialog'
  dialog.innerHTML =
    '<div class="meta-shell"><header><h2 id="meta-title"></h2><button type="button" class="meta-close" id="meta-close">✕ Close</button></header><div id="meta-body" class="meta-content"></div></div>'
  document.body.append(dialog)
  actions.addEventListener('click', (event) => {
    const button = event.target.closest('button')
    if (!button) return
    if (button.id === 'meta-continue') continueRun()
    else if (button.dataset.panel) openPanel(button.dataset.panel)
  })
  dialog.addEventListener(
    'error',
    (event) => {
      const image = event.target
      if (!(image instanceof HTMLImageElement)) return
      if (!image.matches('[data-world-art]')) return
      image.hidden = true
      image.closest('.meta-scrapbook-world')?.classList.add('art-pending')
    },
    true,
  )
  $$('meta-close').addEventListener('click', () => dialog.close())
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      dialog.close()
      return
    }
    const replay = e.target.closest?.('[data-replay-ending]')
    if (replay) {
      dialog.close()
      showEnding(replay.dataset.replayWorld, replay.dataset.replayEnding, {
        replay: true,
      })
      return
    }
    const transfer = e.target.closest?.('[data-transfer]')
    if (!transfer) return
    const area = $$('meta-transfer-code')
    const statusLine = $$('meta-transfer-status')
    if (transfer.dataset.transfer === 'export') {
      area.value = transferCode()
      area.select?.()
      navigator.clipboard?.writeText?.(area.value).catch?.(() => {})
      statusLine.textContent =
        'Transfer code ready. Copy it to your other device and choose Merge pasted code there.'
    } else {
      try {
        mergeTransfer(area.value)
        statusLine.textContent =
          'Progress merged. Endings, achievements, records and campaign chapters from the code were added to this device.'
        window.dispatchEvent(new CustomEvent('chessweeper:profile-merged'))
      } catch {
        statusLine.textContent =
          'That code could not be read. Paste the whole CW1 code and try again.'
      }
    }
  })
  dialog.addEventListener(
    'error',
    (event) => {
      const image = event.target
      if (!(image instanceof HTMLImageElement)) return
      if (!image.matches('[data-scrapbook-art]')) return
      const fallback = image.dataset.fallback
      if (fallback && image.getAttribute('src') !== fallback) {
        image.src = fallback
        return
      }
      const thumb = document.createElement('div')
      thumb.className = 'meta-ending-thumb'
      thumb.setAttribute('aria-hidden', 'true')
      image.replaceWith(thumb)
    },
    true,
  )
  dialog.addEventListener('change', (e) => {
    if (e.target.matches('[data-setting]')) {
      profile.settings[e.target.dataset.setting] = e.target.checked
      write()
      applySettings()
      tone(720)
    }
  })
  dialog.addEventListener('input', (e) => {
    if (!e.target.matches('[data-volume]')) return
    const key = e.target.dataset.volume
    profile.settings[key] = safeVolume(
      e.target.value,
      key === 'musicVolume' ? 0.32 : 0.58,
    )
    write()
    applySettings()
  })
  document.querySelectorAll('[data-realm]').forEach((button) =>
    button.addEventListener('click', () => {
      saveSignature = ''
      sync()
    }),
  )
  window.addEventListener('chessweeper:fx', (event) => {
    const events = eventsFor(engine.get())
    const kind = event.detail?.kind
    if (Object.hasOwn(events, kind)) events[kind]++
  })
  window.addEventListener('chessweeper:campaign-mastery', (event) => {
    const world = event.detail?.world
    const progress = window.__chessweeperCampaign?.current?.(world)
    if (progress && (progress.mastery & 15) === 15) award('mastery')
  })
  window.addEventListener('chessweeper:campaign-cleared', (event) => {
    const world = event.detail?.world
    if (NAMES[world]) award('campaign-' + world)
  })
  window.__chessweeperProfile = {
    openPanel,
    hasEnding: (id) => profile.endings.includes(id),
    endings: () => profile.endings.slice(),
    achievements: () => profile.achievements.slice(),
    history: () => profile.history.slice(),
    achievementCount: () => ACHIEVEMENTS.length,
    transferCode,
    mergeTransfer,
  }
  window.addEventListener('chessweeper:state', sync)
  window.addEventListener('chessweeper:end', (event) =>
    recordEnding(event.detail.type, event.detail.reason),
  )
  window.addEventListener('message', (event) => {
    if (
      event.origin !== location.origin ||
      !event.data ||
      event.data.type !== 'chessweeper:open'
    )
      return
    if (
      ['guide', 'settings', 'scrapbook', 'achievements'].includes(
        event.data.panel,
      )
    )
      openPanel(event.data.panel)
  })
  if (
    window.parent !== window &&
    new URLSearchParams(location.search).get('embedded') === '1'
  )
    document.documentElement.classList.add('meta-embedded')
  applySettings()
  sync()
})()
