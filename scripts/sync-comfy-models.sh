#!/usr/bin/env bash
#
# scripts/sync-comfy-models.sh — pull the ComfyUI models Kind Robots actually
# uses onto Ferngrotto's LOCAL disk, off the Alexandria share.
#
# WHY THIS EXISTS. Krea 2 jobs were taking ~400s each, of which ~370s was
# ComfyUI evicting the 5 GB Qwen3-VL text encoder between prompts and reading it
# back at roughly 13 MB/s. The same queue, same model, same 1024x1024/8-step
# work, ran at ~63 jobs/hour on 2026-09-06 and ~8.5/hour after — the delta is
# entirely re-reading weights over the share. Local NVMe turns that 370s reload
# into seconds, so an eviction stops mattering.
#
# WHAT IT COPIES. Only the models the app actually names, read off the workflow
# builders in server/api/comfy/**. Anything else on the share is left alone.
#
# COPY, NOT MOVE, BY DEFAULT. These files are large and slow to re-acquire, and
# a half-finished move is a broken render host. The script copies, verifies size
# (and optionally checksum), and only removes the Alexandria copy if you ask for
# it explicitly with --prune-remote. Re-running is safe and resumable: files
# already present at the right size are skipped.
#
#   ./scripts/sync-comfy-models.sh --local /opt/comfyui/models            # plan, then confirm
#   ./scripts/sync-comfy-models.sh --local /opt/comfyui/models --tier core --yes
#   ./scripts/sync-comfy-models.sh --local /opt/comfyui/models --dry-run
#   ./scripts/sync-comfy-models.sh --local /opt/comfyui/models --verify   # + sha256 both ends
#
set -euo pipefail

REMOTE_ROOT="${REMOTE_ROOT:-/mnt/user/pc/ai/models}"
LOCAL_ROOT="${LOCAL_ROOT:-}"
TIER="all"
ASSUME_YES=0
DRY_RUN=0
VERIFY=0
PRUNE_REMOTE=0

usage() {
  sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --remote) REMOTE_ROOT="$2"; shift 2 ;;
    --local) LOCAL_ROOT="$2"; shift 2 ;;
    --tier) TIER="$2"; shift 2 ;;
    --yes|-y) ASSUME_YES=1; shift ;;
    --dry-run|-n) DRY_RUN=1; shift ;;
    --verify) VERIFY=1; shift ;;
    --prune-remote) PRUNE_REMOTE=1; shift ;;
    -h|--help) usage 0 ;;
    *) echo "unknown option: $1" >&2; usage 1 ;;
  esac
done

# ── the manifest ─────────────────────────────────────────────────────────────
#
# tier|comfy-subdir|name-as-the-app-asks-for-it
#
# The third field is EXACTLY the string the workflow builders send to ComfyUI,
# so a name here with a subfolder ("ltx/…") must keep that subfolder locally —
# ComfyUI resolves it relative to the category directory, not by basename.
#
#   core  — Krea 2. 188 of 198 pending jobs. Fixing this tier fixes the queue.
#   image — the other still-image lanes (Kontext, Flux, Flux2, SDXL).
#   video — WAN and LTX. Big, and only used by the animation lanes.
#   extra — occasional/one-off (Hunyuan3D, SD1.5).
MANIFEST=$(cat <<'EOF'
core|unet|Krea-2-Turbo-Q5_K_S.gguf
core|clip|qwen3vl_4b_fp8_scaled.safetensors
core|vae|qwen_image_vae.safetensors
image|unet|flux1-kontext-dev-Q5_K_M.gguf
image|unet|flux1-dev-Q8_0.gguf
image|unet|flux1-schnell-Q8_0.gguf
image|unet|flux2_dev_fp8mixed.safetensors
image|clip|t5-v1_1-xxl-encoder-Q5_K_S.gguf
image|clip|t5xxl_fp8_e4m3fn_scaled.safetensors
image|clip|clip_l.safetensors
image|clip|mistral_3_small_flux2_bf16.safetensors
image|vae|ae.safetensors
image|vae|flux2-vae.safetensors
image|checkpoints|SDXL/dreamshaperXL_v21TurboDPMSDE.safetensors
video|unet|wan2.2_ti2v_5B_fp16.safetensors
video|unet|wan2.2_i2v_high_noise_14B_fp8_scaled.safetensors
video|unet|wan2.2_i2v_low_noise_14B_fp8_scaled.safetensors
video|clip|umt5-xxl-encoder-Q5_K_M.gguf
video|clip|gemma_3_12B_it_fp4_mixed.safetensors
video|vae|wan_2.1_vae.safetensors
video|vae|wan2.2_vae.safetensors
video|checkpoints|ltx/ltx-2.3-22b-dev-fp8.safetensors
video|loras|ltx-2.3-22b-distilled-lora-384.safetensors
extra|checkpoints|3d/hunyuan_3d_v2.1.safetensors
extra|checkpoints|v1-5-pruned-emaonly.safetensors
EOF
)

want_tier() {
  [[ "$TIER" == "all" || "$TIER" == "$1" ]]
}

die() { echo "error: $*" >&2; exit 1; }

# ── preflight ────────────────────────────────────────────────────────────────
[[ -n "$LOCAL_ROOT" ]] || die "pass --local <comfyui models dir> (e.g. /opt/comfyui/models)"
[[ -d "$REMOTE_ROOT" ]] || die "remote root '$REMOTE_ROOT' is not mounted here. Mount the Alexandria share on Ferngrotto first."
mkdir -p "$LOCAL_ROOT" || die "cannot create '$LOCAL_ROOT'"
# rsync is preferred (resumable, progress), but a plain cp is a correct
# fallback — the size/checksum verification below is what actually guarantees
# the copy, not the tool that made it.
if command -v rsync >/dev/null; then COPY_TOOL=rsync; else COPY_TOOL=cp; fi

echo "remote : $REMOTE_ROOT"
echo "local  : $LOCAL_ROOT"
echo "tier   : $TIER"
echo

# Locate a manifest entry under the remote root. The share's own layout is not
# assumed: we search by basename, which survives whatever subfoldering exists
# over there, and only fall back to the literal relative path.
find_remote() {
  local rel="$1" base
  base="$(basename "$rel")"
  if [[ -f "$REMOTE_ROOT/$rel" ]]; then printf '%s\n' "$REMOTE_ROOT/$rel"; return 0; fi
  find "$REMOTE_ROOT" -type f -name "$base" -print -quit 2>/dev/null | grep . || return 1
}

human() { numfmt --to=iec --suffix=B "${1:-0}" 2>/dev/null || echo "${1:-0}B"; }

# ── plan ─────────────────────────────────────────────────────────────────────
PLAN=""      # tier|subdir|rel|src|bytes|action
total=0
missing=0
while IFS='|' read -r tier subdir rel; do
  [[ -n "${tier:-}" ]] || continue
  want_tier "$tier" || continue

  dest="$LOCAL_ROOT/$subdir/$rel"
  if ! src="$(find_remote "$rel")"; then
    printf '  %-9s %-12s %-52s MISSING on share\n' "$tier" "$subdir" "$rel"
    missing=$((missing + 1))
    continue
  fi

  sbytes=$(stat -c %s "$src" 2>/dev/null || echo 0)
  if [[ -f "$dest" ]] && [[ "$(stat -c %s "$dest" 2>/dev/null || echo -1)" == "$sbytes" ]]; then
    printf '  %-9s %-12s %-52s already local (%s)\n' "$tier" "$subdir" "$rel" "$(human "$sbytes")"
    continue
  fi

  printf '  %-9s %-12s %-52s COPY %s\n' "$tier" "$subdir" "$rel" "$(human "$sbytes")"
  PLAN+="$subdir|$rel|$src|$sbytes"$'\n'
  total=$((total + sbytes))
done <<< "$MANIFEST"

echo
if [[ -z "$PLAN" ]]; then
  echo "nothing to copy — every model in tier '$TIER' is already local."
  [[ "$missing" -gt 0 ]] && echo "note: $missing manifest entr(y|ies) not found on the share."
  exit 0
fi

avail=$(df -PB1 "$LOCAL_ROOT" | awk 'NR==2 {print $4}')
echo "to copy : $(human "$total")"
echo "free    : $(human "$avail") on $LOCAL_ROOT"
[[ "$missing" -gt 0 ]] && echo "missing : $missing not found on the share (skipped)"
if (( avail < total )); then
  die "not enough free space on $LOCAL_ROOT — need $(human "$total"), have $(human "$avail")"
fi
echo

if [[ "$DRY_RUN" == 1 ]]; then
  echo "--dry-run: stopping before any copy."
  exit 0
fi

if [[ "$ASSUME_YES" != 1 ]]; then
  read -r -p "proceed? [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]] || { echo "aborted."; exit 1; }
fi

# ── copy ─────────────────────────────────────────────────────────────────────
copied=0
while IFS='|' read -r subdir rel src sbytes; do
  [[ -n "${subdir:-}" ]] || continue
  dest="$LOCAL_ROOT/$subdir/$rel"
  mkdir -p "$(dirname "$dest")"

  echo "==> $rel"
  # Copy to a .part alongside the destination and rename only once the size
  # checks out. An interrupted run then never leaves a truncated file sitting
  # at the name ComfyUI would try to load.
  if [[ "$COPY_TOOL" == rsync ]]; then
    # --partial keeps a resumable remnant if the share drops mid-copy.
    rsync --times --partial --human-readable --info=progress2 "$src" "$dest.part"
  else
    cp --preserve=timestamps "$src" "$dest.part"
  fi

  pbytes=$(stat -c %s "$dest.part" 2>/dev/null || echo -1)
  if [[ "$pbytes" != "$sbytes" ]]; then
    rm -f -- "$dest.part"
    die "short copy for $rel (src $sbytes, got $pbytes) — share copy left in place"
  fi
  mv -f -- "$dest.part" "$dest"

  if [[ "$VERIFY" == 1 ]]; then
    echo "    verifying sha256 (reads both copies in full)…"
    s_sum=$(sha256sum "$src" | awk '{print $1}')
    d_sum=$(sha256sum "$dest" | awk '{print $1}')
    [[ "$s_sum" == "$d_sum" ]] || die "checksum mismatch for $rel — left the share copy in place"
    echo "    ok $d_sum"
  fi

  if [[ "$PRUNE_REMOTE" == 1 ]]; then
    echo "    removing share copy: $src"
    rm -f -- "$src"
  fi

  copied=$((copied + 1))
done <<< "$PLAN"

echo
echo "done: $copied file(s) now local."
cat <<EOF

────────────────────────────────────────────────────────────────────────────
NEXT, AND THIS IS THE STEP THAT ACTUALLY MAKES IT FASTER.

Copying the files changes nothing until ComfyUI stops resolving them over the
share. ComfyUI searches its configured model paths IN ORDER, so if the
Alexandria path is still listed first it will keep reading from it and the
queue will stay at ~8 jobs/hour.

In ComfyUI's extra_model_paths.yaml, put the local root first — or, once you
trust this copy, remove the Alexandria entry entirely:

  ferngrotto:
    base_path: $LOCAL_ROOT
    unet: unet
    clip: clip
    vae: vae
    checkpoints: checkpoints
    loras: loras

Then restart ComfyUI and confirm from its log that a second consecutive Krea 2
job no longer spends ~370s on "Model Krea2TEModel_ prepared for dynamic VRAM
loading" before it starts sampling.
────────────────────────────────────────────────────────────────────────────
EOF
