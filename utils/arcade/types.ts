// /utils/arcade/types.ts
//
// Shared contracts for the Kind Robots Arcade (conductor project kr-arcade).
// A game is metadata (which the server and the hall can read without touching
// a canvas) plus a lazily imported module that creates playable instances.

import type { ArcadeSound, MusicLoop } from './sound'

/** Every cabinet has these; games build frames from them. */
export type CoreButton = 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'start'

/** Extra face buttons, read only by a game that sets `fourButtons`. */
export type ExtraButton = 'x' | 'y'

export type ArcadeButton = CoreButton | ExtraButton

/** Buttons held or pressed in one frame: X and Y may be absent (read as up). */
export type ButtonState = Record<CoreButton, boolean> &
  Partial<Record<ExtraButton, boolean>>

export const ARCADE_BUTTONS: ArcadeButton[] = [
  'up',
  'down',
  'left',
  'right',
  'a',
  'b',
  'x',
  'y',
  'start',
]

/** One fixed tick of input: what is held, and what went down this tick. */
export type InputFrame = {
  held: ButtonState
  pressed: ButtonState
  /**
   * A plunger pulled back this far (0..1) by a finger on a touch screen, for
   * a game that has one (Kind Pinball's touch layout); absent otherwise.
   */
  plunger?: number
  /** Finger target across a paddle cabinet's playfield, from left (0) to right (1). */
  touchPaddleX?: number
  /**
   * Where a twin-stick game's second stick points, each axis -1..1 and at most length 1: the
   * gamepad's right stick, the on-screen aim stick, or the arrows of a split keyboard. Only a
   * cabinet whose game sets `twinStick` ever fills it, and only while something aims.
   */
  aim?: AimVector
}

/** A twin-stick aim (utils/arcade/input.ts). */
export type AimVector = { x: number; y: number }

/**
 * How a cabinet draws. Every classic cabinet is 'canvas2d' (the default): it
 * draws into the cabinet's 2D canvas. A 'webgl' game (Kind Pinball's 3D table,
 * conductor kind-pinball/t-004) renders into a separate stage canvas stacked
 * under it, while the cabinet keeps drawing its attract, pause and initials
 * screens on the 2D canvas above.
 */
export type ArcadeRenderMode = 'canvas2d' | 'webgl'

/** One rung of a cabinet's mastery ladder (utils/arcade/mastery.ts). */
export type ArcadeMasteryGoal = {
  id: string
  /** What the game shows when it is earned. */
  title: string
  /** What the attract page says to do. */
  hint: string
  /** Shown as question marks until earned, so the guide keeps it hidden. */
  secret?: boolean
  /**
   * Steps earned one at a time, across games; the goal is earned when all
   * are (the page shows how many so far).
   */
  parts?: readonly string[]
}

export type ArcadeHallShelf = 'showcase' | 'growing'

export type ArcadeGameMeta = {
  slug: string
  title: string
  /** The classic this one riffs on (mechanics only). */
  riffsOn: string
  blurb: string
  /** Short how-to-play lines, drawn in the pixel font on the attract loop. */
  howTo: string[]
  /** Logical playfield size; the cabinet scales it to fit. */
  width: number
  height: number
  /** Server-side plausibility ceiling for a submitted score. */
  maxPlausibleScore: number
  titleArt: string
  /**
   * A scored game with a page of its own (LINKED_GAMES): the hall's tile and
   * hall-of-fame card link here instead of to a cabinet.
   */
  route?: string
  /** Accent colour for the cabinet glow and the marquee title. */
  accent: string
  /**
   * Where the hall shelves this cabinet: 'showcase' cabinets have finished
   * their whole campaign and lead the hall for first-time visitors; 'growing'
   * ones are playable while their roadmap adds stages, and carry a stamp.
   */
  shelf?: ArcadeHallShelf
  /** One line describing the controls on the cabinet's control panel. */
  controls: string
  /** Omitted for the classic Canvas 2D cabinets. */
  renderMode?: ArcadeRenderMode
  /**
   * The cabinet to play instead on a device that cannot draw this one (the
   * Canvas 2D Kind Pinball where WebGL is missing); same slug, same board.
   */
  fallback?: ArcadeGameMeta
  /** Same-device players the cabinet can seat (default 1). */
  maxPlayers?: number
  /** The cabinet's mastery ladder, shown on its how-to-play page. */
  mastery?: readonly ArcadeMasteryGoal[]
  /**
   * The game's own touch layout in place of the d-pad and buttons while it
   * plays ('pinball': flippers and plunger; 'paddle': drag across the playfield).
   */
  touchLayout?: 'pinball' | 'paddle'
  /**
   * While it plays on a touch screen, the cabinet keeps every on-screen control off the stage: rails
   * beside it or a band under it, and a smaller stage where it must (utils/arcade/touchStage.ts).
   */
  touchClearStage?: boolean
  /**
   * With touchClearStage: the smallest share of its full area the stage may shrink to so the controls
   * stay clear, upright screens included (utils/arcade/touchStage.ts; 0.8, never narrowing upright,
   * when unset). For tall stages whose HUD and launcher sit where floating controls would land.
   */
  touchClearMinShare?: number
  /**
   * On a short or narrow screen the cabinet folds its settings switches into one Settings pop-over,
   * so its title screen keeps the height (contained cabinets only).
   */
  compactSettings?: boolean
  /**
   * The game honours calm motion (ArcadeGameOptions.stillCamera: no flashes, slower scenery), so the cabinet
   * shows its motion switch; a pinball table's still camera shows its own.
   */
  calmMotion?: boolean
  /** The game draws high-contrast hostile shots on request (ArcadeGameOptions.highContrast): the cabinet shows the switch. */
  highContrast?: boolean
  /** The game has crew comms the player can quiet (ArcadeGameOptions.comms): the cabinet shows the switch. */
  comms?: boolean
  /** Players may give each face button a key of their own (utils/arcade/input applyKeyRemap): the cabinet shows the Keys panel. */
  remap?: boolean
  /**
   * The game offers difficulty levels: their names, easiest first (easy, normal, hard). The cabinet
   * shows a switch for them and passes the choice as ArcadeGameOptions.difficulty.
   */
  difficulty?: readonly [easy: string, normal: string, hard: string]
  /**
   * The game never reads Start while it plays, so the cabinet treats any seat's Start (Enter or a
   * gamepad's Start) as Pause. Without it, pausing mid-game takes P, Escape or the pause button.
   */
  startPauses?: boolean
  /**
   * The game reads InputFrame.aim (twin-stick): while it plays the cabinet aims with the right
   * stick, an on-screen aim stick, or the arrows (moving on WASD). Solo cabinets only.
   */
  twinStick?: boolean
  /**
   * The game reads X and Y as well as A and B: the cabinet shows four face buttons, maps a
   * gamepad's X and Y to them (instead of doubling A and B) and lists C and V on the keyboard.
   */
  fourButtons?: boolean
  /**
   * Names for the face buttons (JUMP, DUCK…): a solo touch cabinet shows each one on a big
   * labelled button and shrinks the d-pad, for games played mostly on the buttons.
   */
  buttonLabels?: Partial<Record<'a' | 'b' | 'x' | 'y', string>>
}

export type ArcadeAudioSettings = {
  muted: boolean
  volume: number
}

/** How much crew chatter a game's comms show: everything, story scenes only, or none. */
export const ARCADE_COMMS = ['full', 'essential', 'off'] as const
export type ArcadeComms = (typeof ARCADE_COMMS)[number]

export type ArcadeGameOptions = {
  rng: () => number
  sound: ArcadeSoundLike
  /** Shared Arcade mixer settings for an in-game audio menu. */
  audio?: ArcadeAudioSettings
  /** Lets a game's settings menu control the existing Arcade mixer. */
  onAudioChange?: (settings: ArcadeAudioSettings) => void
  /** Attract-mode demo: the game drives itself and ignores the input. */
  demo: boolean
  hiScore: number
  /** Players seated for this game (1 unless the game's maxPlayers allows more). */
  players?: number
  /** Mastery goals this player has already earned (announced only when new). */
  mastery?: readonly string[]
  /**
   * This game's saved progress on this device (utils/arcade/saves.ts), for a game that keeps one.
   * Untrusted: the game validates it and offers to continue or ignores it.
   */
  resume?: unknown
  /** Save the Plumber title shortcut: select only empty or occupied files. */
  plumberLaunch?: 'new' | 'continue'
  /**
   * The player asked for a still camera (pinball, zuzu-pinball/t-012): no
   * camera sweeps, and a cut instead of a pan when the view must change.
   */
  stillCamera?: boolean
  /** Draw hostile shots on an opaque dark disc with a bright ring, for a game whose meta sets highContrast. */
  highContrast?: boolean
  /** Draw story, banner and speech text larger (Save the Plumber reading options). */
  largeText?: boolean
  /** Hold story panels and speech plates longer before they move on (Save the Plumber reading options). */
  slowReading?: boolean
  /** How much crew chatter to show, for a game whose meta sets comms (default full). */
  comms?: ArcadeComms
  /** Isolated Rainbow Act replay snapshot, never promoted to the campaign save. */
  rainbowReplay?: unknown
  /**
   * Rainbow test hook: let the attract demo fly on from `resume` (a saved checkpoint) instead of ignoring it, so a
   * test can fly a saved road with real lanes. The cabinet never sets it.
   */
  rainbowDemoResume?: boolean
  /** Rainbow Space Princess: fly every authored wave in its authored lanes, without this run's seeded mirrors (D9). The attract demo always does. */
  rainbowAuthoredWaves?: boolean
  /** Earned, per-save-slot Palace Hangar upgrades for Rainbow Space Princess. */
  rainbowHangar?: { shield: boolean; charge: boolean; life: boolean }
  /** Rainbow's call sign and per-pilot paint schemes from the save slot's Hangar (t-044); drawing only. */
  rainbowLivery?: { callSign: string; paints: number[] }
  /**
   * The player's difficulty, for a game whose meta lists `difficulty` names (default 'normal'). A game
   * that scales its score by difficulty keeps one leaderboard fair across levels.
   */
  difficulty?: ArcadeDifficulty
  /**
   * Open with the game's own pilot / difficulty select, for a game that has one. The cabinet sets it for
   * a real game; demos, replays and headless tests leave it off and start flying at once.
   */
  selectScreen?: boolean
}

/** The three difficulty levels a cabinet can offer. */
export type ArcadeDifficulty = 'easy' | 'normal' | 'hard'
export const ARCADE_DIFFICULTIES: readonly ArcadeDifficulty[] = [
  'easy',
  'normal',
  'hard',
]

/**
 * The subset of ArcadeSound a game may call (lets tests pass a stub): the shared presets, and
 * optionally its own notes (a stub may leave `playNotes` out, so games must fall back to `play`).
 */
export type ArcadeSoundLike = Pick<ArcadeSound, 'play'> &
  Partial<Pick<ArcadeSound, 'playNotes'>>

/**
 * One row of ArcadeGameInstance.readout: a label, its value, and an optional colour (a pilot's). A spoken row is
 * a line of dialogue (label the speaker, value the line): the cabinet wraps it and announces it politely.
 */
export type ArcadeReadoutRow = {
  label: string
  value: string
  color?: string
  spoken?: boolean
}

export type ArcadeStagePointer = {
  phase: 'down' | 'move' | 'up' | 'cancel'
  x: number
  y: number
}

export interface ArcadeGameInstance {
  readonly score: number
  readonly level: number
  readonly lives: number
  readonly over: boolean
  /** Optional live local seat adjustment, performed while the Arcade is paused. */
  setPlayers?(count: number): void
  /** Change the calm-motion choice mid-game, for a game whose meta sets calmMotion. */
  setStillCamera?(still: boolean): void
  /** Change the high-contrast shot choice mid-game, for a game whose meta sets highContrast. */
  setHighContrast?(on: boolean): void
  /** Change the comms level mid-game, for a game whose meta sets comms. */
  setComms?(level: ArcadeComms): void
  /** Keep a game's in-cabinet audio menu synchronized with Arcade controls. */
  setAudio?(settings: ArcadeAudioSettings): void
  /**
   * Where the player's career is kept right now (the cabinet's account sync state), for a game that
   * shows it in its own menus, where the cabinet's title plate is hidden on a pinned phone.
   */
  setSaveStatus?(status: ArcadeSaveStatus): void
  /** The game's own music and effects levels (0..1) under the Arcade volume, read as it plays. */
  readonly audioMix?: { music: number; effects: number }
  /** Mastery goals earned this game, for a cabinet with a ladder. */
  readonly mastered?: readonly string[]
  /** Achievement deeds performed since the last call, for a table that reports them. */
  drainFeats?(): string[]
  /**
   * Progress to keep if the player leaves, for a game with a save (a long campaign): the cabinet
   * stores it whenever it changes and hands it back as `resume`. null clears it; a game without
   * saves leaves this undefined.
   */
  readonly save?: unknown
  /**
   * The music loop this game wants playing now, for a game with a score (Ghost Trail's stage,
   * boss and ending themes): the cabinet starts it when the reference changes and stops it on
   * null, on game over and when the game leaves. Return the same object while it should go on.
   */
  readonly music?: MusicLoop | null
  /**
   * A twin-stick game showing its own menu mid-play (a mode list, a shop): while true the cabinet
   * gives the arrow keys back to moving the cursor instead of aiming (kr-arcade t-147).
   */
  readonly menuOpen?: boolean
  readonly scoreBoard?: string | null
  /** Contextual touch actions (shown only when they can do something). */
  readonly touchActions?: Readonly<Partial<Record<'a' | 'b', string>>>
  stagePointer?(event: ArcadeStagePointer): void
  /**
   * The run's status in words, for a cabinet that shows it in large type off the stage (an upright
   * phone, where the canvas HUD is too small to read). null while there is nothing to report
   * (menus, the demo, game over).
   */
  readonly readout?: readonly ArcadeReadoutRow[] | null
  /**
   * Advance one fixed 1/60 s tick. `input` is player 1's; a game seating more
   * players also gets every seated player's frame, player 1 first.
   */
  update(input: InputFrame, players?: InputFrame[]): void
  /** Draw in logical coordinates (the cabinet has already scaled the context). */
  render(g: CanvasRenderingContext2D): void
}

/**
 * A game that draws with WebGL on the cabinet's stage canvas. It owns GPU,
 * physics and audio resources, so the cabinet mounts it once, tells it the
 * stage size, and disposes it when it leaves the screen.
 */
export interface ArcadeWebGLGameInstance {
  readonly renderMode: 'webgl'
  readonly score: number
  readonly level: number
  readonly lives: number
  readonly over: boolean
  /** Mastery goals earned this game, for a cabinet with a ladder. */
  readonly mastered?: readonly string[]
  /** Achievement deeds performed since the last call, for a table that reports them. */
  drainFeats?(): string[]
  /** Attach to the stage canvas and build the scene. */
  mount(canvas: HTMLCanvasElement): void
  /** CSS size of the stage in pixels, and the device pixel ratio to render at. */
  resize(width: number, height: number, dpr: number): void
  /** Advance one fixed 1/60 s tick (`players` as for ArcadeGameInstance). */
  update(input: InputFrame, players?: InputFrame[]): void
  /** Draw the current state to the stage canvas. */
  render(): void
  /** Release every GPU, physics and audio resource; safe to call twice. */
  dispose(): void
  /** Change the still-camera choice mid-game (ArcadeGameOptions.stillCamera). */
  setStillCamera?(still: boolean): void
  /** As ArcadeGameInstance.setHighContrast. */
  setHighContrast?(on: boolean): void
  /** As ArcadeGameInstance.setComms. */
  setComms?(level: ArcadeComms): void
}

export type ArcadePlayableInstance =
  ArcadeGameInstance | ArcadeWebGLGameInstance

export function isWebGLInstance(
  instance: ArcadePlayableInstance | null | undefined,
): instance is ArcadeWebGLGameInstance {
  return (
    !!instance &&
    (instance as Partial<ArcadeWebGLGameInstance>).renderMode === 'webgl'
  )
}

/** One page of a cabinet's table guide (an FX3-style rules card). */
export type ArcadeGuidePage = {
  title: string
  lines: readonly string[]
  /** Line size in the pixel font: 2 (the default), or 1 for a fuller page. */
  scale?: 1 | 2
  /** A diagram across the top of the page; the lines go under it. */
  diagram?: {
    height: number
    draw(
      g: CanvasRenderingContext2D,
      x: number,
      y: number,
      w: number,
      h: number,
    ): void
  }
}

export type ArcadeGameModule = {
  create(options: ArcadeGameOptions): ArcadePlayableInstance
  /**
   * The table guide's pages for a player with these mastery goals earned
   * (a guide may keep a secret until it is earned). Reachable from the
   * attract loop and the pause screen.
   */
  guide?(earned: ReadonlySet<string>): ArcadeGuidePage[]
}

/** The arcade store's cloud-save state for a game with an account career (Superkate's Spectrum). */
export type ArcadeSaveStatus =
  'local' | 'checking' | 'saving' | 'synced' | 'offline'

export function emptyInput(): InputFrame {
  const held = {} as Record<ArcadeButton, boolean>
  const pressed = {} as Record<ArcadeButton, boolean>
  for (const button of ARCADE_BUTTONS) {
    held[button] = false
    pressed[button] = false
  }
  return { held, pressed }
}
