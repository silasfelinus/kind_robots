// /server/api/chatgpt/_utils/actionRunner.ts
import { type ChatGptActionHeaders, fail } from './access'
import {
  getIdInput,
  getListInput,
  type PublicChatGptAction,
  translateCreateInput,
  translateUpdateInput,
} from './actionGlossary'
import { runRegistryAction } from './actionRegistry'
import { isRecord } from './validate'

function requireInput(input: unknown) {
  if (!isRecord(input)) {
    fail('Input must be an object', 400)
  }

  return input
}

export async function runPublicAction(
  action: string,
  rawInput: unknown,
  headers: ChatGptActionHeaders,
) {
  const input = requireInput(rawInput)
  const publicAction = action as PublicChatGptAction

  switch (publicAction) {
    case 'dream.createLocation': {
      const translated = translateCreateInput(publicAction, input)

      return runRegistryAction('kr.create', translated, headers)
    }

    case 'dream.updateMine': {
      const translated = translateUpdateInput(publicAction, input)

      return runRegistryAction('kr.update', translated, headers)
    }

    case 'dream.deleteMine': {
      const id = getIdInput(input)

      return runRegistryAction(
        'kr.delete',
        {
          model: 'Dream',
          id,
        },
        headers,
      )
    }

    case 'dream.getPublic': {
      const id = getIdInput(input)

      return runRegistryAction(
        'kr.get',
        {
          model: 'Dream',
          id,
          view: input.view ?? 'detail',
        },
        headers,
      )
    }

    case 'dream.listPublic': {
      const listInput = getListInput(input)

      return runRegistryAction(
        'kr.list',
        {
          model: 'Dream',
          where: listInput.where,
          take: listInput.take,
          skip: listInput.skip,
          view: input.view ?? 'card',
        },
        headers,
      )
    }

    case 'art.createPrompt': {
      const translated = translateCreateInput(publicAction, input)

      return runRegistryAction('kr.create', translated, headers)
    }

    case 'art.getPublic': {
      const id = getIdInput(input)

      return runRegistryAction(
        'kr.get',
        {
          model: 'Art',
          id,
          view: input.view ?? 'detail',
        },
        headers,
      )
    }

    case 'art.listPublic': {
      const listInput = getListInput(input)

      return runRegistryAction(
        'kr.list',
        {
          model: 'Art',
          where: listInput.where,
          take: listInput.take,
          skip: listInput.skip,
          view: input.view ?? 'card',
        },
        headers,
      )
    }

    case 'character.create': {
      const translated = translateCreateInput(publicAction, input)

      return runRegistryAction('kr.create', translated, headers)
    }

    case 'character.listPublic': {
      const listInput = getListInput(input)

      return runRegistryAction(
        'kr.list',
        {
          model: 'Character',
          where: listInput.where,
          take: listInput.take,
          skip: listInput.skip,
          view: input.view ?? 'card',
        },
        headers,
      )
    }

    case 'scenario.create': {
      const translated = translateCreateInput(publicAction, input)

      return runRegistryAction('kr.create', translated, headers)
    }

    case 'scenario.listPublic': {
      const listInput = getListInput(input)

      return runRegistryAction(
        'kr.list',
        {
          model: 'Scenario',
          where: listInput.where,
          take: listInput.take,
          skip: listInput.skip,
          view: input.view ?? 'card',
        },
        headers,
      )
    }

    case 'gallery.listPublic': {
      const listInput = getListInput(input)

      return runRegistryAction(
        'kr.list',
        {
          model: 'Gallery',
          where: listInput.where,
          take: listInput.take,
          skip: listInput.skip,
          view: input.view ?? 'card',
        },
        headers,
      )
    }

    case 'bot.create': {
      const translated = translateCreateInput(publicAction, input)

      return runRegistryAction('kr.create', translated, headers)
    }

    case 'bot.listPublic': {
      const listInput = getListInput(input)

      return runRegistryAction(
        'kr.list',
        {
          model: 'Bot',
          where: listInput.where,
          take: listInput.take,
          skip: listInput.skip,
          view: input.view ?? 'card',
        },
        headers,
      )
    }

    default:
      fail(`Unknown public action: ${action}`, 400)
  }
}
