# Automated Thermal Printer Driver Installer
# Run as Administrator
# Right-click PowerShell → Run as Administrator
# Then: powershell.exe -ExecutionPolicy Bypass -File install-printer-drivers.ps1

Clear-Host
Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   🖨️  THERMAL PRINTER DRIVER INSTALLER - AUTO               ║" -ForegroundColor Cyan
Write-Host "║   MTP-II_565A / Universal Thermal Printer Support          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ ERROR: This script must run as Administrator!" -ForegroundColor Red
    Write-Host "   Right-click PowerShell → Run as Administrator" -ForegroundColor Yellow
    Write-Host "   Then run this script again`n" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit
}

Write-Host "✅ Running as Administrator`n" -ForegroundColor Green

# Create temp folder
$tempDir = "$env:TEMP\PrinterDrivers"
if (-not (Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

Write-Host "📁 Temp folder: $tempDir`n" -ForegroundColor Cyan

# Function to download file
function Download-File {
    param(
        [string]$Url,
        [string]$OutputPath,
        [string]$FileName
    )

    Write-Host "⏳ Downloading $FileName..." -ForegroundColor Yellow
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $progressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $Url -OutFile $OutputPath -UseBasicParsing
        Write-Host "✅ Downloaded: $FileName" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to download $FileName" -ForegroundColor Red
        Write-Host "   Error: $_" -ForegroundColor Red
        return $false
    }
}

# Function to extract ZIP
function Extract-Zip {
    param(
        [string]$ZipPath,
        [string]$ExtractPath
    )

    Write-Host "📦 Extracting files..." -ForegroundColor Yellow
    try {
        Expand-Archive -Path $ZipPath -DestinationPath $ExtractPath -Force
        Write-Host "✅ Extracted successfully" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to extract" -ForegroundColor Red
        return $false
    }
}

# Function to run installer
function Install-Driver {
    param(
        [string]$InstallerPath,
        [string]$DriverName
    )

    Write-Host "`n🔧 Installing $DriverName..." -ForegroundColor Yellow
    try {
        $process = Start-Process -FilePath $InstallerPath -ArgumentList "/S" -PassThru -Wait
        if ($process.ExitCode -eq 0) {
            Write-Host "✅ $DriverName installed successfully" -ForegroundColor Green
            return $true
        } else {
            Write-Host "⚠️  Installation completed with code: $($process.ExitCode)" -ForegroundColor Yellow
            return $true
        }
    } catch {
        Write-Host "❌ Installation failed: $_" -ForegroundColor Red
        return $false
    }
}

# Main installation process
Write-Host "📋 STEP 1: Detecting printer and USB chip..." -ForegroundColor Cyan
Write-Host "-" * 60

# Check for existing devices
$devices = Get-PnpDevice | Where-Object { $_.Name -match "Thermal|MTP|Printer|USB" }
if ($devices) {
    Write-Host "Found devices:" -ForegroundColor Green
    $devices | ForEach-Object {
        Write-Host "  • $($_.Name) - Status: $($_.Status)"
    }
} else {
    Write-Host "ℹ️  No thermal printers detected (they may be paired already)" -ForegroundColor Cyan
}

# Install CH340 Driver (Most Common)
Write-Host "`n📋 STEP 2: Installing CH340 USB Driver..." -ForegroundColor Cyan
Write-Host "-" * 60

$ch340Url = "https://www.wch.cn/downloads/CH341SER_EXE.html"
$ch340Path = "$tempDir\CH340.exe"
$ch340Zip = "$tempDir\CH340.zip"

# For demo purposes, we'll create a placeholder since direct download might fail
Write-Host "⚠️  CH340 driver download requires manual intervention" -ForegroundColor Yellow
Write-Host "   Click the link below and download the .EXE file:" -ForegroundColor Cyan
Write-Host "   📥 $ch340Url" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Then run the installer as Administrator" -ForegroundColor Yellow

# Check if file exists
if (Test-Path $ch340Path) {
    Write-Host "`n✅ CH340 installer found, running installation..." -ForegroundColor Green
    Install-Driver -InstallerPath $ch340Path -DriverName "CH340"
} else {
    Write-Host "`n📝 Please download and run manually:" -ForegroundColor Yellow
    Write-Host "   1. Visit: https://www.wch.cn/downloads/CH341SER_EXE.html" -ForegroundColor Yellow
    Write-Host "   2. Download CH340SER.EXE" -ForegroundColor Yellow
    Write-Host "   3. Right-click → Run as Administrator" -ForegroundColor Yellow
    Write-Host "   4. Follow installer prompts" -ForegroundColor Yellow
}

# Step 3: Remove and re-pair printer
Write-Host "`n📋 STEP 3: Printer Pairing Instructions..." -ForegroundColor Cyan
Write-Host "-" * 60
Write-Host @"
After driver installation:

1. ✓ Power OFF the printer for 10 seconds
2. ✓ Settings → Bluetooth & devices → Devices
3. ✓ Find "MTP-II_565A"
4. ✓ Click it → Remove device → Confirm
5. ✓ Power ON the printer
6. ✓ Settings → Add device → Bluetooth
7. ✓ Select "MTP-II_565A" from list
8. ✓ Complete the pairing wizard
"@ -ForegroundColor Yellow

# Step 4: Verify installation
Write-Host "`n📋 STEP 4: Verifying Installation..." -ForegroundColor Cyan
Write-Host "-" * 60

Write-Host "`nChecking COM ports..." -ForegroundColor Yellow
$comPorts = Get-PnpDevice | Where-Object { $_.Class -eq "Ports" }
if ($comPorts) {
    Write-Host "✅ COM Ports found:" -ForegroundColor Green
    $comPorts | ForEach-Object {
        $status = if ($_.Status -eq "OK") { "✅ OK" } else { "⚠️  Problem" }
        Write-Host "   $status  $($_.Name)"
    }
} else {
    Write-Host "⚠️  No COM ports found yet" -ForegroundColor Yellow
    Write-Host "   (They will appear after printer pairing)" -ForegroundColor Cyan
}

# Step 5: Test
Write-Host "`n📋 STEP 5: Testing Printer..." -ForegroundColor Cyan
Write-Host "-" * 60
Write-Host @"
To test your printer:

1. 🌐 Open browser: http://localhost:9002
2. 📄 Navigate to any invoice
3. 🖨️  Click "Print Receipt"
4. 🔌 Select your printer from the port list
5. 📏 Choose paper size (58mm or 80mm)
6. ✅ Click "Connect & Print"
7. 📋 Receipt should print!

Check browser console (F12) for detailed logs.
"@ -ForegroundColor Cyan

# Summary
Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   INSTALLATION SUMMARY                                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host @"

✅ Script completed!

📋 Next Actions (DO THESE):

1. DOWNLOAD DRIVER
   → Visit: https://www.wch.cn/downloads/CH341SER_EXE.html
   → Download: CH340SER.EXE (or CH341SER.EXE)
   → Save to: $tempDir
   → Right-click → Run as Administrator

2. RESTART WINDOWS
   → This is IMPORTANT for driver installation!
   → Full restart (not sleep)

3. RE-PAIR PRINTER
   → Settings → Bluetooth & devices
   → Remove "MTP-II_565A"
   → Re-add device and pair again

4. TEST PRINTING
   → Open http://localhost:9002
   → Navigate to invoice
   → Click "Print Receipt"
   → Select printer
   → Click "Connect & Print"

⚠️  IMPORTANT NOTES:

• Driver download requires manual action (browser-based)
• After installation, RESTART your computer
• After restart, re-pair the printer
• Check Device Manager (Right-click Start) to verify
• COM port should appear WITHOUT warning symbol

📞 NEED HELP?

See these guides for troubleshooting:
• QUICK_PRINTER_FIX.md
• PRINTER_DRIVER_FIX.md
• Run: diagnose-printer.ps1 (to run diagnostics)

🎉 Good luck! Your printer should work after these steps!
"@ -ForegroundColor Green

Write-Host ""
Write-Host "Press Enter to exit" -ForegroundColor Yellow
Read-Host
