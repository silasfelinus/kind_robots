// /utils/musicVideoTimeline.ts
//
// Pure timeline math for the Music Video editor (music-video/t-007): the beat grid,
// snapping, waveform peaks, lyric section bands and scene split / merge / lyric
// assignment. DB-free and DOM-free so the editor component and the verify script share
// one implementation. Beat detection is out of scope: the grid is the requested BPM plus
// an offset and beats per bar.
import type {
  MusicVideoDoc,
  MusicVideoMarker,
  MusicVideoScene,
} from './musicVideoDoc'

export type BeatGrid = MusicVideoDoc['timeline']['beatGrid']
export type SnapMode = MusicVideoMarker['snap']
export type LyricRef = { sectionId: string; lineIdx: number }

const round3 = (n: number): number => Math.round(n * 1000) / 1000

export function beatSec(grid: BeatGrid): number {
  return 60 / grid.bpm
}

export function barSec(grid: BeatGrid): number {
  return beatSec(grid) * grid.beatsPerBar
}

/** Every beat in [0, durationSec]; `bar` flags the first beat of each bar. */
export function beatTimes(
  grid: BeatGrid,
  durationSec: number,
): { atSec: number; bar: boolean }[] {
  const step = beatSec(grid)
  if (!(step > 0) || !(durationSec > 0)) return []
  const first = Math.ceil((0 - grid.offsetSec) / step - 1e-9)
  const out: { atSec: number; bar: boolean }[] = []
  for (let n = first; ; n++) {
    const atSec = round3(grid.offsetSec + n * step)
    if (atSec > durationSec + 1e-9) break
    if (atSec < 0) continue
    const inBar = ((n % grid.beatsPerBar) + grid.beatsPerBar) % grid.beatsPerBar
    out.push({ atSec, bar: inBar === 0 })
  }
  return out
}

/** Snap a time to the nearest beat or bar line, or leave it free; clamped to the song. */
export function snapTime(
  atSec: number,
  mode: SnapMode,
  grid: BeatGrid,
  durationSec: number,
): number {
  const clamped = Math.min(Math.max(atSec, 0), durationSec)
  if (mode === 'free') return round3(clamped)
  const step = mode === 'bar' ? barSec(grid) : beatSec(grid)
  const n = Math.round((clamped - grid.offsetSec) / step)
  const snapped = grid.offsetSec + n * step
  return round3(Math.min(Math.max(snapped, 0), durationSec))
}

/** Collapse decoded samples into `buckets` peak amplitudes in 0..1 for drawing. */
export function waveformPeaks(
  samples: ArrayLike<number>,
  buckets: number,
): number[] {
  const count = Math.max(1, Math.floor(buckets))
  if (!samples.length) return Array.from({ length: count }, () => 0)
  const peaks: number[] = []
  const per = samples.length / count
  let max = 0
  for (let b = 0; b < count; b++) {
    const from = Math.floor(b * per)
    const to = Math.max(from + 1, Math.floor((b + 1) * per))
    let peak = 0
    for (let i = from; i < to && i < samples.length; i++) {
      const v = Math.abs(samples[i] ?? 0)
      if (v > peak) peak = v
    }
    peaks.push(peak)
    if (peak > max) max = peak
  }
  return max > 0 ? peaks.map((p) => round3(p / max)) : peaks
}

export type SectionBand = {
  sectionId: string
  kind: string
  startSec: number
  endSec: number
}

/** Section bands sized by line count (an empty section still gets one line's width). */
export function sectionBands(
  sections: MusicVideoDoc['lyrics']['sections'],
  durationSec: number,
): SectionBand[] {
  if (!sections.length || !(durationSec > 0)) return []
  const weights = sections.map((s) => Math.max(1, s.lines.length))
  const total = weights.reduce((a, b) => a + b, 0)
  let acc = 0
  return sections.map((section, i) => {
    const startSec = round3((acc / total) * durationSec)
    acc += weights[i] ?? 1
    const endSec = round3((acc / total) * durationSec)
    return { sectionId: section.id, kind: section.kind, startSec, endSec }
  })
}

export function addMarker(
  markers: MusicVideoMarker[],
  atSec: number,
  snap: SnapMode,
  grid: BeatGrid,
  durationSec: number,
  id: string,
): MusicVideoMarker[] {
  const at = snapTime(atSec, snap, grid, durationSec)
  if (at <= 0 || at >= durationSec) return markers
  if (markers.some((m) => Math.abs(m.atSec - at) < 0.001)) return markers
  return [...markers, { id, atSec: at, snap }].sort((a, b) => a.atSec - b.atSec)
}

export function moveMarker(
  markers: MusicVideoMarker[],
  id: string,
  atSec: number,
  grid: BeatGrid,
  durationSec: number,
): MusicVideoMarker[] {
  const current = markers.find((m) => m.id === id)
  if (!current) return markers
  const at = snapTime(atSec, current.snap, grid, durationSec)
  if (at <= 0 || at >= durationSec) return markers
  if (markers.some((m) => m.id !== id && Math.abs(m.atSec - at) < 0.001))
    return markers
  return markers
    .map((m) => (m.id === id ? { ...m, atSec: at } : m))
    .sort((a, b) => a.atSec - b.atSec)
}

export function removeMarker(
  markers: MusicVideoMarker[],
  id: string,
): MusicVideoMarker[] {
  return markers.filter((m) => m.id !== id)
}

/** Split the scene that contains `atSec`; the new right half carries no art or prompt. */
export function splitSceneAt(
  scenes: MusicVideoScene[],
  atSec: number,
  newId: string,
): MusicVideoScene[] {
  const index = scenes.findIndex((s) => atSec > s.startSec && atSec < s.endSec)
  if (index < 0) return scenes
  const left = scenes[index]
  if (!left) return scenes
  const refs = left.lyricRefs
  const half = Math.ceil(refs.length / 2)
  const right: MusicVideoScene = {
    id: newId,
    startSec: round3(atSec),
    endSec: left.endSec,
    lyricRefs: refs.slice(half),
    prompt: '',
    promptSource: 'llm',
    image: { source: 'generated' },
    motion: { kind: 'kenburns' },
    transition: 'cut',
    transitionSec: 0,
  }
  const next = [...scenes]
  next.splice(
    index,
    1,
    { ...left, endSec: round3(atSec), lyricRefs: refs.slice(0, half) },
    right,
  )
  return next
}

/** Merge a scene into its predecessor (the earlier scene keeps its art and prompt). */
export function mergeSceneBack(
  scenes: MusicVideoScene[],
  sceneId: string,
): MusicVideoScene[] {
  const index = scenes.findIndex((s) => s.id === sceneId)
  if (index <= 0) return scenes
  const prev = scenes[index - 1]
  const gone = scenes[index]
  if (!prev || !gone) return scenes
  const next = [...scenes]
  next.splice(index - 1, 2, {
    ...prev,
    endSec: gone.endSec,
    lyricRefs: [...prev.lyricRefs, ...gone.lyricRefs],
  })
  return next
}

/** Spread every lyric line across the scenes by scene length (user-adjustable after). */
export function spreadLyricsAcrossScenes(
  scenes: MusicVideoScene[],
  sections: MusicVideoDoc['lyrics']['sections'],
): MusicVideoScene[] {
  if (!scenes.length) return scenes
  const lines: LyricRef[] = sections.flatMap((s) =>
    s.lines.map((_, lineIdx) => ({ sectionId: s.id, lineIdx })),
  )
  const spans = scenes.map((s) => Math.max(0.001, s.endSec - s.startSec))
  const total = spans.reduce((a, b) => a + b, 0)
  let acc = 0
  return scenes.map((scene, i) => {
    const from = Math.round((acc / total) * lines.length)
    acc += spans[i] ?? 0
    const to =
      i === scenes.length - 1
        ? lines.length
        : Math.round((acc / total) * lines.length)
    return { ...scene, lyricRefs: lines.slice(from, to) }
  })
}

/** Move one lyric line to another scene (a line belongs to at most one scene). */
export function assignLyricLine(
  scenes: MusicVideoScene[],
  ref: LyricRef,
  targetSceneId: string,
): MusicVideoScene[] {
  if (!scenes.some((s) => s.id === targetSceneId)) return scenes
  const same = (r: LyricRef) =>
    r.sectionId === ref.sectionId && r.lineIdx === ref.lineIdx
  return scenes.map((scene) => {
    const rest = scene.lyricRefs.filter((r) => !same(r))
    return scene.id === targetSceneId
      ? { ...scene, lyricRefs: [...rest, ref] }
      : { ...scene, lyricRefs: rest }
  })
}
