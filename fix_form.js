const fs = require('fs');

const file = 'C:/Users/sseki/Documents/CHART-DENTAL/src/app/(dashboard)/billing/components/invoice-form.tsx';
let content = fs.readFileSync(file, 'utf8');

// The block we want to replace starts with the discount field (inside grid-cols-1 md:grid-cols-3)
// Wait, currently in the file it starts with:
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                             <FormField
//                                 control={form.control}
//                                 name="discount"
// Actually let's just find the start: `<div className="grid grid-cols-1 md:grid-cols-3 gap-4">`
// And the end: just before `<div className={cn("flex justify-end space-x-2 pt-4"`

const startIndex = content.indexOf('<div className="grid grid-cols-1 md:grid-cols-3 gap-4">');
const endIndex = content.indexOf('<div className={cn("flex justify-end space-x-2 pt-4"');

if (startIndex !== -1 && endIndex !== -1) {
    let block = content.substring(startIndex, endIndex);

    // We will completely reconstruct this block.
    // It should be:
    // <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    //   [discount, tax, insuranceCoverage, status, paymentMethod, issueDate, dueDate]
    // </div>
    // <div className="rounded-md border p-4 space-y-2">
    //   [subtotals]
    // </div>

    // Let's extract each FormField by name.
    const extractField = (name) => {
        const regex = new RegExp(`(<FormField[\\s\\S]*?name="${name}"[\\s\\S]*?<\\/FormField>)`);
        const m = block.match(regex);
        return m ? m[1] : '';
    };

    const discount = extractField('discount');
    const tax = extractField('tax');
    const insuranceCoverage = extractField('insuranceCoverage');
    const status = extractField('status');
    const paymentMethod = extractField('paymentMethod');
    const issueDate = extractField('issueDate');
    const dueDate = extractField('dueDate');

    // Extract the subtotals block
    const subtotalsRegex = /(<div className="rounded-md border p-4 space-y-2">[\s\S]*?<\/div>\s*)<div className="grid grid-cols-2 gap-4">/;
    const subtotalsMatch = block.match(subtotalsRegex) || block.match(/(<div className="rounded-md border p-4 space-y-2">[\s\S]*?<\/div>\s*)</);
    let subtotals = '';
    
    // Manual extraction of subtotals
    const subStart = block.indexOf('<div className="rounded-md border p-4 space-y-2">');
    if (subStart !== -1) {
        // Find matching closing div for subtotals
        let divCount = 0;
        let subEnd = -1;
        const subStr = block.substring(subStart);
        const divRegex = /<\/?div[^>]*>/g;
        let m;
        while ((m = divRegex.exec(subStr)) !== null) {
            if (m[0].startsWith('</div')) {
                divCount--;
            } else if (m[0].startsWith('<div')) {
                divCount++;
            }
            if (divCount === 0) {
                subEnd = subStart + m.index + m[0].length;
                break;
            }
        }
        if (subEnd !== -1) {
            subtotals = block.substring(subStart, subEnd);
        }
    }

    const newBlock = `
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            ${discount}
                            ${tax}
                            ${insuranceCoverage}
                            ${status}
                            ${paymentMethod}
                            ${issueDate}
                            ${dueDate}
                        </div>
                        ${subtotals}
                        `;

    content = content.substring(0, startIndex) + newBlock + content.substring(endIndex);
    fs.writeFileSync(file, content);
    console.log("Fixed block");
} else {
    console.log("Could not find start or end index");
}
