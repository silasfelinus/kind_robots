import {
  bearerHeaders,
  createLoggedInTestUser,
  getApiEnv,
  invalidBearerHeaders,
  jsonHeaders,
} from '../../support/api-auth'

type ApiResponse<T = unknown> = {
  success: boolean
  message: string
  data?: T | null
  statusCode?: number
}

describe('Stripe Checkout Identity API Tests', () => {
  let checkoutUrl = ''
  let userToken = ''
  let userId: number | undefined

  before(() => {
    return getApiEnv()
      .then((env) => {
        checkoutUrl = `${env.apiBase}/stripe/checkout`
        return createLoggedInTestUser()
      })
      .then((user) => {
        userToken = user.token
        userId = user.id
      })
  })

  it('rejects checkout without authentication', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: checkoutUrl,
      headers: jsonHeaders(),
      body: {
        cart: [{ id: 'donation', quantity: 1 }],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
      expect(response.body.data).to.eq(null)
    })
  })

  it('rejects checkout with an invalid token', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: checkoutUrl,
      headers: invalidBearerHeaders(),
      body: {
        cart: [{ id: 'donation', quantity: 1 }],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects caller-supplied billing identity', () => {
    expect(userId).to.exist

    cy.request<ApiResponse>({
      method: 'POST',
      url: checkoutUrl,
      headers: bearerHeaders(userToken),
      body: {
        userId,
        cart: [{ id: 'donation', quantity: 1 }],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include(
        'User identity comes from authentication',
      )
    })
  })

  it('rejects client-supplied price and product fields', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: checkoutUrl,
      headers: bearerHeaders(userToken),
      body: {
        cart: [
          {
            id: 'donation',
            quantity: 1,
            price: 0.01,
            label: 'Definitely Real Pricing',
          },
        ],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Unsupported cart entry fields')
    })
  })

  it('rejects unknown cart item IDs', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: checkoutUrl,
      headers: bearerHeaders(userToken),
      body: {
        cart: [{ id: 'free-moon-base', quantity: 1 }],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Invalid cart item')
    })
  })

  it('rejects empty and invalid quantities', () => {
    for (const quantity of [0, -1, 1.5, 26, '1']) {
      cy.request<ApiResponse>({
        method: 'POST',
        url: checkoutUrl,
        headers: bearerHeaders(userToken),
        body: {
          cart: [{ id: 'donation', quantity }],
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400)
        expect(response.body.success).to.eq(false)
        expect(response.body.message).to.include('integer from 1 to 25')
      })
    }
  })

  it('rejects duplicate entries whose combined quantity exceeds the limit', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: checkoutUrl,
      headers: bearerHeaders(userToken),
      body: {
        cart: [
          { id: 'donation', quantity: 20 },
          { id: 'donation', quantity: 10 },
        ],
      },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Combined quantity')
    })
  })
})
