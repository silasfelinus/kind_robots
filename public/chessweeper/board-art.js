// Chessweeper painted boards: activate each world only after its art has loaded.
// The plain tile palette stays playable while its image is absent or still rendering.
;(() => {
  const SOURCES = {
    sugar: '/images/chessweeper/sugarbomb-board.webp',
    ashen: '/images/chessweeper/ashen-board.webp',
    jackpot: '/images/chessweeper/jackpot-board.webp',
  }
  const PIECE_ATLASES = {
    sugar: '/images/chessweeper/sugarbomb-piece-atlas.webp',
    ashen: '/images/chessweeper/ashen-piece-atlas.webp',
    jackpot: '/images/chessweeper/jackpot-piece-atlas.webp',
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

  let pieceRealm = ''
  let pieceRequest = 0
  function updatePieceArt() {
    const realm = root.dataset.realm
    if (realm === pieceRealm) return
    pieceRealm = realm
    const generation = ++pieceRequest
    delete root.dataset.pieceArt
    const src = PIECE_ATLASES[realm]
    if (!src) return
    const image = new Image()
    image.onload = () => {
      if (
        generation === pieceRequest &&
        pieceRealm === realm &&
        image.naturalWidth >= 600 &&
        image.naturalHeight >= 200
      ) {
        root.dataset.pieceArt = 'ready'
      }
    }
    image.onerror = () => {
      if (generation === pieceRequest) delete root.dataset.pieceArt
    }
    image.src = src
  }

  window.addEventListener('chessweeper:state', updateBoardArt)
  window.addEventListener('chessweeper:state', updatePieceArt)
  updateBoardArt()
  updatePieceArt()
})()
