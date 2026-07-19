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
  'stores/chatStore.ts',
  `function chatHasUserId(chat: Chat, userId: number): boolean {
  return chat.userId === userId || chat.recipientId === userId
}`,
  `function chatHasUserId(chat: Chat, userId: number): boolean {
  return chat.userId === userId || chat.recipientId === userId
}

function replaceUserChatScope(
  existing: Chat[],
  incoming: Chat[],
  userId: number,
): Chat[] {
  const preserved = existing.filter((chat) => !chatHasUserId(chat, userId))
  const incomingById = new Map(incoming.map((chat) => [chat.id, chat]))

  return [...preserved, ...incomingById.values()].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}`,
  'Chat user-scope replacement helper',
)

replaceExact(
  'stores/chatStore.ts',
  `        const data = await fetchChatsForUser(userId)
        chats.value = data
        lastFetchedUserId.value = userId`,
  `        const data = await fetchChatsForUser(userId)
        chats.value = replaceUserChatScope(chats.value, data, userId)
        lastFetchedUserId.value = userId`,
  'Chat scoped fetch replacement',
)

replaceExact(
  'cypress/e2e/api/chats.cy.ts',
  `        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body.data)
          .to.be.an('array')
          .and.have.length.greaterThan(0)
      },
    )
  })

  it('Get Chats by Bot ID', () => {`,
  `        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('success', true)
        expect(response.body.statusCode).to.eq(200)
        expect(response.body.data)
          .to.be.an('array')
          .and.have.length.greaterThan(0)
      },
    )
  })

  it('returns real status codes for invalid and cross-user Chat lists', () => {
    makeRequest('GET', \`${'${baseUrl}'}/user/0\`, userJwt).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.statusCode).to.eq(400)
    })

    makeRequest('GET', \`${'${baseUrl}'}/user/${'${userId + 1}'}\`, userJwt).then(
      (response) => {
        expect(response.status).to.eq(403)
        expect(response.body.success).to.eq(false)
        expect(response.body.statusCode).to.eq(403)
      },
    )
  })

  it('allows an admin to read another user’s Chat list', () => {
    makeRequest('GET', \`${'${baseUrl}'}/user/${'${userId}'}\`, setupAuth).then(
      (response) => {
        expect(response.status).to.eq(200)
        expect(response.body.success).to.eq(true)
        expect(response.body.statusCode).to.eq(200)
      },
    )
  })

  it('Get Chats by Bot ID', () => {`,
  'Chat user-list status and admin assertions',
)
