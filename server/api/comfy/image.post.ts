// server/api/comfy/image.post.ts
import { defineEventHandler, readMultipartFormData } from 'h3'
import fs from 'node:fs/promises'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)

  const file = formData?.find((f) => f.type === 'file')
  if (!file) {
    return { success: false, message: 'No file uploaded' }
  }

  const filename = file.filename || `upload-${Date.now()}.png`
  const uploadDir = '/path/to/comfy/input' // Adjust this to your actual input folder
  const filepath = path.join(uploadDir, filename)

  try {
    await fs.writeFile(filepath, file.data)
    return {
      success: true,
      filename, // You can then use this in prompt injection
      path: filepath,
    }
  } catch (err) {
    return { success: false, message: 'Upload failed', error: err }
  }
})
