/** Versioned, replay-safe decisions for the optional e03/e04 Last Train packet. */
export const TRAIN_CHOICES = {
  e03Door: ['md.train.e03.release', 'md.train.e03.wait', 'md.train.e03.leave'],
  e03Timetable: ['md.train.e03.share', 'md.train.e03.return', 'md.train.e03.redact'],
  e04Platform: ['md.train.e04.open', 'md.train.e04.listen', 'md.train.e04.retreat'],
  e04Carriage: ['md.train.e04.name', 'md.train.e04.map', 'md.train.e04.silence'],
} as const

export type TrainScene = keyof typeof TRAIN_CHOICES
export type TrainProgress = {
  version: 1
  decisions: Partial<{ [K in TrainScene]: (typeof TRAIN_CHOICES)[K][number] }>
}

const scenes = Object.keys(TRAIN_CHOICES) as TrainScene[]

export function newTrainProgress(): TrainProgress {
  return { version: 1, decisions: {} }
}

export function restoreTrainProgress(input: unknown): TrainProgress | null {
  if (input == null) return newTrainProgress()
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const raw = input as Record<string, unknown>
  if (Object.getPrototypeOf(raw) !== Object.prototype) return null
  if (Object.keys(raw).some((key) => key !== 'version' && key !== 'decisions'))
    return null
  if (
    raw.version !== 1 ||
    !raw.decisions ||
    typeof raw.decisions !== 'object' ||
    Array.isArray(raw.decisions)
  )
    return null
  const decisions = raw.decisions as Record<string, unknown>
  if (Object.getPrototypeOf(decisions) !== Object.prototype) return null
  if (Object.keys(decisions).some((key) => !scenes.includes(key as TrainScene)))
    return null
  for (const scene of scenes) {
    if (
      Object.hasOwn(decisions, scene) &&
      (typeof decisions[scene] !== 'string' ||
        !(TRAIN_CHOICES[scene] as readonly string[]).includes(decisions[scene] as string))
    )
      return null
  }
  return { version: 1, decisions: { ...decisions } as TrainProgress['decisions'] }
}

export function chooseTrain(
  progress: TrainProgress,
  scene: TrainScene,
  choice: string,
): TrainProgress {
  if (!restoreTrainProgress(progress)) return progress
  if (!scenes.includes(scene)) return progress
  if (!(TRAIN_CHOICES[scene] as readonly string[]).includes(choice)) return progress
  if (progress.decisions[scene]) return progress
  return {
    version: 1,
    decisions: { ...progress.decisions, [scene]: choice },
  }
}

/** Derived rewards cannot be duplicated by replaying a scene or rehydrating. */
export function trainConsequences(progress: TrainProgress) {
  const choices = restoreTrainProgress(progress)?.decisions ?? {}
  const door = choices.e03Door
  return {
    trainDoor:
      door === 'md.train.e03.release'
      ? 'opened'
      : door === 'md.train.e03.wait'
      ? 'held'
      : door === 'md.train.e03.leave'
      ? 'delegated'
      : null,
    trainWitness:
      door === 'md.train.e03.release'
      ? 'public'
      : door === 'md.train.e03.wait'
      ? 'private'
      : door === 'md.train.e03.leave'
      ? 'none'
      : null,
    trainLedger:
      choices.e03Timetable === 'md.train.e03.share'
      ? 'shared'
      : choices.e03Timetable === 'md.train.e03.return'
      ? 'returned'
      : choices.e03Timetable === 'md.train.e03.redact'
      ? 'redacted'
      : null,
    trainNightDoor:
      choices.e04Platform === 'md.train.e04.open'
      ? 'opened'
      : choices.e04Platform === 'md.train.e04.listen'
      ? 'listened'
      : choices.e04Platform === 'md.train.e04.retreat'
      ? 'retreated'
      : null,
    trainNightLedger:
      choices.e04Carriage === 'md.train.e04.name'
      ? 'consented'
      : choices.e04Carriage === 'md.train.e04.map'
      ? 'routes'
      : choices.e04Carriage === 'md.train.e04.silence'
      ? 'refused'
      : null,
    trainToken: door === 'md.train.e03.release',
    trainRouteSlip: door === 'md.train.e03.wait',
    trainEchoFragment:
      choices.e04Platform === 'md.train.e04.open' ||
      choices.e04Platform === 'md.train.e04.listen',
  }
}
