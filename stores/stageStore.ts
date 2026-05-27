// /stores/stageStore.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getStagePerformerById,
  getStageUtilityCardById,
  performerToTemporaryParticipant,
  stagePerformers,
  stagePresets,
  stageUtilityCards,
  type StagePerformer,
  type StageUtilityCard,
} from '@/stores/helpers/stageCards'
import {
  buildTurnPrompt,
  cleanGeneratedLine,
  emptyCastSlot,
  initialCastForStage,
  isCastReady,
  loadStageSnapshot,
  makeId,
  pickNextSpeakerIndex,
  resolveCastSlot,
  saveStageSnapshot,
  streamStageTurn,
  type CastSlot,
  type ResolvedCastMember,
  type StagePreset,
  type StageTranscriptEntry,
  type TemporaryParticipant,
} from '@/stores/helpers/stageHelper'
import { useBotStore } from './botStore'
import { useCharacterStore } from './characterStore'

const defaultStageId = stagePresets[0]?.id ?? 'late-night-talk-show'

function utilityImagePath(id: string): string | null {
  return getStageUtilityCardById(id)?.imagePath ?? null
}

export const useStageStore = defineStore('stageStore', () => {
  const presets = ref<StagePreset[]>(stagePresets)
  const performers = ref<StagePerformer[]>(stagePerformers)
  const utilityCards = ref<StageUtilityCard[]>(stageUtilityCards)

  const selectedStageId = ref<string>(defaultStageId)
  const cast = ref<CastSlot[]>([])
  const transcript = ref<StageTranscriptEntry[]>([])

  const turnIndex = ref(0)
  const maxTurns = ref(12)

  const isRunning = ref(false)
  const isPaused = ref(false)
  const isGenerating = ref(false)

  const selectedTextServerId = ref<number | null>(null)
  const selectedModel = ref<string>('gpt-4o-mini')
  const turnDelayMs = ref(800)

  const customOpening = ref<string>('')
  const showTitle = ref<string>('')
  const showTopic = ref<string>('')

  const pendingDirectorNudge = ref<string | null>(null)
  const pendingSpeakerSlotId = ref<string | null>(null)
  const lastError = ref<string | null>(null)

  const characterStore = useCharacterStore()
  const botStore = useBotStore()

  const selectedStage = computed<StagePreset | undefined>(() =>
    presets.value.find((stage) => stage.id === selectedStageId.value),
  )

  const selectedStageImagePath = computed<string | null>(() => {
    return selectedStage.value?.imagePath ?? null
  })

  const splashImagePath = computed<string | null>(() => {
    return utilityImagePath('splash')
  })

  const transcriptBackgroundImagePath = computed<string | null>(() => {
    return utilityImagePath('transcript-background')
  })

  const loadingImagePath = computed<string | null>(() => {
    return utilityImagePath('stage-loading')
  })

  const errorImagePath = computed<string | null>(() => {
    return utilityImagePath('error-goblin')
  })

  const emptyRoleImagePath = computed<string | null>(() => {
    return utilityImagePath('empty-role')
  })

  const temporaryPerformerImagePath = computed<string | null>(() => {
    return utilityImagePath('temporary-performer')
  })

  const directorImagePath = computed<string | null>(() => {
    return utilityImagePath('director')
  })

  const narratorImagePath = computed<string | null>(() => {
    return utilityImagePath('narrator')
  })

  const userImagePath = computed<string | null>(() => {
    return utilityImagePath('user')
  })

  const castReady = computed<boolean>(() => {
    const stage = selectedStage.value
    if (!stage) return false

    return isCastReady(stage, cast.value)
  })

  const resolvedCast = computed<ResolvedCastMember[]>(() => {
    const stage = selectedStage.value
    if (!stage) return []

    const lookup = {
      findCharacter: (id: number) => {
        return (characterStore.characters || []).find(
          (character) => character.id === id,
        )
      },
      findBot: (id: number) => {
        return (botStore.bots || []).find((bot) => bot.id === id)
      },
    }

    const output: ResolvedCastMember[] = []

    for (const slot of cast.value) {
      const role = stage.roles.find((entry) => entry.key === slot.roleKey)

      if (!role) continue

      const resolved = resolveCastSlot(slot, role, lookup)

      if (resolved) {
        output.push(resolved)
      }
    }

    return output
  })

  const transcriptHasEntries = computed<boolean>(
    () => transcript.value.length > 0,
  )

  const stageTitle = computed<string>(() => {
    return showTitle.value.trim() || selectedStage.value?.label || 'Stage'
  })

  function setLastError(error: unknown, fallback: string): void {
    lastError.value = error instanceof Error ? error.message : fallback
  }

  function clearError(): void {
    lastError.value = null
  }

  function getUtilityCard(id: string): StageUtilityCard | undefined {
    return getStageUtilityCardById(id)
  }

  function getUtilityImagePath(id: string): string | null {
    return utilityImagePath(id)
  }

  function performersForRole(roleKey: string): StagePerformer[] {
    const stageId = selectedStageId.value

    return performers.value.filter((performer) => {
      if (performer.avoidRoles?.includes(roleKey)) return false

      return (
        performer.preferredStages.includes(stageId) ||
        performer.preferredRoles.includes(roleKey)
      )
    })
  }

  function selectStage(id: string): void {
    selectedStageId.value = id

    const stage = selectedStage.value

    if (!stage) return

    maxTurns.value = stage.defaultTurns
    cast.value = initialCastForStage(stage)
    transcript.value = []
    turnIndex.value = 0
    pendingDirectorNudge.value = null
    pendingSpeakerSlotId.value = null
    clearError()
    persist()
  }

  function addCastSlot(roleKey: string): void {
    const stage = selectedStage.value

    if (!stage) return

    const role = stage.roles.find((entry) => entry.key === roleKey)

    if (!role) return

    const current = cast.value.filter(
      (entry) => entry.roleKey === roleKey,
    ).length

    if (current >= role.max) return

    cast.value.push(emptyCastSlot(roleKey))
    persist()
  }

  function removeCastSlot(slotId: string): void {
    cast.value = cast.value.filter((entry) => entry.slotId !== slotId)
    persist()
  }

  function assignCharacter(slotId: string, characterId: number): void {
    const slot = cast.value.find((entry) => entry.slotId === slotId)

    if (!slot) return

    slot.participantType = 'character'
    slot.participantId = characterId
    slot.temporary = null
    persist()
  }

  function assignBot(slotId: string, botId: number): void {
    const slot = cast.value.find((entry) => entry.slotId === slotId)

    if (!slot) return

    slot.participantType = 'bot'
    slot.participantId = botId
    slot.temporary = null
    persist()
  }

  function assignTemporary(
    slotId: string,
    payload: TemporaryParticipant,
    participantType: 'temporary-bot' | 'narrator' = 'temporary-bot',
  ): void {
    const slot = cast.value.find((entry) => entry.slotId === slotId)

    if (!slot) return

    slot.participantType = participantType
    slot.participantId = null
    slot.temporary = payload
    persist()
  }

  function assignPerformer(slotId: string, performerId: string): void {
    const performer = getStagePerformerById(performerId)

    if (!performer) return

    assignTemporary(slotId, performerToTemporaryParticipant(performer))
  }

  function assignNarrator(slotId: string, name = 'Narrator'): void {
    assignTemporary(
      slotId,
      {
        name,
        species: 'Narrator',
        imagePath: utilityImagePath('narrator'),
        personality:
          'A flexible story voice that frames scenes, describes consequences, and keeps the world moving.',
        comments:
          'Useful for story prompts, campfire tales, scene transitions, and dreamlike narration.',
        prompt:
          'Perform as the narrator. Describe the scene, consequence, atmosphere, and unseen details. Do not speak as the other characters.',
        artImageId: null,
      },
      'narrator',
    )
  }

  function clearSlot(slotId: string): void {
    const slot = cast.value.find((entry) => entry.slotId === slotId)

    if (!slot) return

    slot.participantType = null
    slot.participantId = null
    slot.temporary = null
    persist()
  }

  function nudge(note: string): void {
    const cleanNote = note.trim()

    if (!cleanNote) return

    pendingDirectorNudge.value = cleanNote

    transcript.value.push({
      id: makeId(),
      kind: 'director',
      castSlotId: null,
      speakerLabel: 'Director',
      speakerArtImageId: null,
      speakerImagePath: utilityImagePath('director'),
      content: cleanNote,
      isStageDirection: true,
      timestamp: Date.now(),
    })

    persist()
  }

  function pickNextSpeaker(slotId: string): void {
    pendingSpeakerSlotId.value = slotId
  }

  async function start(): Promise<void> {
    if (!castReady.value) return

    const stage = selectedStage.value

    if (!stage) return

    clearError()

    transcript.value = []
    turnIndex.value = 0
    isRunning.value = true
    isPaused.value = false

    transcript.value.push({
      id: makeId(),
      kind: 'stage',
      castSlotId: null,
      speakerLabel: stage.label,
      speakerArtImageId: null,
      speakerImagePath: stage.imagePath ?? utilityImagePath('stage-preset'),
      content: customOpening.value.trim() || stage.openingCue,
      isStageDirection: true,
      timestamp: Date.now(),
    })

    persist()

    await runLoop()
  }

  async function runLoop(): Promise<void> {
    while (
      isRunning.value &&
      !isPaused.value &&
      turnIndex.value < maxTurns.value
    ) {
      await generateNextTurn()

      if (turnDelayMs.value > 0 && isRunning.value && !isPaused.value) {
        await new Promise((resolve) => setTimeout(resolve, turnDelayMs.value))
      }
    }

    if (turnIndex.value >= maxTurns.value) {
      isRunning.value = false
    }
  }

  function pause(): void {
    isPaused.value = true
  }

  async function resume(): Promise<void> {
    if (!isRunning.value) {
      isRunning.value = true
    }

    isPaused.value = false

    await runLoop()
  }

  function stop(): void {
    isRunning.value = false
    isPaused.value = false
    isGenerating.value = false
  }

  async function generateNextTurn(): Promise<void> {
    const stage = selectedStage.value

    if (!stage) return

    const resolved = resolvedCast.value

    if (!resolved.length) return

    isGenerating.value = true
    clearError()

    try {
      let speakerIndex: number

      if (pendingSpeakerSlotId.value) {
        const overrideIndex = resolved.findIndex(
          (entry) => entry.slotId === pendingSpeakerSlotId.value,
        )

        speakerIndex =
          overrideIndex >= 0
            ? overrideIndex
            : pickNextSpeakerIndex(
                stage,
                resolved,
                turnIndex.value,
                transcript.value,
              )

        pendingSpeakerSlotId.value = null
      } else {
        speakerIndex = pickNextSpeakerIndex(
          stage,
          resolved,
          turnIndex.value,
          transcript.value,
        )
      }

      const speaker = resolved[speakerIndex]

      if (!speaker) return

      const nudgeForTurn = pendingDirectorNudge.value
      pendingDirectorNudge.value = null

      const { system, user } = buildTurnPrompt({
        stage,
        cast: resolved,
        transcript: transcript.value,
        speakerIndex,
        showTopic: showTopic.value.trim() || undefined,
        directorNudge: nudgeForTurn,
      })

      const entryId = makeId()

      transcript.value.push({
        id: entryId,
        kind: 'speaker',
        castSlotId: speaker.slotId,
        speakerLabel: speaker.displayName,
        speakerArtImageId: speaker.artImageId,
        speakerImagePath: speaker.imagePath,
        content: '',
        isStageDirection: false,
        timestamp: Date.now(),
      })

      const onToken = (token: string) => {
        const entry = transcript.value.find((item) => item.id === entryId)

        if (entry) {
          entry.content += token
        }
      }

      const finalText = await streamStageTurn(
        system,
        user,
        {
          serverId: selectedTextServerId.value,
          model: selectedModel.value,
          temperature: 0.85,
          maxTokens: 400,
          stream: true,
        },
        onToken,
      )

      const entry = transcript.value.find((item) => item.id === entryId)

      if (entry) {
        entry.content = cleanGeneratedLine(finalText)
      }

      turnIndex.value++
      persist()
    } catch (error) {
      setLastError(error, 'Stage turn failed.')
      console.error('[stageStore] turn failed:', error)
      isRunning.value = false
    } finally {
      isGenerating.value = false
    }
  }

  async function regenerateLastTurn(): Promise<void> {
    for (let index = transcript.value.length - 1; index >= 0; index--) {
      const entry = transcript.value[index]

      if (!entry) continue

      if (entry.kind === 'speaker') {
        transcript.value.splice(index, 1)
        turnIndex.value = Math.max(0, turnIndex.value - 1)
        break
      }
    }

    await generateNextTurn()
  }

  function addUserInterjection(content: string, label = 'You'): void {
    const cleanContent = content.trim()

    if (!cleanContent) return

    transcript.value.push({
      id: makeId(),
      kind: 'user',
      castSlotId: null,
      speakerLabel: label,
      speakerArtImageId: null,
      speakerImagePath: utilityImagePath('user'),
      content: cleanContent,
      isStageDirection: false,
      timestamp: Date.now(),
    })

    persist()
  }

  function addNarratorBeat(content: string): void {
    const cleanContent = content.trim()

    if (!cleanContent) return

    transcript.value.push({
      id: makeId(),
      kind: 'narrator',
      castSlotId: null,
      speakerLabel: 'Scene',
      speakerArtImageId: null,
      speakerImagePath: utilityImagePath('narrator'),
      content: cleanContent,
      isStageDirection: true,
      timestamp: Date.now(),
    })

    persist()
  }

  function clearTranscript(): void {
    transcript.value = []
    turnIndex.value = 0
    pendingDirectorNudge.value = null
    pendingSpeakerSlotId.value = null
    persist()
  }

  function resetStage(): void {
    const stage = selectedStage.value

    cast.value = stage ? initialCastForStage(stage) : []
    transcript.value = []
    turnIndex.value = 0
    pendingDirectorNudge.value = null
    pendingSpeakerSlotId.value = null
    isRunning.value = false
    isPaused.value = false
    isGenerating.value = false
    clearError()
    persist()
  }

  function persist(): void {
    saveStageSnapshot({
      selectedStageId: selectedStageId.value,
      cast: cast.value,
      transcript: transcript.value,
      turnIndex: turnIndex.value,
      maxTurns: maxTurns.value,
      selectedTextServerId: selectedTextServerId.value,
      selectedModel: selectedModel.value,
      turnDelayMs: turnDelayMs.value,
      customOpening: customOpening.value,
      showTitle: showTitle.value,
      showTopic: showTopic.value,
    })
  }

  function hydrate(): void {
    const snapshot = loadStageSnapshot()

    if (!snapshot) {
      const stage = selectedStage.value

      if (stage && !cast.value.length) {
        cast.value = initialCastForStage(stage)
        maxTurns.value = stage.defaultTurns
      }

      return
    }

    selectedStageId.value = snapshot.selectedStageId
    cast.value = snapshot.cast
    transcript.value = snapshot.transcript
    turnIndex.value = snapshot.turnIndex
    maxTurns.value = snapshot.maxTurns
    selectedTextServerId.value = snapshot.selectedTextServerId
    selectedModel.value = snapshot.selectedModel
    turnDelayMs.value = snapshot.turnDelayMs
    customOpening.value = snapshot.customOpening
    showTitle.value = snapshot.showTitle
    showTopic.value = snapshot.showTopic
  }

  return {
    presets,
    performers,
    utilityCards,

    selectedStageId,
    cast,
    transcript,
    turnIndex,
    maxTurns,

    isRunning,
    isPaused,
    isGenerating,

    selectedTextServerId,
    selectedModel,
    turnDelayMs,

    customOpening,
    showTitle,
    showTopic,

    pendingDirectorNudge,
    pendingSpeakerSlotId,
    lastError,

    selectedStage,
    selectedStageImagePath,
    splashImagePath,
    transcriptBackgroundImagePath,
    loadingImagePath,
    errorImagePath,
    emptyRoleImagePath,
    temporaryPerformerImagePath,
    directorImagePath,
    narratorImagePath,
    userImagePath,
    castReady,
    resolvedCast,
    transcriptHasEntries,
    stageTitle,

    getUtilityCard,
    getUtilityImagePath,
    performersForRole,

    selectStage,

    addCastSlot,
    removeCastSlot,
    assignCharacter,
    assignBot,
    assignTemporary,
    assignPerformer,
    assignNarrator,
    clearSlot,

    nudge,
    pickNextSpeaker,

    start,
    runLoop,
    pause,
    resume,
    stop,

    generateNextTurn,
    regenerateLastTurn,

    addUserInterjection,
    addNarratorBeat,
    clearTranscript,
    resetStage,

    persist,
    hydrate,
    clearError,
  }
})
