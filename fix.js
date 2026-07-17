const fs = require('fs'); 
const files = [
    'src/app/(dashboard)/appointments/page.tsx', 
    'src/app/(dashboard)/billing/page.tsx', 
    'src/app/(dashboard)/charting/page.tsx', 
    'src/app/(dashboard)/employees/page.tsx', 
    'src/app/(dashboard)/laboratory/page.tsx', 
    'src/app/(dashboard)/patients/page.tsx', 
    'src/app/(dashboard)/payroll/page.tsx', 
    'src/app/(dashboard)/queue/page.tsx', 
    'src/lib/api.ts'
]; 
files.forEach(f => { 
    let c = fs.readFileSync(f, 'utf8'); 
    c = c.replace(/currentUser\./g, 'getCurrentUser()?.');
    c = c.replace(/currentUser\?/g, 'getCurrentUser()?');
    c = c.replace(/currentUser,/g, 'getCurrentUser,');
    
    // Make sure getCurrentUser is imported
    if (c.includes("import {") && c.includes("@/lib/user") && !c.includes("getCurrentUser")) {
        c = c.replace(/import\s*\{([^}]*)\}\s*from\s*['"]@\/lib\/user['"];?/, "import { $1, getCurrentUser } from '@/lib/user';");
    }
    fs.writeFileSync(f, c); 
});
console.log('Fixed');
