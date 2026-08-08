import {
  bearerHeaders,
  defaultApiBase,
  getApiEnv,
} from '../../support/api-auth'

type OpenApiDocument = {
  openapi?: string
  info?: {
    title?: string
  }
  servers?: Array<{
    url?: string
  }>
  paths?: Record<
    string,
    {
      post?: {
        operationId?: string
        security?: Array<Record<string, unknown>>
      }
    }
  >
  components?: {
    securitySchemes?: Record<
      string,
      {
        type?: string
        scheme?: string
      }
    >
    schemas?: Record<
      string,
      {
        properties?: Record<
          string,
          {
            enum?: string[]
          }
        >
      }
    >
  }
}

type DescribeResponse = {
  success?: boolean
  operation?: string
  data?: {
    actor?: {
      role?: string
      source?: string
    }
    authentication?: {
      acceptedCredentials?: string[]
    }
  }
}

describe('ChatGPT admin action bridge', () => {
  it('publishes an importable bearer-auth OpenAPI schema', () => {
    cy.request<OpenApiDocument>({
      url: `${defaultApiBase}/chatgpt/openapi`,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status, JSON.stringify(response.body)).to.eq(200)
      expect(response.body.openapi).to.eq('3.1.0')
      expect(response.body.info?.title).to.eq('Kind Robots Admin Action')
      expect(response.body.servers?.[0]?.url).to.eq(
        'https://kind-robots.vercel.app',
      )

      const action = response.body.paths?.['/api/chatgpt']?.post
      expect(action?.operationId).to.eq('executeKindRobotsOperation')
      expect(action?.security).to.deep.include({ bearerAuth: [] })

      const bearer = response.body.components?.securitySchemes?.bearerAuth
      expect(bearer?.type).to.eq('http')
      expect(bearer?.scheme).to.eq('bearer')

      const operations =
        response.body.components?.schemas?.KindRobotsOperation?.properties
          ?.operation?.enum || []
      expect(operations).to.include('meta.describe')
      expect(operations).to.include('content.list')
      expect(operations).to.include('content.update')
      expect(operations).to.include('content.setActive')
    })
  })

  it('accepts the existing admin token through Bearer auth', () => {
    getApiEnv().then(({ apiBase, adminToken }) => {
      cy.request<DescribeResponse>({
        method: 'POST',
        url: `${apiBase}/chatgpt`,
        headers: bearerHeaders(adminToken),
        body: {
          operation: 'meta.describe',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status, JSON.stringify(response.body)).to.eq(200)
        expect(response.body.success, JSON.stringify(response.body)).to.eq(true)
        expect(response.body.operation).to.eq('meta.describe')
        expect(response.body.data?.actor?.role).to.eq('admin')
        expect(response.body.data?.actor?.source).to.eq('beta-admin-token')
        expect(
          response.body.data?.authentication?.acceptedCredentials,
        ).to.include('beta admin token')
      })
    })
  })
})
