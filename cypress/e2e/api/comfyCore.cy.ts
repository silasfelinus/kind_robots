// /cypress/e2e/comfy1.core.cy.ts
// Core functionality: text-to-image and image-to-image generation

describe('[Comfy] Core Image Generation (No Auth)', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/comfy'
  const testPrompt = 'A test prompt'
  const base64Image = 'data:image/png;base64,...'

  it('Flux: Text to Image', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      failOnStatusCode: false,
      body: {
        modelType: 'flux',
        inputType: 'text',
        outputType: 'image',
        prompt: testPrompt,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('SDXL: Text to Image', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      failOnStatusCode: false,
      body: {
        modelType: 'sdxl',
        inputType: 'text',
        outputType: 'image',
        prompt: testPrompt,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Flux: Image to Image', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      failOnStatusCode: false,
      body: {
        modelType: 'flux',
        inputType: 'image',
        outputType: 'image',
        imageData: base64Image,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('SDXL: Image to Image', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      failOnStatusCode: false,
      body: {
        modelType: 'sdxl',
        inputType: 'image',
        outputType: 'image',
        imageData: base64Image,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })
})
