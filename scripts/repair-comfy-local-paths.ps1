#Requires -Version 5.1
<#
.SYNOPSIS
  Repair Ferngrotto's ComfyUI local-first model path configuration.

.DESCRIPTION
  Ferngrotto runs ComfyUI from D:\comfy\comfy-fast and its populated local
  model store is D:\comfy\comfy-fast\models. The `comfyui_local` name below is
  only a YAML section label; it is not a filesystem directory.

  The model sync scripts place text encoders in models/clip, but a 2026-09-08
  extra_model_paths.yaml revision pointed the local `clip` and `text_encoders`
  keys at models/text_encoders. The Alexandria section was also marked
  `is_default: true`, so share priority could beat the local copy depending on
  section order. A later repair mistakenly changed the local base_path to
  D:/comfy even though the populated model store lives under comfy-fast.

  This script makes three narrow, idempotent changes:
    1. the local comfyui_local base_path points at D:/comfy/comfy-fast;
    2. the local comfyui_local clip/text_encoders keys point at models/clip;
    3. the Alexandria comfyui section is no longer marked is_default, so the
       local section is the only default-priority model root.

  A timestamped backup is written before any change. The script deliberately
  does not restart ComfyUI; restart it after reviewing the reported diff.
#>
[CmdletBinding(SupportsShouldProcess)]
param(
  [string] $Path = 'D:\comfy\comfy-fast\extra_model_paths.yaml'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
  throw "extra_model_paths.yaml not found at '$Path'"
}

$raw = Get-Content -LiteralPath $Path -Raw
$original = $raw

$localHeader = '(?m)^comfyui_local:\s*$'
$shareHeader = '(?m)^comfyui:\s*$'
if ($raw -notmatch $localHeader) { throw 'missing comfyui_local section; refusing to guess' }
if ($raw -notmatch $shareHeader) { throw 'missing comfyui section; refusing to guess' }

# Work on section slices so a replacement cannot accidentally touch a similarly
# named key elsewhere in the YAML.
$localMatch = [regex]::Match($raw, '(?ms)^comfyui_local:\s*\r?\n(?<body>.*?)(?=^[A-Za-z0-9_-]+:\s*$|\z)')
if (-not $localMatch.Success) { throw 'could not parse comfyui_local section' }
$localSection = $localMatch.Value

# Ferngrotto's populated model store is inside the optimized Comfy install at
# D:/comfy/comfy-fast/models. The previous D:/comfy repair redirected every
# `models/...` lookup into a separate, mostly empty D:/comfy/models tree.
$localSection = [regex]::Replace(
  $localSection,
  '(?m)^(\s+base_path:\s*)D:[\\/]comfy\s*$',
  '${1}D:/comfy/comfy-fast'
)
if ($localSection -notmatch '(?m)^\s+base_path:\s*D:/comfy/comfy-fast\s*$') {
  throw 'local base_path was not D:/comfy/comfy-fast or the known mistaken D:/comfy value; refusing to write'
}

# The sync scripts intentionally store all text encoders under models/clip.
# Both ComfyUI folder keys may point there; folder key != physical directory.
$localSection = [regex]::Replace(
  $localSection,
  '(?ms)^(\s+clip:\s*\|\s*\r?\n)\s+models/text_encoders\s*$',
  '$1    models/clip'
)
$localSection = [regex]::Replace(
  $localSection,
  '(?ms)^(\s+text_encoders:\s*\|\s*\r?\n)\s+models/text_encoders\s*$',
  '$1    models/clip'
)

if ($localSection -notmatch '(?ms)^\s+clip:\s*\|\s*\r?\n\s+models/clip\s*$') {
  throw 'local clip mapping was not found in the expected shape; refusing to write'
}
if ($localSection -notmatch '(?ms)^\s+text_encoders:\s*\|\s*\r?\n\s+models/clip\s*$') {
  throw 'local text_encoders mapping was not found in the expected shape; refusing to write'
}

$raw = $raw.Substring(0, $localMatch.Index) + $localSection +
  $raw.Substring($localMatch.Index + $localMatch.Length)

$shareMatch = [regex]::Match($raw, '(?ms)^comfyui:\s*\r?\n(?<body>.*?)(?=^[A-Za-z0-9_-]+:\s*$|\z)')
if (-not $shareMatch.Success) { throw 'could not parse comfyui share section' }
$shareSection = $shareMatch.Value
$shareSection = [regex]::Replace(
  $shareSection,
  '(?m)^\s+is_default:\s*true\s*\r?\n',
  ''
)
$raw = $raw.Substring(0, $shareMatch.Index) + $shareSection +
  $raw.Substring($shareMatch.Index + $shareMatch.Length)

# Invariant: local is the only section carrying is_default: true.
# Force an array here. PowerShell unwraps a one-item pipeline result to a scalar;
# indexing that scalar with [0] returns its first character ("c"), not the first
# section name. That made a correct single `comfyui_local` result fail validation.
$defaultSections = @(
  [regex]::Matches($raw, '(?ms)^(?<name>[A-Za-z0-9_-]+):\s*\r?\n(?<body>.*?)(?=^[A-Za-z0-9_-]+:\s*$|\z)') |
    Where-Object { $_.Groups['body'].Value -match '(?m)^\s+is_default:\s*true\s*$' } |
    ForEach-Object { $_.Groups['name'].Value }
)
if ($defaultSections.Count -ne 1 -or $defaultSections[0] -ne 'comfyui_local') {
  throw "expected comfyui_local to be the only default section; found: $($defaultSections -join ', ')"
}

if ($raw -eq $original) {
  Write-Host 'No changes needed. Local ComfyUI model paths are already aligned.' -ForegroundColor Green
  exit 0
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = "$Path.bak-$stamp"
if ($PSCmdlet.ShouldProcess($Path, "Back up to '$backup' and repair local-first model paths")) {
  Copy-Item -LiteralPath $Path -Destination $backup
  Set-Content -LiteralPath $Path -Value $raw -Encoding UTF8

  Write-Host "Updated : $Path" -ForegroundColor Green
  Write-Host "Backup  : $backup"
  Write-Host 'Local base_path -> D:/comfy/comfy-fast (models resolve under D:/comfy/comfy-fast/models)'
  Write-Host 'Local clip/text_encoders -> models/clip'
  Write-Host 'Only comfyui_local retains is_default: true'
  Write-Host ''
  Write-Host 'Restart ComfyUI before testing Krea 2; folder_paths caches model locations.' -ForegroundColor Yellow
}
