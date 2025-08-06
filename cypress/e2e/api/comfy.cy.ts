// /cypress/e2e/comfy.cy.ts
// Full coverage for Comfy API endpoints
// Each test maps to a specific input-output scenario or modifier mode

describe('[Comfy] Full Endpoint Coverage (No Auth)', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/comfy'
  const testPrompt = 'A test prompt'
  const base64Image =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFhgJ/lEFVXgAAAABJRU5ErkJggg=='
  const base64Mask =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AApMBgUfrAJYAAAAASUVORK5CYII='

  // --- CORE MODE TESTS ---

  it('Test 01: Flux - Text to Image', () => {
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

  it('Test 02: SDXL - Text to Image', () => {
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

  it('Test 03: Flux - Image to Image', () => {
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

  it('Test 04: SDXL - Image to Image', () => {
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

  // --- UTILITY ROUTES ---

  it('Test 05: Tag image via CLIP', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/tag`,
      body: { imageData: base64Image },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.description || res.body.text).to.exist
    })
  })

  it('Test 06: Poll for Prompt Result', () => {
    cy.request({
      method: 'GET',
      url: `${baseUrl}/prompt/test-prompt-id`,
      failOnStatusCode: false,
    }).then((res) => {
      expect([200, 404]).to.include(res.status)
    })
  })

  it('Test 07: Schnell generation (Flux)', () => {
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

  it('Test 08: Image modification (/image)', () => {
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

  it('Test 09: Flux prompt test submit', () => {
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

  it('Test 10: Server status endpoint', () => {
    cy.request(`${baseUrl}/status?url=wss://comfy.acrocatranch.com/ws`).then(
      (res) => {
        expect(res.status).to.eq(200)
        expect(res.body).to.have.property('success', true) // Strong assert!
      },
    )
  })

  it('Test 11: Get current model checkpoint', () => {
    cy.request(`${baseUrl}/model/get`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('ckpt')
    })
  })

  it('Test 12: Set model checkpoint', () => {
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

  // --- ADVANCED MODIFIER TESTS ---

  it('Test 13: SDXL + ControlNet (depth)', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'sdxl',
        inputType: 'text',
        outputType: 'image',
        prompt: 'Testing depth',
        useControlNet: true,
        controlType: 'depth',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 14: SDXL + ControlNet (custom)', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'sdxl',
        inputType: 'text',
        outputType: 'image',
        prompt: 'Testing custom',
        useControlNet: true,
        controlType: 'custom',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 15: Flux + Inpainting', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'flux',
        inputType: 'text',
        outputType: 'image',
        useInpaint: true,
        maskData: base64Mask,
        prompt: testPrompt,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 16: Flux + Outpainting', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'flux',
        inputType: 'text',
        outputType: 'image',
        useOutpaint: true,
        outpaintDirection: 'right',
        prompt: testPrompt,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 17: Flux + Upscale', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'flux',
        inputType: 'text',
        outputType: 'image',
        useUpscale: true,
        prompt: testPrompt,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 18: Flux + Morph', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'flux',
        inputType: 'text',
        outputType: 'image',
        useMorph: true,
        prompt: 'a cat',
        promptB: 'a tiger',
        promptBlend: 0.6,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 19: SDXL + Inpainting', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'sdxl',
        inputType: 'text',
        outputType: 'image',
        useInpaint: true,
        maskData: base64Mask,
        prompt: testPrompt,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 20: SDXL + Outpainting', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'sdxl',
        inputType: 'text',
        outputType: 'image',
        useOutpaint: true,
        outpaintDirection: 'right',
        prompt: testPrompt,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 21: SDXL + Upscale', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'sdxl',
        inputType: 'text',
        outputType: 'image',
        useUpscale: true,
        prompt: testPrompt,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 22: SDXL + Morph', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'sdxl',
        inputType: 'text',
        outputType: 'image',
        useMorph: true,
        prompt: 'a cat',
        promptB: 'a tiger',
        promptBlend: 0.6,
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  // --- CLOSURE / REPEAT TESTS ---

  it('Test 23: Flux text input', () => {
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

  it('Test 24: Flux image input', () => {
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

  it('Test 25: SDXL text input', () => {
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

  it('Test 25: SDXL basic text input', () => {
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

  it('Test 26: SDXL basic image input', () => {
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

  it('Test 27: Get current model checkpoint', () => {
    cy.request(`${baseUrl}/model/get`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('ckpt')
    })
  })

  it('Test 28: Set model checkpoint', () => {
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

  it('Test 29: WebSocket server status check', () => {
    cy.request({
      url: `${baseUrl}/status?url=wss://comfy.acrocatranch.com/ws`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('success', true)
    })
  })
})
