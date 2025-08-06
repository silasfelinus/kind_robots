// /cypress/e2e/comfyCore.cy.ts
// Core functionality: text-to-image and image-to-image generation
describe('[Comfy] Core Image Generation (No Auth)', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/comfy'
  const testPrompt = 'A test prompt'
  const base64Image =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFhgJ/lEFVXgAAAABJRU5ErkJggg=='

  const apiUrl = `${Cypress.env('COMFY_URL')}/prompt`

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
        apiUrl, // ✅ Inject from env
      },
    }).then((res) => {
      console.log('Response:', res.body)
      expect(res.status).to.eq(200)
      expect(res.body).to.have.any.keys('success', 'promptId')
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
        apiUrl,
      },
    }).then((res) => {
      console.log('Response:', res.body)
      expect(res.status).to.eq(200)
      expect(res.body).to.have.any.keys('success', 'promptId')
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
        apiUrl,
      },
    }).then((res) => {
      console.log('Response:', res.body)
      expect(res.status).to.eq(200)
      expect(res.body).to.have.any.keys('success', 'promptId')
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
        apiUrl,
      },
    }).then((res) => {
      console.log('Response:', res.body)
      expect(res.status).to.eq(200)
      expect(res.body).to.have.any.keys('success', 'promptId')
    })
  })
})
