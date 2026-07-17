// /server/utils/imageStorageRoot.ts
import path from 'node:path'

/**
 * Filesystem root that backs the public `/images/...` namespace during local
 * development and maintenance scripts.
 *
 * Defaults to the repository's `public/images` directory so existing setups
 * keep working. Set IMAGES_PATH to an external mounted directory (for example
 * `/mnt/z/kindrobots/images` in WSL) to write and discover images outside Git.
 */
export function getImageStorageRoot(): string {
  const configuredRoot = process.env.IMAGES_PATH?.trim()

  return configuredRoot
    ? path.resolve(configuredRoot)
    : path.resolve(process.cwd(), 'public/images')
}
