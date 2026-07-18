import { readFileSync, writeFileSync } from 'node:fs'

const path = 'server/api/reactions/index.post.ts'
const source = readFileSync(path, 'utf8')
const target = '      data,\n      reaction: data,\n      statusCode: event.node.res.statusCode,'
const replacement = '      data,\n      statusCode: event.node.res.statusCode,'

if (!source.includes(target)) {
  throw new Error('Expected Reaction response alias block was not found.')
}

writeFileSync(path, source.replace(target, replacement), 'utf8')
