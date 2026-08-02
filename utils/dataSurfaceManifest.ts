// /utils/dataSurfaceManifest.ts
//
// Registry of application data surfaces that must be reachable from a
// top-level nav destination (a channel/tab in content/channels). A content
// Markdown page gets this check for free from verifyChannelContent.ts's
// channelKey/tabKey frontmatter cross-reference -- but a data surface can
// live entirely inside a Vue component's local tab state, with no Markdown
// page at all, and slip past that file-scanning check silently. That is what
// happened to the honeydo inbox until global-ui/t-014 landed: todoStore.honeyDoTodos
// was correctly global, but its only UI entry point was a HONEYDO tab buried
// inside conductor-page.vue's per-project detail view, with no top-level
// destination -- caught only by a manual audit (NAVIGATION-MAP.md,
// 2026-07-15), not CI. Mirrors the intent of PortOS's server/lib/navManifest.js.
//
// Add an entry here whenever you introduce a data source a user should be
// able to reach without already knowing which project/page it is tucked
// inside. Wire `navEntry` once it has a real top-level channel/tab; leave it
// `null` with an `acknowledgedGap` pointing at the tracking task while the
// work is in flight -- that is the only way an unwired surface passes the
// contract in utils/scripts/verifyDataSurfaceManifest.ts, so a gap can never
// land silently.

export type DataSurfaceEntry = {
  id: string
  label: string
  dataSource: string
  navEntry: { channelKey: string; tabKey: string } | null
  acknowledgedGap?: string
}

export const DATA_SURFACES: DataSurfaceEntry[] = [
  {
    id: 'honeydo-inbox',
    label: 'Global honeydo queue',
    dataSource: 'stores/todoStore.ts: todoStore.honeyDoTodos',
    // Silas, 2026-08-02: "we have a just for you section in home that ostensibly
    // is for ai deliverables? I don't know, it never has anything, just delete it
    // unless it has a particular need [...] but if so, it should be completely
    // hidden if it's not used."
    //
    // It never has anything because NOTHING EVER WRITES A HONEYDO TODO. The
    // consumer half is real -- taskmasterStore.ts builds checkpoints from
    // honeyDoTodos, and conductor-page.vue has a HONEYDO tab -- but the producer
    // was never built: conductor's agents write `category: "AGENT"`
    // (scripts/ci_janitor.py, scripts/new_app.py), and the only way a HONEYDO
    // exists at all is a human picking it from conductor-page's dropdown. So the
    // page's promise, "action items your AI assigned to you", has never been true.
    //
    // The /for-you route and this surface stay (deep-linkable, and honeydo keeps
    // a home the moment a producer exists); the nav TAB is gone, which is the
    // "completely hidden if it's not used" half of the instruction. Wire navEntry
    // back the moment something writes a HONEYDO.
    navEntry: null,
    acknowledgedGap: 'interface-vision/t-056',
  },
  {
    id: 'video-generator',
    label: 'Image-to-video generator',
    dataSource:
      'pages/play/video-generator.vue: stores/videoStore.ts -> POST /api/art/enqueue',
    navEntry: { channelKey: 'play', tabKey: 'video-generator' },
  },
]
