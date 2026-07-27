const fs = require('fs');
const path = require('path');

const files = [
  'src/app/(dashboard)/accounting/components/expense-form.tsx',
  'src/app/(dashboard)/appointments/components/appointment-form.tsx',
  'src/app/(dashboard)/billing/components/invoice-form.tsx',
  'src/app/(dashboard)/billing/components/payment-form.tsx',
  'src/app/(dashboard)/branches/components/branch-form.tsx',
  'src/app/(dashboard)/employees/components/employee-form.tsx',
  'src/app/(dashboard)/hrm/components/advance-form.tsx',
  'src/app/(dashboard)/hrm/components/attendance-form.tsx',
  'src/app/(dashboard)/hrm/components/employee-form.tsx',
  'src/app/(dashboard)/hrm/components/leave-request-form.tsx',
  'src/app/(dashboard)/hrm/components/mass-attendance-form.tsx',
  'src/app/(dashboard)/hrm/components/payroll-form.tsx',
  'src/app/(dashboard)/hrm/components/role-form.tsx',
  'src/app/(dashboard)/hrm/components/salary-form.tsx',
  'src/app/(dashboard)/inventory/components/item-form.tsx',
  'src/app/(dashboard)/laboratory/components/lab-order-form.tsx',
  'src/app/(dashboard)/patients/[id]/charting/components/endodontic-record-form.tsx',
  'src/app/(dashboard)/patients/[id]/charting/components/orthodontic-record-form.tsx',
  'src/app/(dashboard)/patients/[id]/charting/components/restorative-record-form.tsx',
  'src/app/(dashboard)/patients/[id]/components/treatment-plan-form.tsx',
  'src/app/(dashboard)/payroll/components/payroll-form.tsx'
];

for (let relPath of files) {
  let fullPath = path.join('C:/Users/sseki/Documents/CHART-DENTAL', relPath);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Find "use client"; (and variations)
  const useClientRegex = /^\s*(["']use client["'];?)\s*/m;
  const match = content.match(useClientRegex);
  
  if (match) {
      const index = match.index;
      const beforeStr = content.substring(0, index).trim();
      
      if (beforeStr.length > 0) {
          // Remove the match
          let newContent = content.substring(0, index) + content.substring(index + match[0].length);
          // Prepend
          newContent = '"use client";\n\n' + newContent.trimStart();
          fs.writeFileSync(fullPath, newContent);
          console.log(`[FIXED] ${relPath}`);
      }
  }
}
