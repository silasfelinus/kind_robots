// /utils/reactions/firstPartyReactionAuthor.ts
export type FirstPartyReactionAuthorKind = 'BOT' | 'CHARACTER'

export type FirstPartyReactionAuthor = {
  kind: FirstPartyReactionAuthorKind
  id: number
  name: string
  avatarImage: string | null
  role: string | null
}

type AuthorEntity = {
  id: number
  name?: string | null
  avatarImage?: string | null
  imagePath?: string | null
  BotType?: string | null
  characterType?: string | null
}

export type FirstPartyReactionAuthorSource = {
  authorBotId?: number | null
  authorCharacterId?: number | null
  AuthorBot?: AuthorEntity | null
  AuthorCharacter?: AuthorEntity | null
}

function positiveId(value: unknown): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function publicName(entity: AuthorEntity, fallback: string): string {
  return entity.name?.trim() || fallback
}

function publicAvatar(entity: AuthorEntity): string | null {
  return entity.avatarImage?.trim() || entity.imagePath?.trim() || null
}

export function assertSingleFirstPartyReactionAuthor(
  source: Pick<FirstPartyReactionAuthorSource, 'authorBotId' | 'authorCharacterId'>,
): void {
  if (positiveId(source.authorBotId) && positiveId(source.authorCharacterId)) {
    throw new Error('A Reaction cannot have both a Bot and Character display author.')
  }
}

export function firstPartyReactionAuthor(
  source: FirstPartyReactionAuthorSource,
): FirstPartyReactionAuthor | null {
  assertSingleFirstPartyReactionAuthor(source)

  const botId = positiveId(source.authorBotId)
  if (botId) {
    if (!source.AuthorBot || source.AuthorBot.id !== botId) return null

    return {
      kind: 'BOT',
      id: botId,
      name: publicName(source.AuthorBot, `Bot #${botId}`),
      avatarImage: publicAvatar(source.AuthorBot),
      role: source.AuthorBot.BotType?.trim() || 'BOT',
    }
  }

  const characterId = positiveId(source.authorCharacterId)
  if (characterId) {
    if (!source.AuthorCharacter || source.AuthorCharacter.id !== characterId) {
      return null
    }

    return {
      kind: 'CHARACTER',
      id: characterId,
      name: publicName(source.AuthorCharacter, `Character #${characterId}`),
      avatarImage: publicAvatar(source.AuthorCharacter),
      role: source.AuthorCharacter.characterType?.trim() || 'CHARACTER',
    }
  }

  return null
}
