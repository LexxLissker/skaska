# Подключает рабочий Node к текущей сессии PowerShell.
#
# Зачем: в системном PATH этой машины прописан C:\nvm4w\nodejs — симлинк на
# C:\Users\Админ\AppData\Local\nvm\v24.13.0, то есть на профиль другого пользователя
# Windows. Читать его текущий пользователь не может, и npm падает с EPERM.
# Системный PATH идёт раньше пользовательского, поэтому просто установить Node
# «для себя» недостаточно — его нужно поставить в начало PATH вручную.
#
# Использование (точка и пробел в начале обязательны — скрипт меняет текущую сессию):
#   . .\scripts\dev-env.ps1

$nodeDir = "$env:LOCALAPPDATA\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.18.1-win-x64"

if (-not (Test-Path $nodeDir)) {
    Write-Error "Node не найден в $nodeDir. Установи: winget install --id OpenJS.NodeJS.LTS --scope user"
    return
}

$env:PATH = "$nodeDir;$env:PATH"

Write-Host "node $(& "$nodeDir\node.exe" -v) · npm $(& "$nodeDir\npm.cmd" -v)" -ForegroundColor Green
