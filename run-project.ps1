$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProjectRoot

$VenvPython = Join-Path $ProjectRoot ".venv\Scripts\python.exe"
$ApiUrl = "http://127.0.0.1:8002"
$AdminUrl = "http://DMDCareBangladesh.loc/admin.html"

if (!(Test-Path $VenvPython)) {
    Write-Host "Creating Python virtual environment..."
    python -m venv .venv
}

Write-Host "Installing/updating dependencies..."
& $VenvPython -m pip install -r requirements.txt

Write-Host "Starting DMD Care API at $ApiUrl"
$ApiProcess = Start-Process `
    -FilePath $VenvPython `
    -ArgumentList "-m", "uvicorn", "backend.main:app", "--reload", "--host", "127.0.0.1", "--port", "8002" `
    -WorkingDirectory $ProjectRoot `
    -WindowStyle Hidden `
    -PassThru

Write-Host "Waiting for API to become ready..."
$Ready = $false
for ($i = 0; $i -lt 30; $i++) {
    try {
        $Response = Invoke-WebRequest -Uri "$ApiUrl/api/health" -UseBasicParsing -TimeoutSec 2
        if ($Response.StatusCode -eq 200) {
            $Ready = $true
            break
        }
    } catch {
        Start-Sleep -Seconds 1
    }
}

if (-not $Ready) {
    if ($ApiProcess -and -not $ApiProcess.HasExited) {
        Stop-Process -Id $ApiProcess.Id -Force
    }
    throw "DMD Care API did not become ready at $ApiUrl."
}

Start-Process $AdminUrl
Write-Host "DMD Care Admin is ready: $AdminUrl"
Write-Host "API is running in process $($ApiProcess.Id). Close it from Task Manager or stop python.exe when finished."