param(
  [string]$OutputPath = "D:\PROJECT\DEPLOY\Solane Run.zip"
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$deployRoot = Split-Path -Parent $OutputPath
New-Item -ItemType Directory -Force -Path $deployRoot | Out-Null

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("solane-run-export-" + [System.Guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null

$excludePrefixes = @(
  ".git/",
  ".cache/",
  ".codex-logs/",
  ".vite/",
  "coverage/",
  "dev.logs/",
  "dist/",
  "htmlcov/",
  "node_modules/",
  "apps/web/dist/",
  "apps/web/node_modules/"
)
$excludeExact = @(
  ".env",
  ".env.local"
)

function Test-Excluded {
  param([string]$RelativePath)

  $normalized = $RelativePath.Replace("\", "/")
  if ($excludeExact -contains $normalized) {
    return $true
  }

  foreach ($prefix in $excludePrefixes) {
    if ($normalized.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
  }

  return $false
}

try {
  $files = git -C $repoRoot ls-files --cached --others --exclude-standard
  foreach ($file in $files) {
    if ([string]::IsNullOrWhiteSpace($file) -or (Test-Excluded $file)) {
      continue
    }

    $source = Join-Path $repoRoot $file
    if (-not (Test-Path -LiteralPath $source -PathType Leaf)) {
      continue
    }

    $destination = Join-Path $tempRoot $file
    $destinationDir = Split-Path -Parent $destination
    New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
    Copy-Item -LiteralPath $source -Destination $destination -Force
  }

  if (Test-Path -LiteralPath $OutputPath) {
    Remove-Item -LiteralPath $OutputPath -Force
  }

  Compress-Archive -Path (Join-Path $tempRoot "*") -DestinationPath $OutputPath -Force
  $hash = Get-FileHash -Path $OutputPath -Algorithm SHA256
  Write-Host "Created $OutputPath"
  Write-Host "SHA256 $($hash.Hash)"
}
finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}
