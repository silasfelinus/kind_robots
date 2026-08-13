// /utils/comments/populationProfiles.ts
//
// How a row becomes a speaker profile, and how a row becomes something to talk
// about. Shared by both authoring exporters.
//
// These started as private functions inside exportPopulationDraftPlan.ts. The
// second comment pass needs the identical mapping -- if it built profiles even
// slightly differently, the two passes would cast different speakers onto the
// same object for no reason a reader could see, and the site would feel
// inconsistent rather than varied. Copying them would have worked on the day
// and drifted by the next change, which is the failure this module exists to
// make impossible.
import {
  populationTargetTitle,
  type PopulationRow,
  type PopulationTargetType,
} from '@/utils/comments/populationTargets'
import type {
  SignalSpeakerProfile,
  SignalTargetProfile,
} from '@/utils/comments/commentSignals'

const text = (value: unknown): string => String(value ?? '').trim()

/**
 * Where each target type's rows come from.
 *
 * `/api/dreams` defaults to a take of 48 and there are 75, so it is asked
 * explicitly. Every other list returns everything. This exact cap already cost
 * the connection lane four wrongly-rejected assignments and nearly created a
 * duplicate world; it is spelled out here rather than left to the default.
 */
export const POPULATION_ENDPOINTS: Record<PopulationTargetType, string> = {
  BOT: '/api/bots?page=1&pageSize=200',
  CHARACTER: '/api/characters',
  DREAM: '/api/dreams?take=1000',
  SCENARIO: '/api/scenarios',
  PROJECT: '/api/projects',
}

export function characterProfile(row: PopulationRow): SignalSpeakerProfile {
  return {
    kind: 'CHARACTER',
    id: Number(row.id),
    name: String(row.name),
    personality: text(row.personality) || null,
    voice: text(row.voice) || null,
    sampleResponse: text(row.sampleResponse) || null,
    quirks: text(row.quirks) || null,
    drive: text(row.drive) || null,
    backstory: text(row.backstory) || null,
    role: text(row.role) || null,
    title: text(row.title) || null,
    alignment: text(row.alignment) || null,
    characterClass: text(row.class) || null,
    species: text(row.species) || null,
    genre: text(row.genre) || null,
  }
}

export function botProfile(row: PopulationRow): SignalSpeakerProfile {
  return {
    kind: 'BOT',
    id: Number(row.id),
    name: String(row.name),
    personality: text(row.personality) || null,
    botIntro: text(row.botIntro) || null,
    narrativeVoice: text(row.narrativeVoice) || null,
    sampleResponse: text(row.sampleResponse) || null,
    tagline: text(row.tagline) || null,
    subtitle: text(row.subtitle) || null,
    description: text(row.description) || null,
    botType: text(row.BotType) || null,
  }
}

/**
 * What a speaker is reacting TO, per target type.
 *
 * Every branch reports `type: 'REWARD'`. That is not a mislabel: the signal
 * scorer's target type only selects which weighting profile to use, and the
 * catalogue-object profile is the right one for all five of these. Naming a
 * type the scorer does not know would silently fall back to flat weights.
 */
export function targetProfile(
  type: PopulationTargetType,
  row: PopulationRow,
): SignalTargetProfile {
  const base = {
    id: Number(row.id),
    title: populationTargetTitle(type, row),
  }
  switch (type) {
    case 'BOT':
      return {
        ...base,
        type: 'REWARD',
        description: text(row.botIntro) || text(row.description) || null,
        flavorText: text(row.tagline) || text(row.subtitle) || null,
        category: text(row.BotType),
      }
    case 'CHARACTER':
      return {
        ...base,
        type: 'REWARD',
        description: text(row.personality) || text(row.backstory) || null,
        flavorText: text(row.drive) || text(row.quirks) || null,
        category: [text(row.role), text(row.class)].filter(Boolean).join(' '),
      }
    case 'DREAM':
      return {
        ...base,
        type: 'REWARD',
        description: text(row.pitch) || text(row.description) || null,
        flavorText: text(row.flavorText) || null,
        category: text(row.dreamType),
      }
    case 'SCENARIO':
      return {
        ...base,
        type: 'REWARD',
        description: text(row.description) || text(row.intro) || null,
        flavorText: text(row.locations) || null,
        category: text(row.genres),
      }
    case 'PROJECT':
      return {
        ...base,
        type: 'REWARD',
        description: text(row.description) || text(row.pitch) || null,
        flavorText: text(row.flavorText) || null,
        category: text(row.projectType) || text(row.status),
      }
  }
}
