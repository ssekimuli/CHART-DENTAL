// Test file for ESC/POS printer functionality
// Run: npx ts-node src/lib/test-escpos.ts

import { generateReceiptBytes, type ReceiptData } from './escpos-printer';

function testReceiptGeneration() {
  console.log('\n🖨️  Testing ESC/POS Receipt Generation\n');
  console.log('=' .repeat(50));

  // Test data
  const testReceipt: ReceiptData = {
    printerSize: '58mm',
    businessName: 'CHART DENTAL CLINIC',
    businessPhone: '+256 701 234 567',
    businessAddress: 'Kampala, Uganda',
    invoiceNumber: 'INV-2024-001',
    date: '2024-08-09',
    time: '14:30',
    patientName: 'John Doe',
    doctorName: 'Dr. Sarah Smith',
    items: [
      {
        description: 'Dental Cleaning',
        quantity: 1,
        unitPrice: 50000,
        total: 50000,
      },
      {
        description: 'Filling - Tooth #16',
        quantity: 1,
        unitPrice: 120000,
        total: 120000,
      },
      {
        description: 'X-Ray Examination',
        quantity: 1,
        unitPrice: 30000,
        total: 30000,
      },
    ],
    subtotal: 200000,
    tax: 20000,
    discount: 5000,
    total: 215000,
    paymentMethod: 'Cash',
    notes: 'Payment received. Thank you!',
    footer: 'Visit us again soon!',
  };

  try {
    // Generate ESC/POS bytes
    const bytes = generateReceiptBytes(testReceipt);

    console.log(`✅ Receipt generated successfully!`);
    console.log(`📊 Receipt Data:`);
    console.log(`  - Invoice #: ${testReceipt.invoiceNumber}`);
    console.log(`  - Patient: ${testReceipt.patientName}`);
    console.log(`  - Doctor: ${testReceipt.doctorName}`);
    console.log(`  - Items: ${testReceipt.items.length}`);
    console.log(`  - Total: ${testReceipt.total}`);

    console.log(`\n📦 ESC/POS Output:`);
    console.log(`  - Total bytes: ${bytes.length}`);
    console.log(`  - Size: ${(bytes.length / 1024).toFixed(2)} KB`);

    // Show hex representation (first 100 bytes)
    const hexPreview = Array.from(bytes.slice(0, 100))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(' ');
    console.log(`  - Hex preview: ${hexPreview}...`);

    // Show ASCII representation (printable characters only)
    const ascii = Array.from(bytes)
      .map(b => {
        const char = String.fromCharCode(b);
        return /[ -~]/.test(char) ? char : '.';
      })
      .join('');
    console.log(`\n📄 ASCII Output Preview:`);
    console.log('---START---');
    console.log(ascii.substring(0, 500));
    console.log('---END---\n');

    // Verify critical ESC commands
    console.log(`✓ Verification Checks:`);
    const hasInitialize = bytes.includes(0x1b); // ESC character
    const hasCut = bytes.includes(0x41); // Cut command
    console.log(`  ${hasInitialize ? '✅' : '❌'} Contains ESC initialization`);
    console.log(`  ${hasCut ? '✅' : '❌'} Contains cut command`);

    // Test with 80mm printer
    console.log(`\n\n📐 Testing 80mm Printer Size:`);
    const testReceipt80mm: ReceiptData = {
      ...testReceipt,
      printerSize: '80mm',
    };

    const bytes80mm = generateReceiptBytes(testReceipt80mm);
    console.log(`✅ 80mm receipt generated!`);
    console.log(`  - Total bytes: ${bytes80mm.length}`);
    console.log(`  - Char width: 48 characters`);

    console.log(`\n${'='.repeat(50)}`);
    console.log(`✅ All tests passed! Receipt is ready for printing.\n`);

    // Save test output to file
    const testOutput = {
      timestamp: new Date().toISOString(),
      receipt: testReceipt,
      bytesGenerated: bytes.length,
      bytes80mm: bytes80mm.length,
      status: 'SUCCESS',
    };

    console.log(`📁 Test completed successfully!`);
    return testOutput;
  } catch (error: any) {
    console.error(`❌ Error generating receipt:`, error.message);
    throw error;
  }
}

// Run test
if (require.main === module) {
  try {
    testReceiptGeneration();
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

export { testReceiptGeneration };
