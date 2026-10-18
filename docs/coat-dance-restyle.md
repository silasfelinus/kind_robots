# Coat Dance full-video restyle: staged upload contract

The admin-only `/admin/coat-dance` route is linked from Video Gen. It accepts
MP4/MOV/WebM files up to 128 MiB, including the 35.5 MB / 5:32 reference.
The source is stored under `PRIVATE_PATH/video-restyle/<owner-id>/<uuid>/source.<ext>`;
a `job.json` manifest beside it survives browser navigation and application
restarts on the mounted Unraid volume. Never place sources in public/images or
base64 DB columns. The upload endpoint checks admin authentication, content
length, magic bytes, style/quality and the client-reported length. **The duration
is not verified against the file until the worker uses ffprobe.**

State **STAGED** is deliberate: **this PR does not yet implement motion-conditioned
rendering, audio assembly, automated worker execution or notifications**. Do not
call a staged job queued/running/done, set nonzero progress, or charge mana.
The saved source can be reopened from the same admin workspace through an authenticated\nprivate streaming route (never a public URL); staged style and quality can be updated\nwithout re-uploading the video. The three editor panes remain visible together\nat desktop widths and switch independently on narrow screens.\nNo browser tab must remain open for storage to persist. A future worker owns
status transitions, media probing, resumability and reassembly.

## Worker acceptance contract

1. Run ffprobe against the private source, reject invalid media or durations
   above 15 minutes, inspect rotation, pixel aspect, fps, and audio streams.
2. Rebuild the timestamp manifest from the _verified_ source duration. The
   client-provided duration is a hint only. Never truncate the original
   5:32 choreography by trusting that hint.
3. Create motion/pose and optional depth/line guides from original frames.
   Use Illustrious anchor frames, with a measured temporal-conditioning
   backend (test WAN VACE first; LTX is an alternate after a fidelity trial).
   The current WAN/LTX image-to-video endpoints **do not** implement
   video-to-video conditioning, so do not submit those jobs as a substitute.
4. Process ~4.5-second windows with 0.5-second overlaps; continuity anchors
   and optical alignment must cross each seam. Track immutable segment IDs,
   per-segment ArtJob IDs, attempts, output and failures to permit resume.
5. ~~Render a 20-30 second pilot before full production.~~ Superseded by Silas,
   2026-10-18: upload, choose a look, and the **whole film renders in one
   batch**. The studio no longer queues pilots; existing pilot files remain
   watchable, and `queueRestyleFull` accepts STAGED, PILOT_BLOCKED,
   PILOT_FAILED and REVIEW projects. Windows are saved as they finish, so a
   failed film resumes instead of restarting.
6. Stitch using exact source PTS, blend overlaps instead of duplicating frames,
   copy the original synchronized audio and upscale _after_ assembly (target
   720p or 1080p). Check duration, A/V sync and dropped-frame count.
7. Persist progress server-side and offer a private playable MP4 download.
   Notification should be sent from the established queue/digest service,
   not from an open browser tab. No public release without human approval.

A 12 GB GPU may need lower-resolution working frames and staged offloading.
Treat runtime and VRAM estimates as measurements to collect in the excerpt test,
not as promises. Preserve the old 38-beat creative plan; style experiments are
reversible and should not silently approve later camera/perspective treatments.

## Grab bag (intentional style rotation)

Every other look aims for continuity. **Grab bag** (`style: 'grab-bag'`) does
the opposite on purpose: each VACE motion window (65 frames every 57 at 16 fps,
about 3.6 s) gets a different look from the chosen list.

- The job saves `variantStyleIds` (2 up to every look, in rotation order) and
  `variantMode` (`cycle`, or `shuffle_locked`, which is shuffled once in the
  studio and then saved as the fixed order). Nothing reshuffles after saving.
- Queueing a render persists `styleSchedule` on that pass: one
  concrete look per window, computed by `planRestyleStyleSchedule`. The
  rotation is anchored to source time, so the 2:38 pilot shows the same looks
  the full film uses at 2:38. Pilot re-renders, retries, and full-film runs
  read the saved schedule, which does not change.
- The ArtJob payload carries `videoRestyle.styleSchedule` plus each used look's
  prompt once (`stylePrompts`). Only a relay that declares
  `supportsVideoRestyleGrabBag` may claim it. An older relay leaves the job
  PENDING instead of rendering it in one style.
- The worker (conductor `ops/home-server/coat_dance_vace_worker.py`) renders
  each window with its own look and does **not** chain the previous window's
  stylized frame as a reference, which would pull the old look into the new
  window. The Canny motion guide still keeps the dance intact.
