type UploadRow = {
  id: string
  title: string
  description: string
  kind: string
  artImageId: number
  createdAt: Date
}

// Client shape of an uploaded ingredient. It reuses the lab's ingredient
// fields so uploads sit in the same drawers as starters and hybrids.
export function serializeHybridizerUpload(upload: UploadRow) {
  return {
    key: 'upload:' + upload.id,
    title: upload.title,
    description: upload.description,
    kind: upload.kind,
    taxonomy: 'UPLOAD',
    artImageId: upload.artImageId,
    isPublic: false,
    depth: 0,
    createdAt: upload.createdAt,
  }
}
