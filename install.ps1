# SILENT KILLER Installation Script (PowerShell)
# Ambient Intelligence for Productivity

param(
    [switch]$Force,
    [switch]$SkipNode
)

Write-Host "🧠 SILENT KILLER Installation" -ForegroundColor Blue
Write-Host "============================" -ForegroundColor Blue
Write-Host ""

# Check Python version
try {
    $pythonVersion = python --version 2>&1
    $versionParts = $pythonVersion -split ' '
    $versionNumber = $versionParts[1]
    $majorMinor = $versionNumber -split '\.'
    $major = [int]$majorMinor[0]
    $minor = [int]$majorMinor[1]
    
    if ($major -lt 3 -or ($major -eq 3 -and $minor -lt 8)) {
        Write-Host "❌ Python 3.8+ required. Found: $versionNumber" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Python version: $versionNumber" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+" -ForegroundColor Red
    exit 1
}

# Check Node.js (optional)
if (-not $SkipNode) {
    try {
        $nodeVersion = node --version
        Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Node.js not found. Frontend will not be installed." -ForegroundColor Yellow
        Write-Host "   Install Node.js from https://nodejs.org/ or run with -SkipNode" -ForegroundColor Yellow
        $SkipNode = $true
    }
}

# Create virtual environment
Write-Host "📦 Setting up Python virtual environment..." -ForegroundColor Blue
if (Test-Path ".venv") {
    if (-not $Force) {
        Write-Host "⚠️  Virtual environment already exists. Use -Force to recreate." -ForegroundColor Yellow
    } else {
        Write-Host "Removing existing virtual environment..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force .venv
    }
}

if (-not (Test-Path ".venv")) {
    python -m venv .venv
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "🔄 Activating virtual environment..." -ForegroundColor Blue
& .\.venv\Scripts\Activate.ps1

# Install backend dependencies
Write-Host "📦 Installing backend dependencies..." -ForegroundColor Blue
pip install --upgrade pip
pip install -r backend\requirements.txt

# Install agent dependencies
Write-Host "📦 Installing agent dependencies..." -ForegroundColor Blue
pip install -r agent\requirements.txt

# Install frontend dependencies
if (-not $SkipNode) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Blue
    Set-Location frontend
    npm install
    Set-Location ..
}

# Create configuration file
Write-Host "⚙️ Creating configuration..." -ForegroundColor Blue
if (-not (Test-Path ".env")) {
    Copy-Item .env.example .env
    Write-Host "✅ Configuration file created (.env)" -ForegroundColor Green
    Write-Host "   Please edit .env with your settings" -ForegroundColor Yellow
} else {
    Write-Host "ℹ️  Configuration file already exists" -ForegroundColor Yellow
}

# Create data directory
if (-not (Test-Path "data")) {
    New-Item -ItemType Directory -Path data | Out-Null
    Write-Host "✅ Data directory created" -ForegroundColor Green
}

# Create run script for PowerShell
$runScript = @'
# SILENT KILLER Run Script (PowerShell)
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("backend", "frontend", "agent", "desktop", "all", "stop", "status", "test")]
    [string]$Action
)

# Colors
$colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $colors.Red
}

function Test-Backend {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health" -TimeoutSec 5 -UseBasicParsing
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Start-Backend {
    Write-Status "Starting SILENT KILLER backend..."
    
    if (Test-Backend) {
        Write-Warning "Backend is already running on port 8000"
        return
    }
    
    # Activate virtual environment
    if (Test-Path ".venv") {
        & .\.venv\Scripts\Activate.ps1
    } else {
        Write-Error "Virtual environment not found. Please run .\install.ps1 first."
        exit 1
    }
    
    # Start backend
    Set-Location backend
    $backend = Start-Process -FilePath "uvicorn" -ArgumentList "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload" -PassThru
    Set-Location ..
    
    # Wait for backend to start
    for ($i = 1; $i -le 30; $i++) {
        if (Test-Backend) {
            Write-Success "Backend started successfully (PID: $($backend.Id))"
            $backend.Id | Out-File -FilePath ".backend_pid" -Encoding UTF8
            break
        }
        Start-Sleep -Seconds 1
    }
    
    if (-not (Test-Backend)) {
        Write-Error "Backend failed to start"
        $backend.Kill()
        exit 1
    }
}

function Start-Frontend {
    Write-Status "Starting SILENT KILLER frontend..."
    
    if (-not (Test-Backend)) {
        Write-Warning "Backend is not running. Starting it first..."
        Start-Backend
    }
    
    # Start frontend
    Set-Location frontend
    $frontend = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -PassThru
    Set-Location ..
    
    Write-Success "Frontend started successfully (PID: $($frontend.Id))"
    $frontend.Id | Out-File -FilePath ".frontend_pid" -Encoding UTF8
}

function Start-Agent {
    Write-Status "Starting SILENT KILLER agent..."
    
    if (-not (Test-Backend)) {
        Write-Warning "Backend is not running. Starting it first..."
        Start-Backend
    }
    
    # Activate virtual environment
    if (Test-Path ".venv") {
        & .\.venv\Scripts\Activate.ps1
    } else {
        Write-Error "Virtual environment not found. Please run .\install.ps1 first."
        exit 1
    }
    
    # Start agent TUI
    Set-Location agent
    python tui.py
    Set-Location ..
}

function Start-DesktopAgent {
    Write-Status "Starting SILENT KILLER desktop agent..."
    
    if (-not (Test-Backend)) {
        Write-Warning "Backend is not running. Starting it first..."
        Start-Backend
    }
    
    # Activate virtual environment
    if (Test-Path ".venv") {
        & .\.venv\Scripts\Activate.ps1
    } else {
        Write-Error "Virtual environment not found. Please run .\install.ps1 first."
        exit 1
    }
    
    # Start desktop agent
    Set-Location agent
    python desktop_agent.py
    Set-Location ..
}

function Stop-Services {
    Write-Status "Stopping SILENT KILLER services..."
    
    # Stop backend
    if (Test-Path ".backend_pid") {
        $backendId = Get-Content ".backend_pid"
        try {
            $process = Get-Process -Id $backendId -ErrorAction Stop
            $process.Kill()
            Write-Success "Backend stopped (PID: $backendId)"
        } catch {
            Write-Warning "Backend process not found"
        }
        Remove-Item ".backend_pid" -ErrorAction SilentlyContinue
    }
    
    # Stop frontend
    if (Test-Path ".frontend_pid") {
        $frontendId = Get-Content ".frontend_pid"
        try {
            $process = Get-Process -Id $frontendId -ErrorAction Stop
            $process.Kill()
            Write-Success "Frontend stopped (PID: $frontendId)"
        } catch {
            Write-Warning "Frontend process not found"
        }
        Remove-Item ".frontend_pid" -ErrorAction SilentlyContinue
    }
}

function Show-Status {
    Write-Status "SILENT KILLER Status"
    Write-Host "=======================" -ForegroundColor Blue
    
    # Backend status
    if (Test-Backend) {
        Write-Success "Backend: Running on http://localhost:8000"
    } else {
        Write-Warning "Backend: Not running"
    }
    
    # Frontend status
    if (Test-Path ".frontend_pid") {
        $frontendId = Get-Content ".frontend_pid"
        try {
            $process = Get-Process -Id $frontendId -ErrorAction Stop
            Write-Success "Frontend: Running (PID: $frontendId)"
        } catch {
            Write-Warning "Frontend: PID file exists but process not running"
        }
    } else {
        Write-Warning "Frontend: Not running"
    }
    
    # Virtual environment
    if (Test-Path ".venv") {
        Write-Success "Virtual environment: Found"
    } else {
        Write-Warning "Virtual environment: Not found"
    }
}

function Run-Tests {
    Write-Status "Running SILENT KILLER tests..."
    
    # Activate virtual environment
    if (Test-Path ".venv") {
        & .\.venv\Scripts\Activate.ps1
    } else {
        Write-Error "Virtual environment not found. Please run .\install.ps1 first."
        exit 1
    }
    
    # Run backend tests
    Write-Status "Running backend tests..."
    python -m pytest tests/ -v
    
    Write-Success "All tests completed!"
}

# Main logic
switch ($Action) {
    "backend" { Start-Backend }
    "frontend" { Start-Frontend }
    "agent" { Start-Agent }
    "desktop" { Start-DesktopAgent }
    "all" {
        Start-Backend
        Start-Frontend
        Write-Status "All services started!"
        Write-Status "Frontend: http://localhost:3000"
        Write-Status "Backend: http://localhost:8000"
        Write-Status "Press Ctrl+C to stop all services"
        # Keep script running
        try {
            while ($true) { Start-Sleep -Seconds 1 }
        } finally {
            Stop-Services
        }
    }
    "stop" { Stop-Services }
    "status" { Show-Status }
    "test" { Run-Tests }
    default {
        Write-Host "🧠 SILENT KILLER - Ambient Intelligence for Productivity" -ForegroundColor Blue
        Write-Host ""
        Write-Host "Usage: .\run.ps1 -Action {backend|frontend|agent|desktop|all|stop|status|test}" -ForegroundColor White
        Write-Host ""
        Write-Host "Commands:" -ForegroundColor White
        Write-Host "  backend   - Start the backend API server" -ForegroundColor White
        Write-Host "  frontend  - Start the frontend web interface" -ForegroundColor White
        Write-Host "  agent     - Start the terminal user interface" -ForegroundColor White
        Write-Host "  desktop   - Start the desktop monitoring agent" -ForegroundColor White
        Write-Host "  all       - Start backend and frontend" -ForegroundColor White
        Write-Host "  stop      - Stop all running services" -ForegroundColor White
        Write-Host "  status    - Show service status" -ForegroundColor White
        Write-Host "  test      - Run test suite" -ForegroundColor White
        Write-Host ""
        Write-Host "Examples:" -ForegroundColor White
        Write-Host "  .\run.ps1 -Action all      # Start everything" -ForegroundColor Gray
        Write-Host "  .\run.ps1 -Action backend  # Start only backend" -ForegroundColor Gray
        Write-Host "  .\run.ps1 -Action agent    # Start TUI agent" -ForegroundColor Gray
        Write-Host "  .\run.ps1 -Action stop     # Stop all services" -ForegroundColor Gray
    }
}
'@

$runScript | Out-File -FilePath "run.ps1" -Encoding UTF8
Write-Host "✅ PowerShell run script created (run.ps1)" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Blue
Write-Host "1. Edit .env file with your configuration" -ForegroundColor White
Write-Host "2. Start the backend: .\run.ps1 -Action backend" -ForegroundColor White
Write-Host "3. Start the frontend: .\run.ps1 -Action frontend" -ForegroundColor White
Write-Host "4. Run the agent: .\run.ps1 -Action agent" -ForegroundColor White
Write-Host ""
Write-Host "📚 For more information, see:" -ForegroundColor Blue
Write-Host "   - README.md" -ForegroundColor White
Write-Host "   - agent\README.md" -ForegroundColor White
Write-Host "   - frontend\README.md" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Enjoy your ambient intelligence!" -ForegroundColor Green
