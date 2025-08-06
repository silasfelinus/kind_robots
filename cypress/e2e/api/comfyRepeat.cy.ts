// /cypress/e2e/comfy4.repeat.cy.ts
// Repeat generation, model checkpoint state, and WebSocket status

describe('[Comfy] Repeat & Status Tests (No Auth)', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/comfy'
  const testPrompt = 'A test prompt'
  const base64Image =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFhgJ/lEFVXgAAAABJRU5ErkJggg=='

  it('Repeat: Flux text input', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
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

  it('Repeat: Flux image input', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
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

  it('Repeat: SDXL text input', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
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

  it('Repeat: SDXL image input', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
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

  it('Model Checkpoint: Get current model', () => {
    cy.request(`${baseUrl}/model/get`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('ckpt')
    })
  })

  it('Model Checkpoint: Set model to Flux Schnell', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/model/set`,
      body: {
        ckpt: 'Flux/flux1-schnell-fp8.safetensors',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
    })
  })

  it('Server Status: WebSocket check', () => {
    cy.request({
      url: `${baseUrl}/status?url=wss://comfy.acrocatranch.com/ws`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('success', true)
    })
  })
})
