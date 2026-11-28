import receiptData from './renderedArtReceipts.json'

const receipts: Readonly<Record<string, number>> = receiptData

export function renderedArtImageId(path: string): number | null {
  const match = /^\/crystal-street\/((?:scenes|outcomes|endings|items)\/[a-z0-9][a-z0-9-]+)\.webp$/.exec(
    path,
  )
  if (!match?.[1] || !Object.hasOwn(receipts, match[1])) return null
  const id = receipts[match[1]]
  return typeof id === 'number' && Number.isSafeInteger(id) && id > 0
    ? id
    : null
}

export const renderedArtReceiptCount = Object.keys(receipts).length
