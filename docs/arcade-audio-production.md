# Arcade soundtrack pipeline (follow-up to Kind Robots #3606)

This file records the zero-cost, no-live-generation stages of the Arcade
audio upgrade. Nothing here has generated audio, enqueued a production
ArtJob or spent credits.

## Where things live

- **Manifest and briefs:** `utils/arcade/soundtrackBriefs.ts`. Keyed by game
  and cue. Music scenes are `level`, `level-2` (the priority cabinets only) and
  `boss`. The shared event cues are `pickup`, `danger`, `impact` and
  `victory`, rendered once and reused by every cabinet. Each brief holds its
  prompt, mood, instrumentation, BPM and loop length. Briefed cabinets: Gloom
  Invaders, Zuzu Ghost Trail, Prize Show Panic and Zuzu Showdown (priority),
  plus Butterfly Blaster, Brick Bloom and Kindness Gauntlet. Per-cabinet audio
  themes (music level, effects level, duck depth, crossfade length) sit beside
  the briefs.
- **Verified assets:** `VERIFIED_ARCADE_AUDIO_ASSETS`, in the same file. It is
  **empty**, so every cabinet still plays its oscillator music.
- **Mixer:** `utils/arcade/soundtrackMixer.ts` wraps the oscillator sound
  object in `utils/arcade/sound.ts`. It is used by `arcade-cabinet.vue` and
  `zuzu-showdown-stage.vue`.
- **Approval queue (admin API):** `GET /api/arcade/audio-jobs` and
  `POST /api/arcade/audio-jobs`. The decisions live in
  `server/utils/arcadeAudioJobs.ts`. The relay's `supportsAudio` declaration is
  recorded in `server/utils/relayAgentRegistry.ts`, and
  `GET /api/art/queue/relay-status` shows it too.

## Mixer behaviour

- **Gesture-safe.** Before `unlock()` the mixer does no fetch, no decode and no
  playback, and it never creates an AudioContext. `createArcadeSound` creates
  the context only inside a gesture handler.
- **Recorded music only from a real file.** The mixer considers an asset only
  when it is approved, verified, checksummed and on
  `/images/arcade/audio/<game>/<cue>.(ogg|mp3|wav)`. Even then the file has to
  load and decode. A missing or undecodable file drops back to the cabinet's
  oscillator loop, and that file is not fetched again during the visit.
  `level-2` falls back to the `level` recording.
- **Transitions.** A scene change crossfades over the theme's `fadeSeconds`.
  The same track is never restarted.
- **Ducking.** Important presets (`boom`, `die`, `start`, `level`, `extra`,
  `warn` and the Zuzu stingers) duck both the recorded music and the
  oscillator music to `duckDepth` for as long as they sound. Ordinary shots
  and blips do not duck. A recorded event cue ducks the music for its own
  length.
- **Volume and mute.** The volume is persisted in the arcade store
  (`kr-arcade-prefs.volume`, 0 to 1, default 1) and set from the cabinet's
  `Vol` slider. Mute stays the existing arcade switch. At the default volume
  the oscillator music and effects keep their previous loudness.
- **Leaving.** `stopCabinetMusic()` (on game over, on a cabinet switch, or
  when a game is retired) and `dispose()` (on unmount) cut every loop
  immediately, including a loop that is still fading out. They also drop any
  load still in flight, so a late file never starts playing after the player
  has left.

## Safe production path

1. An administrator opens `GET /api/arcade/audio-jobs`. It lists every
   briefed cue, the exact ACE-Step request an approval would send, any existing
   job for that cue's key, whether `ARCADE_AUDIO_JOBS_ENABLED=true` is set on
   the server, and whether a COMFY relay advertising `supportsAudio` has
   polled within the last 5 minutes. Existing ACE-Step code does not prove that
   a worker is ready. Only the relay's poll-time declaration counts.
2. `POST /api/arcade/audio-jobs` with `{ game, cue, approve: true }` enqueues
   one private ACE-Step ArtJob through `/api/art/enqueue`. The job uses
   `designer = arcadeAudioJobKey(game, cue)`, `projectSlug = kr-arcade` and a
   seed derived from the key. The order of refusals is:
   - an approval without `approve: true` gets a 400;
   - a cue that already has a PENDING, RUNNING or DONE job reuses that job;
   - a server where generation is not authorized gets a 403;
   - with no live supportsAudio relay the request gets a 409.

   Event cues are shorter than ACE-Step's 10-second minimum, so they request
   10 seconds and are trimmed at ingestion. Nothing enqueues from game play,
   page load or a public route.

3. Wait for actual completion with a readable audio artifact. Reject failed,
   missing or inaccessible files rather than substituting an expected URL.
4. Validate the duration and format, find a loop point, transcode a web-safe
   static rendition, and record a content checksum with its provenance
   (`artJobId`), `approvedAt` and `verifiedAt`. Publish it under
   `/images/arcade/audio/<game>/<cue>.<format>` (shared cues use
   `shared/<cue>`). Do this only once the file can be fetched from the
   environment where the cabinet runs.
5. Add the asset to `VERIFIED_ARCADE_AUDIO_ASSETS`. The mixer picks it up at
   the next unlock. If the file goes missing it falls back to the oscillators
   automatically.

## Verification

- `npm run test:arcade-soundtrack-briefs` checks:
  - game slugs and every brief's fields (mood, instrumentation, BPM inside
    ACE-Step's range, loop length);
  - that job keys are unique and every request builds;
  - the dedupe needle, the authorization flag and the approval decisions;
  - that unverified assets are never used.
- `npm run test:arcade-soundtrack-mixer` uses a fake AudioContext to check:
  - no fetch or playback before unlock;
  - oscillator fallback when a file is missing or undecodable, and no refetch;
  - crossfade timing;
  - every loop cut on leave, including mid-crossfade and for a load that
    finishes after leaving;
  - ducking math, volume and mute;
  - recorded event cues versus their preset fallback.
- `npm run test:relay-agent-registry` covers the `supportsAudio` readiness
  rules.
- **Still manual:** test gesture-only unlock, the volume slider, exit cleanup
  and real transitions in actual browsers (including iOS Safari) and with
  gamepads.
- The audio issue stays open until at least one ACE-produced, approved,
  reachable recording has been heard in a cabinet.
