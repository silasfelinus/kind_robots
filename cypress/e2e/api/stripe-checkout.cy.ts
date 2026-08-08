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
  let checkoutStatusUrl = ''
  let userToken = ''
  let userId: number | undefined

  before(() => {
    return getApiEnv()
      .then((env) => {
        checkoutUrl = `${env.apiBase}/stripe/checkout`
        checkoutStatusUrl = `${env.apiBase}/stripe/checkout-status`
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

  it('rejects checkout-status verification without authentication', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${checkoutStatusUrl}?session_id=cs_test_not_real`,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects checkout-status verification with an invalid token', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${checkoutStatusUrl}?session_id=cs_test_not_real`,
      headers: invalidBearerHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects malformed checkout session IDs before contacting Stripe', () => {
    cy.request<ApiResponse>({
      method: 'GET',
      url: `${checkoutStatusUrl}?session_id=not-a-stripe-session`,
      headers: bearerHeaders(userToken),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include(
        'valid Stripe checkout session ID',
      )
    })
  })
})

// digital-storefront/t-039: topup/subscribe/cancel-subscription previously had
// zero test coverage of any kind. Each route's real fulfillment step (creating
// a live Stripe Checkout Session or cancelling a real subscription) needs a
// configured Stripe account this suite doesn't have, but each route also does
// real request-shape validation *before* it ever calls Stripe — the same
// "cheap to verify, was never verified" gap stripe-checkout.cy.ts already
// closed for checkout.post.ts/checkout-status.get.ts above.
describe('Stripe Mana Top-up API Tests', () => {
  let topupUrl = ''
  let userToken = ''

  before(() => {
    return getApiEnv()
      .then((env) => {
        topupUrl = `${env.apiBase}/stripe/topup`
        return createLoggedInTestUser()
      })
      .then((user) => {
        userToken = user.token
      })
  })

  it('rejects top-up without authentication', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: topupUrl,
      headers: jsonHeaders(),
      body: { tierId: 'small' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects top-up with an invalid token', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: topupUrl,
      headers: invalidBearerHeaders(),
      body: { tierId: 'small' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects unknown top-up tiers before contacting Stripe', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: topupUrl,
      headers: bearerHeaders(userToken),
      body: { tierId: 'gigantic' },
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('Invalid top-up tier')
    })
  })
})

describe('Stripe Subscription API Tests', () => {
  let subscribeUrl = ''
  let cancelSubscriptionUrl = ''
  let userToken = ''

  before(() => {
    return getApiEnv()
      .then((env) => {
        subscribeUrl = `${env.apiBase}/stripe/subscribe`
        cancelSubscriptionUrl = `${env.apiBase}/stripe/cancel-subscription`
        return createLoggedInTestUser()
      })
      .then((user) => {
        userToken = user.token
      })
  })

  it('rejects subscribe checkout without authentication', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: subscribeUrl,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects subscribe checkout with an invalid token', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: subscribeUrl,
      headers: invalidBearerHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects cancel-subscription without authentication', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: cancelSubscriptionUrl,
      headers: jsonHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects cancel-subscription with an invalid token', () => {
    cy.request<ApiResponse>({
      method: 'POST',
      url: cancelSubscriptionUrl,
      headers: invalidBearerHeaders(),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(401)
      expect(response.body.success).to.eq(false)
    })
  })

  it('rejects cancelling a subscription the user does not have, without contacting Stripe', () => {
    // A freshly created test user has no stripeSubscriptionId, so this route's
    // own guard must reject before it ever calls stripe.subscriptions.cancel().
    cy.request<ApiResponse>({
      method: 'POST',
      url: cancelSubscriptionUrl,
      headers: bearerHeaders(userToken),
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.success).to.eq(false)
      expect(response.body.message).to.include('No active subscription')
    })
  })
})
