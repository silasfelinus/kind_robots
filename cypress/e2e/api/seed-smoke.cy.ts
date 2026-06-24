import { getApiSeed } from '../../support/api-seed'

describe('Cypress API seed smoke test', () => {
  it('creates and returns shared seed users', () => {
    getApiSeed().then((seed) => {
      expect(seed.user.id, 'seed user').to.be.a('number')
      expect(seed.user.token, 'seed user token').to.be.a('string').and.have.length.greaterThan(20)

      expect(seed.secondUser.id, 'second seed user').to.be.a('number')
      expect(seed.secondUser.token, 'second seed token').to.be.a('string').and.have.length.greaterThan(20)

      expect(seed.thirdUser.id, 'third seed user').to.be.a('number')
      expect(seed.thirdUser.token, 'third seed token').to.be.a('string').and.have.length.greaterThan(20)
    })
  })
})
