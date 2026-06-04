// /stores/helpers/applyQuerySelections.ts
import type { LocationQuery } from 'vue-router'
import { useBotStore } from '@/stores/botStore'
import { useCharacterStore } from '@/stores/characterStore'
import { useScenarioStore } from '@/stores/scenarioStore'
import { useChatStore } from '@/stores/chatStore'
import { usePitchStore } from '@/stores/pitchStore'
import { usePromptStore } from '@/stores/promptStore'
import type {
  displayModeState,
  displayActionState,
} from '@/stores/displayStore'

type DisplayStore = ReturnType<
  typeof import('@/stores/displayStore').useDisplayStore
>

function asString(
  value: LocationQuery[string] | undefined,
): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function selectById(
  value: LocationQuery[string] | undefined,
  select: (id: number) => void,
): void {
  const raw = asString(value)
  if (!raw) return
  const id = Number(raw)
  if (Number.isFinite(id)) select(id)
}

export function applyQuerySelections(
  query: LocationQuery,
  displayStore: DisplayStore,
): void {
  const displayMode = asString(query.displayMode)
  const displayAction = asString(query.displayAction)

  if (displayMode) displayStore.displayMode = displayMode as displayModeState
  if (displayAction)
    displayStore.displayAction = displayAction as displayActionState

  selectById(query.botId, (id) => useBotStore().selectBot(id))
  selectById(query.characterId, (id) => useCharacterStore().selectCharacter(id))
  selectById(query.scenarioId, (id) => useScenarioStore().selectScenario(id))
  selectById(query.chatId, (id) => useChatStore().selectChat(id))
  selectById(query.pitchId, (id) => usePitchStore().selectPitch(id))
  selectById(query.promptId, (id) => usePromptStore().selectPrompt(id))
}
