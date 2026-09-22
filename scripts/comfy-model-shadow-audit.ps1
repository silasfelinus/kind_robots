#Requires -Version 5.1
<#
.SYNOPSIS
  Explain why ComfyUI lists a model you cannot find on disk, and find the
  right-sized-but-unwritten files that render as pure static.

.DESCRIPTION
  WHY THIS EXISTS. Two questions kept coming back with no way to answer them
  from the ComfyUI UI, and both have the same shape: the dropdown is not a
  listing of one directory, and a file that loads is not the same as a file
  that is intact.

  1. "COMFY LISTS A FILE THAT ISN'T THERE." ComfyUI registers TWO directories
     under one category and shows their union:

       folder_names_and_paths["diffusion_models"] =
           ([models/unet, models/diffusion_models], supported_pt_extensions)

     ComfyUI-GGUF's UnetLoaderGGUF builds its dropdown from get_filename_list
     ("unet_gguf"), which reuses that same path list with a .gguf filter, and
     extra_model_paths.yaml appends still more roots. get_filename_list_ collects
     into a `set()` keyed by path RELATIVE to each root, so the same filename in
     two roots collapses to ONE dropdown entry. Looking in models\diffusion_models
     and not finding it proves nothing: it is almost certainly in models\unet,
     or on the share.

  2. "SO WHICH COPY ACTUALLY LOADS?" get_full_path walks the roots IN ORDER and
     returns the first os.path.isfile hit. models\unet is FIRST. A stale or
     broken copy there therefore SHADOWS a good copy in models\diffusion_models,
     and the dropdown's set() dedup means nothing on screen says so. Dropping a
     fresh model into models\diffusion_models does not fix a bad models\unet.

  3. "IT LOADS AND RENDERS STATIC." robocopy /J preallocates the destination, so
     an interrupted copy leaves a file of EXACTLY the right length with unwritten
     bytes in it. When the interruption lands EARLY the magic is wrong and you
     get a loud `GGUF magic invalid` (Krea-2-Turbo, 2026-09-08). When it lands
     LATE the header and early tensors are fine, the model loads without error,
     and the unwritten tail dequantises to zeros -- so the UNet predicts nothing,
     the sampler never denoises, and VAEDecode returns the sampler's own noise as
     a valid, well-formed image. The job reports DONE. sync-comfy-models.ps1's
     4-byte header check passes it, and so does every size check.

     The tell is in the render, not the file: byte-identical output statistics
     from completely DIFFERENT source images, because the output no longer
     depends on the input at all (conductor coloring-book/t-039, mr-016 and
     mr-020 both at mean_saturation 0.17 / colorful_fraction 0.35).

  WHAT THIS REPORTS. Read-only. Nothing is copied, moved or deleted.

    SHADOWED   the same name in more than one root -- which copy ComfyUI loads
    BAD MAGIC  container header is not what the extension claims
    ZERO TAIL  right size, readable header, unwritten tail -- the static case
    STAGING    a leftover .kr-sync-tmp\ partial, which ComfyUI lists as loadable
    ORPHAN     ComfyUI offers a name that resolves to no file (with -ComfyUrl)

.EXAMPLE
  cd D:\code\kind_robots
  git pull
  .\scripts\comfy-model-shadow-audit.ps1 -Local D:\comfy\comfy-fast\models

.EXAMPLE
  # Also diff against what the running ComfyUI is actually offering.
  cd D:\code\kind_robots
  .\scripts\comfy-model-shadow-audit.ps1 -Local D:\comfy\comfy-fast\models -ComfyUrl http://127.0.0.1:8188
#>
[CmdletBinding()]
param(
  # ComfyUI's models root, e.g. D:\comfy\comfy-fast\models. Defaults to
  # $env:COMFYUI_MODELS.
  [string] $Local,
  # Optional extra_model_paths.yaml. Defaults to the one beside the models root.
  [string] $ExtraPaths,
  # Optional running ComfyUI, to compare the live dropdown against disk.
  [string] $ComfyUrl,
  # How much of the end of each file to test for unwritten bytes.
  [int] $TailBytes = 1MB,
  # Only audit these categories.
  [string[]] $Category = @('unet', 'clip', 'vae', 'checkpoints', 'loras')
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

# ComfyUI's own folder_paths.map_legacy, plus the category names this repo and
# extra_model_paths.yaml use. Everything that maps to the same key shares ONE
# ordered search list, which is the whole point of this script.
$LegacyMap = @{
  unet          = 'diffusion_models'
  clip          = 'text_encoders'
  text_encoders = 'text_encoders'
  vae           = 'vae'
  checkpoints   = 'checkpoints'
  loras         = 'loras'
}
function Resolve-Category([string] $Name) {
  $key = $Name.Trim().ToLowerInvariant()
  if ($LegacyMap.ContainsKey($key)) { return $LegacyMap[$key] }
  return $key
}

# ComfyUI's built-in roots, in ComfyUI's own order. The two-entry lists are the
# ones that surprise people.
$BuiltinRoots = @{
  diffusion_models = @('unet', 'diffusion_models')
  text_encoders    = @('text_encoders', 'clip')
  vae              = @('vae')
  checkpoints      = @('checkpoints')
  loras            = @('loras')
}

$ModelExtensions = @('.safetensors', '.ckpt', '.pt', '.pth', '.bin', '.gguf', '.sft')

# ── roots ───────────────────────────────────────────────────────────────────

if (-not $Local) { $Local = $env:COMFYUI_MODELS }
if (-not $Local) {
  Fail "pass -Local (ComfyUI's models directory), or set COMFYUI_MODELS. Example: -Local D:\comfy\comfy-fast\models"
}
if (-not (Test-Path -LiteralPath $Local -PathType Container)) {
  Fail "not a directory: $Local"
}
$Local = (Resolve-Path -LiteralPath $Local).Path

# A deliberately small extra_model_paths.yaml reader: top-level section, two-space
# `key: value` pairs, and `|`/`-` multi-path values. That is the whole shape
# ComfyUI's own loader accepts for these keys, and pulling in a YAML module would
# make this script refuse to run on a host that does not have one.
# ComfyUI resolves these on Windows, where a drive letter or a UNC prefix makes a
# path absolute and os.path.join(base, absolute) discards the base. [IO.Path]::
# IsPathRooted only knows the CONVENTION OF THE HOST it runs on, so it is wrong
# about "D:/..." anywhere but Windows -- test the shapes directly instead.
function Test-WindowsRooted([string] $Value) {
  return ($Value -match '^[A-Za-z]:[\\/]' -or $Value -match '^[\\/][\\/]' -or $Value -match '^[\\/]')
}

function Read-ExtraModelPaths([string] $Path) {
  $out = @()
  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $out }

  # Pass 1: split the file into sections. Pass 2 expands them once each
  # section's base_path is known. Two passes rather than one with a nested
  # flush, because a nested PowerShell function assigning to $out would write a
  # local copy and silently drop every entry.
  $sections = @()
  $current = $null
  # The key currently accepting continuation lines (a `key: |` block or a `- `
  # list), and the indent of the line that opened it. Indent is what separates a
  # continuation from an ordinary sibling key: YAML siblings share an indent, so
  # anything indented DEEPER than the opening key belongs to that key. Without
  # this, a file written with 4-space indents has every key after the first block
  # swallowed as block content -- `clip: |` then eats `vae:` and `checkpoints:`.
  # It also handles a drive-lettered path inside a block (`D:/comfy/models/clip`),
  # which otherwise reads as a key named `D`.
  $blockKey = $null
  $blockIndent = -1

  foreach ($raw in (Get-Content -LiteralPath $Path)) {
    $line = $raw -replace '\s+$', ''
    if (-not $line -or $line -match '^\s*#') { continue }
    $indent = $line.Length - $line.TrimStart().Length

    if ($indent -eq 0) {
      $current = [pscustomobject]@{
        Name      = $line.TrimEnd(':').Trim()
        Base      = $null
        IsDefault = $false
        Entries   = @{}
      }
      $sections += $current
      $blockKey = $null; $blockIndent = -1
      continue
    }
    if (-not $current) { continue }

    if ($blockKey -and $indent -gt $blockIndent) {
      $item = $line.Trim()
      if ($item -match '^-\s*(.+)$') { $item = $Matches[1] }
      $current.Entries[$blockKey] += $item
      continue
    }

    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$') {
      $key = $Matches[1]; $val = $Matches[2].Trim()
      $blockKey = $null; $blockIndent = -1

      if ($key -eq 'base_path') {
        $current.Base = ($val -replace '/', '\')
      } elseif ($key -eq 'is_default') {
        $current.IsDefault = ($val -match '^(true|yes|1)$')
      } else {
        if (-not $current.Entries.ContainsKey($key)) { $current.Entries[$key] = @() }
        if ($val -and $val -notmatch '^[|>][-+]?$') {
          $current.Entries[$key] += $val
        } else {
          # `key:`, `key: |`, `key: >` -- the values are on the lines below.
          $blockKey = $key; $blockIndent = $indent
        }
      }
    }
  }

  $yamlDir = Split-Path (Resolve-Path -LiteralPath $Path).Path -Parent

  foreach ($sec in $sections) {
    if ($sec.Base -and -not (Test-WindowsRooted $sec.Base)) {
      $sec.Base = $yamlDir.TrimEnd('\', '/') + '\' + $sec.Base.TrimStart('\', '/')
    }
    foreach ($key in $sec.Entries.Keys) {
      foreach ($v in $sec.Entries[$key]) {
        $p = $v.Trim()
        if (-not $p) { continue }
        # Concatenated rather than Join-Path: these are Windows paths read from a
        # yaml file, and Join-Path resolves a rooted-looking string against the
        # current PSDrive, which throws on any host where that drive is not mounted.
        if (-not (Test-WindowsRooted $p) -and $sec.Base) {
          $p = $sec.Base.TrimEnd('\', '/') + '\' + $p.TrimStart('\', '/')
        }
        $out += [pscustomobject]@{
          Section   = $sec.Name
          Category  = (Resolve-Category $key)
          Path      = ($p -replace '/', '\')
          IsDefault = $sec.IsDefault
        }
      }
    }
  }
  return $out
}

if (-not $ExtraPaths) {
  # ComfyUI keeps it next to main.py, i.e. the parent of models\.
  $guess = Join-Path (Split-Path $Local -Parent) 'extra_model_paths.yaml'
  if (Test-Path -LiteralPath $guess -PathType Leaf) { $ExtraPaths = $guess }
}
$extra = @()
if ($ExtraPaths) {
  try { $extra = Read-ExtraModelPaths $ExtraPaths }
  catch { Write-Host "warning: could not parse $ExtraPaths ($($_.Exception.Message)) - continuing with built-in roots only" -ForegroundColor Yellow }
}

# Build each category's search list in ComfyUI's order: built-ins first, then
# extra_model_paths entries appended -- except is_default, which inserts at the
# front, exactly as add_model_folder_path does.
function Get-SearchRoots([string] $Canonical) {
  $roots = @()
  foreach ($sub in $BuiltinRoots[$Canonical]) {
    $roots += (Join-Path $Local $sub)
  }
  foreach ($e in ($extra | Where-Object { $_.Category -eq $Canonical })) {
    if ($roots -contains $e.Path) { continue }
    if ($e.IsDefault) { $roots = @($e.Path) + $roots } else { $roots += $e.Path }
  }
  return $roots
}

# ── integrity ───────────────────────────────────────────────────────────────

# $true looks right, $false definitely corrupt, $null format we do not check.
function Test-ModelHeader([string] $Path) {
  $ext = [System.IO.Path]::GetExtension($Path).ToLowerInvariant()
  try {
    $fs = [System.IO.File]::OpenRead($Path)
    try {
      switch ($ext) {
        '.gguf' {
          $buf = New-Object byte[] 4
          if ($fs.Read($buf, 0, 4) -ne 4) { return $false }
          return ([System.Text.Encoding]::ASCII.GetString($buf, 0, 4) -eq 'GGUF')
        }
        '.safetensors' {
          $buf = New-Object byte[] 8
          if ($fs.Read($buf, 0, 8) -ne 8) { return $false }
          $headerLen = [System.BitConverter]::ToUInt64($buf, 0)
          return (($headerLen -gt 0) -and ($headerLen -lt [uint64]($fs.Length - 8)))
        }
        default { return $null }
      }
    } finally { $fs.Close() }
  } catch { return $false }
}

# $true when the last $TailBytes are ALL zero, which for quantised weights means
# the region was preallocated and never written. Quant blocks carry per-block
# scales, so a megabyte of real weight data is never uniformly zero; GGUF's
# alignment padding is at most 31 bytes.
function Test-ZeroTail([string] $Path, [long] $Length) {
  if ($Length -lt 65536) { return $false }
  $window = [Math]::Min([long]$TailBytes, $Length)
  try {
    $fs = [System.IO.File]::OpenRead($Path)
    try {
      $fs.Seek(-$window, [System.IO.SeekOrigin]::End) | Out-Null
      $buf = New-Object byte[] ([int]$window)
      $read = 0
      while ($read -lt $window) {
        $n = $fs.Read($buf, $read, $window - $read)
        if ($n -le 0) { break }
        $read += $n
      }
      for ($i = 0; $i -lt $read; $i++) { if ($buf[$i] -ne 0) { return $false } }
      return ($read -gt 0)
    } finally { $fs.Close() }
  } catch { return $false }
}

# ── walk ────────────────────────────────────────────────────────────────────

Write-Host ""
Write-Host "ComfyUI model audit" -ForegroundColor Cyan
Write-Host "models root : $Local"
if ($ExtraPaths) { Write-Host "extra paths : $ExtraPaths" } else { Write-Host "extra paths : (none found)" }
Write-Host "tail window : $(Format-Size $TailBytes)"
Write-Host ""

$shadowed = 0; $badMagic = 0; $zeroTail = 0; $staging = 0; $orphans = 0

foreach ($cat in ($Category | ForEach-Object { Resolve-Category $_ } | Select-Object -Unique)) {
  if (-not $BuiltinRoots.ContainsKey($cat)) { continue }
  $roots = Get-SearchRoots $cat

  Write-Host ("== {0} " -f $cat).PadRight(76, '=') -ForegroundColor Cyan
  Write-Host "   search order (first match wins):"
  for ($i = 0; $i -lt $roots.Count; $i++) {
    $mark = if (Test-Path -LiteralPath $roots[$i] -PathType Container) { ' ' } else { '!' }
    Write-Host ("   {0}{1}. {2}" -f $mark, ($i + 1), $roots[$i])
  }
  if ($roots | Where-Object { -not (Test-Path -LiteralPath $_ -PathType Container) }) {
    Write-Host "   (! = configured but not present on this host)" -ForegroundColor DarkGray
  }
  Write-Host ""

  # relative path -> ordered list of copies, in ComfyUI's search order.
  $byRel = @{}
  for ($i = 0; $i -lt $roots.Count; $i++) {
    $root = $roots[$i]
    if (-not (Test-Path -LiteralPath $root -PathType Container)) { continue }
    $files = Get-ChildItem -LiteralPath $root -Recurse -File -Force -ErrorAction SilentlyContinue |
      Where-Object { $ModelExtensions -contains $_.Extension.ToLowerInvariant() }
    foreach ($f in $files) {
      $rel = ($f.FullName.Substring($root.Length) -replace '/', '\').TrimStart('\')
      if (-not $byRel.ContainsKey($rel)) { $byRel[$rel] = @() }
      $byRel[$rel] += [pscustomobject]@{ Rank = $i; Root = $root; File = $f }
    }
  }

  foreach ($rel in ($byRel.Keys | Sort-Object)) {
    $copies = $byRel[$rel] | Sort-Object Rank
    $winner = $copies[0]

    if ($rel -like '*.kr-sync-tmp\*') {
      Write-Host ("   STAGING   {0}" -f $rel) -ForegroundColor Red
      Write-Host ("             leftover partial from an interrupted sync-comfy-models.ps1 run.")
      Write-Host ("             ComfyUI lists it as a loadable model. Delete: {0}" -f $winner.File.FullName)
      $staging++
    }

    if ($copies.Count -gt 1) {
      Write-Host ("   SHADOWED  {0}" -f $rel) -ForegroundColor Yellow
      foreach ($c in $copies) {
        $tag = if ($c.Rank -eq $winner.Rank) { 'LOADS ' } else { 'ignored' }
        Write-Host ("             [{0}] {1}  ({2}, {3:yyyy-MM-dd})" -f `
          $tag, $c.File.FullName, (Format-Size $c.File.Length), $c.File.LastWriteTime)
      }
      Write-Host ("             the dropdown shows ONE entry for these - get_filename_list_ dedups by relative path.")
      $shadowed++
    }

    # Integrity is only interesting for the copy ComfyUI would actually load.
    $magic = Test-ModelHeader $winner.File.FullName
    if ($magic -eq $false) {
      Write-Host ("   BAD MAGIC {0}" -f $rel) -ForegroundColor Red
      Write-Host ("             {0} ({1}) - container header is wrong; this errors on load." -f `
        $winner.File.FullName, (Format-Size $winner.File.Length))
      $badMagic++
      continue
    }

    if (Test-ZeroTail $winner.File.FullName $winner.File.Length) {
      Write-Host ("   ZERO TAIL {0}" -f $rel) -ForegroundColor Red
      Write-Host ("             {0} ({1}) - header fine, last {2} unwritten." -f `
        $winner.File.FullName, (Format-Size $winner.File.Length), (Format-Size $TailBytes))
      Write-Host ("             This loads WITHOUT ERROR and renders pure static. Recopy it:")
      Write-Host ("               .\scripts\sync-comfy-models.ps1 -Local {0} -Tier all -Verify -Yes" -f $Local)
      $zeroTail++
    }
  }
  Write-Host ""
}

# ── what the running ComfyUI is actually offering ───────────────────────────

if ($ComfyUrl) {
  $ComfyUrl = $ComfyUrl.TrimEnd('/')
  Write-Host ("== live ComfyUI ({0}) " -f $ComfyUrl).PadRight(76, '=') -ForegroundColor Cyan
  foreach ($node in @('UnetLoaderGGUF', 'UNETLoader')) {
    try {
      $info = Invoke-RestMethod -Uri "$ComfyUrl/object_info/$node" -TimeoutSec 30
    } catch {
      Write-Host ("   {0}: not reachable ({1})" -f $node, $_.Exception.Message) -ForegroundColor DarkGray
      continue
    }
    $names = $info.$node.input.required.unet_name[0]
    if (-not $names) { Write-Host "   $node : no unet_name list"; continue }

    Write-Host ("   {0}: offers {1} name(s)" -f $node, @($names).Count)
    $roots = Get-SearchRoots 'diffusion_models'
    foreach ($n in $names) {
      $hit = $null
      foreach ($r in $roots) {
        $cand = Join-Path $r ($n -replace '/', '\')
        if (Test-Path -LiteralPath $cand -PathType Leaf) { $hit = $cand; break }
      }
      if (-not $hit) {
        Write-Host ("   ORPHAN    {0}" -f $n) -ForegroundColor Yellow
        Write-Host ("             offered by the dropdown, resolves to no file in any root.")
        Write-Host ("             Almost always a STALE BROWSER TAB: /object_info is fetched once")
        Write-Host ("             per page load. Hit Refresh (R) in ComfyUI before believing it.")
        $orphans++
      }
    }
  }
  Write-Host ""
}

# ── verdict ─────────────────────────────────────────────────────────────────

Write-Host ("=" * 76)
Write-Host ("shadowed: {0}   bad magic: {1}   zero tail: {2}   staging: {3}   orphans: {4}" -f `
  $shadowed, $badMagic, $zeroTail, $staging, $orphans)

if ($zeroTail -gt 0) {
  Write-Host ""
  Write-Host "A ZERO TAIL file is the static. It loads clean and predicts nothing, so the" -ForegroundColor Yellow
  Write-Host "sampler never denoises and you get the latent's own noise back through the VAE." -ForegroundColor Yellow
}
if ($shadowed -gt 0) {
  Write-Host ""
  Write-Host "A SHADOWED name means dropping a fresh copy into the second root changes" -ForegroundColor Yellow
  Write-Host "nothing - ComfyUI loads the first. Fix the copy marked [LOADS ]." -ForegroundColor Yellow
}
if ($shadowed -eq 0 -and $badMagic -eq 0 -and $zeroTail -eq 0 -and $staging -eq 0 -and $orphans -eq 0) {
  Write-Host "clean: every name resolves to exactly one intact file." -ForegroundColor Green
}
Write-Host ("=" * 76)

if ($badMagic -gt 0 -or $zeroTail -gt 0 -or $staging -gt 0) { exit 1 }
exit 0
