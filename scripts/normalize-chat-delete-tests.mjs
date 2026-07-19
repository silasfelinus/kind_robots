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
  'cypress/e2e/api/chats.cy.ts',
  `
  // Auth migration: fresh disposable JWT user
  before(() => {
    createLoggedInTestUser().then((auth) => {
      userId = auth.id
    })
  })
`,
  ``,
  'duplicate Chat test-user setup',
)

replaceExact(
  'cypress/e2e/api/chats.cy.ts',
  `  const baseUrl = 'https://kind-robots.vercel.app/api/chats'`,
  `  let baseUrl = ''`,
  'hard-coded Chat API URL',
)

replaceExact(
  'cypress/e2e/api/chats.cy.ts',
  `      apiBase = env.apiBase
      setupAuth = env.adminToken`,
  `      apiBase = env.apiBase
      baseUrl = \`${'${apiBase}'}/chats\`
      setupAuth = env.adminToken`,
  'environment-resolved Chat API URL',
)

replaceExact(
  'cypress/e2e/api/chats.cy.ts',
  `        expect(response.body.message).to.include(
          \`Communication with ID ${'${chatId}'} successfully deleted\`,
        )

        chatId = null`,
  `        expect(response.body.message).to.include(
          \`Chat with ID ${'${chatId}'} successfully deleted\`,
        )
        expect(response.body.data).to.eq(null)
        expect(response.body.statusCode).to.eq(200)

        chatId = null`,
  'Chat DELETE response assertions',
)

replaceExact(
  'cypress/e2e/api/chats.cy.ts',
  `  it('Delete Chat with Valid Authentication', () => {`,
  `  it('returns real status codes for invalid and missing Chat IDs', () => {
    makeRequest('DELETE', \`${'${baseUrl}'}/0\`, userJwt).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.statusCode).to.eq(400)
      expect(response.body.message).to.match(/invalid chat id/i)
    })
  })

  it('Delete Chat with Valid Authentication', () => {`,
  'Chat DELETE invalid-ID regression test',
)
