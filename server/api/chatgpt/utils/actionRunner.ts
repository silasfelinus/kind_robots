// /server/api/chatgpt/utils/actionRunner.ts
import { type ChatGptActionHeaders, fail } from './access'
import {
  getIdInput,
  getListInput,
  translateCreateInput,
  translateUpdateInput,
} from './actionGlossary'
import {
  listActionContracts,
  getActionContract,
  getModelContract,
} from './metaService'
import { runRegistryAction } from './actionRegistry'
import { uploadChatGptAsset } from './assetService'
import { createArtCollectionFromAction } from './collectionService'
import { createWorldContentBundle } from './worldBundleService'
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

  switch (action) {
    case 'dream.createLocation': {
      const translated = translateCreateInput('dream.createLocation', input)

      return runRegistryAction('kr.create', translated, headers)
    }

    case 'dream.updateMine': {
      const translated = translateUpdateInput('dream.updateMine', input)

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

    case 'meta.listActions':
      return listActionContracts()

    case 'meta.getActionContract':
      return getActionContract(input)

    case 'meta.getModelContract':
      return getModelContract(input)

    case 'art.createPrompt': {
      const translated = translateCreateInput('art.createPrompt', input)

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
      const translated = translateCreateInput('character.create', input)

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
      const translated = translateCreateInput('scenario.create', input)

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
      const translated = translateCreateInput('bot.create', input)

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

    case 'asset.uploadImage':
      return uploadChatGptAsset(input, headers)

    case 'collection.createArtCollection':
      return createArtCollectionFromAction(input, headers)

    case 'world.createContentBundle':
      return createWorldContentBundle(input, headers)

    default:
      fail(`Unknown public action: ${action}`, 400)
  }
}
