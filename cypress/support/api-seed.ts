import {
  bearerHeaders,
  type TestUserAuth,
} from './api-auth'

export type CypressApiSeedState = {
  runId: string
  apiBase: string
  adminKey: string
  user: TestUserAuth
  secondUser: TestUserAuth
  thirdUser: TestUserAuth
  fixtures: Record<string, number | string | boolean | null>
}

export const getApiSeed = () => cy.task<CypressApiSeedState>('cypressSeed:get')

export const getSeedUser = () => getApiSeed().then((seed) => seed.user)

export const getSecondSeedUser = () => getApiSeed().then((seed) => seed.secondUser)

export const getThirdSeedUser = () => getApiSeed().then((seed) => seed.thirdUser)

export const seedBearerHeaders = (seed: CypressApiSeedState) => bearerHeaders(seed.user.token)

export const secondSeedBearerHeaders = (seed: CypressApiSeedState) => bearerHeaders(seed.secondUser.token)

export const thirdSeedBearerHeaders = (seed: CypressApiSeedState) => bearerHeaders(seed.thirdUser.token)
