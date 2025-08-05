// /cypress/e2e/comfy.cy.ts
describe('[Comfy] Full Endpoint Coverage (No Auth)', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/comfy'
  const testPrompt = 'A test prompt'
  const base64Image = 'BASE64_IMAGE'
  const base64Mask = 'BASE64_MASK'

  it('Test 01', () => {
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

  it('Test 02', () => {
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

  it('Test 03', () => {
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

  it('Test 04', () => {
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

  it('Test 05', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/tag`,
      body: { imageData: base64Image },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 06', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/tag`,
      body: { imageData: base64Image },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 07', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'flux',
        inputType: 'text',
        outputType: 'image',
        prompt: 'Testing canny',
        useControlNet: true,
        controlType: 'canny',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 08', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'flux',
        inputType: 'text',
        outputType: 'image',
        prompt: 'Testing scribble',
        useControlNet: true,
        controlType: 'scribble',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 09', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'flux',
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

  it('Test 10', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'flux',
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

  it('Test 11', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'sdxl',
        inputType: 'text',
        outputType: 'image',
        prompt: 'Testing canny',
        useControlNet: true,
        controlType: 'canny',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 12', () => {
    cy.request({
      method: 'POST',
      url: baseUrl,
      body: {
        modelType: 'sdxl',
        inputType: 'text',
        outputType: 'image',
        prompt: 'Testing scribble',
        useControlNet: true,
        controlType: 'scribble',
      },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success || res.body.promptId).to.exist
    })
  })

  it('Test 13', () => {
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

  it('Test 14', () => {
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

  it('Test 15', () => {
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

  it('Test 16', () => {
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

  it('Test 17', () => {
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

  it('Test 18', () => {
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

  it('Test 19', () => {
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

  it('Test 20', () => {
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

  it('Test 21', () => {
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

  it('Test 22', () => {
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

  it('Test 23', () => {
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

  it('Test 24', () => {
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

  it('Test 25', () => {
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

  it('Test 26', () => {
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

  it('Test 27', () => {
    cy.request(`${baseUrl}/model/get`).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body).to.have.property('ckpt')
    })
  })

  it('Test 28', () => {
    cy.request({
      method: 'POST',
      url: `${baseUrl}/model/set`,
      body: { ckpt: 'Flux/flux1-schnell-fp8.safetensors' },
    }).then((res) => {
      expect(res.status).to.eq(200)
      expect(res.body.success).to.be.true
    })
  })

  it('Test 29', () => {
    cy.request(`${baseUrl}/status?url=wss://comfy.acrocatranch.com/ws`).then(
      (res) => {
        expect(res.status).to.eq(200)
        expect(res.body).to.have.property('success')
      },
    )
  })
})
