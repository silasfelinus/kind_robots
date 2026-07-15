import { bearerHeaders, type TestUserAuth } from './api-auth'

export type CypressApiSeedState = {
  runId: string
  apiBase: string
  adminKey: string
  user: TestUserAuth
  fixtures: Record<string, number | string | boolean | null>
}

export const getApiSeed = () => cy.task<CypressApiSeedState>('cypressSeed:get')

export const getSeedUser = () => getApiSeed().then((seed) => seed.user)

export const seedBearerHeaders = (seed: CypressApiSeedState) =>
  bearerHeaders(seed.user.token)
