const fs = require('fs');
let code = fs.readFileSync('src/lib/api.ts');
let clean = code.toString('utf8').replace(/\x00/g, '');

const lastExportIndex = clean.lastIndexOf('export const updatePatientAvatar');
if (lastExportIndex !== -1) {
    clean = clean.substring(0, lastExportIndex) + `export const updatePatientAvatar = async (patientId: string | number, file: File): Promise<{ avatar: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await customAxios.post(\`/patients/\${patientId}/avatar\`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};
`;
}
fs.writeFileSync('src/lib/api.ts', clean);
console.log('Cleaned and fixed api.ts');
