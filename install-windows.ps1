# DRH AI - Installateur automatique pour Windows
# Usage : ouvrir PowerShell puis coller :
#   iwr -useb https://raw.githubusercontent.com/jimy78/Wavely/claude/create-hr-ai-agent-oGtCZ/install-windows.ps1 | iex

$ErrorActionPreference = "Stop"

function Section($n, $total, $title) {
    Write-Host ""
    Write-Host "[$n/$total] $title" -ForegroundColor Cyan
    Write-Host ("-" * 50) -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "  DRH AI - Installateur automatique" -ForegroundColor Magenta
Write-Host ""

# --- 1. Node.js ---
Section 1 6 "Verification Node.js"
$nodeVer = $null
try { $nodeVer = & node --version 2>$null } catch {}
if ($nodeVer) {
    Write-Host "  OK : Node.js $nodeVer" -ForegroundColor Green
} else {
    Write-Host "  Node.js absent. Installation via winget (peut prendre 1-2 min)..."
    try {
        winget install --silent --accept-source-agreements --accept-package-agreements OpenJS.NodeJS.LTS
    } catch {
        Write-Host "  Echec winget. Telechargez manuellement Node.js LTS depuis https://nodejs.org puis relancez le script." -ForegroundColor Red
        exit 1
    }
    Write-Host ""
    Write-Host "  Node.js installe." -ForegroundColor Green
    Write-Host "  IMPORTANT : fermez CETTE fenetre PowerShell, ouvrez-en une NOUVELLE, puis relancez :" -ForegroundColor Yellow
    Write-Host "  iwr -useb https://raw.githubusercontent.com/jimy78/Wavely/claude/create-hr-ai-agent-oGtCZ/install-windows.ps1 | iex" -ForegroundColor Yellow
    Read-Host "  Appuyez sur Entree pour quitter"
    exit 0
}

# --- 2. Claude Code (bonus, utile pour creer d'autres agents plus tard) ---
Section 2 6 "Installation Claude Code (CLI)"
$claudeVer = $null
try { $claudeVer = & claude --version 2>$null } catch {}
if ($claudeVer) {
    Write-Host "  OK : Claude Code deja present ($claudeVer)" -ForegroundColor Green
} else {
    Write-Host "  Installation de @anthropic-ai/claude-code..."
    & npm install -g @anthropic-ai/claude-code 2>&1 | Out-Null
    Write-Host "  OK : Claude Code installe (commande : claude)" -ForegroundColor Green
}

# --- 3. Download MCP server ---
Section 3 6 "Telechargement du serveur MCP DRH AI"
$targetDir = Join-Path $env:USERPROFILE "drh-ai-mcp"
$zipUrl = "https://github.com/jimy78/Wavely/archive/refs/heads/claude/create-hr-ai-agent-oGtCZ.zip"
$zipPath = Join-Path $env:TEMP "drh-ai-mcp.zip"

if (Test-Path $targetDir) {
    Write-Host "  Dossier existant detecte, mise a jour..."
    Remove-Item -Recurse -Force $targetDir
}
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath -UseBasicParsing
Expand-Archive -Path $zipPath -DestinationPath $env:TEMP -Force
$extracted = Get-ChildItem -Path $env:TEMP -Directory | Where-Object { $_.Name -like "Wavely-*hr-ai-agent*" } | Select-Object -First 1
if (-not $extracted) {
    Write-Host "  Erreur : archive extraite introuvable." -ForegroundColor Red
    exit 1
}
Move-Item -Path $extracted.FullName -Destination $targetDir
Remove-Item $zipPath
Write-Host "  OK : Code installe dans $targetDir" -ForegroundColor Green

# --- 4. npm install ---
Section 4 6 "Installation des dependances Node (1-2 min)"
Push-Location $targetDir
& npm install --silent --no-fund --no-audit 2>&1 | Out-Null
Pop-Location
Write-Host "  OK : Dependances installees" -ForegroundColor Green

# --- 5. API key ---
Section 5 6 "Cle API Anthropic"
Write-Host "  Si vous n'en avez pas, creez-la ici : https://console.anthropic.com/" -ForegroundColor Yellow
$apiKey = Read-Host "  Collez votre cle (sk-ant-...)"
$apiKey = $apiKey.Trim()
if (-not $apiKey.StartsWith("sk-ant-")) {
    Write-Host "  Cle invalide (doit commencer par sk-ant-). Annulation." -ForegroundColor Red
    exit 1
}

# --- 6. Claude Desktop config ---
Section 6 6 "Configuration Claude Desktop"
$configDir = Join-Path $env:APPDATA "Claude"
$configPath = Join-Path $configDir "claude_desktop_config.json"
$mcpServerPath = Join-Path $targetDir "mcp-server.js"

if (-not (Test-Path $configDir)) {
    New-Item -ItemType Directory -Path $configDir -Force | Out-Null
}

$config = $null
if (Test-Path $configPath) {
    $raw = Get-Content $configPath -Raw -ErrorAction SilentlyContinue
    if ($raw -and $raw.Trim().Length -gt 0) {
        try {
            $config = $raw | ConvertFrom-Json
            Copy-Item $configPath "$configPath.bak" -Force
            Write-Host "  Backup de la config existante : $configPath.bak" -ForegroundColor DarkGray
        } catch {
            Write-Host "  Config existante illisible, ecrasement." -ForegroundColor Yellow
        }
    }
}

if (-not $config) { $config = [PSCustomObject]@{} }
if (-not ($config.PSObject.Properties.Name -contains "mcpServers")) {
    $config | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([PSCustomObject]@{}) -Force
}

$drhEntry = [PSCustomObject]@{
    command = "node"
    args    = @($mcpServerPath)
    env     = [PSCustomObject]@{ ANTHROPIC_API_KEY = $apiKey }
}

if ($config.mcpServers.PSObject.Properties.Name -contains "drh-ai") {
    $config.mcpServers."drh-ai" = $drhEntry
} else {
    $config.mcpServers | Add-Member -NotePropertyName "drh-ai" -NotePropertyValue $drhEntry -Force
}

$config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath -Encoding UTF8
Write-Host "  OK : Config ecrite dans $configPath" -ForegroundColor Green

# --- Done ---
Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host "  INSTALLATION TERMINEE" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Derniere etape (manuelle, 10 secondes) :" -ForegroundColor Cyan
Write-Host "  1. Quittez COMPLETEMENT Claude Desktop" -ForegroundColor White
Write-Host "     (clic droit sur l'icone en bas a droite pres de l'horloge -> Quitter)" -ForegroundColor DarkGray
Write-Host "  2. Relancez Claude Desktop depuis le menu Demarrer" -ForegroundColor White
Write-Host "  3. Dans le chat, demandez par exemple :" -ForegroundColor White
Write-Host '     "Utilise answer_labor_law pour expliquer le preavis d''un cadre CDI demissionnaire"' -ForegroundColor Yellow
Write-Host ""
Write-Host "Si probleme, log :" -ForegroundColor DarkGray
Write-Host "  $env:APPDATA\Claude\logs\mcp-server-drh-ai.log" -ForegroundColor DarkGray
Write-Host ""
