import { readFileSync, writeFileSync } from 'node:fs'

function replaceExact(path, target, replacement, label) {
  const source = readFileSync(path, 'utf8')
  const newline = source.includes('\r\n') ? '\r\n' : '\n'
  const normalized = source.replace(/\r\n/g, '\n')

  if (!normalized.includes(target)) {
    throw new Error(`Expected ${label} was not found in ${path}.`)
  }

  writeFileSync(
    path,
    normalized.replace(target, replacement).replace(/\n/g, newline),
    'utf8',
  )
}

replaceExact(
  'stores/helpers/chatHelper.ts',
  `export interface AddChatInput {
  content: string
  userId: number
  botId?: number | null
  botName?: string | null
  recipientId: number | null
  recipient?: string | null
  isPublic?: boolean
  originId?: number | null
  previousEntryId?: number | null
  promptId?: number | null
  botResponse?: string | null
  type: ChatType
  characterId: number | null
  username: string
  channel?: string | null
  sender?: string | null
  serverId?: number | null
  serverName?: string | null
  dreamId?: number | null
  projectId?: number | null
}`,
  `export interface AddChatInput {
  content: string
  userId: number
  botId?: number | null
  botName?: string | null
  recipientId: number | null
  recipient?: string | null
  isPublic?: boolean
  originId?: number | null
  previousEntryId?: number | null
  promptId?: number | null
  botResponse?: string | null
  type: ChatType
  characterId: number | null
  username: string
  channel?: string | null
  sender?: string | null
  serverId?: number | null
  serverName?: string | null
  dreamId?: number | null
  projectId?: number | null
}

type ChatCreateRequest = Pick<
  Chat,
  | 'type'
  | 'sender'
  | 'recipient'
  | 'content'
  | 'title'
  | 'isPublic'
  | 'isFavorite'
  | 'previousEntryId'
  | 'originId'
  | 'botId'
  | 'recipientId'
  | 'artImageId'
  | 'promptId'
  | 'botName'
  | 'channel'
  | 'botResponse'
  | 'characterId'
  | 'isRead'
  | 'isMature'
  | 'serverId'
  | 'serverName'
  | 'dreamId'
  | 'isActive'
  | 'projectId'
>

type ChatPatchRequest = Partial<
  Omit<ChatCreateRequest, 'projectId'>
>`,
  'Chat request payload types',
)

replaceExact(
  'stores/helpers/chatHelper.ts',
  `export async function createChat(
  chat: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Chat> {
  const response = await performFetch<Chat>('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chat),
  })`,
  `export async function createChat(
  chat: Omit<Chat, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Chat> {
  const payload: ChatCreateRequest = {
    type: chat.type,
    sender: chat.sender,
    recipient: chat.recipient,
    content: chat.content,
    title: chat.title,
    isPublic: chat.isPublic,
    isFavorite: chat.isFavorite,
    previousEntryId: chat.previousEntryId,
    originId: chat.originId,
    botId: chat.botId,
    recipientId: chat.recipientId,
    artImageId: chat.artImageId,
    promptId: chat.promptId,
    botName: chat.botName,
    channel: chat.channel,
    botResponse: chat.botResponse,
    characterId: chat.characterId,
    isRead: chat.isRead,
    isMature: chat.isMature,
    serverId: chat.serverId,
    serverName: chat.serverName,
    dreamId: chat.dreamId,
    isActive: chat.isActive,
    projectId: chat.projectId,
  }

  const response = await performFetch<Chat>('/api/chats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })`,
  'Chat create request sanitation',
)

replaceExact(
  'stores/helpers/chatHelper.ts',
  `export async function patchChat(
  chatId: number,
  data: Partial<Chat>,
): Promise<Chat> {
  const response = await performFetch<Chat>(\`/api/chats/\${chatId}\`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })`,
  `export async function patchChat(
  chatId: number,
  data: Partial<Chat>,
): Promise<Chat> {
  const payload: ChatPatchRequest = {
    type: data.type,
    sender: data.sender,
    recipient: data.recipient,
    content: data.content,
    title: data.title,
    isPublic: data.isPublic,
    isFavorite: data.isFavorite,
    previousEntryId: data.previousEntryId,
    originId: data.originId,
    botId: data.botId,
    recipientId: data.recipientId,
    artImageId: data.artImageId,
    promptId: data.promptId,
    botName: data.botName,
    channel: data.channel,
    botResponse: data.botResponse,
    characterId: data.characterId,
    isRead: data.isRead,
    isMature: data.isMature,
    serverId: data.serverId,
    serverName: data.serverName,
    dreamId: data.dreamId,
    isActive: data.isActive,
  }

  const response = await performFetch<Chat>(\`/api/chats/\${chatId}\`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })`,
  'Chat patch request sanitation',
)

replaceExact(
  'cypress/e2e/api/chats.cy.ts',
  `  let chatId: number | null = null

  before(() => {`,
  `  let chatId: number | null = null

  function expectLeanMutation(chat: Record<string, unknown>) {
    for (const relation of [
      'User',
      'Bot',
      'Character',
      'Prompt',
      'ArtImage',
      'Dream',
      'Project',
      'Server',
    ]) {
      expect(chat).to.not.have.property(relation)
    }
  }

  before(() => {`,
  'Chat lean mutation assertion helper',
)

for (const target of [
  `      content: 'Hello, AMI!',
      userId,
      botId,`,
  `      content: 'Hello, AMI!',
      userId,
      botId,`,
]) {
  replaceExact(
    'cypress/e2e/api/chats.cy.ts',
    target,
    `      content: 'Hello, AMI!',
      botId,`,
    'unauthenticated Chat body identity',
  )
}

replaceExact(
  'cypress/e2e/api/chats.cy.ts',
  `        promptId: null,
        botName: 'AMI',
        userId,
      },`,
  `        promptId: null,
        botName: 'AMI',
      },`,
  'authenticated Chat body identity',
)

replaceExact(
  'cypress/e2e/api/chats.cy.ts',
  `  it('Create a new Chat with valid authentication', () => {`,
  `  it('rejects caller-owned Chat identity and timestamps', () => {
    makeRequest('POST', baseUrl, userJwt, {
      type: 'ToBot',
      sender: 'forged-user',
      content: 'This request should be rejected.',
      userId,
      createdAt: '2000-01-01T00:00:00.000Z',
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.match(/unsupported chat fields/i)
    })
  })

  it('Create a new Chat with valid authentication', () => {`,
  'Chat create identity rejection test',
)

replaceExact(
  'cypress/e2e/api/chats.cy.ts',
  `      expect(response.body.data).to.be.an('object').that.is.not.empty

      chatId = response.body.data.id`,
  `      expect(response.body.data).to.be.an('object').that.is.not.empty
      expect(response.body.data.userId).to.eq(userId)
      expectLeanMutation(response.body.data)

      chatId = response.body.data.id`,
  'Chat create ownership and lean assertions',
)

replaceExact(
  'cypress/e2e/api/chats.cy.ts',
  `      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('isFavorite', true)
    })
  })`,
  `      expect(response.body).to.have.property('success', true)
      expect(response.body.data).to.have.property('isFavorite', true)
      expectLeanMutation(response.body.data)
    })
  })

  it('rejects server-owned and unknown Chat PATCH fields', () => {
    expect(chatId).to.not.eq(null)

    makeRequest('PATCH', \`${'${baseUrl}'}/${'${chatId}'}\`, userJwt, {
      userId,
      updatedAt: '2000-01-01T00:00:00.000Z',
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.match(/unsupported chat fields/i)
    })
  })`,
  'Chat patch lean and protected-field assertions',
)

replaceExact(
  'cypress/e2e/api/relationships.cy.ts',
  `          title: \`Cypress Chat \${time}\`,
          userId,
          botId: id('bot'),`,
  `          title: \`Cypress Chat \${time}\`,
          botId: id('bot'),`,
  'relationship Chat body identity',
)
