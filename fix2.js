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
    c = c.replace(/^import \{ getCurrentUser \} from '.*?';\n/g, ''); 
    if (c.includes('getCurrentUser()')) { 
        c = c.replace(/import\s*\{([^}]*)\}\s*from\s*['"]@\/lib\/user['"]/g, 'import { $1, getCurrentUser } from "@/lib/user"'); 
        c = c.replace(/import\s*\{([^}]*)\}\s*from\s*['"]\.\/user['"]/g, 'import { $1, getCurrentUser } from "./user"'); 
    } 
    fs.writeFileSync(f, c); 
});
console.log('Fixed2');
