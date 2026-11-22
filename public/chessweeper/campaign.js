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
  const TRIALS = {
    sugar: [
      ['Royal Guard', 'Win with three or more king hearts.', (s) => s.hp?.[1] >= 3],
      ['Sugar Survey', 'Reveal five covered squares.', (s) => s.shown?.size >= 37],
      ['Sugar Rush', 'Activate Sugar Rush during this fight.', (_s, e) => e.rush > 0],
      ['Royal Encore', 'Survive eight complete beats before winning.', (s) => s.turns >= 8],
    ],
    ashen: [
      ['The Watch', 'Win with two or more king hearts.', (s) => s.hp?.[1] >= 2],
      ['Blade Gauntlet', 'Survive six turns before winning.', (s) => s.turns >= 6],
      ['Last Ember', 'Trigger Last Stand and still emerge victorious.', (_s, e) => e.laststand > 0],
      ['The Long Night', 'Win after at least ten turns.', (s) => s.turns >= 10],
    ],
    jackpot: [
      ['House Money', 'Win with a hundred or more chips.', (s) => s.score >= 100],
      ['Place Your Bet', 'Place a Double or Nothing wager before winning.', (_s, e) => e.wager > 0],
      ['Cash Out', 'Collect an actual wager payout.', (_s, e) => e.jackpot > 0],
      ['Triple Crown', 'Win with a multiplier of three or more.', (s) => s.multiplier >= 3],
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
      mastery: Number.isInteger(raw?.mastery)
        ? Math.max(0, Math.min(15, raw.mastery))
        : 0,
      best: Number.isSafeInteger(raw?.best) && raw.best >= 0
        ? Math.min(99999999, raw.best)
        : 0,
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
    '<p data-campaign-story></p><p class="chess-campaign-bonus" data-campaign-bonus></p>' +
    '<button data-campaign-next hidden>' +
    'Next battle ↻</button>'
  document.querySelector('.panel')?.prepend(panel)
  const el = (key) => panel.querySelector('[data-campaign-' + key + ']')
  const next = el('next')
  let lastState = null
  let recordedState = null
  const eventsByState = new WeakMap()

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
    const trial = TRIALS[w]?.[progress.chapter]
    const mastered = !!(progress.mastery & (1 << progress.chapter))
    el('bonus').textContent = trial
      ? (mastered ? '★ Mastered: ' : '☆ Optional mastery: ') +
        trial[0] +
        (mastered ? '' : ' · ' + trial[1])
      : ''
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
      eventsByState.set(state, { rush: 0, laststand: 0, wager: 0, jackpot: 0 })
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
      const trial = TRIALS[w]?.[progress.chapter]
      const events = eventsByState.get(state) || {}
      const mastered = !!trial?.[2](state, events)
      const mastery =
        progress.mastery | (mastered ? 1 << progress.chapter : 0)
      const score = Number.isFinite(Number(state.score))
        ? Math.max(0, Math.min(99999999, Math.floor(state.score)))
        : 0
      archive[w] = {
        chapter: Math.min(3, progress.chapter + 1),
        cleared: progress.cleared || progress.chapter === 3,
        mastery,
        best: Math.max(progress.best, score),
      }
      save()
      if (mastered && !(progress.mastery & (1 << progress.chapter))) {
        window.dispatchEvent(
          new CustomEvent('chessweeper:campaign-mastery', {
            detail: { world: w, chapter: progress.chapter, trial: trial[0] },
          }),
        )
      }
    }
    render()
  }
  next.addEventListener('click', () => {
    if (engine.get()?.over) engine.reset()
  })
  window.addEventListener('chessweeper:fx', (event) => {
    const state = engine.get()
    const events = eventsByState.get(state)
    const kind = event.detail?.kind
    if (events && Object.hasOwn(events, kind)) events[kind]++
  })
  window.addEventListener('chessweeper:state', sync)
  window.addEventListener('chessweeper:end', onEnd)
  window.__chessweeperCampaign = {
    current,
    worldCount: Object.keys(WORLDS).length,
    chapters: (w) => WORLDS[w]?.length || 0,
    trial: (w, chapter) => TRIALS[w]?.[chapter]?.slice(0, 2) || null,
  }
  sync()
})()
