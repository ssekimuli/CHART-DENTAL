@echo off
REM Thermal Printer Driver Installation Helper
REM Run as Administrator

cls
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║  🖨️  THERMAL PRINTER DRIVER INSTALLATION               ║
echo ║  MTP-II_565A / USB-to-Serial Thermal Printers         ║
echo ╚════════════════════════════════════════════════════════╝
echo.

REM Check for Administrator
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ❌ ERROR: This script must run as Administrator!
    echo.
    echo    Steps to run as Administrator:
    echo    1. Right-click This File
    echo    2. Select "Run as Administrator"
    echo    3. Click "Yes" if prompted
    echo.
    pause
    exit /b 1
)

echo ✅ Running as Administrator
echo.
echo ════════════════════════════════════════════════════════
echo 📋 STEP 1: DRIVER DOWNLOAD
echo ════════════════════════════════════════════════════════
echo.
echo The CH340 driver is the most common for thermal printers.
echo Your browser will open shortly...
echo.
echo CH340 Download: https://www.wch.cn/downloads/CH341SER_EXE.html
echo.
echo Instructions:
echo   1. Click "CH341SER.EXE" or "CH340SER.EXE" (download link)
echo   2. Wait for download to complete
echo   3. IMPORTANT: Come back to this window
echo   4. Do NOT close this window yet
echo.
pause

REM Open browser with driver download
start https://www.wch.cn/downloads/CH341SER_EXE.html

echo.
echo ⏳ Waiting for you to download the driver...
echo.
echo Once downloaded, press Enter to continue
echo.
pause

cls
echo.
echo ════════════════════════════════════════════════════════
echo 📋 STEP 2: INSTALL DRIVER
echo ════════════════════════════════════════════════════════
echo.
echo The driver files should be in your Downloads folder.
echo.
echo Steps to install:
echo   1. Open File Explorer (Windows key + E)
echo   2. Go to: C:\Users\%USERNAME%\Downloads
echo   3. Find the CH340 or CH341 ZIP or EXE file
echo   4. If it's a ZIP: Extract it first
echo   5. Find SETUP.EXE inside
echo   6. Right-click SETUP.EXE
echo   7. Select "Run as Administrator"
echo   8. Click "Install"
echo   9. Wait for installation to complete
echo   10. Press Enter when done
echo.
pause

cls
echo.
echo ════════════════════════════════════════════════════════
echo 📋 STEP 3: RESTART COMPUTER
echo ════════════════════════════════════════════════════════
echo.
echo ⚠️  VERY IMPORTANT: You MUST restart your computer now!
echo.
echo This is required for Windows to recognize the driver.
echo.
echo.
set /p restart="Do you want to restart now? (Y/N): "
if /i "%restart%"=="Y" (
    echo.
    echo ⏳ Computer will restart in 10 seconds...
    timeout /t 10
    shutdown /r /t 0
) else (
    echo.
    echo ⚠️  Please remember to restart later!
    echo.
)

cls
echo.
echo ════════════════════════════════════════════════════════
echo 📋 STEP 4: RE-PAIR PRINTER
echo ════════════════════════════════════════════════════════
echo.
echo After your computer restarts:
echo.
echo   1. Power OFF your printer for 10 seconds
echo   2. Settings → Bluetooth ^& devices → Devices
echo   3. Find "MTP-II_565A"
echo   4. Click it
echo   5. Click "Remove device" → Confirm
echo   6. Power ON your printer
echo   7. Settings → Add device
echo   8. Wait for printer to appear
echo   9. Select "MTP-II_565A"
echo   10. Complete pairing
echo.
pause

cls
echo.
echo ════════════════════════════════════════════════════════
echo 📋 STEP 5: VERIFY DRIVER INSTALLATION
echo ════════════════════════════════════════════════════════
echo.
echo To verify the driver is installed:
echo.
echo   1. Right-click Start button
echo   2. Select "Device Manager"
echo   3. Expand "COM ports"
echo   4. Your printer should appear
echo   5. It should NOT have a warning symbol ⚠️
echo.
echo If you see a ⚠️ warning:
echo   - Right-click the device
echo   - Select "Update driver"
echo   - Choose "Browse my computer"
echo   - Select the driver folder
echo   - Click "Install"
echo.
pause

cls
echo.
echo ════════════════════════════════════════════════════════
echo 📋 STEP 6: TEST PRINTING
echo ════════════════════════════════════════════════════════
echo.
echo To test your printer:
echo.
echo   1. Open your browser
echo   2. Navigate to: http://localhost:9002
echo   3. Go to any invoice
echo   4. Click "Print Receipt" button
echo   5. Select your printer from the list
echo   6. Choose paper size (58mm or 80mm)
echo   7. Click "Connect ^& Print"
echo   8. Your printer should print!
echo.
echo   ✅ If receipt prints = SUCCESS!
echo   ❌ If it doesn't = Check browser console (Press F12)
echo.
pause

cls
echo.
echo ════════════════════════════════════════════════════════
echo ✅ INSTALLATION HELPER COMPLETE
echo ════════════════════════════════════════════════════════
echo.
echo Summary of what you did:
echo   ✓ Downloaded CH340 driver
echo   ✓ Installed driver
echo   ✓ Restarted computer
echo   ✓ Re-paired printer
echo   ✓ Verified driver in Device Manager
echo   ✓ Tested printing
echo.
echo 📞 Need Help?
echo.
echo   • If driver shows warning: See PRINTER_DRIVER_FIX.md
echo   • For quick fixes: See QUICK_PRINTER_FIX.md
echo   • Run diagnostics: diagnose-printer.ps1
echo.
echo 🎉 Your printer should now work!
echo.
pause
exit /b 0
