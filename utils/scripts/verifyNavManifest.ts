// /utils/scripts/verifyNavManifest.ts
// Compatibility entrypoint. The nav-manifest checks now live in the canonical
// channel-content contract so both npm scripts and existing CI callers execute
// one implementation.
import '@/utils/scripts/verifyChannelContent'
