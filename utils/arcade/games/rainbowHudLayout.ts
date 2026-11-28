/**
 * Where Rainbow's on-canvas words go, as pure layout (presentation critic round 2): the HUD bar's title,
 * counters, button legend and pilot status never touch (R2-01); only one centred headline banner shows at a
 * time, the rest wait their turn (R2-02); and each ship's seat tag and super caption sit where no other ship
 * or tag is, or not at all (R2-04). Everything is in game px on the 480x270 stage.
 */

export type RainbowRect = {
  left: number
  top: number
  right: number
  bottom: number
}

/** True when `a` and `b` come within `gap` px of each other. */
export function rainbowRectsTouch(
  a: RainbowRect,
  b: RainbowRect,
  gap = 0,
): boolean {
  return (
    a.left < b.right + gap &&
    b.left < a.right + gap &&
    a.top < b.bottom + gap &&
    b.top < a.bottom + gap
  )
}

/** A text's advance width in game px for a canvas font (the engine passes the canvas's own measureText). */
export type RainbowMeasure = (text: string, font: string) => number

const STAGE_WIDTH = 480
const STAGE_HEIGHT = 270

/** The HUD bar: text clears the cabinet's corner chips (close/fullscreen left, pause right). */
export const RAINBOW_HUD = {
  left: 44,
  right: STAGE_WIDTH - 26,
  /** The width of one pilot-status column. */
  column: 140,
  /** The least room between two words on one HUD row. */
  gap: 8,
  titleFont: 'bold 10px monospace',
  font: '9px monospace',
  rows: [12, 24] as const,
} as const

/**
 * The Act I button legend, longest first: the bar shows the longest that clears every pilot's status on its
 * row, and none when even the shortest would touch one (a full crew needs the room).
 */
export const RAINBOW_HUD_LEGENDS = [
  'A FIRE · B HOLD FOCUS/TAP SUPER · X SPECIAL · Y EVADE',
  'A FIRE · B FOCUS/SUPER · X SPECIAL · Y EVADE',
  'A FIRE · B SUPER · X SPECIAL · Y EVADE',
] as const

/**
 * Where a seat's status sits inside the 29 px HUD bar: a solo pilot under the counters on the right; with
 * more pilots, seats 1-2 fill the right column (rows 12 and 24) and seats 3-4 the column beside it.
 */
export function rainbowHudStatusSlot(
  seat: number,
  players: number,
): { column: number; y: number } {
  if (players <= 1) return { column: 0, y: 24 }
  return { column: Math.floor(seat / 2), y: seat % 2 === 0 ? 12 : 24 }
}

export type RainbowHudText = {
  role: 'title' | 'counters' | 'legend' | 'status'
  /** The seat, for a status. */
  seat?: number
  text: string
  font: string
  /** The anchor: the left edge for left-aligned text, the right edge for right-aligned. */
  x: number
  y: number
  align: 'left' | 'right'
  rect: RainbowRect
}

function placed(
  role: RainbowHudText['role'],
  text: string,
  font: string,
  x: number,
  y: number,
  align: 'left' | 'right',
  measure: RainbowMeasure,
  seat?: number,
): RainbowHudText {
  const width = measure(text, font)
  const left = align === 'left' ? x : x - width
  return {
    role,
    ...(seat === undefined ? {} : { seat }),
    text,
    font,
    x,
    y,
    align,
    rect: { left, top: y - 9, right: left + width, bottom: y + 3 },
  }
}

/**
 * The HUD bar's words for this frame. Each pilot's status keeps its slot; the counters (one or two pilots),
 * the Act title and the Act I legend take the longest form of theirs that clears everything already on
 * their row by RAINBOW_HUD.gap, or drop out (presentation critic R2-01: "Y EVADEPETAL").
 */
export function rainbowHudBarLayout(input: {
  players: number
  /** 'ACT I / PINKWAKE'. */
  title: string
  /** Shoals cleared and novas fired, shown with one or two pilots. */
  shoals: number
  novas: number
  /** Each seat's status line, ship name first. */
  statuses: readonly string[]
  /** Show the button legend (Act I). */
  legend: boolean
  measure: RainbowMeasure
}): RainbowHudText[] {
  const { players, measure } = input
  const out: RainbowHudText[] = []
  for (let seat = 0; seat < players; seat++) {
    const slot = rainbowHudStatusSlot(seat, players)
    // The second column starts at its slot, or further left when a wide status in the first column needs it.
    const inner = out.find((other) => other.y === slot.y)
    out.push(
      placed(
        'status',
        input.statuses[seat] ?? '',
        RAINBOW_HUD.font,
        Math.min(
          RAINBOW_HUD.right - slot.column * RAINBOW_HUD.column,
          slot.column && inner
            ? inner.rect.left - RAINBOW_HUD.gap
            : RAINBOW_HUD.right,
        ),
        slot.y,
        'right',
        measure,
        seat,
      ),
    )
  }
  const clear = (candidate: RainbowHudText) =>
    candidate.rect.left >= RAINBOW_HUD.left &&
    candidate.rect.right <= RAINBOW_HUD.right &&
    out.every(
      (other) =>
        other.y !== candidate.y ||
        !rainbowRectsTouch(other.rect, candidate.rect, RAINBOW_HUD.gap),
    )
  const first = (candidates: RainbowHudText[]) => {
    const fit = candidates.find(clear)
    if (fit) out.push(fit)
  }
  if (players <= 2) {
    // Beside the lead pilot's status with two pilots, however wide that status measures.
    const right =
      players === 1
        ? RAINBOW_HUD.right
        : Math.min(
            RAINBOW_HUD.right - RAINBOW_HUD.column,
            out[0]!.rect.left - RAINBOW_HUD.gap,
          )
    first(
      [
        `SHOALS ${input.shoals}  ·  NOVAS ${input.novas}`,
        `SHOALS ${input.shoals} · NOVAS ${input.novas}`,
      ].map((text) =>
        placed('counters', text, RAINBOW_HUD.font, right, 12, 'right', measure),
      ),
    )
  }
  const [where, name] = input.title.split(' / ')
  first(
    [
      input.title,
      ...(name ? [`${where!.replace(/^ACT /, '')} / ${name}`, where!] : []),
    ].map((text) =>
      placed(
        'title',
        text,
        RAINBOW_HUD.titleFont,
        RAINBOW_HUD.left,
        12,
        'left',
        measure,
      ),
    ),
  )
  if (input.legend)
    first(
      RAINBOW_HUD_LEGENDS.map((text) =>
        placed(
          'legend',
          text,
          RAINBOW_HUD.font,
          RAINBOW_HUD.left,
          24,
          'left',
          measure,
        ),
      ),
    )
  return out
}

/** A floating word on the stage; a headline is a centred segment banner (an Act medal, a route, a detour). */
export type RainbowPopup = {
  x: number
  y: number
  text: string
  age: number
  headline?: boolean
}

/**
 * Age every popup a frame and drop the spent ones. Headlines queue (presentation critic R2-02: "ACT V · GOLD
 * MEDAL" over "TURN ON THE EMPIRE"): only the oldest waiting headline ages and shows; the next starts when it
 * is gone, so two never draw at once and each gets its full time.
 */
export function stepRainbowPopups(popups: RainbowPopup[], life: number): void {
  let headlineShowing = false
  for (let i = 0; i < popups.length;) {
    const popup = popups[i]!
    if (popup.headline) {
      if (headlineShowing) {
        i++
        continue
      }
      headlineShowing = true
    }
    if (++popup.age > life) popups.splice(i, 1)
    else i++
  }
}

/** The popups to draw this frame: every local one and the single headline whose turn it is. */
export function rainbowShownPopups<T extends RainbowPopup>(
  popups: readonly T[],
): T[] {
  let headlineShown = false
  return popups.filter((popup) => {
    if (!popup.headline) return true
    if (headlineShown) return false
    headlineShown = true
    return true
  })
}

/** A ship's painted hull around its core, in game px (the sprites are about 34x24). */
export const RAINBOW_SHIP_HULL: RainbowRect = {
  left: -17,
  top: -12,
  right: 18,
  bottom: 12,
}
export const RAINBOW_SUPER_CAPTION = 'SUPER READY · TAP B'
/** The caption's size in 'bold 7px monospace': 19 cells of about 4.2 px, 7 px tall. */
export const RAINBOW_SUPER_CAPTION_SIZE = { width: 82, height: 8 } as const
/** The seat number's tag: a small disc behind the tail by default. */
export const RAINBOW_SEAT_TAG_RADIUS = 5
const TAG_SPOTS = [
  [-24, 0],
  [-24, -13],
  [-24, 13],
  [0, -19],
  [0, 19],
] as const
const CAPTION_SPOTS = [22, -22] as const

export type RainbowShipLabel = {
  seat: number
  /** The seat tag's centre, or null when every spot would land on another ship or tag. */
  tag: { x: number; y: number } | null
  /** The super caption's centre, or null (a crew of three or four, not ready, or no clear spot). */
  caption: { x: number; y: number } | null
}

const around = (x: number, y: number, box: RainbowRect): RainbowRect => ({
  left: x + box.left,
  top: y + box.top,
  right: x + box.right,
  bottom: y + box.bottom,
})

/**
 * Seat tags and super captions for the ships in flight (presentation critic R2-04). Each tag takes the first of
 * its spots (behind the tail, then above or below it, then over or under the hull) that touches no other ship's
 * hull and no tag already placed. Only a crew of one or two spells out SUPER READY, and only where the caption
 * touches no hull and no tag; a bigger crew reads it from the filled tag and its HUD status.
 */
export function rainbowShipLabels(
  ships: ReadonlyArray<{
    x: number
    y: number
    alive: boolean
    ready: boolean
  }>,
  players: number,
): RainbowShipLabel[] {
  const hulls = ships.map((ship) =>
    ship.alive ? around(ship.x, ship.y, RAINBOW_SHIP_HULL) : null,
  )
  const taken: RainbowRect[] = []
  const onStage = (box: RainbowRect) =>
    box.left >= 0 &&
    box.right <= STAGE_WIDTH &&
    box.top >= 0 &&
    box.bottom <= STAGE_HEIGHT
  const free = (box: RainbowRect, own: number, ownHull: boolean) =>
    onStage(box) &&
    hulls.every(
      (hull, seat) =>
        !hull || (seat === own && !ownHull) || !rainbowRectsTouch(hull, box, 1),
    ) &&
    taken.every((other) => !rainbowRectsTouch(other, box, 1))
  const labels: RainbowShipLabel[] = ships.map((ship, seat) => {
    if (!ship.alive) return { seat, tag: null, caption: null }
    const r = RAINBOW_SEAT_TAG_RADIUS
    for (const [dx, dy] of TAG_SPOTS) {
      const box = around(ship.x + dx, ship.y + dy, {
        left: -r,
        top: -r,
        right: r,
        bottom: r,
      })
      if (free(box, seat, false)) {
        taken.push(box)
        return { seat, tag: { x: ship.x + dx, y: ship.y + dy }, caption: null }
      }
    }
    return { seat, tag: null, caption: null }
  })
  if (players > 2) return labels
  const { width, height } = RAINBOW_SUPER_CAPTION_SIZE
  for (const [seat, ship] of ships.entries()) {
    if (!ship.alive || !ship.ready) continue
    for (const dy of CAPTION_SPOTS) {
      const box = around(ship.x, ship.y + dy, {
        left: -width / 2,
        top: -height / 2,
        right: width / 2,
        bottom: height / 2,
      })
      if (free(box, seat, true)) {
        taken.push(box)
        labels[seat]!.caption = { x: ship.x, y: ship.y + dy }
        break
      }
    }
  }
  return labels
}
