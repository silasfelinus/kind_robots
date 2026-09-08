#Requires -Version 5.1
<#
.SYNOPSIS
  Copy the ComfyUI models Kind Robots actually uses onto Ferngrotto's local
  disk, off the Alexandria share.

.DESCRIPTION
  WHY THIS EXISTS. Krea 2 jobs were taking ~400s each, of which ~370s was
  ComfyUI evicting the 5 GB Qwen3-VL text encoder between prompts and reading
  it back at roughly 13 MB/s. The same queue -- same model, same 1024x1024,
  same 8 steps -- ran at ~63 jobs/hour on 2026-09-06 and ~8.5/hour after. The
  delta is entirely re-reading weights over the share. Local disk turns that
  370s reload into seconds, so an eviction stops mattering.

  WHY POWERSHELL. Ferngrotto is Windows and this is run from a PowerShell
  prompt. The bash sibling of this script (sync-comfy-models.sh) is for a Linux
  host; running it here would mean WSL, and WSL reaches the Windows filesystem
  through /mnt/d, which is exactly the slow bridge this script exists to stop
  using. Native Copy/robocopy is the point.

  COPY, NOT MOVE, BY DEFAULT. These files are large and slow to re-acquire, and
  a half-finished move is a broken render host. This copies, verifies size (and
  optionally SHA256), and only deletes the Alexandria copy with -PruneRemote.
  Re-running is safe: files already local at the right size are skipped.

.EXAMPLE
  # From PowerShell, in the repo:
  cd D:\code\kind_robots
  git pull
  .\scripts\sync-comfy-models.ps1 -DryRun

.EXAMPLE
  # Just the three Krea 2 files -- the whole queue bottleneck
  .\scripts\sync-comfy-models.ps1 -Tier core -Yes

.EXAMPLE
  # When auto-detection guesses wrong
  .\scripts\sync-comfy-models.ps1 -Local D:\ComfyUI\models -Remote \\alexandria\pc\ai\models
#>
[CmdletBinding()]
param(
  [string] $Local,
  [string] $Remote,
  [ValidateSet('core', 'image', 'video', 'extra', 'all')]
  [string] $Tier = 'all',
  [switch] $DryRun,
  [switch] $Yes,
  [switch] $Verify,
  [switch] $PruneRemote
)

$ErrorActionPreference = 'Stop'

function Fail([string] $Message) {
  Write-Host "error: $Message" -ForegroundColor Red
  exit 1
}

function Format-Size([double] $Bytes) {
  $units = 'B', 'KB', 'MB', 'GB', 'TB'
  $i = 0
  while ($Bytes -ge 1024 -and $i -lt 4) { $Bytes /= 1024; $i++ }
  '{0:N1}{1}' -f $Bytes, $units[$i]
}

# ── the manifest ────────────────────────────────────────────────────────────
#
# Tier, the ComfyUI category directory, and the name EXACTLY as the workflow
# builders send it to ComfyUI. A name carrying a subfolder ("ltx/...") must
# keep that subfolder locally: ComfyUI resolves it relative to the category
# directory, not by basename.
#
#   core  - Krea 2. 188 of 198 pending jobs. This tier alone fixes the queue.
#   image - the other still-image lanes (Kontext, Flux, Flux2, SDXL).
#   video - WAN and LTX. Large, and only the animation lanes use them.
#   extra - occasional (Hunyuan3D, SD1.5).
$Manifest = @'
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
'@ -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ }

# ── finding things ──────────────────────────────────────────────────────────

# A directory only counts as the ComfyUI models root if it ALREADY holds a
# recognisable category folder. Without that check an empty or wrong path could
# be silently adopted as the destination for ten gigabytes of weights.
function Test-ModelsDir([string] $Path) {
  if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
  if (-not (Test-Path -LiteralPath $Path -PathType Container)) { return $false }
  foreach ($sub in 'unet', 'diffusion_models', 'clip', 'text_encoders', 'vae', 'checkpoints', 'loras') {
    if (Test-Path -LiteralPath (Join-Path $Path $sub) -PathType Container) { return $true }
  }
  return $false
}

function Find-LocalRoot {
  $candidates = @()
  if ($env:COMFYUI_MODELS) { $candidates += $env:COMFYUI_MODELS }
  # Every fixed drive, common install spellings. Ordered so a D:/E: data drive
  # wins over C: -- that is where a render box usually keeps models.
  $drives = Get-PSDrive -PSProvider FileSystem -ErrorAction SilentlyContinue |
    Where-Object { $_.Free -ne $null } | Select-Object -ExpandProperty Root
  foreach ($d in ($drives | Sort-Object -Descending)) {
    foreach ($p in 'ComfyUI\models', 'comfyui\models', 'AI\ComfyUI\models',
                   'ComfyUI_windows_portable\ComfyUI\models', 'stable-diffusion\ComfyUI\models') {
      $candidates += (Join-Path $d $p)
    }
  }
  foreach ($c in $candidates) {
    if (Test-ModelsDir $c) { return (Resolve-Path -LiteralPath $c).Path }
  }
  return $null
}

function Find-RemoteRoot {
  $candidates = @()
  if ($env:ALEXANDRIA_MODELS) { $candidates += $env:ALEXANDRIA_MODELS }
  $candidates += '\\alexandria\pc\ai\models'
  $candidates += '\\ALEXANDRIA\pc\ai\models'
  # Any mapped network drive that happens to expose the same tree.
  $mapped = Get-PSDrive -PSProvider FileSystem -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayRoot -like '\\*' } | Select-Object -ExpandProperty Root
  foreach ($m in $mapped) { $candidates += (Join-Path $m 'pc\ai\models'); $candidates += $m }
  foreach ($c in $candidates) {
    if ($c -and (Test-Path -LiteralPath $c -PathType Container)) { return $c }
  }
  return $null
}

# ── preflight ───────────────────────────────────────────────────────────────
if (-not $Local) {
  $Local = Find-LocalRoot
  if ($Local) { Write-Host "auto-detected ComfyUI models dir: $Local" }
}
if (-not $Local) {
  Fail "could not find a ComfyUI models directory. Pass it: -Local D:\ComfyUI\models"
}

if (-not $Remote) {
  $Remote = Find-RemoteRoot
  if ($Remote) { Write-Host "auto-detected Alexandria share  : $Remote" }
}
if (-not $Remote -or -not (Test-Path -LiteralPath $Remote -PathType Container)) {
  Fail "the Alexandria model share is not reachable. Map it or pass it: -Remote \\alexandria\pc\ai\models"
}

Write-Host ""
Write-Host "remote : $Remote"
Write-Host "local  : $Local"
Write-Host "tier   : $Tier"
Write-Host ""

# The share's own layout is not assumed: a file is looked up by name anywhere
# beneath it. That index is built LAZILY -- walking a large SMB share costs
# real time, and if the share happens to mirror ComfyUI's own layout every
# literal path hits and the walk never happens.
$script:remoteIndex = $null
function Get-RemoteIndex {
  if ($null -eq $script:remoteIndex) {
    Write-Host "indexing the share (first lookup that needs it)..."
    $script:remoteIndex = @{}
    foreach ($f in Get-ChildItem -LiteralPath $Remote -Recurse -File -ErrorAction SilentlyContinue) {
      if (-not $script:remoteIndex.ContainsKey($f.Name)) { $script:remoteIndex[$f.Name] = $f }
    }
  }
  return $script:remoteIndex
}

# ── plan ────────────────────────────────────────────────────────────────────
$plan = @()
$missing = 0
foreach ($line in $Manifest) {
  $tier, $subdir, $rel = $line -split '\|', 3
  if ($Tier -ne 'all' -and $Tier -ne $tier) { continue }

  $relWin = $rel -replace '/', '\'
  $leaf = Split-Path $relWin -Leaf
  $dest = Join-Path $Local (Join-Path $subdir $relWin)

  $src = $null
  $literal = Join-Path $Remote $relWin
  if (Test-Path -LiteralPath $literal -PathType Leaf) {
    $src = Get-Item -LiteralPath $literal
  } else {
    $idx = Get-RemoteIndex
    if ($idx.ContainsKey($leaf)) { $src = $idx[$leaf] }
  }

  if (-not $src) {
    Write-Host ('  {0,-6} {1,-12} {2,-52} MISSING on share' -f $tier, $subdir, $rel)
    $missing++
    continue
  }

  if ((Test-Path -LiteralPath $dest -PathType Leaf) -and
      ((Get-Item -LiteralPath $dest).Length -eq $src.Length)) {
    Write-Host ('  {0,-6} {1,-12} {2,-52} already local ({3})' -f $tier, $subdir, $rel, (Format-Size $src.Length))
    continue
  }

  Write-Host ('  {0,-6} {1,-12} {2,-52} COPY {3}' -f $tier, $subdir, $rel, (Format-Size $src.Length))
  $plan += [pscustomobject]@{ Subdir = $subdir; Rel = $relWin; Src = $src; Dest = $dest; Bytes = $src.Length }
}

Write-Host ""
if ($plan.Count -eq 0) {
  Write-Host "nothing to copy - every model in tier '$Tier' is already local."
  if ($missing -gt 0) { Write-Host "note: $missing manifest entries were not found on the share." }
  exit 0
}

$total = ($plan | Measure-Object -Property Bytes -Sum).Sum
$localDrive = Get-PSDrive -Name ((Split-Path -Qualifier $Local) -replace ':', '') -ErrorAction SilentlyContinue
Write-Host ("to copy : {0}" -f (Format-Size $total))
if ($localDrive -and $localDrive.Free) {
  Write-Host ("free    : {0} on {1}" -f (Format-Size $localDrive.Free), (Split-Path -Qualifier $Local))
  if ($localDrive.Free -lt $total) {
    Fail ("not enough free space - need {0}, have {1}" -f (Format-Size $total), (Format-Size $localDrive.Free))
  }
}
if ($missing -gt 0) { Write-Host "missing : $missing not found on the share (skipped)" }
Write-Host ""

if ($DryRun) { Write-Host "-DryRun: stopping before any copy."; exit 0 }

if (-not $Yes) {
  $reply = Read-Host "proceed? [y/N]"
  if ($reply -notmatch '^[Yy]') { Write-Host "aborted."; exit 1 }
}

# ── copy ────────────────────────────────────────────────────────────────────
$copied = 0
foreach ($item in $plan) {
  Write-Host "==> $($item.Rel)"
  $destDir = Split-Path $item.Dest -Parent
  New-Item -ItemType Directory -Force -Path $destDir | Out-Null

  # Staged through a temp directory and renamed only once the size checks out,
  # so an interrupted run never leaves a truncated file sitting at the name
  # ComfyUI would try to load. robocopy because it is built in, handles UNC
  # sources properly, and /Z restarts a dropped network copy mid-file.
  $stage = Join-Path $destDir '.kr-sync-tmp'
  New-Item -ItemType Directory -Force -Path $stage | Out-Null
  $staged = Join-Path $stage $item.Src.Name

  robocopy $item.Src.DirectoryName $stage $item.Src.Name /Z /J /R:2 /W:5 /NJH /NJS /NDL /NC | Out-Host
  # robocopy exit codes below 8 are success/informational; 8+ is a real failure.
  if ($LASTEXITCODE -ge 8) {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
    Fail "robocopy failed for $($item.Rel) (exit $LASTEXITCODE) - share copy left in place"
  }

  if (-not (Test-Path -LiteralPath $staged -PathType Leaf) -or
      (Get-Item -LiteralPath $staged).Length -ne $item.Bytes) {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
    Fail "short copy for $($item.Rel) - share copy left in place"
  }

  if ($Verify) {
    Write-Host "    verifying SHA256 (reads both copies in full)..."
    $a = (Get-FileHash -LiteralPath $item.Src.FullName -Algorithm SHA256).Hash
    $b = (Get-FileHash -LiteralPath $staged -Algorithm SHA256).Hash
    if ($a -ne $b) {
      Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
      Fail "checksum mismatch for $($item.Rel) - share copy left in place"
    }
    Write-Host "    ok $b"
  }

  Move-Item -LiteralPath $staged -Destination $item.Dest -Force
  Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue

  if ($PruneRemote) {
    Write-Host "    removing share copy: $($item.Src.FullName)"
    Remove-Item -LiteralPath $item.Src.FullName -Force
  }

  $copied++
}

Write-Host ""
Write-Host "done: $copied file(s) now local."
Write-Host @"

--------------------------------------------------------------------------
NEXT, AND THIS IS THE STEP THAT ACTUALLY MAKES IT FASTER.

Copying the files changes nothing until ComfyUI stops resolving them over the
share. ComfyUI searches its configured model paths IN ORDER, so if the
Alexandria path is still listed first it keeps reading from it and the queue
stays at ~8 jobs/hour.

In ComfyUI's extra_model_paths.yaml, put the local root first - or, once you
trust this copy, drop the Alexandria entry entirely. Forward slashes:

  ferngrotto:
    base_path: $($Local -replace '\\', '/')
    unet: unet
    clip: clip
    vae: vae
    checkpoints: checkpoints
    loras: loras

Then restart ComfyUI and check its log: a second consecutive Krea 2 job should
no longer spend ~370s on "Model Krea2TEModel_ prepared for dynamic VRAM
loading" before it starts sampling.
--------------------------------------------------------------------------
"@
