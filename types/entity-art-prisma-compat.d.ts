// Prisma 7's $extends client intentionally omits several base-client methods,
// while the entity-art service only consumes model delegates. These overloads
// keep that runtime-compatible boundary local until Prisma exposes a stable
// structural extended-client type for application services.
import '~/server/utils/entityArt'

declare module '~/server/utils/entityArt' {
  export function getEntityArtRecord(...args: any[]): Promise<any>
  export function resolveEntityArtTarget(...args: any[]): Promise<any>
  export function archiveCurrentEntityArt(...args: any[]): Promise<any>
  export function applyEntityArtImage(...args: any[]): Promise<any>
  export function listEntityArtHistory(...args: any[]): Promise<any>
  export function resolveEntityArtSourceImage(...args: any[]): Promise<any>
  export function prepareEntityArtEnqueue(...args: any[]): Promise<any>
  export function applyEntityArtCompletion(...args: any[]): Promise<any>
}
