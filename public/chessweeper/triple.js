'use strict'
;(() => {
  const chess = window.ChessweeperChess
  if (!chess) return

  const $ = (id) => document.getElementById(id)
  const symbols = {
    K: '♔',
    Q: '♕',
    R: '♖',
    B: '♗',
    N: '♘',
    P: '♙',
    k: '♚',
    q: '♛',
    r: '♜',
    b: '♝',
    n: '♞',
    p: '♟',
  }
  const pieces = {
    k: 'king',
    q: 'queen',
    r: 'rook',
    b: 'bishop',
    n: 'knight',
    p: 'pawn',
  }
  const canvas = $('disc-arena')
  const ctx = canvas.getContext('2d')
  const keys = new Set()
  const points = { chess: 0, mine: 0, disc: 0 }
  const DIFFICULTIES = Object.freeze({
    easy: {
      name: 'Easy', badge: '🌱 EASY', hearts: 5, mines: 6,
      startingDiscs: 2, discSpeed: 0.7, newDiscSeconds: 34,
      playerSpeed: 190, invulnerability: 2, cpuChoices: 7, cpuDelay: 600,
    },
    medium: {
      name: 'Medium', badge: '⚖ MED', hearts: 3, mines: 10,
      startingDiscs: 3, discSpeed: 1, newDiscSeconds: 24,
      playerSpeed: 170, invulnerability: 1.4, cpuChoices: 3, cpuDelay: 310,
    },
    hard: {
      name: 'Hard', badge: '🔥 HARD', hearts: 2, mines: 15,
      startingDiscs: 4, discSpeed: 1.3, newDiscSeconds: 17,
      playerSpeed: 164, invulnerability: 1.1, cpuChoices: 2, cpuDelay: 190,
    },
    catastrophic: {
      name: 'Catastrophic', badge: '☠ CATA', hearts: 1, mines: 20,
      startingDiscs: 6, discSpeed: 1.65, newDiscSeconds: 11,
      playerSpeed: 158, invulnerability: 0.85, cpuChoices: 1, cpuDelay: 80,
    },
  })
  const leaderboardSlug = (value) =>
    value === 'medium' ? 'chessweeper-triple' :
      'chessweeper-triple-' + value
  const state = {
    phase: 'start',
    remaining: 120,
    duration: 120,
    difficulty: 'medium',
    scoresDifficulty: 'medium',
    ranked: true,
    hearts: 3,
    chess: chess.initialPosition(),
    selected: -1,
    lastMove: [],
    moves: 0,
    chessRound: 1,
    busy: false,
    mineLevel: 1,
    mines: new Set(),
    opened: new Set(),
    flagged: new Set(),
    mineFirst: true,
    minePendingReset: false,
    flagMode: false,
    player: { x: 180, y: 180 },
    discs: [],
    invulnerable: 0,
    drag: null,
    discSeconds: 0,
    nextDisc: 24,
    final: 0,
    submitted: false,
    scoresReturn: 'start',
    range: 'all',
  }
  const difficulty = () => DIFFICULTIES[state.difficulty]
  let lastFrame = performance.now()
  let suppressedFlagClick = -1
  const AUDIO_KEY = 'kindrobots:chessweeper:triple:audio'
  try {
    const saved = JSON.parse(localStorage.getItem(AUDIO_KEY) || '{}')
    $('music-setting').checked = saved.music !== false
    $('fx-setting').checked = saved.effects !== false
  } catch {}

  function updateAudio() {
    const playing = state.phase === 'running'
    window.dispatchEvent(
      new CustomEvent('chessweeper:settings', {
        detail: {
          music: playing && $('music-setting').checked,
          sound: playing && $('fx-setting').checked,
        },
      }),
    )
  }

  function cue(kind) {
    window.dispatchEvent(
      new CustomEvent('chessweeper:fx', {
        detail: { kind },
      }),
    )
  }

  function saveAudio() {
    try {
      localStorage.setItem(
        AUDIO_KEY,
        JSON.stringify({
          music: $('music-setting').checked,
          effects: $('fx-setting').checked,
        }),
      )
    } catch {}
    updateAudio()
  }

  function totalScore() {
    return Math.floor(
      points.chess +
        points.mine +
        points.disc +
        Math.min(points.chess, points.mine, points.disc) * 1.5,
    )
  }

  function updateHud() {
    const minutes = Math.floor(state.remaining / 60)
    const seconds = Math.ceil(state.remaining % 60)
    $('clock').textContent =
      String(minutes).padStart(2, '0') +
      ':' +
      String(seconds === 60 ? 59 : seconds).padStart(2, '0')
    $('total').textContent = totalScore().toLocaleString('en-US')
    $('hearts').textContent =
      '♥'.repeat(Math.max(0, state.hearts)) +
      '♡'.repeat(Math.max(0, difficulty().hearts - state.hearts))
    $('difficulty-badge').textContent = difficulty().badge
    for (const kind of ['chess', 'mine', 'disc']) {
      $(kind + '-points').textContent = String(Math.floor(points[kind]))
    }
  }

  function score(kind, amount) {
    if (state.phase !== 'running') return
    points[kind] += amount
    updateHud()
  }

  function resetChess() {
    state.chess = chess.initialPosition()
    state.selected = -1
    state.lastMove = []
    state.moves = 0
    state.busy = false
    $('chess-status').textContent = 'Round ' + state.chessRound
    renderChess()
  }

  function renderChess() {
    const board = $('chess-board')
    board.replaceChildren()
    const available =
      state.chess.t === 1 && state.selected !== -1
        ? chess
            .legalMoves(state.chess)
            .filter((move) => move[0] === state.selected)
        : []
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 8; x++) {
        const index = y * 16 + x
        const piece = state.chess.b[index]
        const cell = document.createElement('button')
        cell.type = 'button'
        cell.className = 'cell chess-cell ' + ((x + y) % 2 ? 'dark' : 'light')
        if (index === state.selected) cell.classList.add('selected')
        if (state.lastMove.includes(index)) cell.classList.add('last')
        if (available.some((move) => move[1] === index))
          cell.classList.add('legal')
        if (piece !== '.') {
          const glyph = document.createElement('span')
          glyph.className =
            piece === piece.toUpperCase() ? 'white-piece' : 'black-piece'
          glyph.textContent = symbols[piece]
          cell.append(glyph)
        }
        cell.setAttribute(
          'aria-label',
          chess.squareName(index) +
            (piece === '.'
              ? ' empty'
              : ' ' +
                (piece === piece.toUpperCase() ? 'white ' : 'black ') +
                pieces[piece.toLowerCase()]),
        )
        cell.addEventListener('click', () => clickChess(index))
        board.append(cell)
      }
    }
  }

  function moveChess(move) {
    const prior = state.chess
    const victim = prior.b[move[1]]
    state.chess = chess.makePosition(prior, move)
    state.moves++
    state.lastMove = [move[0], move[1]]
    state.selected = -1
    score('chess', 18 + (victim === '.' ? 0 : 70))
    cue(victim === '.' ? 'move' : 'capture')
    if (chess.inCheck(state.chess)) score('chess', 35)
    const replies = chess.legalMoves(state.chess)
    if (!replies.length) {
      score('chess', chess.inCheck(state.chess) ? 1150 : 180)
      state.chessRound++
      $('chess-status').textContent = chess.inCheck(state.chess)
        ? 'CHECKMATE!'
        : 'Stalemate'
      state.busy = true
      renderChess()
      setTimeout(() => {
        if (state.phase === 'running') resetChess()
      }, 700)
      return
    }
    state.busy = true
    $('chess-status').textContent = 'CPU thinking…'
    renderChess()
    setTimeout(cpuMove, difficulty().cpuDelay)
  }

  function clickChess(index) {
    if (state.phase !== 'running' || state.busy || state.chess.t !== 1) return
    const current = state.chess.b[index]
    if (chess.colorOf(current) === 1) {
      state.selected = index === state.selected ? -1 : index
      renderChess()
      return
    }
    if (state.selected < 0) return
    const move = chess
      .legalMoves(state.chess)
      .find(
        (candidate) =>
          candidate[0] === state.selected &&
          candidate[1] === index &&
          (!candidate[2] || candidate[2] === 'q'),
      )
    if (!move) {
      state.selected = -1
      renderChess()
      return
    }
    moveChess(move)
  }

  function cpuMove() {
    if (state.phase !== 'running' || state.chess.t !== -1) return
    const options = chess.legalMoves(state.chess)
    if (!options.length) return resetChess()
    const pieceValue = {
      p: 10, n: 30, b: 30, r: 50, q: 90, k: 0,
    }
    const rated = options.map((move) => {
      const victim = state.chess.b[move[1]]
      const trial = chess.makePosition(state.chess, move)
      const replies = chess.legalMoves(trial)
      const whiteCapture = replies.reduce((highest, reply) => {
        const target = trial.b[reply[1]]
        return Math.max(highest,
          target === '.' ? 0 : pieceValue[target.toLowerCase()])
      }, 0)
      return {
        move,
        value: (victim === '.' ? 0 : pieceValue[victim.toLowerCase()]) -
          whiteCapture * 0.8 + (chess.inCheck(trial) ? 18 : 0) +
          (!replies.length && chess.inCheck(trial) ? 1500 : 0) +
          Math.random() * 9,
      }
    })
    rated.sort((a, b) => b.value - a.value)
    const choice = rated[Math.floor(
      Math.random() * Math.min(difficulty().cpuChoices, rated.length),
    )].move
    state.chess = chess.makePosition(state.chess, choice)
    state.lastMove = [choice[0], choice[1]]
    state.busy = false
    const whiteMoves = chess.legalMoves(state.chess)
    if (!whiteMoves.length) {
      if (chess.inCheck(state.chess)) damage('Checkmated')
      state.chessRound++
      if (state.phase === 'running') resetChess()
      return
    }
    $('chess-status').textContent = chess.inCheck(state.chess)
      ? 'CHECK! Your move'
      : 'Your move'
    renderChess()
  }

  function adjacent(index) {
    const y = Math.floor(index / 8)
    const x = index % 8
    const result = []
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && nx < 8 && ny >= 0 && ny < 8) {
          result.push(ny * 8 + nx)
        }
      }
    }
    return result
  }

  function resetMines(exclude = -1) {
    state.mines = new Set()
    state.opened = new Set()
    state.flagged = new Set()
    state.mineFirst = true
    state.minePendingReset = false
    const cells = Array.from({ length: 64 }, (_, i) => i).filter(
      (index) => index !== exclude,
    )
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[cells[i], cells[j]] = [cells[j], cells[i]]
    }
    state.mines = new Set(cells.slice(
      0, Math.min(26, difficulty().mines + state.mineLevel - 1),
    ))
    $('mine-status').textContent = 'Field ' + state.mineLevel
    renderMines()
  }

  function clue(index) {
    return adjacent(index).filter((other) => state.mines.has(other)).length
  }

  function flagMine(index) {
    if (state.phase !== 'running' || state.opened.has(index)) return
    if (state.flagged.has(index)) state.flagged.delete(index)
    else state.flagged.add(index)
    renderMines()
  }

  function revealMine(index) {
    if (
      state.phase !== 'running' ||
      state.minePendingReset ||
      state.flagged.has(index) ||
      state.opened.has(index)
    )
      return
    if (state.mineFirst) {
      state.mineFirst = false
      if (state.mines.has(index)) {
        const newSet = new Set(state.mines)
        newSet.delete(index)
        const replacement = Array.from({ length: 64 }, (_, i) => i).find(
          (i) => i !== index && !newSet.has(i),
        )
        if (replacement !== undefined) newSet.add(replacement)
        state.mines = newSet
      }
    }
    if (state.mines.has(index)) {
      state.opened.add(index)
      cue('mine')
      state.minePendingReset = true
      renderMines()
      damage('A mine exploded')
      if (state.phase === 'running') {
        state.mineLevel = Math.max(1, state.mineLevel)
        setTimeout(() => {
          if (state.phase === 'running' && state.minePendingReset) resetMines()
        }, 430)
      }
      return
    }
    cue('move')
    const queue = [index]
    while (queue.length) {
      const cell = queue.pop()
      if (
        state.opened.has(cell) ||
        state.flagged.has(cell) ||
        state.mines.has(cell)
      )
        continue
      state.opened.add(cell)
      score('mine', 20)
      if (!clue(cell)) queue.push(...adjacent(cell))
    }
    if (state.opened.size === 64 - state.mines.size) {
      score('mine', 360 + state.mineLevel * 110)
      cue('victory')
      state.mineLevel++
      state.minePendingReset = true
      $('mine-status').textContent = 'FIELD CLEARED!'
      setTimeout(() => {
        if (state.phase === 'running' && state.minePendingReset) resetMines()
      }, 430)
    }
    renderMines()
  }

  function renderMines() {
    const board = $('mine-board')
    board.replaceChildren()
    for (let index = 0; index < 64; index++) {
      const cell = document.createElement('button')
      cell.type = 'button'
      cell.className = 'cell mine-cell'
      const opened = state.opened.has(index)
      const flag = state.flagged.has(index)
      const mine = state.mines.has(index)
      const number = opened && !mine ? clue(index) : 0
      if (opened) cell.classList.add('open')
      if (opened && mine) cell.classList.add('boom')
      if (flag) cell.classList.add('flagged')
      if (number) cell.classList.add('hint-' + Math.min(4, number))
      cell.textContent = flag ? '🚩' : opened ? (mine ? '✹' : number || '') : ''
      cell.setAttribute(
        'aria-label',
        'Minefield row ' +
          (Math.floor(index / 8) + 1) +
          ' column ' +
          ((index % 8) + 1) +
          ' ' +
          (flag
            ? 'flagged'
            : !opened
              ? 'covered'
              : mine
                ? 'mine'
                : number + ' adjacent mines'),
      )
      let held = 0
      cell.addEventListener('pointerdown', (event) => {
        if (event.pointerType === 'mouse') return
        held = window.setTimeout(() => {
          suppressedFlagClick = index
          flagMine(index)
        }, 480)
      })
      for (const name of ['pointerup', 'pointercancel', 'pointerleave']) {
        cell.addEventListener(name, () => clearTimeout(held))
      }
      cell.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        flagMine(index)
      })
      cell.addEventListener('click', () => {
        if (suppressedFlagClick === index) {
          suppressedFlagClick = -1
          return
        }
        if (state.flagMode) flagMine(index)
        else revealMine(index)
      })
      board.append(cell)
    }
    $('mine-status').textContent =
      '✹ ' + (state.mines.size - state.flagged.size) + ' left'
  }

  function makeDisc() {
    const edge = Math.floor(Math.random() * 4)
    const coordinate = 35 + Math.random() * 290
    const speed =
      (52 + Math.random() * 32 + state.discs.length * 4) *
      difficulty().discSpeed
    const x = edge === 0 ? 12 : edge === 1 ? 348 : coordinate
    const y = edge === 2 ? 12 : edge === 3 ? 348 : coordinate
    const angle = Math.atan2(180 - y, 180 - x) + (Math.random() - 0.5) * 1.9
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 13,
      spin: Math.random() * 7,
    }
  }

  function resetDiscs() {
    state.player = { x: 180, y: 180 }
    state.discs = []
    state.invulnerable = difficulty().invulnerability
    state.drag = null
    state.discSeconds = 0
    state.nextDisc = difficulty().newDiscSeconds
    for (let i = 0; i < difficulty().startingDiscs; i++) {
      state.discs.push(makeDisc())
    }
    $('disc-status').textContent = state.discs.length + ' blades'
  }

  function damage(source) {
    if (state.phase !== 'running') return
    state.hearts--
    cue(source === 'Disc impact' ? 'blade' : 'damage')
    $('disc-caption').textContent = source + '! ♥ lost'
    updateHud()
    if (state.hearts <= 0) finish('All three hearts lost')
  }

  function updateDiscs(dt) {
    state.invulnerable = Math.max(0, state.invulnerable - dt)
    let dx = (keys.has('d') ? 1 : 0) - (keys.has('a') ? 1 : 0)
    let dy = (keys.has('s') ? 1 : 0) - (keys.has('w') ? 1 : 0)
    if (!dx && !dy && state.drag) {
      dx = state.drag.x - state.player.x
      dy = state.drag.y - state.player.y
      if (Math.hypot(dx, dy) < 7) {
        dx = 0
        dy = 0
      }
    }
    const norm = Math.hypot(dx, dy)
    if (norm) {
      state.player.x = Math.max(
        12,
        Math.min(348, state.player.x + (dx / norm) * dt * difficulty().playerSpeed),
      )
      state.player.y = Math.max(
        12,
        Math.min(348, state.player.y + (dy / norm) * dt * difficulty().playerSpeed),
      )
    }
    for (const disc of state.discs) {
      disc.x += disc.vx * dt
      disc.y += disc.vy * dt
      if (disc.x < disc.radius || disc.x > 360 - disc.radius) {
        disc.vx *= -1
        disc.x = Math.max(disc.radius, Math.min(360 - disc.radius, disc.x))
      }
      if (disc.y < disc.radius || disc.y > 360 - disc.radius) {
        disc.vy *= -1
        disc.y = Math.max(disc.radius, Math.min(360 - disc.radius, disc.y))
      }
      disc.spin += dt * 5
      if (
        state.invulnerable <= 0 &&
        Math.hypot(disc.x - state.player.x, disc.y - state.player.y) < 21
      ) {
        state.invulnerable = difficulty().invulnerability
        damage('Disc impact')
      }
    }
    state.discSeconds += dt
    if (state.discSeconds >= 1) {
      const steps = Math.floor(state.discSeconds)
      state.discSeconds -= steps
      score('disc', steps * 7)
    }
    state.nextDisc -= dt
    if (state.nextDisc <= 0 && state.discs.length < 10) {
      state.discs.push(makeDisc())
      state.nextDisc = Math.max(
        5, difficulty().newDiscSeconds - state.discs.length,
      )
      $('disc-status').textContent = state.discs.length + ' blades'
      score('disc', 90)
    }
  }

  function paintDiscs() {
    ctx.clearRect(0, 0, 360, 360)
    const bg = ctx.createLinearGradient(0, 0, 360, 360)
    bg.addColorStop(0, '#142841')
    bg.addColorStop(1, '#211126')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, 360, 360)
    ctx.strokeStyle = '#ffffff11'
    for (let i = 0; i <= 360; i += 36) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, 360)
      ctx.moveTo(0, i)
      ctx.lineTo(360, i)
      ctx.stroke()
    }
    for (const disc of state.discs) {
      ctx.save()
      ctx.translate(disc.x, disc.y)
      ctx.rotate(disc.spin)
      ctx.fillStyle = '#e96c91'
      ctx.strokeStyle = '#ffc5d4'
      ctx.lineWidth = 3
      ctx.beginPath()
      for (let i = 0; i < 24; i++) {
        const a = (Math.PI * i) / 12
        const r = i % 2 ? disc.radius - 4 : disc.radius + 3
        const px = Math.cos(a) * r
        const py = Math.sin(a) * r
        if (!i) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = '#20243c'
      ctx.beginPath()
      ctx.arc(0, 0, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
    const blinking =
      state.invulnerable > 0 && Math.floor(performance.now() / 90) % 2
    if (!blinking) {
      ctx.save()
      ctx.translate(state.player.x, state.player.y)
      ctx.shadowBlur = 20
      ctx.shadowColor = '#70ffe1'
      ctx.fillStyle = '#7bffe2'
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(0, -13)
      ctx.lineTo(11, 8)
      ctx.lineTo(0, 5)
      ctx.lineTo(-11, 8)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()
      ctx.restore()
    }
  }

  function openDialog(view) {
    for (const id of ['start', 'pause', 'end', 'scores']) {
      $(id + '-view').classList.toggle('hidden', id !== view)
    }
    $('dialog').classList.add('visible')
    $('dialog-title').textContent =
      view === 'end'
        ? 'RUN COMPLETE'
        : view === 'pause'
          ? 'PAUSED'
          : view === 'scores'
            ? 'GLOBAL LEADERBOARD'
            : 'CHESSWEEPER TRIPLE THREAT'
    $('dialog-subtitle').textContent =
      view === 'end'
        ? 'One clock. Three challenges. Your score.'
        : view === 'pause'
          ? 'Take a breather, then return to all three.'
          : view === 'scores'
            ? 'Every challenger shares the same scoreboard.'
            : 'Play chess, clear mines and dodge discs at the same time.'
    $('show-scores').classList.toggle('hidden', view === 'scores')
    $('audio-settings').classList.toggle(
      'hidden',
      view === 'scores' || view === 'end',
    )
  }

  function closeDialog() {
    $('dialog').classList.remove('visible')
  }

  function pause() {
    if (state.phase !== 'running') return
    state.phase = 'pause'
    updateAudio()
    keys.clear()
    state.drag = null
    openDialog('pause')
  }

  function resume() {
    if (state.phase !== 'pause') return
    state.phase = 'running'
    if (state.minePendingReset) resetMines()
    if (state.busy && state.chess.t === -1) cpuMove()
    lastFrame = performance.now()
    updateAudio()
    closeDialog()
  }

  function start() {
    state.duration = Number($('duration').value)
    state.difficulty = $('difficulty').value
    state.scoresDifficulty = state.difficulty
    state.ranked = state.duration === 120
    state.remaining = state.duration
    state.hearts = difficulty().hearts
    state.phase = 'running'
    state.final = 0
    state.submitted = false
    state.chessRound = 1
    state.mineLevel = 1
    state.flagMode = false
    $('flag-mode').setAttribute('aria-pressed', 'false')
    keys.clear()
    for (const key of Object.keys(points)) points[key] = 0
    document.documentElement.dataset.realm = $('theme').value
    resetChess()
    resetMines()
    resetDiscs()
    $('disc-caption').textContent = 'WASD or touch and drag'
    updateHud()
    lastFrame = performance.now()
    updateAudio()
    closeDialog()
  }

  function finish(reason) {
    if (state.phase !== 'running') return
    state.final = totalScore()
    cue(reason === 'Time!' ? 'victory' : 'defeat')
    state.phase = 'end'
    setTimeout(() => {
      if (state.phase === 'end') updateAudio()
    }, 380)
    keys.clear()
    state.drag = null
    $('run-result').textContent =
      difficulty().name + ' · ' + reason + ' · ' +
      state.final.toLocaleString('en-US') + ' points'
    $('run-breakdown').textContent =
      'Chess ' +
      points.chess +
      ' · Mines ' +
      points.mine +
      ' · Discs ' +
      points.disc +
      ' · Balance bonus ' +
      Math.floor(1.5 * Math.min(...Object.values(points)))
    $('submit-status').textContent = state.ranked
      ? ''
      : 'Practice run: only 120-second Standard scores enter global rankings.'
    $('submit').disabled = state.final <= 0 || !state.ranked
    openDialog('end')
  }

  async function showScores() {
    if (state.phase === 'running') pause()
    state.scoresReturn = state.phase
    openDialog('scores')
    $('score-difficulty').value =
      state.phase === 'start' ? $('difficulty').value : state.difficulty
    await loadScores(state.range)
  }

  async function loadScores(range) {
    state.range = range
    const bracket = $('score-difficulty').value
    state.scoresDifficulty = bracket
    $('all-time').classList.toggle('on', range === 'all')
    $('today').classList.toggle('on', range === 'today')
    $('score-error').textContent = ''
    $('score-rows').replaceChildren()
    const loading = document.createElement('li')
    loading.textContent = 'Loading global scores…'
    $('score-rows').append(loading)
    try {
      const response = await fetch(
        '/api/arcade/scores/' + leaderboardSlug(bracket) +
          '?range=' + range,
      )
      if (!response.ok) throw new Error('Scoreboard temporarily unavailable')
      const data = await response.json()
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Invalid leaderboard response')
      }
      if (state.range !== range || state.scoresDifficulty !== bracket) return
      $('score-rows').replaceChildren()
      if (!data.data.length) {
        const empty = document.createElement('li')
        empty.textContent = 'No scores yet. The crown is vacant.'
        $('score-rows').append(empty)
      }
      for (const [index, row] of data.data.entries()) {
        const item = document.createElement('li')
        const player = document.createElement('span')
        const amount = document.createElement('strong')
        player.textContent =
          index +
          1 +
          '. ' +
          row.initials +
          (row.username ? ' · ' + row.username : '')
        amount.textContent = Number(row.score).toLocaleString('en-US')
        item.append(player, amount)
        $('score-rows').append(item)
      }
    } catch {
      $('score-rows').replaceChildren()
      $('score-error').textContent =
        'Global leaderboard unavailable. Your current run is still playable.'
    }
  }

  async function submit() {
    if (
      state.phase !== 'end' ||
      state.submitted ||
      !state.ranked ||
      state.final <= 0
    )
      return
    const initials = $('initials').value.trim().toUpperCase()
    if (!/^[A-Z0-9]{3}$/.test(initials)) {
      $('submit-status').textContent = 'Enter exactly three letters or digits.'
      return
    }
    $('submit').disabled = true
    $('submit-status').textContent = 'Saving global score…'
    try {
      const headers = { 'content-type': 'application/json' }
      const sessionToken = localStorage.getItem('token')
      if (sessionToken && sessionToken.split('.').length === 3) {
        headers.authorization = 'Bearer ' + sessionToken
      }
      const response = await fetch('/api/arcade/scores', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          game: leaderboardSlug(state.difficulty),
          initials,
          score: state.final,
          level: Math.min(9999, state.chessRound + state.mineLevel - 1),
        }),
      })
      const body = await response.json()
      if (!response.ok || !body.success) {
        throw new Error(body.message || 'Score save failed')
      }
      state.submitted = true
      $('submit-status').textContent =
        'Global score saved! Rank #' + body.data.rank + '.'
      $('submit').textContent = '✓ SCORE SAVED'
    } catch (error) {
      $('submit-status').textContent =
        error instanceof Error ? error.message : 'Could not save your score.'
      $('submit').disabled = false
    }
  }

  function frame(now) {
    const raw = Math.max(0, (now - lastFrame) / 1000)
    lastFrame = now
    if (state.phase === 'running') {
      state.remaining = Math.max(0, state.remaining - raw)
      if (state.remaining <= 0) finish('Time!')
      else updateDiscs(Math.min(0.05, raw))
      updateHud()
    }
    paintDiscs()
    requestAnimationFrame(frame)
  }

  canvas.addEventListener('pointerdown', (event) => {
    if (state.phase !== 'running') return
    canvas.setPointerCapture(event.pointerId)
    const rect = canvas.getBoundingClientRect()
    state.drag = {
      x: Math.max(
        0,
        Math.min(360, ((event.clientX - rect.left) * 360) / rect.width),
      ),
      y: Math.max(
        0,
        Math.min(360, ((event.clientY - rect.top) * 360) / rect.height),
      ),
    }
  })
  canvas.addEventListener('pointermove', (event) => {
    if (!state.drag || state.phase !== 'running') return
    const rect = canvas.getBoundingClientRect()
    state.drag.x = Math.max(
      0,
      Math.min(360, ((event.clientX - rect.left) * 360) / rect.width),
    )
    state.drag.y = Math.max(
      0,
      Math.min(360, ((event.clientY - rect.top) * 360) / rect.height),
    )
  })
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    canvas.addEventListener(event, () => {
      state.drag = null
    })
  }
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (state.phase === 'running') pause()
      else if (
        state.phase === 'pause' &&
        !$('scores-view').classList.contains('hidden')
      ) {
        openDialog('pause')
      } else if (state.phase === 'pause') resume()
      return
    }
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLSelectElement
    )
      return
    const key = event.key.toLowerCase()
    if (['w', 'a', 's', 'd'].includes(key) && state.phase === 'running') {
      event.preventDefault()
      keys.add(key)
    }
  })
  window.addEventListener('keyup', (event) => {
    keys.delete(event.key.toLowerCase())
  })
  window.addEventListener('blur', () => {
    keys.clear()
    state.drag = null
  })
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.phase === 'running') pause()
  })
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return
    if (event.data?.type !== 'chessweeper:open') return
    if (state.phase === 'running') pause()
    else
      openDialog(
        state.phase === 'end'
          ? 'end'
          : state.phase === 'pause'
            ? 'pause'
            : 'start',
      )
  })
  for (const id of ['music-setting', 'fx-setting']) {
    $(id).addEventListener('change', saveAudio)
  }
  $('flag-mode').addEventListener('click', () => {
    state.flagMode = !state.flagMode
    $('flag-mode').setAttribute('aria-pressed', String(state.flagMode))
  })
  $('start').addEventListener('click', start)
  $('again').addEventListener('click', () => {
    state.phase = 'start'
    $('submit').textContent = '🏆 SUBMIT GLOBAL SCORE'
    openDialog('start')
  })
  $('restart').addEventListener('click', () => {
    state.phase = 'start'
    openDialog('start')
  })
  $('pause').addEventListener('click', () => {
    if (state.phase === 'running') pause()
    else if (state.phase === 'pause') resume()
    else openDialog(state.phase === 'end' ? 'end' : 'start')
  })
  $('resume').addEventListener('click', resume)
  $('rankings').addEventListener('click', showScores)
  $('show-scores').addEventListener('click', showScores)
  $('all-time').addEventListener('click', () => loadScores('all'))
  $('today').addEventListener('click', () => loadScores('today'))
  $('score-difficulty').addEventListener('change', () =>
    loadScores(state.range),
  )
  $('difficulty').addEventListener('change', () => {
    const selected = DIFFICULTIES[$('difficulty').value]
    $('difficulty-hint').textContent =
      selected.name + ': ' + selected.hearts + ' hearts · ' +
      selected.mines + ' mines · ' + selected.startingDiscs +
      ' starting blades · ' +
      (selected.cpuChoices === 1 ? 'relentless CPU' :
        selected.cpuChoices >= 7 ? 'forgiving CPU' :
          selected.cpuChoices >= 3 ? 'balanced CPU' : 'aggressive CPU')
  })
  $('close-scores').addEventListener('click', () => {
    openDialog(
      state.scoresReturn === 'end'
        ? 'end'
        : state.scoresReturn === 'start'
          ? 'start'
          : 'pause',
    )
  })
  $('submit').addEventListener('click', submit)
  state.mines = new Set()
  resetChess()
  resetMines()
  resetDiscs()
  updateHud()
  updateAudio()
  requestAnimationFrame(frame)

  window.__chessweeperTriple = Object.freeze({
    snapshot: () => ({
      phase: state.phase,
      remaining: state.remaining,
      ranked: state.ranked,
      difficulty: state.difficulty,
      hearts: state.hearts,
      maxHearts: difficulty().hearts,
      mineCount: state.mines.size,
      discCount: state.discs.length,
      discSpeed: difficulty().discSpeed,
      cpuChoices: difficulty().cpuChoices,
      chess: points.chess,
      mines: points.mine,
      discs: points.disc,
      score: totalScore(),
      selected: state.selected,
      chessMoves: state.moves,
      mineOpened: state.opened.size,
      discX: state.player.x,
      discY: state.player.y,
      final: state.final,
      submitted: state.submitted,
    }),
  })
})()
