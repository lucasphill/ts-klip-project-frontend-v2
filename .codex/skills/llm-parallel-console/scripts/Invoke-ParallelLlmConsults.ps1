param(
  [ValidateSet("codex", "copilot")]
  [string[]]$Providers = @("codex", "copilot"),

  [Parameter(Mandatory = $true)]
  [string]$Prompt,

  [string]$WorkingDirectory = (Get-Location).Path,
  [string]$OutputDirectory,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$scriptPath = Join-Path $PSScriptRoot "Invoke-LlmConsult.ps1"

if ($DryRun) {
  foreach ($provider in $Providers) {
    & $scriptPath -Provider $provider -Prompt $Prompt -WorkingDirectory $WorkingDirectory -OutputDirectory $OutputDirectory -DryRun
  }
  return
}

$jobs = foreach ($provider in $Providers) {
  Start-Job -ScriptBlock {
    param($ScriptPath, $Provider, $Prompt, $WorkingDirectory, $OutputDirectory)
    & $ScriptPath -Provider $Provider -Prompt $Prompt -WorkingDirectory $WorkingDirectory -OutputDirectory $OutputDirectory
  } -ArgumentList $scriptPath, $provider, $Prompt, $WorkingDirectory, $OutputDirectory
}

Wait-Job -Job $jobs | Out-Null

foreach ($job in $jobs) {
  Receive-Job -Job $job
  Remove-Job -Job $job
}
