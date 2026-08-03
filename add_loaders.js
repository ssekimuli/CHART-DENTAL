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

let successCount = 0;
let failCount = 0;

for (let relPath of files) {
  let fullPath = path.join('C:/Users/sseki/Documents/CHART-DENTAL', relPath);
  if (!fs.existsSync(fullPath)) continue;
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  if (content.includes('const [isSubmitting') || content.includes('disabled={isSubmitting}')) {
    console.log(`[SKIP] ${relPath} already has isSubmitting.`);
    continue;
  }

  let original = content;

  // 1. Add Loader2
  if (!content.includes('Loader2')) {
    if (content.includes('lucide-react"')) {
      content = content.replace(/import\s+\{([^}]+)\}\s+from\s+"lucide-react";/, (match, p1) => {
        return `import { ${p1.trim()}, Loader2 } from "lucide-react";`;
      });
    } else {
      content = `import { Loader2 } from "lucide-react";\n` + content;
    }
  }

  // 2. Add useState if missing
  if (!content.includes('useState')) {
    if (content.includes('from "react"')) {
        content = content.replace(/import\s+\{([^}]+)\}\s+from\s+"react";/, (match, p1) => {
            return `import { ${p1.trim()}, useState } from "react";`;
        });
    } else {
        content = `import { useState } from "react";\n` + content;
    }
  }

  // 3. Inject isSubmitting
  content = content.replace(/(export\s+(?:default\s+)?function\s+[A-Za-z0-9_]+\s*\([^)]*\)\s*\{)/, "$1\n  const [isSubmitting, setIsSubmitting] = useState(false);\n");
  
  // 4. Update onSubmit
  const onSubmitRegex = /(?:async\s+)?function\s+(?:onSubmit|handleSubmit)\s*\([^)]*\)\s*\{/;
  const match = content.match(onSubmitRegex);
  if (match) {
      let startIndex = match.index + match[0].length;
      let openBraces = 1;
      let endIndex = -1;
      for (let i = startIndex; i < content.length; i++) {
          if (content[i] === '{') openBraces++;
          if (content[i] === '}') openBraces--;
          if (openBraces === 0) {
              endIndex = i;
              break;
          }
      }
      
      if (endIndex !== -1) {
          let oldFunc = content.substring(match.index, endIndex + 1);
          let newFunc = oldFunc.replace(/(?:async\s+)?function\s+(onSubmit|handleSubmit)\s*\(([^)]*)\)\s*\{/, "async function $1($2) {\n    setIsSubmitting(true);\n    try {");
          newFunc = newFunc.substring(0, newFunc.length - 1) + "    } finally {\n      setIsSubmitting(false);\n    }\n  }";
          content = content.replace(oldFunc, newFunc);
      }
  }

  // 5. Update Button
  // We need to match <Button ... type="submit" ...> or <Button type="submit" ...>
  // Sometimes type is single quoted.
  content = content.replace(/<Button([^>]*)type=(['"])submit\2([^>]*)>(.*?)<\/Button>/gs, (match, p1, p2, p3, p4) => {
      let attrs = p1 + p3;
      let newAttrs = attrs;
      if (attrs.includes('disabled={')) {
          newAttrs = attrs.replace(/disabled=\{([^}]+)\}/, "disabled={$1 || isSubmitting}");
      } else {
          newAttrs += ' disabled={isSubmitting}';
      }
      return `<Button type="submit"${newAttrs}>\n        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}\n        ${p4.trim()}\n      </Button>`;
  });
  
  if (original !== content) {
      fs.writeFileSync(fullPath, content);
      console.log(`[DONE] ${relPath}`);
      successCount++;
  } else {
      console.log(`[FAIL] ${relPath} (no changes made)`);
      failCount++;
  }
}
console.log(`Success: ${successCount}, Fail: ${failCount}`);
