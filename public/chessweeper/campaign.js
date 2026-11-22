;(() => {
  const engine = window.__fusionTest
  if (!engine) return
  const KEY = 'kindrobots:chessweeper:campaign:v1'
  const WORLDS = {
    sugar: [
      [
        'The First Sprinkle',
        'Protect the candy coronation from its first wheel.',
        1,
        0,
        0,
      ],
      [
        'Taffy Trap',
        'A second blade spins through the royal orchards.',
        0,
        0,
        1,
      ],
      [
        'Glitter Rebellion',
        'The candy marshals turn on the rainbow court.',
        0,
        75,
        2,
      ],
      [
        'The Sugar Crown',
        'Defeat the wheels before the lollipop throne melts.',
        0,
        0,
        2,
      ],
    ],
    ashen: [
      [
        'The Ash Gate',
        'Enter the cursed cathedral under its iron sentinel.',
        0,
        0,
        1,
      ],
      [
        'The Bell Toll',
        'Two more execution wheels wake in the ruined nave.',
        0,
        0,
        2,
      ],
      [
        'The Furnace Choir',
        'Save the last ember with just one king heart.',
        -1,
        0,
        1,
      ],
      [
        'Iron Judgment',
        'Face the executioner with all the wheels awake.',
        -1,
        0,
        2,
      ],
    ],
    jackpot: [
      ['Opening Odds', 'Take fifty chips and face the house.', 0, 50, 0],
      [
        'The Tilt Pit',
        'A second steel pinball prowls beneath the flippers.',
        0,
        60,
        1,
      ],
      ['High-Roller Alley', 'Bet against two more chrome blades.', 0, 80, 2],
      [
        'The Final Spin',
        'Break the house and take the hundred-chip crown.',
        0,
        100,
        2,
      ],
    ],
  }
  let archive = {}
  try {
    const stored = JSON.parse(localStorage.getItem(KEY) || '{}')
    if (stored.v === 1 && stored.worlds && typeof stored.worlds === 'object') {
      archive = stored.worlds
    }
  } catch {}
  const world = () => document.documentElement.dataset.realm || 'jackpot'
  const current = (w = world()) => {
    const raw = archive[w]
    return {
      chapter: Number.isInteger(raw?.chapter)
        ? Math.max(0, Math.min(3, raw.chapter))
        : 0,
      cleared: raw?.cleared === true,
    }
  }
  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ v: 1, worlds: archive }))
    } catch {}
  }
  const panel = document.createElement('section')
  panel.className = 'chess-campaign'
  panel.setAttribute('aria-label', 'Chessweeper campaign')
  panel.innerHTML =
    '<div class="chess-campaign-head"><span data-campaign-chapter></span>' +
    '<strong data-campaign-title></strong></div>' +
    '<p data-campaign-story></p><button data-campaign-next hidden>' +
    'Next battle ↻</button>'
  document.querySelector('.panel')?.prepend(panel)
  const el = (key) => panel.querySelector('[data-campaign-' + key + ']')
  const next = el('next')
  let lastState = null
  let recordedState = null

  function render() {
    const w = world()
    const progress = current(w)
    const stage = WORLDS[w]?.[progress.chapter]
    if (!stage) return
    el('chapter').textContent =
      (progress.cleared
        ? 'CAMPAIGN COMPLETE'
        : 'CHAPTER ' + (progress.chapter + 1) + '/4') +
      ' · ' +
      w.toUpperCase()
    el('title').textContent = stage[0]
    el('story').textContent = stage[1]
    next.hidden = !engine.get()?.over
    next.textContent = progress.cleared
      ? 'Replay final battle ↻'
      : 'Next / retry ↻'
  }
  function sync() {
    const state = engine.get()
    if (!state) return
    if (state !== lastState) {
      lastState = state
      recordedState = null
      const stage = WORLDS[world()]?.[current().chapter]
      if (stage && state.turns === 0 && !state.over) {
        state.hp[1] = Math.max(1, state.hp[1] + stage[2])
        state.score += stage[3]
        if (stage[4] >= 1) state.discs[2].active = true
        if (stage[4] >= 2) state.discs[3].active = true
        engine.refresh()
      }
    }
    render()
  }
  function onEnd(event) {
    const state = engine.get()
    if (!state || recordedState === state) return
    recordedState = state
    if (event.detail?.type === 'win') {
      const w = world()
      const progress = current(w)
      archive[w] = {
        chapter: Math.min(3, progress.chapter + 1),
        cleared: progress.cleared || progress.chapter === 3,
      }
      save()
    }
    render()
  }
  next.addEventListener('click', () => {
    if (engine.get()?.over) engine.reset()
  })
  window.addEventListener('chessweeper:state', sync)
  window.addEventListener('chessweeper:end', onEnd)
  window.__chessweeperCampaign = {
    current,
    worldCount: Object.keys(WORLDS).length,
    chapters: (w) => WORLDS[w]?.length || 0,
  }
  sync()
})()
