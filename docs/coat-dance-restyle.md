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
No browser tab must remain open for storage to persist. A future worker owns
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
5. Render a faithful 20-30 second sample including the coat flourish. Compare
   motion and silhouettes side-by-side with the original before full production.
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
