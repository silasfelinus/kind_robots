// /stores/choiceStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { allSeeds } from './../stores/seeds/seedChoices'

export interface ChoiceOption {
  text: string // Required: label
  image?: string // Optional: visual reference
  description?: string // Optional: flavor text
  icon?: string // Optional: icon name (e.g. 'mdi:robot-happy')
  imagePrompt?: string // Optional: used to generate or display related art
  subtitle?: string // Optional: short note like "AI-Generated", "Rare", etc.
  value?: string // Optional: override selected value (fallback to `text`)
}

export interface ChoiceEntry {
  label: string
  model: SupportedModel
  options: ChoiceOption[]
  selected: string | null
  custom: string
  icon?: string // Optional: shown in tabs or UI header for the choice category
  imagePrompt?: string // Optional: fallback image prompt for this label
  groupTitle?: string // Optional: used to group/label similar entries (like tabs)
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

  function buildKey(label: string, model: SupportedModel): ChoiceKey {
    return `${model}:${label}`
  }

  function initialize() {
    try {
      allSeeds.forEach(({ label, model, options }: ChoiceEntry) => {
        registerChoice(label, model, options)
      })
    } catch (err) {
      console.error('Error loading seed choices', err)
    }
  }

  function registerChoice(
    label: string,
    model: SupportedModel,
    options: ChoiceOption[],
  ) {
    const key = buildKey(label, model)
    entries.value[key] = {
      label,
      model,
      options,
      selected: null,
      custom: '',
    }
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
    if (entry) {
      entry.selected = value
    }
  }

  function setCustomChoice(
    label: string,
    value: string,
    model?: SupportedModel,
  ) {
    const entry = getChoice(label, model)
    if (entry) {
      entry.custom = value
      entry.selected = value
    }
  }

  function getValue(label: string, model?: SupportedModel): string | null {
    const entry = getChoice(label, model)
    return entry?.selected || null
  }

  function applyToForm<T extends Record<string, any>>(
    form: Partial<T>,
    label: string,
    model: SupportedModel,
  ): Partial<T> {
    const entry = getChoice(label, model)
    if (entry && entry.selected) {
      form[label as keyof T] = entry.selected as any
    }
    return form
  }

  return {
    entries,
    initialize,
    registerChoice,
    getChoice,
    selectChoice,
    setCustomChoice,
    getValue,
    applyToForm,
  }
})
