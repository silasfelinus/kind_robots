#!/usr/bin/env node
// /utils/scripts/fix-nuxt-tsconfig.mjs
import { readFile, writeFile } from 'node:fs/promises'

const files = [
  '.nuxt/tsconfig.json',
  '.nuxt/tsconfig.app.json',
  '.nuxt/tsconfig.server.json',
  '.nuxt/tsconfig.node.json',
  '.nuxt/tsconfig.shared.json',
]

for (const file of files) {
  try {
    const raw = await readFile(file, 'utf8')
    const json = JSON.parse(raw)

    if (json.vueCompilerOptions?.plugins) {
      json.vueCompilerOptions.plugins = json.vueCompilerOptions.plugins.filter(
        (plugin) => plugin !== 'vue-router/volar/sfc-route-blocks',
      )
    }

    await writeFile(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8')
    console.log(`patched ${file}`)
  } catch {}
}
