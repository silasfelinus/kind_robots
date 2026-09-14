// /utils/narrativeArtMilestones.ts
//
// selectTaskmasterArtMilestone() and TASKMASTER_INTERMEDIATE_ART_LIMIT were
// removed on 2026-09-14 (storybook/t-047). They read a TaskmasterSession held
// in the browser by stores/taskmasterStore.ts; a taskmaster quest is a
// server-side run now, so there is no client session to choose art moments
// from. The rules themselves are not lost -- art for a taskmaster run is
// directed server-side alongside every other mode.
import type {
  StorybookBeat,
  StorybookSession,
  StorybookStateDelta,
} from '@/stores/storybookStore'
import type { NarrativeArtMoment } from '@/utils/narrativeArtProfiles'

export const STORYBOOK_INTERMEDIATE_ART_LIMIT = 2
export const MIN_BEATS_BETWEEN_ART = 2

const LOCATION_TRANSITION_PATTERN =
  /\b(arriv(?:e|ed|ing)|enter(?:ed|ing)?|reach(?:ed|ing)?|cross(?:ed|ing)? into|step(?:ped|ping)? into|emerg(?:e|ed|ing) into|descend(?:ed|ing)? into|climb(?:ed|ing)? into)\b/i

function hasMeaningfulStateDelta(delta: StorybookStateDelta): boolean {
  return Boolean(
    delta.consequences.length ||
      delta.relationshipShifts.length ||
      delta.inventoryAdd.length ||
      delta.inventoryRemove.length,
  )
}

function intermediateArtCount(beats: { art?: { moment: NarrativeArtMoment } }[]): number {
  return beats.filter(
    (beat) =>
      beat.art && beat.art.moment !== 'opening' && beat.art.moment !== 'finale',
  ).length
}

function lastIllustratedBeatIndex(
  beats: { art?: { moment: NarrativeArtMoment } }[],
  beforeIndex: number,
): number {
  for (let index = Math.min(beforeIndex - 1, beats.length - 1); index >= 0; index--) {
    if (beats[index]?.art) return index
  }
  return -1
}

function hasArtCooldown(
  beats: { art?: { moment: NarrativeArtMoment } }[],
  beatIndex: number,
): boolean {
  const lastIndex = lastIllustratedBeatIndex(beats, beatIndex)
  return lastIndex < 0 || beatIndex - lastIndex >= MIN_BEATS_BETWEEN_ART
}

function normalizedText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function newlyIntroducedCast(
  session: StorybookSession,
  beat: StorybookBeat,
  beatIndex: number,
): boolean {
  const current = normalizedText(beat.narrative)
  const previous = normalizedText(
    session.beats
      .slice(0, beatIndex)
      .map((entry) => entry.narrative)
      .join(' '),
  )

  return session.bible.cast.some((member) => {
    const title = normalizedText(member.title)
    return title.length >= 3 && current.includes(title) && !previous.includes(title)
  })
}

function storyChapterBoundary(session: StorybookSession, beatIndex: number): boolean {
  const sceneNumber = beatIndex + 1
  if (session.bible.structure === 'chaptered') return sceneNumber >= 4 && sceneNumber % 3 === 1
  if (session.bible.structure === 'episodic') return sceneNumber >= 5 && sceneNumber % 4 === 1
  return false
}

export function selectStorybookArtMilestone(
  session: StorybookSession,
  beat: StorybookBeat,
): NarrativeArtMoment | null {
  if (beat.art || session.status !== 'active') return null
  const beatIndex = session.beats.findIndex((entry) => entry.id === beat.id)
  if (beatIndex <= 0) return null
  if (intermediateArtCount(session.beats) >= STORYBOOK_INTERMEDIATE_ART_LIMIT) {
    return null
  }
  if (!hasArtCooldown(session.beats, beatIndex)) return null

  if (hasMeaningfulStateDelta(beat.stateDelta)) return 'pivotal-event'
  if (newlyIntroducedCast(session, beat, beatIndex)) return 'character-introduction'
  if (storyChapterBoundary(session, beatIndex)) return 'chapter'
  if (LOCATION_TRANSITION_PATTERN.test(beat.narrative)) return 'location'
  return null
}
