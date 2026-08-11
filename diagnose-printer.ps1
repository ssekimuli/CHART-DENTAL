# Windows Thermal Printer Diagnostics Script
# Run as Administrator: Right-click PowerShell → Run as Administrator
# Then: cd "C:\Users\sseki\Documents\CHART-DENTAL" && powershell.exe -ExecutionPolicy Bypass -File diagnose-printer.ps1

Write-Host "`n🖨️  THERMAL PRINTER DIAGNOSTICS`n" -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "`n❌ ERROR: Please run PowerShell as Administrator!`n" -ForegroundColor Red
    exit
}

Write-Host "✓ Running as Administrator`n" -ForegroundColor Green

# 1. Check Bluetooth Devices
Write-Host "1️⃣  BLUETOOTH DEVICES" -ForegroundColor Yellow
Write-Host "-" * 60

try {
    $btDevices = Get-PnpDevice | Where-Object { $_.Class -eq "Bluetooth" }
    if ($btDevices) {
        $btDevices | ForEach-Object {
            Write-Host "  • $($_.Name) - Status: $($_.Status)"
        }
    } else {
        Write-Host "  ⚠️  No Bluetooth devices found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Error checking Bluetooth: $_" -ForegroundColor Red
}

# 2. Check COM Ports
Write-Host "`n2️⃣  COM PORTS" -ForegroundColor Yellow
Write-Host "-" * 60

try {
    $comPorts = Get-PnpDevice | Where-Object { $_.Class -eq "Ports" }
    if ($comPorts) {
        $comPorts | ForEach-Object {
            $status = if ($_.Status -eq "OK") { "✓ OK" } else { "⚠️  Problem" }
            Write-Host "  • $($_.Name) - $status"
        }
    } else {
        Write-Host "  ⚠️  No COM ports found!" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Error checking COM ports: $_" -ForegroundColor Red
}

# 3. Check for USB Devices with Problems
Write-Host "`n3️⃣  USB DEVICES WITH PROBLEMS" -ForegroundColor Yellow
Write-Host "-" * 60

try {
    $problemDevices = Get-PnpDevice | Where-Object { $_.Status -ne "OK" }
    if ($problemDevices) {
        $problemDevices | ForEach-Object {
            Write-Host "  ⚠️  $($_.Name) - Status: $($_.Status)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ✓ No problem devices found" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Error checking devices: $_" -ForegroundColor Red
}

# 4. Check Registry for Printer Drivers
Write-Host "`n4️⃣  INSTALLED PRINTER DRIVERS" -ForegroundColor Yellow
Write-Host "-" * 60

try {
    $drivers = Get-ChildItem "HKLM:\SYSTEM\CurrentControlSet\Services" -ErrorAction SilentlyContinue |
               Where-Object { $_.Name -match "CH340|CP2102|PL2303|FT232|FTDI" }

    if ($drivers) {
        $drivers | ForEach-Object {
            Write-Host "  ✓ Found: $($_.PSChildName)" -ForegroundColor Green
        }
    } else {
        Write-Host "  ⚠️  No common USB-Serial drivers found in registry" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠️  Could not check registry: $_" -ForegroundColor Yellow
}

# 5. List all connected devices
Write-Host "`n5️⃣  ALL CONNECTED DEVICES" -ForegroundColor Yellow
Write-Host "-" * 60

try {
    $allDevices = Get-PnpDevice | Where-Object { $_.Name -match "Thermal|Printer|MTP|Serial|USB" }
    if ($allDevices) {
        $allDevices | ForEach-Object {
            Write-Host "  • $($_.Name) ($($_.Class)) - $($_.Status)"
        }
    } else {
        Write-Host "  ℹ️  No thermal printer devices detected by this search" -ForegroundColor Cyan
    }
} catch {
    Write-Host "  ❌ Error listing devices: $_" -ForegroundColor Red
}

# 6. Network Configuration
Write-Host "`n6️⃣  NETWORK & CONNECTIVITY" -ForegroundColor Yellow
Write-Host "-" * 60

try {
    # Check if ports are listening
    $listeningPorts = netstat -an | Select-String "LISTENING"
    if ($listeningPorts) {
        Write-Host "  ✓ Network is active" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️  Could not check network" -ForegroundColor Yellow
}

# 7. Recommendations
Write-Host "`n7️⃣  RECOMMENDATIONS" -ForegroundColor Cyan
Write-Host "-" * 60

Write-Host "
If you see 'Driver is unavailable':

1. ✓ Remove device from Bluetooth settings
2. ✓ Restart Windows
3. ✓ Re-pair the printer
4. ✓ Install USB driver:
   - CH340: https://www.wch.cn/downloads/CH341SER_EXE.html
   - CP2102: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
   - Prolific: http://www.prolific.com.tw/
5. ✓ Restart again
6. ✓ Check Device Manager for COM ports
7. ✓ Try printing

If COM ports show ⚠️ :
- Right-click in Device Manager
- Select 'Update driver'
- Browse to driver folder
- Install manually
" -ForegroundColor Cyan

Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "`n✅ Diagnostics complete!`n" -ForegroundColor Green

# Export results to file
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$logFile = "printer-diagnostics_$timestamp.txt"

Write-Host "📁 Results saved to: $logFile`n" -ForegroundColor Green

Get-PnpDevice | Out-File $logFile -Append
