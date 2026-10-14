# Arcade soundtrack pipeline (follow-up to Kind Robots #3606)

This file records the zero-cost, no-live-generation first stage of the
Arcade audio upgrade. The source of the four initial per-cabinet instrumental
briefs, boss variations, and reusable short event cues is
`utils/arcade/soundtrackBriefs.ts`.

## Status of this slice

- **Authored:** Gloom Invaders, Zuzu Ghost Trail, Prize Show Panic and
  Zuzu Showdown level and boss loops, plus reusable pickup/danger/impact/victory
  cue briefs. Each brief specifies mood, instrumentation, tempo and loop length.
- **Not generated:** no audio files, live ArtJobs, billable endpoints or API
  mutations were produced by this PR. The verified asset manifest is empty.
- **Existing playback:** the shared `utils/arcade/sound.ts` synthesized WebAudio
  music and cues remain intact; game audio remains usable without ACE output.
- **Next:** admin-only review/approval, actual ACE-capable relay readiness,
  stable file ingestion, playback mixer with fades/ducking, and browser testing.

## Safe production path

1. Administrator reviews the brief and selects a game/scene. Resolve the
   server's audio capability through an authenticated system endpoint and
   confirm a worker actually advertises `supportsAudio`. The mere existence of
   ACE-Step code is not proof that a render worker is ready.
2. After explicit approval, enqueue a normal audio ArtJob, using
   `arcadeAudioJobKey(game, cue)` to deduplicate repeated submissions. Never
   enqueue from game play, page load, or an unauthenticated public route.
3. Wait for actual completion with a readable audio artifact. Reject failed,
   missing, or inaccessible files rather than substituting an expected URL.
4. Validate audio duration/format, find a loop point, transcode a web-safe
   static rendition, and record a content checksum with provenance,
   `approvedAt` and `verifiedAt`. Publish under
   `/images/arcade/audio/<game>/<cue>.<format>` only when the file can be fetched
   from the environment where the cabinet runs.
5. Populate `VERIFIED_ARCADE_AUDIO_ASSETS` only after that verification.
   `publishedArcadeAudioPath` intentionally returns null unless the asset is
   approved, verified, well-formed, and supplied in a set of paths confirmed
   accessible by the caller. The set is not proof of access by itself:
   validate the files during build or with a real fetch before passing it.
6. Add recorded audio playback through a touch-unlocked WebAudio context:
   fades between level/boss tracks, stop on cabinet exit, keep SFX audible
   through ducking, and honor the existing arcade mute setting.
   Missing files must always fall back to the present oscillator music.

## Verification / acceptance

- `npm run test:arcade-soundtrack-briefs` verifies game slugs, scene variants,
  deduplicated job identities, sane loop/cue durations and the unverified
  asset fallback. It does not generate or listen to any soundtrack.
- Test gesture-only audio unlock, mute/volume, exit cleanup, music transition,
  ducking and fallback in actual browsers and with gamepads.
- The entire audio issue remains open until at least one ACE-produced,
  approved, reachable recording is audibly verified in the game and the
  mixer/asset pipeline requirements above are implemented.
