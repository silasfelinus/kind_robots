# Does every .ps1 in this folder actually PARSE?
#
# Ported from conductor (ops/home-server/Test-PowerShellSyntax.ps1) after the
# 2026-09-19 incident there, where three `Write-Log "$name: ..."` lines took a
# render-box watchdog down for ELEVEN DAYS. PowerShell reads `$name:` as a
# scope- or drive-qualified variable -- the `$env:PATH` / `$script:foo` syntax --
# and raises InvalidVariableReferenceWithDrive. That is a PARSE error, so it does
# not fail those three lines: it stops the whole file from loading. Every
# 5-minute trigger launched, PowerShell refused the file, the action returned
# exit code 1, and the log recorded nothing at all, because no line of the script
# ever ran. Task Scheduler reported a healthy NextRunTime throughout.
#
# The scripts here are in the same position: they run on Windows boxes, by hand
# or on a schedule, where a parse error is silent until someone notices the work
# did not happen. Nothing in CI could see it, because the runners are Linux.
#
# Two live near-misses in this folder, neither a bug today:
#
#   * None of these files has a UTF-8 BOM, and sync-comfy-models.ps1 contains
#     non-ASCII box-drawing characters. Those are all in COMMENTS, which is why
#     it parses fine -- Windows PowerShell 5.1 reads a no-BOM file as the system
#     ANSI codepage, and a mangled comment is still a comment. Put one em-dash or
#     smart quote inside a STRING LITERAL and the file stops parsing. This check
#     is what would catch that.
#   * database-client-connections.ps1 opens with a `<#` block comment, so it has
#     no BOM either way.
#
# Run it here before you push, or let the powershell-syntax-contract workflow
# run it:
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\Test-PowerShellSyntax.ps1
#
# Exits 0 when every file parses, 1 otherwise, naming file, line, column and
# message for each error.
#
# Parse with WINDOWS POWERSHELL 5.1, not pwsh 7. 5.1 is what these scripts run
# under on the Windows boxes, and a file that parses under 7 can still fail under
# 5.1. The workflow pins `shell: powershell` for the same reason.

[CmdletBinding()]
param(
    # Defaults to this script's own folder, which is where every .ps1 lives.
    [string]$Path
)

$ErrorActionPreference = 'Stop'

if (-not $Path) { $Path = $PSScriptRoot }

$files = @(Get-ChildItem -Path $Path -Filter '*.ps1' -File | Sort-Object Name)

if ($files.Count -eq 0) {
    # A glob that silently matches nothing would "pass" forever.
    Write-Host "NO .ps1 FILES FOUND under $Path - refusing to report success."
    exit 1
}

Write-Host "PowerShell $($PSVersionTable.PSVersion) parsing $($files.Count) file(s) in $Path"
Write-Host ''

$failed = 0
foreach ($file in $files) {
    $errors = $null
    $tokens = $null
    [void][System.Management.Automation.Language.Parser]::ParseFile(
        $file.FullName, [ref]$tokens, [ref]$errors)

    if ($errors -and $errors.Count -gt 0) {
        $failed++
        Write-Host "FAIL  $($file.Name) - $($errors.Count) parse error(s)"
        foreach ($err in $errors) {
            $start = $err.Extent.StartLineNumber
            $col = $err.Extent.StartColumnNumber
            Write-Host "        $($file.Name):${start}:${col}  $($err.Message)"
            Write-Host "          > $($err.Extent.Text)"
        }
        Write-Host ''
    } else {
        Write-Host "ok    $($file.Name)"
    }
}

Write-Host ''
if ($failed -gt 0) {
    Write-Host "$failed of $($files.Count) file(s) do not parse. A parse error disables the ENTIRE script, not just its line."
    exit 1
}

Write-Host "All $($files.Count) file(s) parse."
exit 0
