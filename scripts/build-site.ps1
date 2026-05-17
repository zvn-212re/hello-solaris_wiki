$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Node = Get-Command node -ErrorAction SilentlyContinue

if (-not $Node) {
  $FnmNode = Join-Path $env:APPDATA "fnm\node-versions\v20.20.2\installation\node.exe"

  if (Test-Path -LiteralPath $FnmNode) {
    $Node = [pscustomobject]@{ Source = $FnmNode }
  }
}

if (-not $Node) {
  throw "Node.js was not found. Install Node or add it to PATH before building Solaris Wiki."
}

Push-Location $Root
try {
  & $Node.Source scripts\build-site.js
  & $Node.Source scripts\build-cms-content.js
}
finally {
  Pop-Location
}
