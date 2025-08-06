// /cypress/e2e/comfy2.utility.cy.ts
// Utility routes and prompt submission tools

describe('[Comfy] Utility Routes and Prompt Submission', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/comfy'
  const testPrompt = 'A test prompt'
  const base64Image = 'data:image/png;base64,...'

  it('Tag image using CLIP', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/tag`,
      failOnStatusCode: false,
      body: { imageData: base64Image },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.description || res.body.text).to.exist
    })
  })

  it('Poll prompt ID result', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/prompt/test-prompt-id`,
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 404]).to.include(res.status)
    })
  })

  it('Schnell generation (Flux)', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/flux/schnell`,
      body: {
        prompt: testPrompt,
        negativePrompt: 'blurry',
        cfg: 1,
        steps: 10,
        denoise: 0.85,
        sampler_name: 'euler',
        scheduler: 'karras',
        width: 768,
        height: 1024,
        batch_size: 1,
        seed: 42,
        url: 'https://comfy.acrocatranch.com',
        ckpt_name: 'Flux/flux1-schnell-fp8.safetensors',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.promptId || res.body.success).to.exist
    })
  })

  it('Image modification (/image)', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/image`,
      body: {
        prompt: 'Edit this image',
        imageData: base64Image,
        denoise: 0.85,
        strength: 0.7,
        width: 512,
        height: 512,
        steps: 10,
        scheduler: 'sgm_uniform',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.promptId || res.body.success).to.exist
    })
  })

  it('Flux test prompt submit', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/flux/test`,
      body: {
        promptText: 'candy robot',
        ckpt_name: 'Flux/flux1-schnell-fp8.safetensors',
        denoise: 0.8,
        cfg: 1,
        steps: 10,
        apiUrl: 'https://comfy.acrocatranch.com/prompt',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.promptId || res.body.success).to.exist
    })
  })

  it('Check server status', () => {
    cy.request(`${baseUrl}/status?url=wss://comfy.acrocatranch.com/ws`).then(
      (res) => {
        expect(res.status).to.eq(200)
        expect(res.body).to.have.property('success', true)
      },
    )
  })

  it('Get current model checkpoint', () => {
    cy.request(`${baseUrl}/model/get`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('ckpt')
    })
  })

  it('Set model checkpoint', () => {
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
})
