// /server/api/chatgpt/utils/actionRunner.ts
import { type ChatGptActionHeaders, fail } from './access'
import {
  getIdInput,
  getListInput,
  translateCreateInput,
  translateUpdateInput,
} from './actionGlossary'
import { getActionContract, getModelContract, listActions } from './metaService'
import { runRegistryAction } from './actionRegistry'
import { uploadChatGptAsset } from './assetService'
import { createArtCollectionFromAction } from './collectionService'
import { createWorldContentBundle } from './worldBundleService'
import { isRecord } from './validate'

type RegistryListModel =
  | 'Art'
  | 'Bot'
  | 'Character'
  | 'Dream'
  | 'Gallery'
  | 'Scenario'

function requireInput(input: unknown) {
  if (!isRecord(input)) {
    fail('Input must be an object', 400)
  }

  return input
}

function getOptionalId(input: Record<string, unknown>) {
  const value = input.id
  const id = typeof value === 'number' ? value : Number(value)

  return Number.isFinite(id) && id > 0 ? id : null
}

function getOptionalSlug(input: Record<string, unknown>) {
  const value = input.slug

  if (typeof value !== 'string') return null

  const slug = value.trim()

  return slug || null
}

function getView(input: Record<string, unknown>, fallback = 'card') {
  const value = input.view

  if (
    value === 'minimal' ||
    value === 'card' ||
    value === 'detail' ||
    value === 'full'
  ) {
    return value
  }

  return fallback
}

function buildListPayload(
  model: RegistryListModel,
  input: Record<string, unknown>,
  fallbackView = 'card',
) {
  const listInput = getListInput(input)
  const where: Record<string, unknown> = isRecord(listInput.where)
    ? { ...listInput.where }
    : {}

  if (typeof input.slug === 'string' && input.slug.trim()) {
    where.slug = input.slug.trim()
  }

  if (typeof input.title === 'string' && input.title.trim()) {
    where.title = input.title.trim()
  }

  if (typeof input.name === 'string' && input.name.trim()) {
    where.name = input.name.trim()
  }

  return {
    model,
    where,
    take: listInput.take,
    skip: listInput.skip,
    view: getView(input, fallbackView),
  }
}

async function getPublicByIdOrSlug(
  model: RegistryListModel,
  input: Record<string, unknown>,
  headers: ChatGptActionHeaders,
  fallbackView = 'detail',
) {
  const id = getOptionalId(input)

  if (id) {
    return runRegistryAction(
      'kr.get',
      {
        model,
        id,
        view: getView(input, fallbackView),
      },
      headers,
    )
  }

  const slug = getOptionalSlug(input)

  if (slug) {
    return runRegistryAction(
      'kr.list',
      {
        model,
        where: {
          slug,
        },
        take: 1,
        skip: 0,
        view: getView(input, fallbackView),
      },
      headers,
    )
  }

  return runRegistryAction(
    'kr.get',
    {
      model,
      id: getIdInput(input),
      view: getView(input, fallbackView),
    },
    headers,
  )
}

export async function runPublicAction(
  action: string,
  rawInput: unknown,
  headers: ChatGptActionHeaders,
) {
  const input = requireInput(rawInput)

  switch (action) {
    case 'meta.listActions':
      return listActions()

    case 'meta.getActionContract':
      return getActionContract(input)

    case 'meta.getModelContract':
      return getModelContract(input)

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

    case 'dream.getFull': {
      const id = getIdInput(input)

      return runRegistryAction(
        'kr.get',
        {
          model: 'Dream',
          id,
          view: 'full',
        },
        headers,
      )
    }

    case 'dream.getPublic':
      return getPublicByIdOrSlug('Dream', input, headers, 'detail')

    case 'dream.listPublic':
      return runRegistryAction(
        'kr.list',
        buildListPayload('Dream', input, 'card'),
        headers,
      )

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
          view: getView(input, 'detail'),
        },
        headers,
      )
    }

    case 'art.listPublic':
      return runRegistryAction(
        'kr.list',
        buildListPayload('Art', input, 'card'),
        headers,
      )

    case 'character.create': {
      const translated = translateCreateInput('character.create', input)

      return runRegistryAction('kr.create', translated, headers)
    }

    case 'character.listPublic':
      return runRegistryAction(
        'kr.list',
        buildListPayload('Character', input, 'card'),
        headers,
      )

    case 'scenario.create': {
      const translated = translateCreateInput('scenario.create', input)

      return runRegistryAction('kr.create', translated, headers)
    }

    case 'scenario.listPublic':
      return runRegistryAction(
        'kr.list',
        buildListPayload('Scenario', input, 'card'),
        headers,
      )

    case 'gallery.listPublic':
      return runRegistryAction(
        'kr.list',
        buildListPayload('Gallery', input, 'card'),
        headers,
      )

    case 'bot.create': {
      const translated = translateCreateInput('bot.create', input)

      return runRegistryAction('kr.create', translated, headers)
    }

    case 'bot.listPublic':
      return runRegistryAction(
        'kr.list',
        buildListPayload('Bot', input, 'card'),
        headers,
      )

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
