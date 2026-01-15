
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const filename = '1-JAN-2026 POSITION copy.xlsx';

try {
    const workbook = XLSX.readFile(filename);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

    console.log('Sheet Name:', sheetName);
    console.log('Data Preview (first 20 rows):');
    data.slice(0, 20).forEach((row, i) => console.log(`${i}:`, JSON.stringify(row)));

    // Try to find specific keywords
    console.log('\nSearching for keywords...');
    data.forEach((row, i) => {
        const strInfo = JSON.stringify(row).toLowerCase();
        if (strInfo.includes('share') || strInfo.includes('gram') || strInfo.includes('coin') || strInfo.includes('cash') || strInfo.includes('total') || strInfo.includes('bitcoin') || strInfo.includes('gold') || strInfo.includes('bumi')) {
            console.log(`Row ${i}:`, JSON.stringify(row));
        }
    });

} catch (err) {
    console.error('Error reading file:', err);
}
