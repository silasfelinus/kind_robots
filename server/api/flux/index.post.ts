import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const { image } = await readBody(event)

  const response = await fetch(
    'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-Kontext-dev',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: image }),
    },
  )

  if (!response.ok) {
    return { output: null, error: await response.text() }
  }

  const blob = await response.blob()
  const buffer = await blob.arrayBuffer()
  const base64 = `data:image/png;base64,${Buffer.from(buffer).toString('base64')}`
  return { output: base64 }
})
