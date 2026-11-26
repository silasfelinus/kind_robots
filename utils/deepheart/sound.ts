import {
  createArcadeSound,
  noteFreq,
  type ArcadeSound,
  type MusicLoop,
} from '../arcade/sound'
import type { RunState } from './types'

export type DeepheartMood =
  | 'title'
  | 'ossuary'
  | 'drowned'
  | 'ember'
  | 'combat'
  | 'campfire'
  | 'ending'

export type DeepheartCue =
  | 'descent'
  | 'danger'
  | 'strike'
  | 'wound'
  | 'discovery'
  | 'rest'
  | 'victory'
  | 'fallen'

export const DEEPHEART_THEMES: Record<DeepheartMood, MusicLoop> = {
  title: {
    bpm: 68,
    tracks: [
      { steps: 'D3 - - - A2 - - - Bb2 - - - G2 - - -', type: 'sine' },
      { steps: 'F4 . A4 . E4 . D4 . C4 . F4 . E4 . A3 .', type: 'triangle', vol: 0.035 },
    ],
  },
  ossuary: {
    bpm: 62,
    tracks: [
      { steps: 'D2 - - - D2 - - - C2 - - - G2 - - -', type: 'sine' },
      { steps: 'A3 . . F4 . . E4 . D4 . . C4 . . G3 .', type: 'triangle', vol: 0.03 },
    ],
  },
  drowned: {
    bpm: 54,
    tracks: [
      { steps: 'F2 - - - C3 - - - Db3 - - - Ab2 - - -', type: 'sine' },
      { steps: 'C5 . Ab4 . . G4 . . F4 . Db5 . . C5 . .', type: 'sine', vol: 0.04 },
    ],
  },
  ember: {
    bpm: 78,
    tracks: [
      { steps: 'E2 - E2 . F2 - E2 . C2 - C2 . B1 - B1 .', type: 'triangle', vol: 0.045 },
      { steps: 'B3 . C4 . E4 . F4 . E4 . C4 . B3 . G3 .', type: 'sine' },
    ],
  },
  combat: {
    bpm: 116,
    tracks: [
      { steps: 'D2 . D2 A2 D2 . Eb2 . C2 . C2 G2 Bb1 . A1 .', type: 'triangle' },
      { steps: 'D4 F4 . A4 Eb4 . D4 . C4 G4 . F4 E4 . C4 .', type: 'triangle', vol: 0.035 },
      { steps: 'x . . x . . x . x . . x . . x .', noise: true, vol: 0.015 },
    ],
  },
  campfire: {
    bpm: 72,
    tracks: [
      { steps: 'G2 - - - C3 - - - E3 - - - D3 - - -', type: 'sine' },
      { steps: 'B3 D4 G4 . E4 G4 C5 . B4 G4 E4 . A4 F#4 D4 .', type: 'triangle', vol: 0.04 },
    ],
  },
  ending: {
    bpm: 60,
    tracks: [
      { steps: 'D3 - - - Bb2 - - - F2 - - - C3 - - -', type: 'sine' },
      { steps: 'A4 . F4 . D4 . . . F4 . C5 . A4 . D4 .', type: 'triangle', vol: 0.035 },
    ],
  },
}

export const DEEPHEART_CUES: Record<DeepheartCue, readonly string[]> = {
  descent: ['D4', 'A3', 'D3'],
  danger: ['E3', 'Eb3', 'D3'],
  strike: ['A3', 'D4'],
  wound: ['F3', 'C3'],
  discovery: ['D4', 'F4', 'A4', 'D5'],
  rest: ['G3', 'B3', 'D4'],
  victory: ['D4', 'F4', 'A4', 'D5'],
  fallen: ['D4', 'C4', 'A3', 'D3'],
}

export function deepheartAudioFrame(run: RunState | null, screen: string) {
  return {
    active: screen === 'delve' && !!run,
    seed: run?.seed ?? null,
    phase: run?.phase ?? 'map',
    layer: run?.layer ?? 0,
    ending: run?.ending ?? null,
    hp: run?.party.reduce((sum, member) => sum + member.hp, 0) ?? 0,
    enemyHp:
      run?.combat?.enemies.reduce((sum, enemy) => sum + enemy.hp, 0) ?? 0,
    moments: run?.moments.length ?? 0,
    fights: run?.fights ?? 0,
    puzzles: run?.puzzlesSolved ?? 0,
    chests: run?.chests ?? 0,
  }
}

export type DeepheartAudioFrame = ReturnType<typeof deepheartAudioFrame>

export function deepheartMood(frame: DeepheartAudioFrame): DeepheartMood {
  if (!frame.active) return 'title'
  if (frame.ending || frame.phase === 'ended') return 'ending'
  if (frame.phase === 'fight') return 'combat'
  if (frame.phase === 'camp') return 'campfire'
  return frame.layer === 2 ? 'ember' : frame.layer === 1 ? 'drowned' : 'ossuary'
}

export function deepheartCues(
  before: DeepheartAudioFrame,
  after: DeepheartAudioFrame,
): DeepheartCue[] {
  if (!after.active || !before.active || before.seed !== after.seed) return []
  if (after.ending && after.ending !== before.ending)
    return [after.ending === 'fallen' ? 'fallen' : 'victory']
  if (after.layer !== before.layer) return ['descent']
  if (after.phase !== before.phase) {
    if (after.phase === 'fight') return ['danger']
    if (after.phase === 'camp') return ['rest']
  }
  if (after.fights > before.fights) return ['victory']
  if (after.puzzles > before.puzzles || after.chests > before.chests)
    return ['discovery']
  if (after.hp < before.hp) return ['wound']
  if (after.phase === 'fight' && after.enemyHp < before.enemyHp)
    return ['strike']
  if (after.moments > before.moments) return ['discovery']
  return []
}

export class DeepheartSound {
  private player: ArcadeSound | null = null
  private mood: DeepheartMood = 'title'
  private enabled = true
  private reduced = false
  private hidden = false
  private playing: DeepheartMood | null = null

  constructor(private create = createArcadeSound) {}

  unlock() {
    if (!this.enabled || this.hidden) return
    try {
      this.player ??= this.create()
      this.player.unlock()
      this.sync()
    } catch {
      this.dispose()
    }
  }

  configure(enabled: boolean, reduced: boolean, hidden: boolean) {
    this.enabled = enabled
    this.reduced = reduced
    this.hidden = hidden
    this.sync()
  }

  setMood(mood: DeepheartMood) {
    this.mood = mood
    this.sync()
  }

  private sync() {
    const player = this.player
    if (!player) return
    const audible = this.enabled && !this.hidden
    player.setMuted(!audible)
    player.setVolume(audible ? (this.reduced ? 0.24 : 0.55) : 0)
    if (!audible) {
      player.stopMusic()
      this.playing = null
    } else if (this.playing !== this.mood) {
      player.startMusic(DEEPHEART_THEMES[this.mood])
      this.playing = this.mood
    }
  }

  play(cues: readonly DeepheartCue[]) {
    if (!this.enabled || this.hidden || this.reduced) return
    for (const cue of cues)
      this.player?.playNotes(
        DEEPHEART_CUES[cue].map((pitch, index) => ({
          freq: noteFreq(pitch)!,
          type: 'triangle',
          dur: 0.24,
          vol: 0.07,
          at: index * 0.085,
        })),
      )
  }

  dispose() {
    this.player?.dispose()
    this.player = null
    this.playing = null
  }
}
