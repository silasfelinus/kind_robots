// Chessweeper painted boards: activate each world only after its art has loaded.
// The plain tile palette stays playable while its image is absent or still rendering.
;(() => {
  const SOURCES = {
    sugar: '/images/chessweeper/sugarbomb-board.webp',
    ashen: '/images/chessweeper/ashen-board.webp',
    jackpot: '/images/chessweeper/jackpot-board.webp',
  }
  const root = document.documentElement
  let current = ''
  let request = 0

  function updateBoardArt() {
    const realm = root.dataset.realm
    if (realm === current) return
    current = realm
    const generation = ++request
    delete root.dataset.boardArt

    const src = SOURCES[realm]
    if (!src) return
    const image = new Image()
    image.onload = () => {
      if (generation === request && current === realm) {
        root.dataset.boardArt = 'ready'
      }
    }
    image.onerror = () => {
      if (generation === request) delete root.dataset.boardArt
    }
    image.src = src
  }

  window.addEventListener('chessweeper:state', updateBoardArt)
  updateBoardArt()
})()
