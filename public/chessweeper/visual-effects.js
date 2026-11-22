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

  window.addEventListener('chessweeper:fx', (event) => {
    const detail = event.detail || {}
    const kind = detail.kind
    const count = kinds[kind]
    if (!count || animationOff()) return

    const square = Number.isInteger(detail.square) ? detail.square : -1
    const onBoard = square >= 0 && square < 128 && !(square & 0x88)
    const x = onBoard ? ((square & 7) + 0.5) * 12.5 : 50
    const y = onBoard ? ((square >> 4) + 0.5) * 12.5 : 50
    const radius = kind === 'victory' || kind === 'rush' ? 85 : 39

    for (let i = 0; i < count; i++) {
      if (layer.childElementCount >= 80) {
        layer.firstElementChild?.remove()
      }
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
      layer.append(spark)
      spark.addEventListener('animationend', () => spark.remove(), {
        once: true,
      })
      setTimeout(() => spark.remove(), 920)
    }
  })
})()
