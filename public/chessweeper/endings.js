/* Chessweeper endings: twelve authored, illustrated ending scenes (four per world).
 *
 * Loaded before progression.js. Exposes window.ChessweeperEndings:
 *   CATALOG                 world -> four ending records, in scrapbook order
 *   classify(type, reason)  map an engine end event to mate | sweep | arena | fallen
 *   consequence(context)    run-aware lines (pact branch, chapter, hearts, score)
 *   present(context)        open the illustrated ending scene dialog
 *
 * Every ending is reachable from ordinary play: checkmate (mate), clearing every
 * safe minefield square (sweep), the arena destroying the enemy king (arena), and
 * losing your king or a drawn board (fallen). The plate image falls back to the
 * world's painted art, then to a code-drawn gradient, so a missing render never
 * blocks the scene.
 */
;(() => {
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
  const ORDER = ['mate', 'sweep', 'arena', 'fallen']
  const MARK = { mate: '♔', sweep: '✹', arena: '💿', fallen: '☠' }
  const ROUTE = {
    mate: 'Checkmate ending',
    sweep: 'Minefield ending',
    arena: 'Arena ending',
    fallen: 'Setback ending',
  }

  const CATALOG = {
    sugar: [
      {
        id: 'mate',
        title: 'The Sugar Crown',
        hint: 'Corner the licorice king with your own pieces.',
        prose: [
          'The licorice king has nowhere left to roll. He sets down his sceptre with a sticky little clink, and the whole candy court goes quiet enough to hear the sprinkles settle.',
          'They crown you on the pink-and-mint floor you fought across. Every unicorn gets a vote, every vote is glitter, and the result is unanimous before the counting starts. For one sweet evening, nobody mentions the mines.',
        ],
      },
      {
        id: 'sweep',
        title: 'The Rainbow Orchard',
        hint: 'Leave no safe square of the candy field unexplored.',
        prose: [
          'Square by square, clue by careful clue, you mapped every sugarbomb buried under the kingdom. Not one safe sweet was left undiscovered.',
          'By spring the cleared field is an orchard of lollipop trees. The two lollipop wheels retire to a quiet bakery, where they hang over the doorway as wind chimes and only spin when the cocoa is ready.',
        ],
      },
      {
        id: 'arena',
        title: 'The Glitter Rebellion',
        hint: 'Let the spinning candy wheels settle the rivalry for you.',
        prose: [
          'You never laid a finger on the rival king. You simply kept your court out of the way while the candy wheels did their dizzy rounds, until one of them found licorice.',
          'The glitter storm that follows lasts three days. The kingdom is yours, although the floor is sticky and the wheels now expect a royal pension.',
        ],
      },
      {
        id: 'fallen',
        title: 'The Melted Throne',
        hint: 'Every candy kingdom has a sour day.',
        prose: [
          'The throne softens, sags and slides into a glossy pink puddle. Your crown sinks slowly, the way good syrup does, while the court musicians keep playing a little slower, as if nothing has happened at all.',
          'It is a beautiful disaster. Somewhere behind the layer cake, the gummy royals are already whispering the next plan, and they have saved you a seat at the table.',
        ],
      },
    ],
    ashen: [
      {
        id: 'mate',
        title: 'Crown of Ash',
        hint: 'Trap the obsidian king where no blade can save him.',
        prose: [
          'The black king finds every road closed by your soldiers. The cathedral falls silent except for the ash, which keeps falling the way snow does in places that have forgotten summer.',
          'The executioner walks out of the smoke, lays his great axe on the cracked stone, and kneels. He has served many kings. This is the first one who learned to survive the impossible.',
        ],
      },
      {
        id: 'sweep',
        title: 'The Last Ember',
        hint: 'Break every hidden sigil beneath the cathedral floor.',
        prose: [
          'Every cursed sigil is found and broken. The floor of the cathedral lies bare and honest for the first time in centuries, and the iron wheels slow to a sullen stop.',
          'At dawn, light comes through the broken rose window and does not flinch. You hold the last ember up to it, and the ember, very slowly, begins to look like a sunrise.',
        ],
      },
      {
        id: 'arena',
        title: 'Iron Judgment',
        hint: 'The execution wheels do not care whose king they find.',
        prose: [
          "The iron wheels were built to keep the cathedral's master safe. They turn on him anyway, grinding through the obsidian throne in a fountain of sparks.",
          'You survive it, which is not the same as being blameless. The pilgrims who arrive afterwards call you lucky. The ones who were watching call you patient, and they lower their voices when they say it.',
        ],
      },
      {
        id: 'fallen',
        title: 'Names in the Stone',
        hint: 'Even legends end up on the crypt wall.',
        prose: [
          'Another name is carved into the crypt, small and neat, between two kings who also thought they had one more move. The mason does not ask how it happened. He never does.',
          'In the iron brazier at the foot of the stairs, a single ember is still burning. It has been waiting a long time. It can wait for you to begin again.',
        ],
      },
    ],
    jackpot: [
      {
        id: 'mate',
        title: 'House of Kings',
        hint: 'Beat the dealer at the oldest game on the table.',
        prose: [
          'Check. Check. Mate. You lay the winning line down on the eight-square felt like a royal flush, and the house king has no card left to play.',
          'The chrome dealer sweats oil, smiles too widely and slides a lifetime comp across the table. Behind you, every slot machine in the hall pays out at once just to be on the winning side.',
        ],
      },
      {
        id: 'sweep',
        title: 'The Perfect Sweep',
        hint: 'Light up every safe square on the neon board.',
        prose: [
          'Every safe square pays out. The board lights up gold from edge to edge, and the bumpers fire for no reason except joy.',
          'Coins pour out of the scoreboard faster than it can count them, until the panels simply glow and give up. Somebody will have to explain this to the accountants. It will not be you.',
        ],
      },
      {
        id: 'arena',
        title: 'Tilt! Tilt! Tilt!',
        hint: 'Sometimes the machine plays for you.',
        prose: [
          'The chrome pinballs have been circling the house king all night. One perfect ricochet later, the dealer booth is a shower of chips and sparks.',
          'Every warning light in the casino blinks at once and the flippers twitch like nervous hands. The machine has finally paid its jackpot, and for once it paid it to a player.',
        ],
      },
      {
        id: 'fallen',
        title: 'The House Collects',
        hint: 'The house always gets its turn.',
        prose: [
          'The reels stop. The neon flickers. A long chrome rake slides the last of your chips back across the felt, unhurried, the way it has done ten thousand times before.',
          'You walk toward the exit under the rain-streaked windows, and you notice one coin glinting on the carpet by the door. The house always collects. There is always another spin.',
        ],
      },
    ],
  }

  // Narrative branch: the risk contract chosen for the chapter colours the epilogue.
  const PACT_LINES = {
    sugar: [
      'You fought under the Royal Shelter, and the court remembers that you kept your people safe first.',
      'You took the Glitter Dare, and the extra wheel you woke is already a legend among the candy marshals.',
    ],
    ashen: [
      'You kept the Ember Vigil, and the chapel bell still rings for the heart you guarded.',
      'You swore the Iron Oath, and the wheel you woke for glory will remember your name.',
    ],
    jackpot: [
      'You played with House Insurance, and the house is quietly annoyed that it had to honour the policy.',
      'You went High Roller, and the steel ball you unleashed is now the most talked-about table in the hall.',
    ],
  }
  const FINALE_LINES = {
    sugar: {
      win: 'CAMPAIGN COMPLETE: all four chapters of the Sugarbomb Kingdom are won. The lollipop throne is safe, and the kingdom throws a parade that ends, as all good parades do, at the bakery.',
      lose: 'The final chapter still waits. The lollipop throne is melting a little faster every hour.',
    },
    ashen: {
      win: 'CAMPAIGN COMPLETE: the four trials of the Ashen Checkmate are behind you. The executioner keeps your name off the crypt wall, at least for now.',
      lose: 'Iron Judgment still waits in the nave. The wheels are patient. So, now, are you.',
    },
    jackpot: {
      win: 'CAMPAIGN COMPLETE: the house is broken across all four tables. The hundred-chip crown is yours, and the casino lights spell nothing at all because they have run out of words.',
      lose: 'The Final Spin still waits. The house is counting on you coming back.',
    },
  }

  function classify(type, reason) {
    const text = String(reason || '').toLowerCase()
    if (type !== 'win') return 'fallen'
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

  const entry = (world, id) =>
    (CATALOG[world] || []).find((ending) => ending.id === id) || null
  const plate = (world, id) =>
    '/images/chessweeper/ending-' + world + '-' + id + '.webp'

  function consequence(context) {
    const world = context.world
    const lines = []
    const state = context.state || {}
    const campaign = context.campaign
    if (campaign && Number.isInteger(campaign.chapter)) {
      const pact = PACT_LINES[world]?.[campaign.pact === 1 ? 1 : 0]
      if (pact) lines.push(pact)
      if (campaign.chapter === 3) {
        const finale = FINALE_LINES[world]
        if (finale)
          lines.push(context.type === 'win' ? finale.win : finale.lose)
      }
    }
    if (context.type === 'draw')
      lines.push(
        'Neither king fell. A draw on this board still counts as a setback for the crown.',
      )
    const hearts = Number(state.hp?.[1])
    const turns = Number(state.turns) || 0
    const score = Number(state.score) || 0
    if (context.type === 'win' && Number.isFinite(hearts) && hearts > 0)
      lines.push(
        'Your king finished with ' +
          hearts +
          (hearts === 1 ? ' heart' : ' hearts') +
          ' after ' +
          turns +
          (turns === 1 ? ' turn' : ' turns') +
          ', for ' +
          score +
          ' points.',
      )
    else
      lines.push(
        'The run lasted ' +
          turns +
          (turns === 1 ? ' turn' : ' turns') +
          ' and banked ' +
          score +
          ' points.',
      )
    if (world === 'ashen' && state.lastStandUsed)
      lines.push('You spent your Last Stand on this run, and it showed.')
    if (world === 'sugar' && context.events?.rush > 0)
      lines.push(
        'Your Sugar Rush froze the wheels at exactly the right moment.',
      )
    if (world === 'jackpot' && context.events?.jackpot > 0)
      lines.push('Your Double or Nothing wager paid out before the end.')
    return lines
  }

  let dialog = null
  let lastFocus = null
  let openTimer = null

  function el(tag, className, text) {
    const node = document.createElement(tag)
    if (className) node.className = className
    if (text !== undefined) node.textContent = text
    return node
  }

  function ensureDialog() {
    if (dialog) return dialog
    dialog = document.createElement('dialog')
    dialog.className = 'cw-ending'
    dialog.id = 'cw-ending'
    dialog.setAttribute('aria-labelledby', 'cw-ending-title')
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) close()
    })
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault()
      close()
    })
    document.body.append(dialog)
    return dialog
  }

  function close() {
    clearTimeout(openTimer)
    openTimer = null
    if (!dialog) return
    if (dialog.open && typeof dialog.close === 'function') dialog.close()
    dialog.removeAttribute('open')
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus()
    lastFocus = null
  }

  function render(context) {
    const world = CATALOG[context.world] ? context.world : 'jackpot'
    const ending = entry(world, context.ending) || CATALOG[world][3]
    const box = ensureDialog()
    box.replaceChildren()
    box.dataset.world = world
    box.dataset.ending = ending.id

    const figure = el('figure', 'cw-ending-plate')
    const image = el('img')
    image.alt = ending.title + ', ' + NAMES[world] + ' ending illustration'
    image.decoding = 'async'
    image.dataset.stage = 'plate'
    image.addEventListener('error', () => {
      if (image.dataset.stage === 'plate') {
        image.dataset.stage = 'world'
        image.src = WORLD_ART[world]
      } else {
        image.hidden = true
        figure.classList.add('cw-ending-painted')
      }
    })
    image.src = plate(world, ending.id)
    const mark = el('span', 'cw-ending-mark', MARK[ending.id])
    mark.setAttribute('aria-hidden', 'true')
    figure.append(image, mark)

    const body = el('div', 'cw-ending-body')
    const index = ORDER.indexOf(ending.id) + 1
    body.append(
      el(
        'p',
        'cw-ending-eyebrow',
        NAMES[world] + ' · ' + ROUTE[ending.id] + ' · ' + index + ' of 4',
      ),
    )
    const title = el('h2', '', ending.title)
    title.id = 'cw-ending-title'
    body.append(title)
    if (context.isNew)
      body.append(el('p', 'cw-ending-new', '✦ New scrapbook page unlocked'))
    for (const paragraph of ending.prose)
      body.append(el('p', 'cw-ending-prose', paragraph))
    if (!context.replay) {
      const run = el('section', 'cw-ending-run')
      run.setAttribute('aria-label', 'Your run')
      run.append(el('h3', '', 'Your run'))
      for (const line of consequence(context)) run.append(el('p', '', line))
      body.append(run)
    }
    if (Number.isInteger(context.discovered))
      body.append(
        el(
          'p',
          'cw-ending-count',
          context.discovered +
            ' of 12 endings discovered across all three worlds.',
        ),
      )

    const actions = el('div', 'cw-ending-actions')
    if (!context.replay) {
      const next = el(
        'button',
        'cw-ending-primary',
        context.type === 'win' ? '▶ Next battle' : '↻ Try again',
      )
      next.type = 'button'
      next.dataset.endingAction = 'next'
      next.addEventListener('click', () => {
        close()
        context.onNext?.()
      })
      actions.append(next)
    }
    const book = el('button', '', '📖 Scrapbook')
    book.type = 'button'
    book.dataset.endingAction = 'scrapbook'
    book.addEventListener('click', () => {
      close()
      context.onScrapbook?.()
    })
    const stay = el(
      'button',
      '',
      context.replay ? '✕ Close' : '♟ View the board',
    )
    stay.type = 'button'
    stay.dataset.endingAction = 'close'
    stay.addEventListener('click', close)
    actions.append(book, stay)
    body.append(actions)

    box.append(figure, body)
    lastFocus = document.activeElement
    if (typeof box.showModal === 'function') {
      if (!box.open) box.showModal()
    } else box.setAttribute('open', '')
    ;(actions.querySelector('button') || stay).focus?.({ preventScroll: true })
    box.scrollTop = 0
    return box
  }

  function present(context) {
    clearTimeout(openTimer)
    const root = document.documentElement
    const reduced =
      root.classList.contains('meta-motion-off') ||
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    // Let the short victory/defeat cinematic play first when motion is on.
    const delay = context.replay || reduced ? 0 : Number(context.delay ?? 1900)
    if (delay <= 0) return render(context)
    openTimer = setTimeout(() => {
      openTimer = null
      render(context)
    }, delay)
    return null
  }

  window.addEventListener('pagehide', close)
  window.ChessweeperEndings = {
    NAMES,
    WORLD_ART,
    ORDER,
    CATALOG,
    PACT_LINES,
    FINALE_LINES,
    classify,
    entry,
    plate,
    consequence,
    present,
    close,
    total: () => ORDER.length * Object.keys(CATALOG).length,
  }
})()
