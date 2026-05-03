param(
  [string]$Url = "https://api.klip.app.br/openapi/v1.json",
  [string]$OutputPath,
  [switch]$Summary
)

$ErrorActionPreference = "Stop"

$content = (Invoke-WebRequest -Uri $Url -UseBasicParsing).Content

if ($Summary) {
  $spec = $content | ConvertFrom-Json
  foreach ($path in $spec.paths.PSObject.Properties) {
    foreach ($method in $path.Value.PSObject.Properties) {
      $tags = ""
      if ($method.Value.tags) {
        $tags = $method.Value.tags -join ","
      }
      "{0} {1} => {2}" -f $method.Name.ToUpperInvariant(), $path.Name, $tags
    }
  }
  return
}

if ($OutputPath) {
  $resolved = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
  $dir = Split-Path -Parent $resolved
  if ($dir -and -not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir | Out-Null
  }
  Set-Content -LiteralPath $resolved -Value $content -Encoding UTF8
  Write-Output $resolved
  return
}

$content
