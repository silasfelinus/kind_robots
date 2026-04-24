// /server/utils/secretCrypto.ts
import crypto from 'crypto'

const config = useRuntimeConfig()
const rawSecret = config.private.SERVER_SECRET_KEY

if (!rawSecret || rawSecret.length < 32) {
  throw new Error('SERVER_SECRET_KEY must be at least 32 characters.')
}

const key = crypto.createHash('sha256').update(rawSecret).digest()

export function encryptSecret(value: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

  const encrypted = Buffer.concat([
    cipher.update(value, 'utf8'),
    cipher.final(),
  ])

  const tag = cipher.getAuthTag()

  return [
    iv.toString('base64'),
    tag.toString('base64'),
    encrypted.toString('base64'),
  ].join('.')
}

export function decryptSecret(value: string): string {
  const [ivRaw, tagRaw, encryptedRaw] = value.split('.')

  if (!ivRaw || !tagRaw || !encryptedRaw) {
    throw new Error('Invalid encrypted secret format.')
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivRaw, 'base64'),
  )

  decipher.setAuthTag(Buffer.from(tagRaw, 'base64'))

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
