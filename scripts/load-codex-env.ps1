param(
  [switch]$PersistUser
)

$envPath = Join-Path (Split-Path -Parent $PSScriptRoot) ".env"

if (-not (Test-Path -LiteralPath $envPath)) {
  throw "Missing .env at $envPath"
}

Get-Content -LiteralPath $envPath | ForEach-Object {
  $line = $_.Trim()

  if ($line.Length -eq 0 -or $line.StartsWith("#")) {
    return
  }

  $parts = $line.Split("=", 2)
  if ($parts.Count -ne 2) {
    return
  }

  $name = $parts[0].Trim()
  $value = $parts[1].Trim().Trim('"').Trim("'")

  if ($name.Length -eq 0) {
    return
  }

  Set-Item -Path "Env:$name" -Value $value

  if ($PersistUser) {
    [Environment]::SetEnvironmentVariable($name, $value, "User")
  }
}

Write-Host "Loaded Codex proxy env from $envPath"

if ($PersistUser) {
  Write-Host "Persisted proxy env variables to the current Windows user."
}
