import { readFileSync, writeFileSync } from 'node:fs'

function migrate(path, replacements) {
  const source = readFileSync(path, 'utf8')
  const newline = source.includes('\r\n') ? '\r\n' : '\n'
  let updated = source.replace(/\r\n/g, '\n')

  for (const { target, replacement, label } of replacements) {
    if (!updated.includes(target)) {
      throw new Error(`Expected ${label} was not found in ${path}.`)
    }
    updated = updated.replace(target, replacement)
  }

  writeFileSync(path, updated.replace(/\n/g, newline), 'utf8')
}

migrate('stores/botStore.ts', [
  {
    label: 'Bot record merge import',
    target: `import { loadSnapshot, markSnapshotActive } from './helpers/snapshotLoader'
import { useServerStore } from './serverStore'`,
    replacement: `import { loadSnapshot, markSnapshotActive } from './helpers/snapshotLoader'
import {
  mergeDefinedRecord,
  reconcileRecordsById,
} from './helpers/recordMerge'
import { useServerStore } from './serverStore'`,
  },
  {
    label: 'Bot detail-preserving upsert',
    target: `  function upsertBot(bot: Bot): void {
    const index = bots.value.findIndex((entry: Bot) => entry.id === bot.id)

    if (index >= 0) {
      bots.value.splice(index, 1, bot)
    } else {
      bots.value.push(bot)
    }

    bots.value.sort(sortBots)
    persist()
  }`,
    replacement: `  function upsertBot(bot: Bot): Bot {
    const index = bots.value.findIndex((entry: Bot) => entry.id === bot.id)
    const existing =
      currentBot.value?.id === bot.id
        ? currentBot.value
        : index >= 0
          ? bots.value[index]
          : undefined
    const merged = mergeDefinedRecord(existing, bot)

    if (index >= 0) {
      bots.value.splice(index, 1, merged)
    } else {
      bots.value.push(merged)
    }

    if (currentBot.value?.id === merged.id) currentBot.value = merged
    bots.value.sort(sortBots)
    persist()
    return merged
  }`,
  },
  {
    label: 'Bot fetch dedupe order',
    target: `  async function fetchBots(force = false): Promise<Bot[]> {
    if (!force && isLoaded.value && bots.value.length > 0) {
      return bots.value
    }

    if (fetchBotsPromise.value && !force) {
      return fetchBotsPromise.value
    }`,
    replacement: `  async function fetchBots(force = false): Promise<Bot[]> {
    if (fetchBotsPromise.value) return fetchBotsPromise.value
    if (!force && isLoaded.value && bots.value.length > 0) {
      return bots.value
    }`,
  },
  {
    label: 'Bot authoritative list reconciliation',
    target: `        bots.value = fetched.slice().sort(sortBots)
        isLoaded.value = true`,
    replacement: `        bots.value = reconcileRecordsById(bots.value, fetched).sort(sortBots)
        isLoaded.value = true`,
  },
  {
    label: 'Bot update merged selection',
    target: `      if (updated) {
        upsertBot(updated)
        currentBot.value = updated
        botForm.value = toBotForm(updated)
        currentImagePath.value = updated.avatarImage || ''
        persist()
      }

      return updated`,
    replacement: `      if (updated) {
        const merged = upsertBot(updated)
        currentBot.value = merged
        botForm.value = toBotForm(merged)
        currentImagePath.value = merged.avatarImage || ''
        persist()
        return merged
      }

      return null`,
  },
  {
    label: 'Bot single create merged return',
    target: `      if (newBot) {
        upsertBot(newBot)
      }

      return newBot`,
    replacement: `      if (newBot) {
        return upsertBot(newBot)
      }

      return null`,
  },
  {
    label: 'Bot detail load merged state',
    target: `        if (bot) {
          upsertBot(bot)
          currentBot.value = bot
          botForm.value = toBotForm(bot)
          currentImagePath.value = bot.avatarImage ?? ''
          persist()
        }

        return bot`,
    replacement: `        if (bot) {
          const merged = upsertBot(bot)
          currentBot.value = merged
          botForm.value = toBotForm(merged)
          currentImagePath.value = merged.avatarImage ?? ''
          persist()
          return merged
        }

        return null`,
  },
])

migrate('stores/characterStore.ts', [
  {
    label: 'Character record merge import',
    target: `} from '@/stores/helpers/snapshotLoader'
import { useArtStore } from '@/stores/artStore'`,
    replacement: `} from '@/stores/helpers/snapshotLoader'
import {
  mergeDefinedRecord,
  reconcileRecordsById,
} from '@/stores/helpers/recordMerge'
import { useArtStore } from '@/stores/artStore'`,
  },
  {
    label: 'Character fetch dedupe order',
    target: `  async function fetchCharacters(force = false): Promise<Character[]> {
    if (!force && hasLoaded.value) {
      return characters.value
    }

    if (fetchPromise.value && !force) {
      return fetchPromise.value
    }`,
    replacement: `  async function fetchCharacters(force = false): Promise<Character[]> {
    if (fetchPromise.value) return fetchPromise.value
    if (!force && hasLoaded.value) {
      return characters.value
    }`,
  },
  {
    label: 'Character authoritative list reconciliation',
    target: `          characters.value = response.data.slice().sort(sortCharacters)
          hasLoaded.value = true`,
    replacement: `          characters.value = reconcileRecordsById(
            characters.value,
            response.data,
          ).sort(sortCharacters)
          hasLoaded.value = true`,
  },
  {
    label: 'Character detail-preserving upsert',
    target: `  function upsertCharacter(character: Character) {
    const index = characters.value.findIndex(
      (entry) => entry.id === character.id,
    )

    if (index >= 0) {
      characters.value.splice(index, 1, character)
    } else {
      characters.value.push(character)
    }

    characters.value.sort(sortCharacters)
    syncToLocalStorage()
  }`,
    replacement: `  function upsertCharacter(character: Character): Character {
    const index = characters.value.findIndex(
      (entry) => entry.id === character.id,
    )
    const existing =
      selectedCharacter.value?.id === character.id
        ? selectedCharacter.value
        : index >= 0
          ? characters.value[index]
          : undefined
    const merged = mergeDefinedRecord(existing, character)

    if (index >= 0) {
      characters.value.splice(index, 1, merged)
    } else {
      characters.value.push(merged)
    }

    if (selectedCharacter.value?.id === merged.id) {
      selectedCharacter.value = merged
    }
    characters.value.sort(sortCharacters)
    syncToLocalStorage()
    return merged
  }`,
  },
  {
    label: 'Character detail fetch merged return',
    target: `      if (response.success && response.data) {
        upsertCharacter(response.data)
        return response.data
      }`,
    replacement: `      if (response.success && response.data) {
        return upsertCharacter(response.data)
      }`,
  },
  {
    label: 'Character create merged state',
    target: `      if (response.success && response.data) {
        upsertCharacter(response.data)
        selectedCharacter.value = response.data
        characterForm.value = toCharacterForm(response.data)
        await updateArtImagePath()

        return response.data
      }`,
    replacement: `      if (response.success && response.data) {
        const merged = upsertCharacter(response.data)
        selectedCharacter.value = merged
        characterForm.value = toCharacterForm(merged)
        await updateArtImagePath()

        return merged
      }`,
  },
  {
    label: 'Character update merged state',
    target: `      if (response.success && response.data) {
        upsertCharacter(response.data)
        selectedCharacter.value = response.data
        characterForm.value = toCharacterForm(response.data)
        await updateArtImagePath()

        return response.data
      }`,
    replacement: `      if (response.success && response.data) {
        const merged = upsertCharacter(response.data)
        selectedCharacter.value = merged
        characterForm.value = toCharacterForm(merged)
        await updateArtImagePath()

        return merged
      }`,
  },
])

migrate('stores/promptStore.ts', [
  {
    label: 'Prompt record merge import',
    target: `import { loadSnapshot, markSnapshotActive } from './helpers/snapshotLoader'
import { useUserStore } from './userStore'`,
    replacement: `import { loadSnapshot, markSnapshotActive } from './helpers/snapshotLoader'
import {
  mergeDefinedRecord,
  reconcileRecordsById,
} from './helpers/recordMerge'
import { useUserStore } from './userStore'`,
  },
  {
    label: 'Prompt detail-preserving upsert',
    target: `  function upsertPrompt(prompt: Prompt): Prompt {
    const index = prompts.value.findIndex((entry) => entry.id === prompt.id)

    if (index >= 0) {
      prompts.value.splice(index, 1, prompt)
    } else {
      prompts.value.push(prompt)
    }

    prompts.value.sort(sortPrompts)

    if (selectedPrompt.value?.id === prompt.id) {
      selectedPrompt.value = prompt
    }

    if (promptForm.value.id === prompt.id) {
      promptForm.value = normalizePromptForm(prompt as PromptForm)
    }

    syncToLocalStorage()

    return prompt
  }`,
    replacement: `  function upsertPrompt(prompt: Prompt): Prompt {
    const index = prompts.value.findIndex((entry) => entry.id === prompt.id)
    const existing =
      selectedPrompt.value?.id === prompt.id
        ? selectedPrompt.value
        : index >= 0
          ? prompts.value[index]
          : undefined
    const merged = mergeDefinedRecord(existing, prompt)

    if (index >= 0) {
      prompts.value.splice(index, 1, merged)
    } else {
      prompts.value.push(merged)
    }

    prompts.value.sort(sortPrompts)

    if (selectedPrompt.value?.id === merged.id) {
      selectedPrompt.value = merged
    }

    if (promptForm.value.id === merged.id) {
      promptForm.value = normalizePromptForm(merged as PromptForm)
    }

    syncToLocalStorage()

    return merged
  }`,
  },
  {
    label: 'Prompt fetch dedupe order',
    target: `  async function fetchPrompts(force = false): Promise<Prompt[]> {
    if (!force && hasLoaded.value && prompts.value.length) return prompts.value
    if (fetchPromise.value && !force) return fetchPromise.value`,
    replacement: `  async function fetchPrompts(force = false): Promise<Prompt[]> {
    if (fetchPromise.value) return fetchPromise.value
    if (!force && hasLoaded.value && prompts.value.length) return prompts.value`,
  },
  {
    label: 'Prompt authoritative list reconciliation',
    target: `        prompts.value = response.data.slice().sort(sortPrompts)
        hasLoaded.value = true`,
    replacement: `        prompts.value = reconcileRecordsById(
          prompts.value,
          response.data,
        ).sort(sortPrompts)
        hasLoaded.value = true`,
  },
  {
    label: 'Prompt failed refresh cache preservation',
    target: `      } catch (error) {
        hasLoaded.value = false
        handleError(error, 'fetching prompts')`,
    replacement: `      } catch (error) {
        handleError(error, 'fetching prompts')`,
  },
])
