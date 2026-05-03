param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("codex", "copilot")]
  [string]$Provider,

  [Parameter(Mandatory = $true)]
  [string]$Prompt,

  [string]$WorkingDirectory = (Get-Location).Path,
  [string]$OutputDirectory,
  [ValidateSet("readonly", "worker")]
  [string]$Mode = "readonly",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

if (-not $OutputDirectory) {
  $OutputDirectory = Join-Path $WorkingDirectory ".codex\consults"
}

$providerCommand = Get-Command $Provider -ErrorAction SilentlyContinue
if (-not $providerCommand) {
  throw "Provider '$Provider' was not found on PATH."
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$safeProvider = $Provider.ToLowerInvariant()
$outputFile = Join-Path $OutputDirectory "$timestamp-$safeProvider.md"

$header = @"
# $Provider consultation

- Generated: $(Get-Date -Format o)
- WorkingDirectory: $WorkingDirectory
- Mode: $Mode

## Prompt

$Prompt

## Response

"@

if ($DryRun) {
  [pscustomobject]@{
    provider = $Provider
    mode = $Mode
    workingDirectory = $WorkingDirectory
    outputFile = $outputFile
    command = if ($Provider -eq "codex") { "codex exec -C <dir> --sandbox read-only -a never -" } else { "copilot -p <prompt> --silent --allow-all-tools --deny-tool=write --deny-tool=shell" }
  }
  return
}

if (-not (Test-Path $OutputDirectory)) {
  New-Item -ItemType Directory -Path $OutputDirectory | Out-Null
}

Set-Content -LiteralPath $outputFile -Value $header -Encoding UTF8

if ($Provider -eq "codex") {
  $sandbox = "read-only"
  if ($Mode -eq "worker") {
    $sandbox = "workspace-write"
  }

  $raw = $Prompt | & codex exec -C $WorkingDirectory --sandbox $sandbox -a never -
  Add-Content -LiteralPath $outputFile -Value ($raw | Out-String) -Encoding UTF8
}
else {
  if ($Mode -eq "worker") {
    throw "Copilot worker mode must be run manually in an isolated worktree with explicit permissions."
  }

  $raw = & copilot -p $Prompt --silent --allow-all-tools --deny-tool=write --deny-tool=shell
  Add-Content -LiteralPath $outputFile -Value ($raw | Out-String) -Encoding UTF8
}

Write-Output $outputFile
