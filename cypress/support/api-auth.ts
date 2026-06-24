type CypressApiEnv = {
  API_KEY?: string
  BETA_ADMIN_TOKEN?: string
  BASE_API_URL?: string
}

type ApiResponse<T = unknown> = {
  success?: boolean
  message?: string
  data?: T
  token?: string
  user?: {
    id?: number
    token?: string
  }
}

type RegisterUserData = {
  id?: number
}

export type TestUserAuth = {
  id: number
  username: string
  email: string
  password: string
  token: string
}

export type TestUserRole = 'primary' | 'second' | 'third'

export type CreateLoggedInTestUserOptions = {
  /**
   * Use a brand-new disposable remote user instead of the shared per-run seed user.
   * Keep this for tests that are specifically about registration, deletion, or hard
   * ownership isolation. Most API specs should use the shared seed for speed.
   */
  fresh?: boolean
  /** Pick a stable seed user. When omitted, calls cycle primary -> second -> third. */
  role?: TestUserRole
}

export const defaultApiBase = 'https://kind-robots.vercel.app/api'
export const defaultTestPassword = 'testtest12'

let seedUserCursor = 0

export const jsonHeaders = () => ({
  Accept: 'application/json',
  'Content-Type': 'application/json',
})

export const bearerHeaders = (token: string) => ({
  ...jsonHeaders(),
  Authorization: `Bearer ${token}`,
})

export const invalidBearerHeaders = () => bearerHeaders('invalid-cypress-token')

export const adminHeaders = (token: string) => ({
  ...jsonHeaders(),
  'x-api-key': token,
})

export const apiKeyHeaders = (token: string) => adminHeaders(token)

const bodyNumber = (value: unknown): number | undefined => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const seedUserForRole = (seed: {
  user: TestUserAuth
  secondUser: TestUserAuth
  thirdUser: TestUserAuth
}, role?: TestUserRole) => {
  if (role === 'primary') return seed.user
  if (role === 'second') return seed.secondUser
  if (role === 'third') return seed.thirdUser

  const users = [seed.user, seed.secondUser, seed.thirdUser]
  const user = users[seedUserCursor % users.length]
  seedUserCursor += 1

  return user
}

export const resetSeedUserCursor = () => {
  seedUserCursor = 0
}

export const getApiEnv = () =>
  cy.env(['API_KEY', 'BETA_ADMIN_TOKEN', 'BASE_API_URL']).then((env: CypressApiEnv) => {
    const apiBase = String(env.BASE_API_URL || defaultApiBase).replace(/\/+$/, '')
    const adminToken = String(env.BETA_ADMIN_TOKEN || env.API_KEY || '')

    expect(apiBase, 'api base').to.be.a('string').and.not.be.empty
    expect(adminToken, 'API_KEY or BETA_ADMIN_TOKEN').to.be.a('string').and.not.be.empty

    return { apiBase, adminToken }
  })

export const extractToken = (body: ApiResponse): string => {
  const data = body.data && typeof body.data === 'object' ? dataFromBody(body) : {}
  const token = String(data.token || body.token || body.user?.token || '')

  expect(token, 'login token').to.be.a('string').and.have.length.greaterThan(20)

  return token
}

const dataFromBody = (body: ApiResponse) => body.data as Record<string, unknown>

export const extractUserId = (body: ApiResponse<RegisterUserData>): number => {
  const data = body.data && typeof body.data === 'object' ? body.data : {}
  const id = bodyNumber(body.user?.id) || bodyNumber(data.id)

  expect(id, 'registered user id').to.be.a('number')

  return id as number
}

export const getSeedTestUser = (role?: TestUserRole) =>
  cy.task<{
    user: TestUserAuth
    secondUser: TestUserAuth
    thirdUser: TestUserAuth
  }>('cypressSeed:get').then((seed) => seedUserForRole(seed, role))

export const createFreshLoggedInTestUser = () =>
  getApiEnv().then(({ apiBase, adminToken }) => {
    const stamp = `${Date.now()}-${Cypress._.random(1000, 9999)}`
    const username = `cypress-user-${stamp}`
    const email = `${username}@example.com`
    const password = defaultTestPassword

    return cy
      .request<ApiResponse<RegisterUserData>>({
        method: 'POST',
        url: `${apiBase}/users/register`,
        headers: adminHeaders(adminToken),
        body: {
          username,
          email,
          password,
        },
        failOnStatusCode: false,
      })
      .then((registerResponse) => {
        expect(registerResponse.status, JSON.stringify(registerResponse.body)).to.be.oneOf([200, 201])

        const id = extractUserId(registerResponse.body)

        return cy
          .request<ApiResponse>({
            method: 'POST',
            url: `${apiBase}/auth/login`,
            headers: jsonHeaders(),
            body: {
              username,
              password,
            },
            failOnStatusCode: false,
          })
          .then((loginResponse) => {
            expect(loginResponse.status, JSON.stringify(loginResponse.body)).to.eq(200)
            expect(loginResponse.body.success, JSON.stringify(loginResponse.body)).to.eq(true)

            const token = extractToken(loginResponse.body)

            return {
              id,
              username,
              email,
              password,
              token,
            } satisfies TestUserAuth
          })
      })
  })

export const createLoggedInTestUser = (options: CreateLoggedInTestUserOptions = {}) => {
  if (options.fresh) return createFreshLoggedInTestUser()

  return getSeedTestUser(options.role)
}

export const deleteTestUser = (apiBase: string, adminToken: string, userId?: number) => {
  if (!userId) {
    return cy.wrap(null)
  }

  return cy.task<boolean>('cypressSeed:isSeedUser', userId).then((isSeedUser) => {
    if (isSeedUser) return null

    return cy.request({
      method: 'DELETE',
      url: `${apiBase}/users/${userId}`,
      headers: adminHeaders(adminToken),
      failOnStatusCode: false,
    })
  })
}
