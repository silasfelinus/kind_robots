// /utils/scripts/verifyFirstPartyReactionAuthor.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import {
  assertSingleFirstPartyReactionAuthor,
  firstPartyReactionAuthor,
} from '@/utils/reactions/firstPartyReactionAuthor'

assert.equal(firstPartyReactionAuthor({}), null)

assert.deepEqual(
  firstPartyReactionAuthor({
    authorBotId: 7,
    AuthorBot: {
      id: 7,
      name: 'Dotti',
      avatarImage: '/images/bots/dotti.webp',
      BotType: 'NARRATOR',
    },
  }),
  {
    kind: 'BOT',
    id: 7,
    name: 'Dotti',
    avatarImage: '/images/bots/dotti.webp',
    role: 'NARRATOR',
  },
)

assert.deepEqual(
  firstPartyReactionAuthor({
    authorCharacterId: 9,
    AuthorCharacter: {
      id: 9,
      name: 'Catbot',
      imagePath: '/images/characters/catbot.webp',
      characterType: 'MASCOT',
    },
  }),
  {
    kind: 'CHARACTER',
    id: 9,
    name: 'Catbot',
    avatarImage: '/images/characters/catbot.webp',
    role: 'MASCOT',
  },
)

assert.equal(
  firstPartyReactionAuthor({
    authorBotId: 7,
    AuthorBot: { id: 8, name: 'Wrong bot' },
  }),
  null,
  'joined identity must match the stored author id',
)

assert.throws(
  () =>
    assertSingleFirstPartyReactionAuthor({
      authorBotId: 1,
      authorCharacterId: 2,
    }),
  /cannot have both/i,
)

const postSource = await readFile('server/api/reactions/index.post.ts', 'utf8')
assert.doesNotMatch(postSource, /authorBotId/)
assert.doesNotMatch(postSource, /authorCharacterId/)

console.log('First-party Reaction author projection contract passed.')
