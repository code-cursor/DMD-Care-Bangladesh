$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$AdminUrl = "http://DMDCareBangladesh.loc/admin.php"

Set-Location $ProjectRoot

$DatabasePort = 3308
$MySqlExecutable = "C:\wamp64\bin\mysql\mysql8.3.0\bin\mysqld.exe"
$MySqlConfig = "C:\wamp64\bin\mysql\mysql8.3.0\my.ini"

if (!(Get-NetTCPConnection -State Listen -LocalPort $DatabasePort -ErrorAction SilentlyContinue)) {
    if (!(Test-Path $MySqlExecutable) -or !(Test-Path $MySqlConfig)) {
        throw "The restored WAMP MySQL installation was not found."
    }

    Write-Host "Starting restored DMD database on port $DatabasePort..."
    $StartOptions = @{
        FilePath = $MySqlExecutable
        ArgumentList = @("--defaults-file=$MySqlConfig", "--port=$DatabasePort", "--mysqlx=OFF", "--log-error=C:\tmp\wamp-mysql-3308.err")
        WindowStyle = "Hidden"
    }
    Start-Process @StartOptions

    $DatabaseReady = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Milliseconds 500
        if (Get-NetTCPConnection -State Listen -LocalPort $DatabasePort -ErrorAction SilentlyContinue) {
            $DatabaseReady = $true
            break
        }
    }
    if (!$DatabaseReady) {
        throw "The restored DMD database did not start on port $DatabasePort."
    }
}

if (!(Get-Command php -ErrorAction SilentlyContinue)) {
    throw "PHP is not available. Enable PHP in WAMP or add php.exe to PATH."
}

Write-Host "Checking PHP files..."
$PhpFiles = @(
    (Join-Path $ProjectRoot "admin.php"),
    (Join-Path $ProjectRoot "php/bootstrap.php"),
    (Join-Path $ProjectRoot "php/admin_actions.php")
)
foreach ($File in $PhpFiles) {
    & php -l $File
    if ($LASTEXITCODE -ne 0) {
        throw "PHP syntax validation failed: $File"
    }
}

Start-Process $AdminUrl
Write-Host "DMD Care Admin opened: $AdminUrl"
Write-Host "The panel uses PHP sessions and direct database access; no API server is required."
