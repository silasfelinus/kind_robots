# Coat Dance motion-preserving pilot: runtime integration

The first controlled GPU run is a **24-second pilot at source time 2:38–3:02**.
This window includes beat-map rows 16–17, the 2:40–2:58 coat flourish and
measured movement climax. It is _not_ an arbitrary first five seconds.

The admin-only /admin/coat-dance studio saves the original video and queues
a pilot by changing job.json to PILOT_QUEUED. It does **not** execute GPU
compute inside a web request and does **not** call the WAN/LTX image-to-video
ArtJob endpoints (those endpoints lack a full motion-control video input).

## Production worker

A new independent local worker is checked in at
`scripts/coat_dance_vace_worker.py`. It uses Python's standard library plus
ffmpeg/ffprobe. It needs a home GPU host with ComfyUI native `LoadVideo`,
`GetVideoComponents`, `Canny`, `WanVaceToVideo`, and `SaveVideo` nodes.

**Required model**: `wan2.1_vace_1.3B_fp16.safetensors` in ComfyUI's
diffusion_models directory. This is **different** from the already wired
WAN 2.2 TI2V 5B image-to-video model. The worker preflights actual ComfyUI
node/model inventory before starting. Missing nodes/models change the job
to `PILOT_BLOCKED` with the reason, not a fake render. It also needs the
existing `wan_2.1_vae.safetensors` and
`umt5-xxl-encoder-Q5_K_M.gguf` (the latter via CLIPLoaderGGUF).

To run on the machine that hosts ComfyUI and can read the private Kind Robots
mount, point at the _real_ shared paths, which may be different from the
web container's /app/private:

```sh
python3 scripts/coat_dance_vace_worker.py \
  --private-root /path/to/mounted/kindrobots/private \
  --comfy-input /path/to/ComfyUI/input \
  --comfy-url http://127.0.0.1:8188 --once --dry-run
```

Dry run probes the original file and prints its verified duration and motion
window count; no media or status is modified. Omit `--dry-run` and
`--once` to poll for pending pilots every 30 seconds. This runner has
**not** been installed as a service on Alexandria or the Windows GPU host
by this change; installing models, mapping shared paths and starting a
long-running host process are separate operational gates. There is no
automatic remote polling until it is running.

## What the worker really does

1. Check source bytes on the shared private mount and use ffprobe to verify
   media, length and whether an audio track exists. Never trust the browser
   duration as media authority.
2. Extract 65-frame/16fps control clips (~4.1 s) from the original, without
   changing camera or source timing, padded only at the final edge.
3. Build a **native ComfyUI VACE video-to-video** graph from each clip,
   decode it with `GetVideoComponents`, create Canny structural guidance,
   and feed the motion sequence into `WanVaceToVideo`. A _separate_ optional
   `reference.png` next to the job adds consistent visual identity once an
   Illustrious-painted anchor frame is generated.
4. Persist one output per window and update job.json after each, so completed
   output files are reused on restart. 8-frame overlaps are divided at
   midpoint. With a 384-frame pilot, the kept frames cover exactly
   0–383 once each.
5. Assemble the processed frames at 16fps and reattach the **unaltered
   source timeline's audio sample** as AAC. The final pilot is private
   `pilot.mp4`. In 1080p target mode it is 1620×1080, preserving the
   original 3:2 aspect ratio rather than cropping to 16:9.
6. Mark status REVIEW only after a nonempty pilot MP4 exists. Owner-scoped
   API playback is available through /api/video-restyle/:id/result.
   Failures are visible, retryable, and do not overwrite the uploaded file.

## Limits and gates

- This is an independently persisted **pilot worker queue**, not yet a new
  ArtJob engine. It does not claim ArtJob completion or mana accounting.
  Unifying it with the established relay/ArtJob engine requires teaching
  the relay video-control transport instead of sending incompatible
  image-to-video payloads.
- It relies on Comfy's native 1.3B VACE model at 720×480 on a 12GB GPU.
  Runtime/quality/VRAM must be measured on the actual render machine.
- The first run is a **motion fidelity experiment**. The desired Illustrious
  house checkpoint still needs its own rendered reference anchor; a
  stylePrompt in VACE is not the same as running the Illustrious checkpoint.
- Full-length processing, quality review, re-timing/optical seam blending,
  ArtImage final export, and finish alerts remain out of scope until the
  pilot's actual result can be evaluated. Do not mark coat-dance/t-011 done
  until an actual animated film is produced and inspected.
