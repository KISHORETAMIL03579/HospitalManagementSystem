# Script to start Mailpit for local CareFlow HMS development
$mailpitPath = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\axllent.mailpit_Microsoft.Winget.Source_8wekyb3d8bbwe\mailpit.exe"

if (-not (Test-Path $mailpitPath)) {
    # Fallback search if path differs
    $found = Get-ChildItem -Path "$env:LOCALAPPDATA" -Filter "mailpit.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName
    if ($found) {
        $mailpitPath = $found
    } else {
        Write-Error "Mailpit executable not found. Install via: winget install --id axllent.mailpit -e"
        exit 1
    }
}

Write-Host "Starting Mailpit..." -ForegroundColor Cyan
Write-Host "  - SMTP Server:  localhost:1025" -ForegroundColor Green
Write-Host "  - Web Dashboard: http://localhost:8025" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop Mailpit." -ForegroundColor Yellow

& $mailpitPath
