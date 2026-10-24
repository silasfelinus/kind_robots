/**
 * Ecotone player portraits are private user uploads. Shared generated
 * portraits live on the public media host; user files never go there.
 * Return only a durable ArtImage ID to the save and a temporary display URI.
 */
type ArtReply<T> = { success: boolean; data?: T | null; message?: string }

export async function uploadPrivateEcotonePortrait(file: File): Promise<number> {
  const form = new FormData()
  form.append('file', file)
  form.append('galleryName', 'ecotone-players')
  form.append('isPublic', 'false')
  form.append('isMature', 'false')
  const response = await fetch('/api/art/upload', {
    method: 'POST',
    body: form,
    credentials: 'same-origin',
  })
  const payload = (await response.json()) as ArtReply<{ id: number }>
  const id = payload.data?.id
  if (!response.ok || !payload.success || !Number.isInteger(id) || !id || id <= 0)
    throw new Error(payload.message || 'Portrait upload failed.')
  return id
}

export async function readPrivateEcotonePortrait(id: number): Promise<string> {
  if (!Number.isInteger(id) || id <= 0)
    throw new Error('Invalid private portrait ID.')
  const response = await fetch(`/api/art/image/${id}?includeImageData=true`, {
    credentials: 'same-origin',
  })
  const payload = (await response.json()) as ArtReply<{
    imageData?: string | null
    fileType?: string | null
  }>
  const image = payload.data
  if (!response.ok || !payload.success || !image?.imageData)
    throw new Error('Private portrait unavailable.')
  const mime =
    image.fileType === 'png'
      ? 'image/png'
      : image.fileType === 'jpeg' || image.fileType === 'jpg'
        ? 'image/jpeg'
        : 'image/webp'
  return `data:${mime};base64,${image.imageData}`
}
