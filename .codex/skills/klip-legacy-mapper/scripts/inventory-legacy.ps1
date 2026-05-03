param(
  [string]$LegacyRoot = "C:\dev\ts-klip-project-frontend",
  [string]$TargetRoot = "C:\dev\ts-klip-project-frontend-v2",
  [string]$OutputPath
)

$ErrorActionPreference = "Stop"

function Select-Lines {
  param(
    [string]$Root,
    [string]$Pattern
  )

  if (-not (Test-Path $Root)) {
    return @()
  }

  $matches = rg -n --glob "*.ts" --glob "*.tsx" --glob "*.md" $Pattern $Root 2>$null
  if (-not $matches) {
    return @()
  }
  return @($matches)
}

$inventory = [ordered]@{
  generatedAt = (Get-Date).ToString("o")
  legacyRoot = $LegacyRoot
  targetRoot = $TargetRoot
  legacyFiles = @()
  targetFiles = @()
  routes = Select-Lines -Root (Join-Path $LegacyRoot "src") -Pattern "<Route|path="
  providers = Select-Lines -Root (Join-Path $LegacyRoot "src") -Pattern "Provider|useAuth0|Auth0Provider|Context"
  apiCalls = Select-Lines -Root (Join-Path $LegacyRoot "src") -Pattern "tasksApi\.|projectsApi\.|customFieldDefinitionsApi\.|customFieldValuesApi\.|projectsTasksApi\.|projectsCustomFieldDefinitionsApi\."
  localStorage = Select-Lines -Root (Join-Path $LegacyRoot "src") -Pattern "localStorage|sessionStorage|klip:"
  v2Shell = Select-Lines -Root (Join-Path $TargetRoot "src") -Pattern "MOCK_|useAppData|TaskDrawer|ProjectDrawer|MobileApp|CalendarView|UserSettingsView|CustomFieldsSettingsView"
}

if (Test-Path (Join-Path $LegacyRoot "src")) {
  $inventory.legacyFiles = @(rg --files (Join-Path $LegacyRoot "src"))
}

if (Test-Path (Join-Path $TargetRoot "src")) {
  $inventory.targetFiles = @(rg --files (Join-Path $TargetRoot "src"))
}

$json = $inventory | ConvertTo-Json -Depth 6

if ($OutputPath) {
  $resolved = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
  $dir = Split-Path -Parent $resolved
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
  }
  Set-Content -LiteralPath $resolved -Value $json -Encoding UTF8
  Write-Output $resolved
  return
}

$json
