/**
 * Where a touch cabinet puts its on-screen controls so none of them sits on the stage
 * (ArcadeGameMeta.touchClearStage). The cabinet measures the area it may use; this picks
 * the arrangement that leaves the largest stage: side rails beside it (a landscape phone,
 * where the stage already has gutters left and right) or a band under it (a tablet or an
 * upright phone, where the gutters are above and below). Every box is in the same CSS px
 * coordinates as the area it was given.
 */

export type TouchBox = {
  left: number
  top: number
  width: number
  height: number
}

export type TouchStageRequest = {
  /** The area the cabinet may use (inside the safe-area insets). */
  area: TouchBox
  /** The stage's width over its height. */
  aspect: number
  /** Seated players, 1 to 4: each gets a d-pad and buttons. */
  seats: number
  /** A solo player gets four face buttons (A, B, X, Y) rather than two. */
  fourButtons: boolean
  /**
   * The solo face buttons carry the game's names (ArcadeGameMeta.buttonLabels), so they are drawn
   * larger: 1.45 keys, and A at 1.7 keys (the cabinet's .cabinet-buttons--labelled rules).
   */
  labelled?: boolean
  /**
   * The smallest share of the full stage's area a solo player may give up for clear controls
   * (ArcadeGameMeta.touchClearMinShare). Set, an upright stage may also narrow: a tall stage on an
   * upright tablet fills the height, so clear controls must come out of its width. Unset: 0.8, and
   * an upright stage keeps its full width.
   */
  minShare?: number
  /** Round chips beside the controls: leave (and fullscreen, where the browser can). */
  cornerChips: number
}

export type TouchCluster = {
  dpad: TouchBox
  buttons: TouchBox
  tag: TouchBox | null
}

export type TouchStagePlan = {
  kind: 'rails' | 'band'
  /** One d-pad key, and one face button, in CSS px. */
  key: number
  ball: number
  /** Room kept free of the stage on each side of the area. */
  reserve: { top: number; right: number; bottom: number; left: number }
  /** How the stage sits in what the reserve leaves: at its top, or centred. */
  align: 'start' | 'center'
  stage: TouchBox
  clusters: TouchCluster[]
  cornerChips: TouchBox
  pauseChip: TouchBox
  /** Room under an upright stage for a prompt to turn the device sideways. */
  hint: TouchBox | null
  /**
   * The rest of that room, above the prompt: an upright phone's large-type status readout
   * (ArcadeGameInstance.readout), so the run's numbers are legible where the canvas HUD is not.
   */
  readout: TouchBox | null
}

const MARGIN = 8
const PAD_GAP = 12
const TAG = 14
const CHIP = 41.6
const CHIP_GAP = 8
const HINT = 28
/** The shortest readout worth showing: two rows of large type. */
const READOUT_MIN = 56
const REM = 16
/** Smaller keys are tried when they buy a larger stage, never below this share of the usual key. */
const KEY_STEPS = [1, 0.9, 0.8]
const MIN_KEY = 24
/** One pilot keeps the floating controls when moving them off the stage would cost more than this. */
const SOLO_MIN_SHARE = 0.8

const clamp = (low: number, value: number, high: number) =>
  Math.max(low, Math.min(high, value))

/** The cabinet's usual key for this many seats (its CSS --key at that viewport). */
export function defaultTouchKey(seats: number, viewportMin: number) {
  if (seats >= 3) return clamp(2.1 * REM, 0.06 * viewportMin, 3.4 * REM)
  if (seats === 2) return clamp(2.4 * REM, 0.07 * viewportMin, 4 * REM)
  return clamp(2.9 * REM, 0.085 * viewportMin, 4.75 * REM)
}

type Parts = {
  key: number
  ball: number
  pad: number
  buttons: { width: number; height: number }
  tag: number
}

function parts(
  key: number,
  seats: number,
  fourButtons: boolean,
  labelled = false,
): Parts {
  if (seats > 1) {
    // Co-op seats keep the four-button kit (gameplay critic r2 G2): X and Y sit above B and A.
    const ball = key * 1.15
    const rows = fourButtons ? 2 : 1
    return {
      key,
      ball,
      pad: key * 3,
      buttons: {
        width: ball * 2 + 0.5 * REM,
        height: ball * rows + key * 0.35 + (rows - 1) * 0.6 * REM,
      },
      tag: TAG,
    }
  }
  if (fourButtons && labelled) {
    // Two auto-sized grid columns and rows: X over B, then Y over the larger A.
    const ball = key * 1.45
    const big = key * 1.7
    return {
      key,
      ball,
      pad: key * 3,
      buttons: {
        width: ball + big + 0.9 * REM,
        height: ball + big + 0.6 * REM,
      },
      tag: 0,
    }
  }
  if (fourButtons) {
    const ball = key * 1.1
    return {
      key,
      ball,
      pad: key * 3,
      buttons: {
        width: ball * 2 + 0.9 * REM,
        height: ball * 2 + 0.6 * REM,
      },
      tag: 0,
    }
  }
  const ball = key * 1.3
  return {
    key,
    ball,
    pad: key * 3,
    buttons: { width: ball * 2 + 0.9 * REM, height: ball + key * 0.45 },
    tag: 0,
  }
}

function fitStage(
  area: TouchBox,
  reserve: TouchStagePlan['reserve'],
  aspect: number,
  align: 'start' | 'center',
): TouchBox | null {
  const width = area.width - reserve.left - reserve.right
  const height = area.height - reserve.top - reserve.bottom
  if (width <= 0 || height <= 0) return null
  const stageWidth = Math.floor(Math.min(width, height * aspect))
  const stageHeight = stageWidth / aspect
  return {
    left: area.left + reserve.left + (width - stageWidth) / 2,
    top:
      area.top +
      reserve.top +
      (align === 'center' ? (height - stageHeight) / 2 : 0),
    width: stageWidth,
    height: stageHeight,
  }
}

const cornerWidth = (chips: number) =>
  Math.max(1, chips) * CHIP + Math.max(0, chips - 1) * CHIP_GAP

/** Seats 1 and 3 on the left rail, 2 and 4 on the right; player 1 and 2 at the bottom. */
function rails(request: TouchStageRequest, p: Parts): TouchStagePlan | null {
  const { area, seats } = request
  const solo = seats === 1
  const corner = cornerWidth(request.cornerChips)
  const rail = Math.max(p.pad, p.buttons.width, corner) + MARGIN * 2
  const block = solo
    ? Math.max(p.pad, p.buttons.height)
    : p.tag + p.buttons.height + PAD_GAP + p.pad
  const rows = solo ? 1 : Math.ceil(seats / 2)
  const needed = MARGIN + CHIP + MARGIN + rows * (block + MARGIN)
  if (needed > area.height || rail * 2 >= area.width) return null
  const reserve = { top: 0, right: rail, bottom: 0, left: rail }
  const stage = fitStage(area, reserve, request.aspect, 'center')
  if (!stage) return null
  const bottom = area.top + area.height
  const right = area.left + area.width
  const railLeft = (side: number) => (side === 0 ? area.left : right - rail)
  const centred = (side: number, width: number) =>
    railLeft(side) + (rail - width) / 2
  const clusters: TouchCluster[] = []
  if (solo) {
    clusters.push({
      dpad: {
        left: centred(0, p.pad),
        top: bottom - MARGIN - p.pad,
        width: p.pad,
        height: p.pad,
      },
      buttons: {
        left: centred(1, p.buttons.width),
        top: bottom - MARGIN - p.buttons.height,
        ...p.buttons,
      },
      tag: null,
    })
  } else {
    for (let seat = 0; seat < seats; seat++) {
      const side = seat % 2
      const row = Math.floor(seat / 2)
      const blockBottom = bottom - MARGIN - row * (block + MARGIN)
      const padTop = blockBottom - p.pad
      const buttonsTop = padTop - PAD_GAP - p.buttons.height
      clusters.push({
        dpad: {
          left: centred(side, p.pad),
          top: padTop,
          width: p.pad,
          height: p.pad,
        },
        buttons: {
          left: centred(side, p.buttons.width),
          top: buttonsTop,
          ...p.buttons,
        },
        tag: {
          left: centred(side, p.pad),
          top: buttonsTop - p.tag,
          width: p.pad,
          height: p.tag,
        },
      })
    }
  }
  return {
    kind: 'rails',
    key: p.key,
    ball: p.ball,
    reserve,
    align: 'center',
    stage,
    clusters,
    cornerChips: {
      left: area.left + MARGIN,
      top: area.top + MARGIN,
      width: corner,
      height: CHIP,
    },
    pauseChip: {
      left: right - MARGIN - CHIP,
      top: area.top + MARGIN,
      width: CHIP,
      height: CHIP,
    },
    hint: null,
    readout: null,
  }
}

/**
 * Every player's controls in a band under the stage, `columns` players to a row (player 1 bottom
 * left). Sideways, the chips sit in the band between the players when there is room; otherwise,
 * and always upright, they get their own row just under the stage.
 */
function band(
  request: TouchStageRequest,
  p: Parts,
  columns: number,
): TouchStagePlan | null {
  const { area, seats } = request
  const solo = seats === 1
  const upright = area.height > area.width
  const corner = cornerWidth(request.cornerChips)
  const chipsWidth = corner + MARGIN * 2 + CHIP
  const clusterWidth = solo
    ? p.pad + MARGIN + p.buttons.width
    : p.pad + PAD_GAP + p.buttons.width
  const clusterHeight = solo
    ? Math.max(p.pad, p.buttons.height)
    : p.tag + Math.max(p.pad, p.buttons.height)
  const rows = Math.ceil(seats / columns)
  const packed = columns * clusterWidth + (columns + 1) * MARGIN
  if (packed > area.width) return null
  const chipsInBand = !upright && area.width - packed >= chipsWidth + MARGIN
  const bandHeight = rows * clusterHeight + (rows + 1) * MARGIN
  const chipRow = chipsInBand ? 0 : CHIP + MARGIN * 2
  const reserve = {
    top: 0,
    right: 0,
    bottom: bandHeight + chipRow,
    left: 0,
  }
  const stage = fitStage(area, reserve, request.aspect, 'start')
  if (!stage) return null
  const bottom = area.top + area.height
  const right = area.left + area.width
  const split = Math.ceil(columns / 2)
  const middle = chipsInBand && columns > 1 ? chipsWidth : 0
  const slot = (area.width - middle - (columns + 1) * MARGIN) / columns
  const slotLeft = (column: number) =>
    area.left +
    MARGIN +
    column * (slot + MARGIN) +
    (column >= split ? middle : 0)
  const clusters: TouchCluster[] = []
  for (let seat = 0; seat < seats; seat++) {
    const column = seat % columns
    const row = Math.floor(seat / columns)
    const rowBottom = bottom - MARGIN - row * (clusterHeight + MARGIN)
    const left = slotLeft(column)
    const dpad = {
      left,
      top: rowBottom - p.pad,
      width: p.pad,
      height: p.pad,
    }
    clusters.push({
      dpad,
      buttons: {
        left: left + slot - p.buttons.width,
        top: rowBottom - p.buttons.height,
        ...p.buttons,
      },
      tag: solo
        ? null
        : { left, top: dpad.top - p.tag, width: p.pad, height: p.tag },
    })
  }
  const bandTop = bottom - bandHeight
  const chipsTop = chipsInBand
    ? bandTop + (bandHeight - CHIP) / 2
    : stage.top + stage.height + MARGIN
  const gapLeft =
    columns > 1 ? slotLeft(split - 1) + slot : clusters[0]!.dpad.left + p.pad
  const gapRight = columns > 1 ? slotLeft(split) : clusters[0]!.buttons.left
  const chipsLeft = chipsInBand
    ? (gapLeft + gapRight - chipsWidth) / 2 + MARGIN
    : area.left + MARGIN
  const hintTop = chipsTop + CHIP + MARGIN
  const hintRoom = bandTop - MARGIN - hintTop
  const showHint = upright && request.aspect > 1 && hintRoom >= HINT
  // Upright with room to spare, the readout takes the gap's top and the prompt keeps its bottom.
  const readoutHeight = showHint ? hintRoom - HINT - MARGIN : 0
  const readout =
    readoutHeight >= READOUT_MIN
      ? {
          left: area.left + MARGIN,
          top: hintTop,
          width: area.width - MARGIN * 2,
          height: readoutHeight,
        }
      : null
  return {
    kind: 'band',
    key: p.key,
    ball: p.ball,
    reserve,
    align: 'start',
    stage,
    clusters,
    cornerChips: {
      left: chipsLeft,
      top: chipsTop,
      width: corner,
      height: CHIP,
    },
    pauseChip: {
      left: chipsInBand ? chipsLeft + corner + MARGIN : right - MARGIN - CHIP,
      top: chipsTop,
      width: CHIP,
      height: CHIP,
    },
    hint: showHint
      ? {
          left: area.left + MARGIN,
          top: readout
            ? readout.top + readout.height + MARGIN
            : hintTop + (hintRoom - HINT) / 2,
          width: area.width - MARGIN * 2,
          height: HINT,
        }
      : null,
    readout,
  }
}

/**
 * The arrangement that leaves the largest stage, trading a smaller key only for a larger stage
 * (area times the key's share of its usual size). Upright, the stage keeps the full width: the
 * controls only ever take the height under it. Null when nothing fits, or when one pilot would
 * lose more than a fifth of the stage: then the controls float over it as before.
 */
export function planTouchStage(
  request: TouchStageRequest,
  viewportMin: number,
): TouchStagePlan | null {
  const seats = Math.max(1, Math.min(4, Math.round(request.seats)))
  const { area, aspect } = request
  if (area.width <= 0 || area.height <= 0 || aspect <= 0) return null
  const usual = defaultTouchKey(seats, viewportMin)
  const whole = Math.min(area.width, area.height * aspect)
  const upright = area.height > area.width
  let best: { plan: TouchStagePlan; score: number } | null = null
  for (const step of KEY_STEPS) {
    const key = usual * step
    if (key < MIN_KEY) break
    const p = parts(key, seats, request.fourButtons, request.labelled)
    const candidates = [rails({ ...request, seats }, p)]
    for (let columns = 1; columns <= seats; columns++)
      candidates.push(band({ ...request, seats }, p, columns))
    for (const plan of candidates) {
      if (
        !plan ||
        (upright &&
          request.minShare === undefined &&
          plan.stage.width < Math.floor(whole))
      )
        continue
      const score = plan.stage.width * plan.stage.height * step
      if (!best || score > best.score + 0.5) best = { plan, score }
    }
  }
  if (!best) return null
  if (
    seats === 1 &&
    best.plan.stage.width * best.plan.stage.height <
      (request.minShare ?? SOLO_MIN_SHARE) * whole * (whole / aspect)
  )
    return null
  return best.plan
}
