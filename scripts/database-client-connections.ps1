<#
.SYNOPSIS
  Read-only census of Kind Robots database clients on the Windows application host.

.DESCRIPTION
  Kind Robots currently runs on the separate local Windows machine that also
  hosts Comfy and related services. ProxySQL and MariaDB run on Alexandria.
  This script identifies which local processes own TCP connections to the
  database endpoint configured by DATABASE_URL.

  It does not stop processes, close sockets, change environment variables, or
  print database credentials.

.EXAMPLE
  .\scripts\database-client-connections.ps1

.EXAMPLE
  $env:DATABASE_URL = 'mysql://user:password@alexandria:5544/database'
  .\scripts\database-client-connections.ps1
#>

[CmdletBinding()]
param(
  [string]$DatabaseUrl = $env:DATABASE_URL,
  [string]$RepoPath = (Get-Location).Path
)

$ErrorActionPreference = 'Stop'

function Get-DotEnvDatabaseUrl {
  param([string]$Root)

  $candidateFiles = @(
    '.env.local',
    '.env.production.local',
    '.env.production',
    '.env'
  )

  foreach ($name in $candidateFiles) {
    $path = Join-Path $Root $name
    if (-not (Test-Path -LiteralPath $path -PathType Leaf)) {
      continue
    }

    foreach ($line in Get-Content -LiteralPath $path) {
      if ($line -notmatch '^\s*DATABASE_URL\s*=\s*(.+?)\s*$') {
        continue
      }

      $value = $Matches[1].Trim()
      if (
        ($value.StartsWith('"') -and $value.EndsWith('"')) -or
        ($value.StartsWith("'") -and $value.EndsWith("'"))
      ) {
        $value = $value.Substring(1, $value.Length - 2)
      }

      if ($value) {
        return $value
      }
    }
  }

  return $null
}

function Hide-Secrets {
  param([AllowNull()][string]$Text)

  if (-not $Text) {
    return ''
  }

  $sanitized = $Text -replace '(?i)(mysql|mariadb)://[^\s/@:]+(?::[^\s/@]*)?@', '$1://***@'
  $sanitized = $sanitized -replace '(?i)(DATABASE_URL\s*=\s*)[^\s]+', '$1***'
  return $sanitized
}

if (-not $DatabaseUrl) {
  $DatabaseUrl = Get-DotEnvDatabaseUrl -Root $RepoPath
}

if (-not $DatabaseUrl) {
  throw 'DATABASE_URL was not found in the current environment or common .env files.'
}

try {
  $uri = [System.Uri]$DatabaseUrl
} catch {
  throw 'DATABASE_URL could not be parsed as a URI.'
}

if ($uri.Scheme -notin @('mysql', 'mariadb')) {
  throw "Unsupported DATABASE_URL scheme '$($uri.Scheme)'."
}

$databaseHost = $uri.Host
$databasePort = if ($uri.IsDefaultPort -or $uri.Port -lt 1) { 3306 } else { $uri.Port }

$resolvedAddresses = @()
try {
  $resolvedAddresses = [System.Net.Dns]::GetHostAddresses($databaseHost) |
    ForEach-Object { $_.IPAddressToString } |
    Sort-Object -Unique
} catch {
  Write-Warning "DNS resolution failed for $databaseHost. Connections will be matched by port only."
}

Write-Host '===== Kind Robots application-host database census ====='
Write-Host "Computer: $env:COMPUTERNAME"
Write-Host "Target:   $databaseHost`:$databasePort"
if ($resolvedAddresses.Count -gt 0) {
  Write-Host "Resolved: $($resolvedAddresses -join ', ')"
}
Write-Host 'Credentials: hidden'

$allConnections = @(Get-NetTCPConnection -RemotePort $databasePort -ErrorAction SilentlyContinue)

if ($resolvedAddresses.Count -gt 0) {
  $databaseConnections = @(
    $allConnections | Where-Object { $_.RemoteAddress -in $resolvedAddresses }
  )
} else {
  $databaseConnections = $allConnections
}

$processRows = @{}
Get-CimInstance Win32_Process | ForEach-Object {
  $processRows[[int]$_.ProcessId] = $_
}

function Get-ProcessStartTime {
  param([int]$ProcessId)

  try {
    return (Get-Process -Id $ProcessId -ErrorAction Stop).StartTime
  } catch {
    return $null
  }
}

Write-Host "`n===== Connections to configured database endpoint ====="
if ($databaseConnections.Count -eq 0) {
  Write-Host 'No matching TCP connections are currently visible.'
} else {
  $details = foreach ($connection in $databaseConnections) {
    $ownerPid = [int]$connection.OwningProcess
    $process = $processRows[$ownerPid]

    [pscustomobject]@{
      PID         = $ownerPid
      Process     = if ($process) { $process.Name } else { '<exited>' }
      State       = $connection.State
      Local       = "$($connection.LocalAddress):$($connection.LocalPort)"
      Remote      = "$($connection.RemoteAddress):$($connection.RemotePort)"
      Started     = Get-ProcessStartTime -ProcessId $ownerPid
      ParentPID   = if ($process) { $process.ParentProcessId } else { $null }
      CommandLine = if ($process) { Hide-Secrets $process.CommandLine } else { '' }
    }
  }

  $details |
    Sort-Object PID, State, Local |
    Format-Table PID, Process, State, Local, Remote, Started, ParentPID -AutoSize

  Write-Host "`n===== Connection count by owning process ====="
  $details |
    Group-Object PID, Process, CommandLine |
    ForEach-Object {
      $sample = $_.Group[0]
      [pscustomobject]@{
        PID         = $sample.PID
        Process     = $sample.Process
        Connections = $_.Count
        States      = ($_.Group.State | Sort-Object -Unique) -join ', '
        Started     = $sample.Started
        ParentPID   = $sample.ParentPID
        CommandLine = $sample.CommandLine
      }
    } |
    Sort-Object @{ Expression = 'Connections'; Descending = $true }, PID |
    Format-List
}

Write-Host "`n===== All local Node-family processes ====="
$nodeProcesses = @(
  $processRows.Values |
    Where-Object {
      $_.Name -match '^(node|nodejs|npm|npx|pnpm|yarn)(\.exe|\.cmd)?$' -or
      $_.CommandLine -match '(?i)(nuxt|nitro|kind_robots|kind-robots|\.output[\\/]server)'
    } |
    Sort-Object ProcessId
)

if ($nodeProcesses.Count -eq 0) {
  Write-Host 'No Node/Nuxt processes were found.'
} else {
  $nodeRows = foreach ($process in $nodeProcesses) {
    $ownerPid = [int]$process.ProcessId
    $ownedCount = @(
      $databaseConnections | Where-Object { $_.OwningProcess -eq $ownerPid }
    ).Count

    [pscustomobject]@{
      PID                 = $ownerPid
      Name                = $process.Name
      ParentPID           = $process.ParentProcessId
      Started             = Get-ProcessStartTime -ProcessId $ownerPid
      DatabaseConnections = $ownedCount
      CommandLine         = Hide-Secrets $process.CommandLine
    }
  }

  $nodeRows | Format-List
}

Write-Host "`n===== Summary ====="
Write-Host "Matching DB connections: $($databaseConnections.Count)"
Write-Host "Distinct owning PIDs:     $(@($databaseConnections.OwningProcess | Sort-Object -Unique).Count)"
Write-Host "Node-family processes:    $($nodeProcesses.Count)"
Write-Host ''
Write-Host 'Capture this output before restarting Kind Robots or killing Node processes.'
