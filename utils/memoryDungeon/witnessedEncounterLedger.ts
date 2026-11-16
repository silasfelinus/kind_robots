export type WitnessedEncounterDefinition = {
  sceneId: string
  worldId: string
  choices: Record<string, readonly string[]>
}

export type WitnessedEncounterEvent = {
  eventId: string
  sceneId: string
  worldId: string
  choiceId: string
  turn: number
}

export type WitnessedEncounterLedger = {
  version: 1
  events: WitnessedEncounterEvent[]
  evidence: string[]
}

export const emptyWitnessedEncounterLedger = (): WitnessedEncounterLedger => ({
  version: 1,
  events: [],
  evidence: [],
})

const validId = (value: unknown): value is string =>
  typeof value === 'string' &&
  value.length > 0 &&
  value.length <= 120 &&
  /^[a-z0-9][a-z0-9-]*$/.test(value)

const validEvent = (
  value: unknown,
  definitions: readonly WitnessedEncounterDefinition[],
): value is WitnessedEncounterEvent => {
  if (!value || typeof value !== 'object') return false
  const event = value as Partial<WitnessedEncounterEvent>
  if (
    !validId(event.eventId) ||
    !validId(event.sceneId) ||
    !validId(event.worldId) ||
    !validId(event.choiceId) ||
    !Number.isSafeInteger(event.turn) ||
    (event.turn ?? -1) < 0
  ) {
    return false
  }
  const definition = definitions.find(
    (entry) =>
      entry.sceneId === event.sceneId && entry.worldId === event.worldId,
  )
  return Boolean(
    definition &&
      Object.prototype.hasOwnProperty.call(
        definition.choices,
        event.choiceId,
      ),
  )
}

const rebuild = (
  events: readonly WitnessedEncounterEvent[],
  definitions: readonly WitnessedEncounterDefinition[],
): WitnessedEncounterLedger => {
  const evidence = new Set<string>()
  for (const event of events) {
    const definition = definitions.find(
      (entry) =>
        entry.sceneId === event.sceneId && entry.worldId === event.worldId,
    )
    for (const key of definition?.choices[event.choiceId] ?? []) {
      evidence.add(key)
    }
  }
  return {
    version: 1,
    events: events.map((event) => ({ ...event })),
    evidence: [...evidence].sort(),
  }
}

export const restoreWitnessedEncounterLedger = (
  saved: unknown,
  definitions: readonly WitnessedEncounterDefinition[],
): WitnessedEncounterLedger | null => {
  if (!saved || typeof saved !== 'object') return null
  const ledger = saved as Partial<WitnessedEncounterLedger>
  if (
    ledger.version !== 1 ||
    !Array.isArray(ledger.events) ||
    !Array.isArray(ledger.evidence) ||
    ledger.events.length > 4096 ||
    !ledger.events.every((event) => validEvent(event, definitions))
  ) {
    return null
  }
  const events = ledger.events as WitnessedEncounterEvent[]
  const ids = new Set(events.map((event) => event.eventId))
  const scenes = new Set(events.map((event) => event.sceneId))
  if (ids.size !== events.length || scenes.size !== events.length) return null
  if (
    events.some(
      (event, index) => index > 0 && event.turn <= events[index - 1]!.turn,
    )
  ) {
    return null
  }
  const canonical = rebuild(events, definitions)
  if (
    ledger.evidence.length !== canonical.evidence.length ||
    ledger.evidence.some(
      (key, index) => key !== canonical.evidence[index],
    )
  ) {
    return null
  }
  return canonical
}

export const commitWitnessedEncounter = (
  ledger: WitnessedEncounterLedger,
  event: WitnessedEncounterEvent,
  definitions: readonly WitnessedEncounterDefinition[],
): WitnessedEncounterLedger | null => {
  const current = restoreWitnessedEncounterLedger(ledger, definitions)
  if (!current || !validEvent(event, definitions)) return null
  const prior = current.events.find(
    (entry) => entry.eventId === event.eventId || entry.sceneId === event.sceneId,
  )
  if (prior) {
    return prior.eventId === event.eventId &&
      prior.sceneId === event.sceneId &&
      prior.worldId === event.worldId &&
      prior.choiceId === event.choiceId &&
      prior.turn === event.turn
      ? current
      : null
  }
  if (
    current.events.length >= 4096 ||
    (current.events.at(-1)?.turn ?? -1) >= event.turn
  ) {
    return null
  }
  return rebuild([...current.events, event], definitions)
}
