// /cypress/e2e/comfy3.modifiers.cy.ts
// Modifier mode support and enhancements

describe('[Comfy] Advanced Modifiers and Effects', () => {
  const baseUrl = 'https://kind-robots.vercel.app/api/comfy'
  const testPrompt = 'A test prompt'
  const base64Mask = 'data:image/png;base64,...'

  const modifierTests = [
    { model: 'sdxl', type: 'depth', label: 'SDXL + ControlNet (depth)' },
    { model: 'sdxl', type: 'custom', label: 'SDXL + ControlNet (custom)' },
  ]

  modifierTests.forEach(({ model, type, label }) => {
    it(label, () => {
      cy.request({
        method: 'POST',
        url: baseUrl,
        body: {
          modelType: model,
          inputType: 'text',
          outputType: 'image',
          prompt: `Testing ${type}`,
          useControlNet: true,
          controlType: type,
        },
      }).then((res) => {
        expect(res.status).to.eq(200)
        expect(res.body.success || res.body.promptId).to.exist
      })
    })
  })

  const extraMods = [
    {
      model: 'flux',
      key: 'useInpaint',
      label: 'Flux + Inpainting',
      extras: { maskData: base64Mask },
    },
    {
      model: 'flux',
      key: 'useOutpaint',
      label: 'Flux + Outpainting',
      extras: { outpaintDirection: 'right' },
    },
    { model: 'flux', key: 'useUpscale', label: 'Flux + Upscale' },
    {
      model: 'flux',
      key: 'useMorph',
      label: 'Flux + Morph',
      extras: { prompt: 'a cat', promptB: 'a tiger', promptBlend: 0.6 },
    },
    {
      model: 'sdxl',
      key: 'useInpaint',
      label: 'SDXL + Inpainting',
      extras: { maskData: base64Mask },
    },
    {
      model: 'sdxl',
      key: 'useOutpaint',
      label: 'SDXL + Outpainting',
      extras: { outpaintDirection: 'right' },
    },
    { model: 'sdxl', key: 'useUpscale', label: 'SDXL + Upscale' },
    {
      model: 'sdxl',
      key: 'useMorph',
      label: 'SDXL + Morph',
      extras: { prompt: 'a cat', promptB: 'a tiger', promptBlend: 0.6 },
    },
  ]

  extraMods.forEach(({ model, key, label, extras = {} }) => {
    it(label, () => {
      cy.request({
        method: 'POST',
        url: baseUrl,
        body: {
          modelType: model,
          inputType: 'text',
          outputType: 'image',
          prompt: testPrompt,
          [key]: true,
          ...extras,
        },
      }).then((res) => {
        expect(res.status).to.eq(200)
        expect(res.body.success || res.body.promptId).to.exist
      })
    })
  })
})
