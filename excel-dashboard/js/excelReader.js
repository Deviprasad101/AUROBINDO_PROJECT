/**
 * Excel Reader Module
 * Handles file reading using SheetJS (XLSX)
 */
const ExcelReader = {
    /**
     * Reads an Excel file and returns its JSON representation
     * @param {File} file - The file object from input
     * @param {number} headerRowIndex - The index of the header row (0-based)
     * @returns {Promise<Array>} - Resolves with JSON array of the first sheet
     */
    readFile: function(file, headerRowIndex = 0) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function(e) {
                try {
                    const data = new Uint8Array(e.target.result);
                    // Read workbook
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    
                    // Read all worksheets
                    let allData = [];

                    workbook.SheetNames.forEach(sheetName => {
                        // Skip default/empty sheets like 'Sheet1'
                        if (sheetName.toLowerCase().startsWith('sheet')) return;
                        
                        const worksheet = workbook.Sheets[sheetName];
                        
                        // First pass: find the header row by looking for something matching 'Month' and 'Year'
                        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        let sheetHeaderRowIndex = 0;
                        for (let i = 0; i < Math.min(10, rawRows.length); i++) {
                            const row = rawRows[i] || [];
                            if (row.some(cell => {
                                if (typeof cell !== 'string') return false;
                                const normalized = cell.toLowerCase().replace(/[\s\n\r]/g, '');
                                return normalized.includes('month/year') || normalized.includes('month\\year');
                            })) {
                                sheetHeaderRowIndex = i;
                                break;
                            }
                        }
                        
                        let jsonOptions = { defval: null }; // fill empty cells with null
                        if (sheetHeaderRowIndex > 0) {
                            jsonOptions.range = sheetHeaderRowIndex;
                        }
                        
                        const sheetData = XLSX.utils.sheet_to_json(worksheet, jsonOptions);
                        
                        // Inject the sheet name into each row for potential use later
                        sheetData.forEach(row => {
                            row._sheetName = sheetName;
                            // Normalize keys to handle variations across tabs (spaces, newlines, case)
                            Object.keys(row).forEach(key => {
                                const normalizedKey = key.toLowerCase().replace(/[\s\n\r]/g, '');
                                if (!(normalizedKey in row)) {
                                    row[normalizedKey] = row[key];
                                }
                            });
                        });
                        
                        allData = allData.concat(sheetData);
                    });
                    
                    resolve(allData);
                } catch (error) {
                    console.error("Error reading Excel file:", error);
                    reject("Failed to parse the Excel file. Please ensure it's a valid .xlsx or .xls format.");
                }
            };

            reader.onerror = function(error) {
                reject("File read error occurred.");
            };

            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Handle file 1 upload
     */
    handleFile1Upload: async function(file) {
        try {
            // FDF Power file has headers on row 0
            const data = await this.readFile(file, 0);
            if (data.length === 0) throw new Error("File is empty or has no data rows.");
            
            AppState.file1Data = data;
            return { success: true, rows: data.length };
        } catch (error) {
            return { success: false, message: error.message || error };
        }
    }
};

// Expose globally
window.ExcelReader = ExcelReader;
