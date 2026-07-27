// /server/utils/productStorageRoot.ts
import path from 'node:path'

/**
 * Filesystem root for paid digital-good files (SPEC.md §5, digital-storefront
 * t-023) — deliberately NOT under `public/`, so Nitro's static file server
 * never exposes these paths. Access always goes through
 * server/api/store/download/[slug].get.ts, which checks the caller's
 * Entitlement before streaming.
 *
 * Defaults to a repo-local `storage/products` directory so existing setups
 * keep working out of the box. Set PRODUCT_FILES_PATH to an external mounted
 * directory in production to keep paid files out of the git repo entirely.
 */
export function getProductStorageRoot(): string {
  const configuredRoot = process.env.PRODUCT_FILES_PATH?.trim()

  return configuredRoot
    ? path.resolve(configuredRoot)
    : path.resolve(process.cwd(), 'storage/products')
}
