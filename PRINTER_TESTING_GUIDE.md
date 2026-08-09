# 🖨️ Bluetooth Thermal Printer Testing Guide

## ✅ What We Verified

The ESC/POS receipt generation is working perfectly:
- **58mm Printer**: 748 bytes generated ✅
- **80mm Printer**: 1012 bytes generated ✅
- ESC/POS commands properly formatted ✅
- Paper cut commands included ✅

## 🚀 How to Test in Your App

### Step 1: Prepare Your Printer

1. **Power on your thermal printer** (MTP-II_565A or similar)
2. **Pair with Windows**:
   - Settings → Bluetooth & devices → Bluetooth
   - Click "Add device"
   - Select your printer
   - Follow pairing wizard

3. **Ensure Drivers are Installed**:
   - If you see "Driver is unavailable", install drivers:
     - Check printer manufacturer's website
     - Or search "" (common for thermal printers)

### Step 2: Test in Browser

1. **Open Invoice Page**:
   ```
   http://localhost:9002/dashboard/billing/[invoice-id]
   ```

2. **Click "Print Receipt" Button**:
   - You should see a button in the invoice header
   - Button will show: "Print Receipt" or "Print (Printer Name)"

3. **Select Printer Port**:
   - Browser will show: "Select Serial Port"
   - Choose your thermal printer (e.g., "COM3" or "USB Serial Device")
   - Click "Select"

4. **Choose Paper Size**:
   - Dialog appears asking for paper size
   - Select: **58mm** (portable) or **80mm** (standard)
   - This depends on your printer

5. **Connect and Print**:
   - Click "Connect & Print" button
   - Browser will:
     - Establish connection
     - Convert receipt to ESC/POS commands
     - Send bytes to printer
   - **Your printer should now print the receipt!**

### Step 3: Monitor for Issues

**Check Browser Console** (Press F12):
- Should see logs like:
  ```
  ✓ Printer connected successfully
  ✓ Sent 748 bytes to printer
  ✓ Print job complete
  ```

**If Something Goes Wrong**:
- Look for error messages in console
- Check if printer is powered on
- Verify printer is paired in Windows Settings
- Try disconnecting and reconnecting

## 🔍 What Gets Printed

The receipt includes:
```
       CHART DENTAL CLINIC
          Kampala, Uganda
        +256 701 234 567
        
        --------------------------------
        
        Invoice #:          INV-2024-001
        Date:                 2024-08-09
        Time:                      14:30
        
        Patient:                John Doe
        Doctor:          Dr. Sarah Smith
        
        --------------------------------
        
        Item                 Qty  Price
        --------------------------------
        Dental Cleaning        1  50000
        Filling - Tooth #16    1 120000
        X-Ray Exam             1  30000
        
        --------------------------------
        
        Subtotal:             200,000
        Tax:                    20,000
        Discount:               -5,000
        
                             215,000
        
        Payment:                  Cash
        
        --------------------------------
        Thank you for your business!
        
        [PAPER CUT]
```

## 📋 Troubleshooting

### Issue: "No ports available"
**Solution**:
- Ensure printer is paired in Windows Settings
- Try unpair → repair
- Restart computer
- Check if printer needs drivers

### Issue: "Connection refused"
**Solution**:
- Check if printer is powered on
- Try different USB port
- Restart printer
- Update printer firmware

### Issue: "Print sent but nothing prints"
**Solution**:
- Check printer has paper
- Verify printer is online (check LED indicators)
- Try manual test print (printer's own test button)
- Check ESC/POS compatibility

### Issue: Receipt prints but looks wrong
**Solution**:
- Make sure you selected correct paper size (58mm or 80mm)
- Some printers need baud rate adjustment
- Try different printer firmware version

### Issue: "Driver is unavailable"
**Solution**:
1. Find your printer model (check label on printer)
2. Visit manufacturer website
3. Download drivers for Windows 11
4. Run installer
5. Restart computer
6. Try pairing again

**Common printer drivers**:
- Thermal printers often use **CH340** or **CP2102** chips
- Search "[Your Printer Model] Windows driver"

## 🧪 Quick Test

Run the printer generation test:
```bash
node test-printer.js
```

This verifies the ESC/POS generation works without needing a physical printer.

## 📊 System Requirements

- **Browser**: Chrome, Edge, or Opera (latest)
- **OS**: Windows 10 or later
- **Connection**: Bluetooth or USB Serial
- **Printer**: ESC/POS compatible thermal printer
- **Paper**: Standard thermal receipt paper (58mm or 80mm)

## 🎯 Next Steps After Testing

1. ✅ Test printing 1-2 invoices
2. ✅ Verify receipt quality and formatting
3. ✅ Check if paper cuts cleanly
4. ✅ Ensure all fields print correctly
5. ✅ Test with different paper sizes if you have both printers

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for detailed error messages
2. Verify Windows can see the printer in Settings
3. Try another printer if available to isolate issues
4. Check printer manual for ESC/POS support

---

**Happy Printing! 🖨️✨**
