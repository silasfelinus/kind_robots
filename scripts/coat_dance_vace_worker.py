#!/usr/bin/env python3
"""Coat Dance Wan VACE pilot worker. Run on a host that can reach ComfyUI and PRIVATE_PATH.

Uses ComfyUI's *native* LoadVideo/GetVideoComponents/WanVaceToVideo nodes,
rather than pretending WAN image-to-video is motion conditioned.
No third-party Python dependencies. The worker only reads jobs explicitly
queued from the admin studio; it never changes the original source file.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid

FPS = 16
WINDOW = 65  # Wan temporal alignment: 4n + 1 frames
STEP = 57    # 8-frame overlap, divided equally at stitching
MODEL = "wan2.1_vace_1.3B_fp16.safetensors"
VAE = "wan_2.1_vae.safetensors"
ENCODER = "umt5-xxl-encoder-Q5_K_M.gguf"
NEGATIVE = (
    "flicker, frame jumps, deformed hands, duplicate performer, "
    "camera movement, changed choreography, distorted coat silhouette, "
    "unreadable faces, artifacts, subtitles, low quality"
)
UUID_RE = re.compile(r"^[a-f0-9-]{36}$", re.I)
SOURCE_RE = re.compile(r"^source\.(mp4|mov|webm)$")


def stamp():
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def windows(frame_count):
    if frame_count <= 0:
        raise ValueError("empty sample")
    return [(index, start, min(WINDOW, frame_count - start))
            for index, start in enumerate(range(0, frame_count, STEP))
            if start == 0 or start < frame_count]


def accepted_frames(frame_count):
    spans = windows(frame_count)
    accepted = []
    for i, (index, start, _) in enumerate(spans):
        low = 0 if i == 0 else 4
        high = min(WINDOW, frame_count - start)
        if i + 1 < len(spans):
            high = min(high, spans[i + 1][1] + 4 - start)
        if high > low:
            accepted.append((index, low, high))
    return accepted


def probe(path):
    cmd = ["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)]
    data = json.loads(subprocess.check_output(cmd, stderr=subprocess.STDOUT, timeout=90))
    streams = data.get("streams") or []
    video = next((stream for stream in streams if stream.get("codec_type") == "video"), None)
    if not video:
        raise ValueError("Source contains no video stream.")
    length = float(data.get("format", {}).get("duration", 0))
    if not (1 <= length <= 900):
        raise ValueError("Verified source duration must be between 1s and 15m.")
    return {"duration": length, "width": video.get("width"), "height": video.get("height"),
            "audio": any(s.get("codec_type") == "audio" for s in streams)}


def graph(video_name, seed, prompt, prefix, reference_name=None):
    node = lambda cls, **inputs: {"class_type": cls, "inputs": inputs}
    workflow = {
        "model": node("UNETLoader", unet_name=MODEL, weight_dtype="default"),
        "sampling": node("ModelSamplingSD3", model=["model", 0], shift=8),
        "encoder": node("CLIPLoaderGGUF", clip_name=ENCODER, type="wan"),
        "vae": node("VAELoader", vae_name=VAE),
        "pos": node("CLIPTextEncode", clip=["encoder", 0], text=prompt),
        "neg": node("CLIPTextEncode", clip=["encoder", 0], text=NEGATIVE),
        "video": node("LoadVideo", file=video_name),
        "frames": node("GetVideoComponents", video=["video", 0]),
        "edges": node("Canny", image=["frames", 0], low_threshold=0.4, high_threshold=0.8),
        "control": node("WanVaceToVideo",
                        positive=["pos", 0], negative=["neg", 0], vae=["vae", 0],
                        width=720, height=480, length=WINDOW, batch_size=1,
                        strength=1.0, control_video=["edges", 0]),
        "sample": node("KSampler", model=["sampling", 0],
                       positive=["control", 0], negative=["control", 1],
                       latent_image=["control", 2], seed=seed,
                       steps=20, cfg=6, sampler_name="uni_pc", scheduler="simple",
                       denoise=1),
        "trim": node("TrimVideoLatent", samples=["sample", 0], trim_amount=["control", 3]),
        "decode": node("VAEDecode", samples=["trim", 0], vae=["vae", 0]),
        "new_video": node("CreateVideo", images=["decode", 0], fps=FPS),
        "save": node("SaveVideo", video=["new_video", 0],
                     filename_prefix=prefix, format="mp4", codec="auto"),
    }
    if reference_name:
        workflow["reference"] = node("LoadImage", image=reference_name)
        workflow["control"]["inputs"]["reference_image"] = ["reference", 0]
    return workflow


def send_json(base, resource, payload=None, timeout=90):
    request = urllib.request.Request(
        base.rstrip("/") + resource,
        data=json.dumps(payload).encode("utf-8") if payload is not None else None,
        headers={"Content-Type": "application/json"} if payload is not None else {},
        method="POST" if payload is not None else "GET",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def check_comfy(base):
    info = send_json(base, "/object_info")
    required = ["UNETLoader", "CLIPLoaderGGUF", "WanVaceToVideo", "LoadVideo",
                "GetVideoComponents", "Canny", "TrimVideoLatent", "CreateVideo",
                "SaveVideo", "ModelSamplingSD3", "VAELoader", "KSampler"]
    missing = [name for name in required if name not in info]
    if missing:
        raise RuntimeError("GPU ComfyUI is missing required nodes: " + ", ".join(missing))
    for name, field, expected in [
        ("UNETLoader", "unet_name", MODEL),
        ("CLIPLoaderGGUF", "clip_name", ENCODER),
        ("VAELoader", "vae_name", VAE),
    ]:
        node = info[name]["input"]["required"]
        listed = node.get(field, [[], {}])[0]
        if isinstance(listed, list) and expected not in listed:
            raise RuntimeError(f"GPU model missing: {expected}. Install it on the ComfyUI host before retrying.")
    return True


def download_output(base, payload, dest):
    filename = payload.get("filename", "")
    subfolder = payload.get("subfolder", "")
    kind = payload.get("type", "output")
    if not filename or "/" in filename or "\\" in filename:
        raise ValueError("Comfy returned an unsafe filename.")
    query = urllib.parse.urlencode({"filename": filename, "subfolder": subfolder, "type": kind})
    with urllib.request.urlopen(base.rstrip("/") + "/view?" + query, timeout=90) as response:
        with open(dest, "wb") as file:
            shutil.copyfileobj(response, file)
    if dest.stat().st_size == 0:
        raise ValueError("Comfy returned an empty rendered video.")


def execute_comfy(base, workflow, result, timeout_seconds=10800):
    queued = send_json(base, "/prompt", {"prompt": workflow, "client_id": uuid.uuid4().hex})
    if not queued.get("prompt_id"):
        raise RuntimeError(f"Comfy rejected workflow: {queued.get('node_errors', queued)}")
    prompt_id = queued["prompt_id"]
    deadline = time.monotonic() + timeout_seconds
    while time.monotonic() < deadline:
        history = send_json(base, "/history/" + urllib.parse.quote(prompt_id))
        entry = history.get(prompt_id)
        if entry:
            status = entry.get("status", {})
            if status.get("status_str") == "error":
                raise RuntimeError("Comfy execution failed: " + str(status.get("messages", []))[-1500:])
            files = entry.get("outputs", {}).get("save", {})
            videos = files.get("videos") or files.get("gifs") or []
            if videos:
                download_output(base, videos[0], result)
                return prompt_id
        time.sleep(8)
    raise TimeoutError(f"Comfy pilot window timed out, prompt {prompt_id}.")


def update(job_path, job, **fields):
    job.update(fields)
    job["updatedAt"] = stamp()
    temp = job_path.with_name("job-" + uuid.uuid4().hex + ".tmp")
    temp.write_text(json.dumps(job, indent=2) + "\n", encoding="utf-8")
    os.replace(temp, job_path)


def run(cmd):
    done = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if done.returncode:
        raise RuntimeError(f"{cmd[0]} failed: {done.stderr[-1200:]}")
    return done


def extract_window(source, start_time, dest):
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-ss", f"{start_time:.6f}", "-i", str(source),
         "-vf", f"fps={FPS},scale=720:480:force_original_aspect_ratio=decrease,"
                "pad=720:480:(ow-iw)/2:(oh-ih)/2,"
                "tpad=stop_mode=clone:stop_duration=5,trim=end_frame=65,"
                "setpts=PTS-STARTPTS",
         "-frames:v", str(WINDOW), "-an", "-c:v", "libx264",
         "-pix_fmt", "yuv420p", str(dest)])


def assemble(job_dir, source, pilot, outputs, frame_count, quality):
    retained = accepted_frames(frame_count)
    inputs = [part for part in outputs]
    filters = []
    for k, (_, low, high) in enumerate(retained):
        filters.append(f"[{k}:v]trim=start_frame={low}:end_frame={high},setpts=PTS-STARTPTS[v{k}]")
    joined = "".join(f"[v{k}]" for k in range(len(retained)))
    filters.append(f"{joined}concat=n={len(retained)}:v=1:a=0[joined]")
    video_map = "[joined]"
    if quality == "1080p":
        filters.append("[joined]scale=1620:1080:flags=lanczos[out]")
        video_map = "[out]"
    command = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y"]
    for path in inputs:
        command += ["-i", str(path)]
    command += ["-ss", str(pilot["startSec"]), "-t", str(pilot["durationSec"]), "-i", str(source)]
    command += ["-filter_complex", ";".join(filters), "-map", video_map,
                "-map", f"{len(inputs)}:a:0?", "-c:v", "libx264", "-crf", "18",
                "-preset", "medium", "-c:a", "aac", "-b:a", "192k",
                "-r", str(FPS), "-frames:v", str(frame_count),
                "-movflags", "+faststart", str(job_dir / "pilot.mp4")]
    run(command)


def render(job_path, args):
    job_dir = job_path.parent
    job = json.loads(job_path.read_text(encoding="utf-8"))
    if job.get("status") != "PILOT_QUEUED":
        return
    if not UUID_RE.fullmatch(job.get("id", "")) or job_dir.name != job["id"]:
        raise ValueError("Invalid restyle job ID.")
    if not SOURCE_RE.fullmatch(job.get("sourceFile", "")):
        raise ValueError("Invalid source file name.")
    if str(job.get("userId")) != job_dir.parent.name:
        raise ValueError("Job ownership disagrees with folder.")
    source = job_dir / job["sourceFile"]
    if not source.is_file():
        raise FileNotFoundError("Uploaded source video is missing.")
    if source.is_symlink():
        raise ValueError("Source video must not be a symlink.")
    meta = probe(source)
    pilot = job["pilot"]
    start = float(pilot["startSec"])
    duration = float(pilot["durationSec"])
    if start < 0 or duration <= 0 or start + duration > meta["duration"] + 0.5:
        raise ValueError("Pilot window is outside verified source duration.")
    frame_count = max(1, round(duration * FPS))
    spans = windows(frame_count)
    if args.dry_run:
        print(json.dumps({"source": str(source), "verified": meta, "pilot": pilot,
                          "windowCount": len(spans), "model": MODEL}, indent=2))
        return
    try:
        check_comfy(args.comfy_url)
    except (RuntimeError, urllib.error.URLError) as error:
        update(job_path, job, status="PILOT_BLOCKED", stage=str(error), error=str(error))
        return
    lock = job_dir / "pilot.lock"
    try:
        with lock.open("x", encoding="utf-8") as owned:
            owned.write(stamp())
        _render_unlocked(job_path, job, meta, source, pilot, frame_count, spans, args)
    except FileExistsError:
        print("Pilot already owned by another worker:", job["id"])
    finally:
        if lock.is_file():
            lock.unlink(missing_ok=True)


def _render_unlocked(job_path, job, meta, source, pilot, frame_count, spans, args):
    job_dir = job_path.parent
    try:
        update(job_path, job, status="PILOT_RUNNING", stage="Verifying and preparing motion guides")
        clips = []
        for index, start_frame, count in spans:
            rendered = job_dir / f"pilot_window_{index:03d}.mp4"
            clips.append(rendered)
            if not rendered.is_file() or rendered.stat().st_size == 0:
                guide = job_dir / f"motion_control_{index:03d}.mp4"
                extract_window(source, pilot["startSec"] + start_frame / FPS, guide)
                input_name = f"coatdance_{job['id']}_{index:03d}.mp4"
                staged = args.comfy_input / input_name
                if not staged.exists():
                    shutil.copyfile(guide, staged)
                prompt = (
                    job["renderRecipe"]["stylePrompt"] +
                    ". Fixed wide stage camera, one performer, a black coat moving "
                    "in exact correspondence with the Canny-controlled original video. "
                    "Retain timing, posture, silhouette and all gestures."
                )
                image_name = None
                if (job_dir / "reference.png").is_file():
                    image_name = f"coatdance_{job['id']}_reference.png"
                    if not (args.comfy_input / image_name).exists():
                        shutil.copyfile(job_dir / "reference.png", args.comfy_input / image_name)
                workflow = graph(input_name, 3451900 + index, prompt,
                                 f"coatdance/{job['id']}/pilot_{index:03d}", image_name)
                execute_comfy(args.comfy_url, workflow, rendered, args.timeout_seconds)
            pilot["completedSegments"] = index + 1
            pilot["totalSegments"] = len(spans)
            update(job_path, job, pilot=pilot,
                   progress=round(100 * (index + 1) / (len(spans) + 1)),
                   stage=f"Motion-conditioned window {index + 1}/{len(spans)} complete")
        update(job_path, job, stage="Assembling sample and restoring source audio")
        assemble(job_dir, source, pilot, clips, frame_count, job["quality"])
        result = job_dir / "pilot.mp4"
        if not result.is_file() or result.stat().st_size < 1000:
            raise RuntimeError("Pilot render assembly produced no playable output.")
        update(job_path, job, status="REVIEW", stage="Pilot ready for choreography review",
               progress=100, resultFile="pilot.mp4", error=None)
    except Exception as exc:
        update(job_path, job, status="PILOT_FAILED", stage="Pilot render failed",
               error=str(exc)[-1800:])
        raise


def main():
    parser = argparse.ArgumentParser(description="Private Coat Dance Wan VACE pilot runner")
    parser.add_argument("--private-root", type=Path, default=Path(os.environ.get("PRIVATE_PATH", "/app/private")))
    parser.add_argument("--comfy-input", type=Path, default=Path(os.environ.get("COMFY_INPUT_PATH", ".")))
    parser.add_argument("--comfy-url", default=os.environ.get("COMFY_URL", "http://127.0.0.1:8188"))
    parser.add_argument("--timeout-seconds", type=int, default=10800)
    parser.add_argument("--poll-seconds", type=int, default=30)
    parser.add_argument("--once", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    root = args.private_root / "video-restyle"
    if not root.is_dir():
        raise SystemExit(f"Restyle volume not mounted: {root}")
    if not args.dry_run and not args.comfy_input.is_dir():
        raise SystemExit(f"Comfy input directory not mounted: {args.comfy_input}")
    while True:
        jobs = sorted(root.glob("*/????????-????-????-????-????????????/job.json"))
        for path in jobs:
            try:
                if json.loads(path.read_text(encoding="utf-8")).get("status") == "PILOT_QUEUED":
                    render(path, args)
            except Exception as exc:
                print(f"Pilot {path.parent.name} error: {exc}", file=sys.stderr)
        if args.once or args.dry_run:
            break
        time.sleep(args.poll_seconds)


if __name__ == "__main__":
    main()
