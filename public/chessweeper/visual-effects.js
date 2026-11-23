;(() => {
  const layer = document.getElementById('chess-fx')
  if (!layer) return
  const kinds = {
    move: 3,
    capture: 9,
    mine: 12,
    blade: 6,
    rush: 14,
    laststand: 13,
    wager: 11,
    jackpot: 15,
    damage: 8,
    victory: 20,
    defeat: 11,
  }
  const root = document.documentElement

  function animationOff() {
    return (
      root.classList.contains('meta-motion-off') ||
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    )
  }

  const MAX_EFFECTS = 80
  const cinematicTitles = {
    sugar: { victory: 'SWEET VICTORY', defeat: 'SUGAR CRASH' },
    ashen: { victory: 'THE EMBERS ENDURE', defeat: 'THE FLAME FADES' },
    jackpot: { victory: 'JACKPOT!', defeat: 'HOUSE WINS' },
  }
  let cinematicTimer = null
  let cinematic = null

  function clearCinematic() {
    clearTimeout(cinematicTimer)
    cinematicTimer = null
    cinematic?.remove()
    cinematic = null
  }

  function showCinematic(detail) {
    clearCinematic()
    if (animationOff()) return
    const title = cinematicTitles[detail.realm]?.[detail.kind]
    if (!title) return
    cinematic = document.createElement('div')
    cinematic.className =
      'chess-fx-cinematic chess-fx-cinematic-' + detail.realm
    cinematic.setAttribute('role', 'status')
    cinematic.setAttribute('aria-label', title)
    const lettering = document.createElement('strong')
    lettering.textContent = title
    cinematic.append(lettering)
    layer.append(cinematic)
    cinematicTimer = setTimeout(clearCinematic, 1800)
  }

  // Painted special-action plates (t-003 ArtJobs 76605-76607). Each one is
  // preloaded and only shown once it has decoded, so a missing render keeps the
  // code-drawn effects without a broken image.
  const ACTION_PLATES = {
    rush: {
      realm: 'sugar',
      src: '/images/chessweeper/sugar-rush-action-scene.webp',
      title: 'SUGAR RUSH!',
    },
    laststand: {
      realm: 'ashen',
      src: '/images/chessweeper/ashen-laststand-action-scene.webp',
      title: 'LAST STAND',
    },
    wager: {
      realm: 'jackpot',
      src: '/images/chessweeper/jackpot-double-or-nothing-action-scene.webp',
      title: 'DOUBLE OR NOTHING',
    },
  }
  const plateReady = new Map()
  function preloadPlate(kind) {
    const plate = ACTION_PLATES[kind]
    if (!plate || plateReady.has(kind) || typeof Image !== 'function') return
    plateReady.set(kind, false)
    const image = new Image()
    image.onload = () => plateReady.set(kind, true)
    image.onerror = () => plateReady.set(kind, false)
    image.src = plate.src
  }
  let plateNode = null
  let plateTimer = null
  function clearPlate() {
    clearTimeout(plateTimer)
    plateTimer = null
    plateNode?.remove()
    plateNode = null
  }
  function showPlate(kind) {
    const plate = ACTION_PLATES[kind]
    if (!plate || !plateReady.get(kind) || animationOff()) return
    clearPlate()
    plateNode = document.createElement('figure')
    plateNode.className = 'chess-fx-plate chess-fx-plate-' + kind
    plateNode.setAttribute('role', 'img')
    plateNode.setAttribute('aria-label', plate.title + ' illustration')
    const image = document.createElement('img')
    image.src = plate.src
    image.alt = ''
    const caption = document.createElement('figcaption')
    caption.textContent = plate.title
    plateNode.append(image, caption)
    layer.append(plateNode)
    plateTimer = setTimeout(clearPlate, 1600)
  }
  function preloadForRealm() {
    for (const [kind, plate] of Object.entries(ACTION_PLATES))
      if (plate.realm === root.dataset?.realm) preloadPlate(kind)
  }
  window.addEventListener('chessweeper:state', preloadForRealm)
  preloadForRealm()
  window.__chessweeperActionPlates = {
    plates: ACTION_PLATES,
    ready: (kind) => plateReady.get(kind) === true,
  }

  window.addEventListener('pagehide', clearPlate)
  window.addEventListener('pagehide', clearCinematic)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearCinematic()
      clearPlate()
    }
  })
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      clearCinematic()
      clearPlate()
    }
  })

  function validSquare(square) {
    return (
      Number.isInteger(square) &&
      square >= 0 &&
      square < 128 &&
      !(square & 0x88)
    )
  }

  function squarePosition(square) {
    return {
      x: ((square & 7) + 0.5) * 12.5,
      y: ((square >> 4) + 0.5) * 12.5,
    }
  }

  function addEffect(node, maxAge) {
    if (layer.childElementCount >= MAX_EFFECTS) {
      layer.firstElementChild?.remove()
    }
    layer.append(node)
    node.addEventListener('animationend', () => node.remove(), {
      once: true,
    })
    setTimeout(() => node.remove(), maxAge)
  }

  function travelPiece(detail) {
    if (!validSquare(detail.from) || !validSquare(detail.square)) return
    if (detail.from === detail.square) return
    const source = document
      .getElementById('board')
      ?.querySelector('[data-square="' + detail.from + '"] .piece')
    if (!source) return
    const bounds = layer.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return

    const from = squarePosition(detail.from)
    const to = squarePosition(detail.square)
    const dx = ((to.x - from.x) / 100) * bounds.width
    const dy = ((to.y - from.y) / 100) * bounds.height
    const arc = Math.min(28, Math.max(12, bounds.height / 24))
    const traveler = document.createElement('span')
    traveler.className = 'chess-fx-traveler chess-fx-traveler-' + detail.kind
    traveler.style.left = from.x + '%'
    traveler.style.top = from.y + '%'
    traveler.style.setProperty('--fx-mid-x', dx * 0.5 + 'px')
    traveler.style.setProperty('--fx-mid-y', dy * 0.5 - arc + 'px')
    traveler.style.setProperty('--fx-travel-x', dx + 'px')
    traveler.style.setProperty('--fx-travel-y', dy + 'px')
    traveler.append(source.cloneNode(true))
    addEffect(traveler, 700)
  }

  function impact(kind, x, y) {
    if (
      ![
        'capture',
        'mine',
        'blade',
        'rush',
        'laststand',
        'wager',
        'jackpot',
        'damage',
        'victory',
        'defeat',
      ].includes(kind)
    ) {
      return
    }
    const ring = document.createElement('span')
    ring.className = 'chess-fx-impact chess-fx-impact-' + kind
    ring.style.left = x + '%'
    ring.style.top = y + '%'
    addEffect(ring, 1100)
  }

  window.addEventListener('chessweeper:fx', (event) => {
    const detail = event.detail || {}
    const kind = detail.kind
    const count = kinds[kind]
    if (!count) return
    if (kind === 'victory' || kind === 'defeat') {
      clearPlate()
      showCinematic(detail)
    }
    if (ACTION_PLATES[kind]) showPlate(kind)
    if (animationOff()) return

    const square = validSquare(detail.square) ? detail.square : -1
    const position = square < 0 ? { x: 50, y: 50 } : squarePosition(square)
    const { x, y } = position
    if (kind === 'move' || kind === 'capture') travelPiece(detail)
    impact(kind, x, y)
    const radius = kind === 'victory' || kind === 'rush' ? 85 : 39

    for (let i = 0; i < count; i++) {
      const spark = document.createElement('span')
      spark.className = 'chess-fx-spark chess-fx-' + kind
      spark.style.left = x + '%'
      spark.style.top = y + '%'
      const angle = ((i + 0.5) / count) * Math.PI * 2
      spark.style.setProperty(
        '--fx-dx',
        Math.round(Math.cos(angle) * radius) + 'px',
      )
      spark.style.setProperty(
        '--fx-dy',
        Math.round(Math.sin(angle) * radius) + 'px',
      )
      spark.style.setProperty('--fx-delay', (i % 4) * 24 + 'ms')
      addEffect(spark, 920)
    }
  })
})()
