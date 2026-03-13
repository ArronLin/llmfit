# LLMFit Desktop Build Script
# This script builds the complete desktop application

param(
    [switch]$Clean,
    [switch]$SkipBackend,
    [switch]$SkipFrontend,
    [switch]$SkipTauri
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
$DesktopDir = $PSScriptRoot
$BackendDir = Join-Path $RootDir "web-ui\backend"
$FrontendDir = Join-Path $RootDir "web-ui\frontend"
$TauriDir = Join-Path $DesktopDir "src-tauri"

Write-Host "=== LLMFit Desktop Build Script ===" -ForegroundColor Cyan
Write-Host ""

# Clean previous builds
if ($Clean) {
    Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
    Remove-Item -Path "$DesktopDir\dist" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$TauriDir\target" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$BackendDir\build" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$BackendDir\dist" -Recurse -Force -ErrorAction SilentlyContinue
}

# Step 1: Build Backend
if (-not $SkipBackend) {
    Write-Host "Step 1: Building Python Backend..." -ForegroundColor Green
    Set-Location $BackendDir
    
    # Check if PyInstaller is installed
    $pyinstaller = Get-Command pyinstaller -ErrorAction SilentlyContinue
    if (-not $pyinstaller) {
        Write-Host "Installing PyInstaller..." -ForegroundColor Yellow
        pip install pyinstaller
    }
    
    # Build backend executable
    Write-Host "Running PyInstaller..." -ForegroundColor Yellow
    pyinstaller llmfit-backend.spec --clean --noconfirm
    
    if (-not (Test-Path "$BackendDir\dist\llmfit-backend.exe")) {
        Write-Error "Backend build failed!"
        exit 1
    }
    
    Write-Host "Backend built successfully!" -ForegroundColor Green
    Write-Host ""
}

# Step 2: Build Frontend
if (-not $SkipFrontend) {
    Write-Host "Step 2: Building React Frontend..." -ForegroundColor Green
    Set-Location $FrontendDir
    
    # Check if node_modules exists
    if (-not (Test-Path "$FrontendDir\node_modules")) {
        Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
        npm install
    }
    
    # Build frontend
    Write-Host "Building frontend..." -ForegroundColor Yellow
    npm run build
    
    if (-not (Test-Path "$FrontendDir\dist")) {
        Write-Error "Frontend build failed!"
        exit 1
    }
    
    Write-Host "Frontend built successfully!" -ForegroundColor Green
    Write-Host ""
}

# Step 3: Prepare Tauri resources
Write-Host "Step 3: Preparing Tauri resources..." -ForegroundColor Green

# Create backend directory in Tauri resources
$TauriBackendDir = "$TauriDir\backend"
New-Item -ItemType Directory -Path $TauriBackendDir -Force | Out-Null

# Copy backend executable
Copy-Item "$BackendDir\dist\llmfit-backend.exe" "$TauriBackendDir\" -Force

# Copy frontend dist
$DesktopDistDir = "$DesktopDir\dist"
if (Test-Path $DesktopDistDir) {
    Remove-Item $DesktopDistDir -Recurse -Force
}
Copy-Item "$FrontendDir\dist" $DesktopDistDir -Recurse -Force

Write-Host "Resources prepared!" -ForegroundColor Green
Write-Host ""

# Step 4: Build Tauri Application
if (-not $SkipTauri) {
    Write-Host "Step 4: Building Tauri Application..." -ForegroundColor Green
    Set-Location $DesktopDir
    
    # Check if Rust is installed
    $cargo = Get-Command cargo -ErrorAction SilentlyContinue
    if (-not $cargo) {
        Write-Error "Rust/Cargo is not installed. Please install Rust from https://rustup.rs/"
        exit 1
    }
    
    # Check if Tauri CLI is installed
    $tauri = Get-Command tauri -ErrorAction SilentlyContinue
    if (-not $tauri) {
        Write-Host "Installing Tauri CLI..." -ForegroundColor Yellow
        cargo install tauri-cli
    }
    
    # Build Tauri app
    Write-Host "Building Tauri application (this may take a while)..." -ForegroundColor Yellow
    cargo tauri build
    
    $MsiPath = "$TauriDir\target\release\bundle\msi\LLMFit_0.1.0_x64_en-US.msi"
    $ExePath = "$TauriDir\target\release\llmfit-desktop.exe"
    
    if (Test-Path $MsiPath) {
        Write-Host ""
        Write-Host "=== Build Successful! ===" -ForegroundColor Green
        Write-Host ""
        Write-Host "MSI Installer: $MsiPath" -ForegroundColor Cyan
        Write-Host "Executable: $ExePath" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To distribute, you can use the MSI file or create a ZIP with the executable."
    } else {
        Write-Error "Tauri build failed!"
        exit 1
    }
}

Set-Location $RootDir
Write-Host "Build script completed!" -ForegroundColor Green
