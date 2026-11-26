import type { QuizFishingCheckpoint, RunSave } from '~/types/ruler-hooked'
import { startFishingEncounter } from './encounter'
import { isMandarinQuizScope, type FishingQuizQuestion } from './quiz'

const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
const text = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 4000
const image = (value: unknown): boolean =>
  value === undefined ||
  (typeof value === 'string' && /^\/flags\/[a-z]{2}\.svg$/.test(value))

function validQuestion(value: unknown): value is FishingQuizQuestion {
  if (!object(value)) return false
  const options = value.options
  if (
    !text(value.id) ||
    !['flags', 'capitals', 'mandarin'].includes(String(value.module)) ||
    !text(value.prompt) ||
    !text(value.hero) ||
    !text(value.explanation) ||
    !text(value.correctId) ||
    !image(value.heroImage) ||
    !image(value.answerImage) ||
    !Array.isArray(options) ||
    options.length < 1 ||
    options.length > 4
  ) return false
  if (!options.every((option) =>
    object(option) && text(option.id) && text(option.label) &&
    (option.icon === undefined || text(option.icon)) && image(option.image),
  )) return false
  if (new Set(options.map((option) => option.id)).size !== options.length)
    return false
  if (!options.some((option) => option.id === value.correctId)) return false
  return value.module === 'mandarin'
    ? text(value.cardKey) && value.cardKey === value.correctId
    : value.cardKey === undefined
}

export function validQuizCheckpoint(
  value: unknown,
): value is QuizFishingCheckpoint {
  if (!object(value) || !text(value.encounterId) ||
    value.encounterId.length > 512) return false
  if (value.question === undefined)
    return value.scope === undefined &&
      value.introduction === undefined &&
      value.feedback === undefined &&
      value.answerSheet === undefined
  return (
    validQuestion(value.question) &&
    typeof value.scope === 'string' && isMandarinQuizScope(value.scope) &&
    typeof value.introduction === 'boolean' &&
    typeof value.answerSheet === 'boolean' &&
    text(value.feedback) &&
    !(value.introduction && value.answerSheet) &&
    (!value.introduction || value.question.module === 'mandarin') &&
    (value.answerSheet ? value.feedback.length > 0 : value.feedback === '')
  )
}

export function readQuizCheckpoint(save: RunSave): QuizFishingCheckpoint | null {
  const checkpoint = save.pendingQuizFishing
  if (
    save.status !== 'ACTIVE' ||
    save.pendingCardId ||
    save.pendingFinaleKey ||
    save.pendingClassicFishing ||
    !validQuizCheckpoint(checkpoint) ||
    checkpoint.encounterId !== startFishingEncounter(save).id
  ) return null
  return checkpoint
}
