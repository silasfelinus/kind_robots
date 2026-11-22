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
  const ENDINGS = {
    sugar: [
      [
        'mate',
        'The Sugar Crown',
        'The candy kingdom crowns its first grandmaster. Every unicorn gets a vote, and every vote is glitter.',
      ],
      [
        'sweep',
        'The Rainbow Orchard',
        'Not one safe sweet was left undiscovered. The lollipop wheels retire to a quiet bakery.',
      ],
      [
        'arena',
        'The Glitter Rebellion',
        'The spinning candy wheels overthrow the rival king. The kingdom is yours, although the floor is sticky.',
      ],
      [
        'fallen',
        'The Melted Throne',
        'A beautiful disaster. Somewhere beneath the sprinkles, the royal family plots another attempt.',
      ],
    ],
    ashen: [
      [
        'mate',
        'Crown of Ash',
        'The cathedral falls silent. Its executioner kneels before a king who learned to survive the impossible.',
      ],
      [
        'sweep',
        'The Last Ember',
        'Every sigil is broken and the cursed floor lies bare. Dawn enters the cathedral for the first time in centuries.',
      ],
      [
        'arena',
        'Iron Judgment',
        'The machines turn upon their master. You survive, though no one mistakes survival for innocence.',
      ],
      [
        'fallen',
        'Names in the Stone',
        'Another name is carved into the crypt. The last ember waits for a stranger with the courage to begin again.',
      ],
    ],
    jackpot: [
      [
        'mate',
        'House of Kings',
        'A royal flush delivered on an eight-square table. The casino offers you a lifetime comp and a nervous smile.',
      ],
      [
        'sweep',
        'The Perfect Sweep',
        'Every safe square pays out. Neon showers descend as the scoreboard runs out of digits.',
      ],
      [
        'arena',
        'Tilt! Tilt! Tilt!',
        'The chrome pinballs overthrow the house dealer. The machine has finally paid the jackpot.',
      ],
      [
        'fallen',
        'The House Collects',
        'The reels stop, the lights flicker, and the house takes its cut. There is always another spin.',
      ],
    ],
  }
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
    const text = (reason || '').toLowerCase()
    if (type === 'win') {
      if (text.includes('minefield') || text.includes('safe square'))
        return 'sweep'
      if (
        text.includes('blade') ||
        text.includes('arena') ||
        text.includes('destroyed') ||
        text.includes('mine strike')
      )
        return 'arena'
      return 'mate'
    }
    return 'fallen'
  }
  function recordEnding(type, reason) {
    const world = currentWorld()
    const s = engine.get()
    if (!s || seen.has(s)) return
    seen.add(s)
    const id = world + ':' + endingFor(world, type, reason)
    const entry = ENDINGS[world].find((e) => e[0] === id.split(':')[1])
    if (!profile.endings.includes(id)) profile.endings.push(id)
    profile.runs++
    const record = profile.records[world] || { best: 0, wins: 0, runs: 0 }
    record.runs++
    if (type === 'win') record.wins++
    record.best = Math.max(record.best, Number(s.score) || 0)
    profile.records[world] = record
    delete profile.saves[world]
    write()
    if (type === 'win') award('winner')
    if (profile.endings.length >= 4) award('collector')
    if (entry) {
      const box = $$('end-desc')
      if (box)
        box.textContent =
          entry[1] + ': ' + entry[2] + ' Final score: ' + s.score + '.'
      notify('Scrapbook: ' + (entry ? entry[1] : 'New ending'))
    }
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
      esc(unlocked ? detail : 'Keep playing to discover this.') +
      '</span></article>'
    )
  }
  function renderArchive() {
    let html =
      '<p class="meta-intro">The cabinet remembers your victories, defeats and strange discoveries on this device.</p>'
    for (const world of ['sugar', 'ashen', 'jackpot']) {
      const r = profile.records[world] || { best: 0, wins: 0, runs: 0 }
      html += `<section class="meta-scrapbook-world"><img data-world-art="${world}" src="${WORLD_ART[world]}" alt="${NAMES[world]} illustrated chessboard" loading="lazy" /><h3>${NAMES[world]} · ${r.wins} wins · best ${r.best}</h3></section><div class="meta-grid">`

      for (const ending of ENDINGS[world])
        html += card(
          '✧',
          ending[1],
          ending[2],
          profile.endings.includes(world + ':' + ending[0]),
        )
      html += '</div>'
    }
    return html
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
      '<p class="meta-warning">Progress is stored locally in this browser, not synchronized to your Kind Robots account. Clearing browser data deletes this archive.</p>'
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
  $('meta-close').addEventListener('click', () => dialog.close())
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close()
  })
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
