const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

global.window = global;
global.AppState = { processedData: [], availableMonths: [], availableUnits: [] };
global.CONFIG = { file1: { dateColumn: 'Month', categoryColumn: 'Unit Name', valueColumn: 'Total Value', unitsColumn: 'Total Unts', sourceName: 'File 1 Data' } };

const buf = fs.readFileSync('d:/MY PROJECTS/AUROBINDO_PROJECT/FDF Power.xlsx');
const workbook = XLSX.read(buf, { type: 'buffer', cellDates: true });
const worksheet = workbook.Sheets['U-XV'];

const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
let sheetHeaderRowIndex = 0;
for (let i = 0; i < Math.min(10, rawRows.length); i++) {
    const row = rawRows[i] || [];
    if (row.some(cell => {
        if (typeof cell !== 'string') return false;
        return cell.toLowerCase().replace(/[\s\n\r]/g, '').includes('month');
    })) {
        sheetHeaderRowIndex = i;
        break;
    }
}

let jsonOptions = { defval: null };
if (sheetHeaderRowIndex > 0) jsonOptions.range = sheetHeaderRowIndex;
const sheetData = XLSX.utils.sheet_to_json(worksheet, jsonOptions);

console.log('First 5 rows dates for U-XV:');
for(let i = 0; i < 5; i++) {
    console.log(sheetData[i].Month, ' -> IsDate:', sheetData[i].Month instanceof Date);
}

const dpCode = fs.readFileSync(path.join(__dirname, 'js/dataProcessor.js'), 'utf8');
eval(dpCode);

const parseRes = DataProcessor.parseDateToMonthYear(sheetData[3].Month);
console.log('Parsed result for row 3 (which should be April):', parseRes);

