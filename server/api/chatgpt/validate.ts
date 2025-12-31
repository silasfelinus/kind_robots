// path: server/api/chatgpt/validate.ts
// summary: zero-dependency H3 validators with small helpers

import { createError } from 'h3'

export function badRequest(msg: string) {
  throw createError({ statusCode: 400, statusMessage: msg })
}

export function expectString(v: any, field: string): string {
  if (typeof v !== 'string') badRequest(`"${field}" must be a string`)
  return v
}

export function expectNumber(v: any, field: string): number {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) badRequest(`"${field}" must be a number`)
  return n
}

export function expectBoolean(v: any, field: string): boolean {
  if (typeof v !== 'boolean') badRequest(`"${field}" must be a boolean`)
  return v
}

export function expectRecord(v: any, field: string): Record<string, any> {
  if (v === null || typeof v !== 'object' || Array.isArray(v)) {
    badRequest(`"${field}" must be an object`)
  }
  return v as Record<string, any>
}

export function optional<T>(fn: (v: any, f: string) => T) {
  return (v: any, field: string): T | undefined =>
    v === undefined || v === null ? undefined : fn(v, field)
}

export function validateShape<T extends Record<string, (v:any,f:string)=>any>>(
  obj: any,
  shape: T
): { [K in keyof T]: ReturnType<T[K]> } {
  const out: any = {}
  const source = obj ?? {}
  for (const key in shape) {
    out[key] = shape[key](source[key], key)
  }
  return out
}