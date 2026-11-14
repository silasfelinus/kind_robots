/** Versioned, replay-safe decisions for the optional e03/e04 Last Train packet. */
export const TRAIN_CHOICES = {
  e03Door: ['md.train.e03.release', 'md.train.e03.wait', 'md.train.e03.leave'],
  e03Timetable: [
    'md.train.e03.share',
    'md.train.e03.return',
    'md.train.e03.redact',
  ],
  e04Platform: [
    'md.train.e04.open',
    'md.train.e04.listen',
    'md.train.e04.retreat',
  ],
  e04Carriage: [
    'md.train.e04.name',
    'md.train.e04.map',
    'md.train.e04.silence',
  ],
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
        !(TRAIN_CHOICES[scene] as readonly string[]).includes(
          decisions[scene] as string,
        ))
    )
      return null
  }
  return {
    version: 1,
    decisions: { ...decisions } as TrainProgress['decisions'],
  }
}

export function chooseTrain(
  progress: TrainProgress,
  scene: TrainScene,
  choice: string,
): TrainProgress {
  if (!restoreTrainProgress(progress)) return progress
  if (!scenes.includes(scene)) return progress
  if (!(TRAIN_CHOICES[scene] as readonly string[]).includes(choice))
    return progress
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

/**
 * Project a saved train ledger through encounter records verified by the expedition
 * replay engine. A structurally valid choice is not evidence that its scene was
 * visited. The caller must supply only replay-verified records, in visit order.
 * The first eligible choice wins, matching the existing idempotent reducer.
 */
export type VerifiedTrainEncounter = {
  world: 'e03' | 'e04'
  scene: TrainScene
  choice: string
}

const sceneWorld: Record<TrainScene, VerifiedTrainEncounter['world']> = {
  e03Door: 'e03',
  e03Timetable: 'e03',
  e04Platform: 'e04',
  e04Carriage: 'e04',
}

export function replayTrainEncounters(
  verifiedEncounters: readonly VerifiedTrainEncounter[],
): TrainProgress {
  let progress = newTrainProgress()
  // Expedition replay is chronological. Once the night-world e04 has been
  // entered, a late e03 record cannot retroactively earn an earlier reward.
  // Keep this boundary even if the caller accidentally passes mixed records.
  let enteredNightWorld = false
  for (const encounter of verifiedEncounters) {
    if (
      !Object.hasOwn(sceneWorld, encounter.scene) ||
      sceneWorld[encounter.scene] !== encounter.world
    )
      continue
    // A malformed e04 choice is not evidence of entering the night world.
    // Otherwise an injected record could suppress valid later e03 rewards.
    if (
      !(TRAIN_CHOICES[encounter.scene] as readonly string[]).includes(
        encounter.choice,
      )
    )
      continue
    if (encounter.world === 'e03' && enteredNightWorld) continue
    if (encounter.world === 'e04') enteredNightWorld = true
    progress = chooseTrain(progress, encounter.scene, encounter.choice)
  }
  return progress
}

/**
 * Accept a restored ledger only if it is exactly reproducible from the verified
 * expedition encounters. This prevents an injected later-world choice from
 * granting a token, route slip or echo fragment on load.
 */
export function restoreVerifiedTrainProgress(
  saved: unknown,
  verifiedEncounters: readonly VerifiedTrainEncounter[],
): TrainProgress | null {
  const restored = restoreTrainProgress(saved)
  if (!restored) return null
  const replayed = replayTrainEncounters(verifiedEncounters)
  for (const scene of scenes) {
    if (restored.decisions[scene] !== replayed.decisions[scene]) return null
  }
  return replayed
}
