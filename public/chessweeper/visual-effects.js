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
    if (!count || animationOff()) return

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
