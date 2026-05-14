// /stores/choiceStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { allSeeds } from './../stores/seeds/seedChoices'

export interface ChoiceOption {
  text: string
  image?: string
  description?: string
  icon?: string
  artPrompt?: string
  subtitle?: string
  value?: string
}

export interface ChoiceEntry {
  label: string
  model: SupportedModel
  options: ChoiceOption[]
  selected: string | null
  custom: string
  icon?: string
  artPrompt?: string
  groupTitle?: string
}

type SupportedModel =
  | 'Character'
  | 'Bot'
  | 'Scenario'
  | 'Pitch'
  | 'Reward'
  | 'Chat'
  | 'Blueprint'

type ChoiceKey = `${SupportedModel}:${string}`

export const useChoiceStore = defineStore('choiceStore', () => {
  const entries = ref<Record<ChoiceKey, ChoiceEntry>>({})
  const initialized = ref(false)

  function buildKey(label: string, model: SupportedModel): ChoiceKey {
    return `${model}:${label}`
  }

  function initialize() {
    if (initialized.value) return

    try {
      allSeeds.forEach((entry: ChoiceEntry) => {
        registerChoice(entry)
      })
      initialized.value = true
    } catch (error) {
      console.error('Error loading seed choices', error)
    }
  }

  function registerChoice(entry: ChoiceEntry) {
    const key = buildKey(entry.label, entry.model)

    const existing = entries.value[key]

    entries.value[key] = {
      label: entry.label,
      model: entry.model,
      options: entry.options,
      selected: existing?.selected ?? entry.selected ?? null,
      custom: existing?.custom ?? entry.custom ?? '',
      icon: entry.icon,
      artPrompt: entry.artPrompt,
      groupTitle: entry.groupTitle,
    }
  }

  function registerChoiceFields(
    label: string,
    model: SupportedModel,
    options: ChoiceOption[],
    extras?: Partial<Pick<ChoiceEntry, 'icon' | 'artPrompt' | 'groupTitle'>>,
  ) {
    registerChoice({
      label,
      model,
      options,
      selected: null,
      custom: '',
      icon: extras?.icon,
      artPrompt: extras?.artPrompt,
      groupTitle: extras?.groupTitle,
    })
  }

  function getChoice(
    label: string,
    model?: SupportedModel,
  ): ChoiceEntry | null {
    if (model) {
      const key = buildKey(label, model)
      return entries.value[key] || null
    }

    const found = Object.values(entries.value).find(
      (entry) => entry.label === label,
    )

    return found || null
  }

  function selectChoice(label: string, value: string, model?: SupportedModel) {
    const entry = getChoice(label, model)
    if (!entry) return
    entry.selected = value
  }

  function setCustomChoice(
    label: string,
    value: string,
    model?: SupportedModel,
  ) {
    const entry = getChoice(label, model)
    if (!entry) return

    entry.custom = value
    entry.selected = value
  }

  function clearChoice(label: string, model?: SupportedModel) {
    const entry = getChoice(label, model)
    if (!entry) return

    entry.selected = null
    entry.custom = ''
  }

  function getValue(label: string, model?: SupportedModel): string | null {
    const entry = getChoice(label, model)
    return entry?.selected || null
  }

  function applyToForm<T extends Record<string, unknown>>(
    form: Partial<T>,
    label: string,
    model: SupportedModel,
  ): Partial<T> {
    const entry = getChoice(label, model)

    if (entry?.selected) {
      form[label as keyof T] = entry.selected as T[keyof T]
    }

    return form
  }

  return {
    entries,
    initialized,
    initialize,
    registerChoice,
    registerChoiceFields,
    getChoice,
    selectChoice,
    setCustomChoice,
    clearChoice,
    getValue,
    applyToForm,
  }
})
