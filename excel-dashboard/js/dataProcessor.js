/**
 * Data Processor Module
 * Handles merging, filtering, and aggregating the JSON data
 */
const DataProcessor = {
    /**
     * Process both loaded files into a unified format
     */
    processData: function() {
        const unifiedData = [];
        const availableMonthsSet = new Set();
        const availableUnitsSet = new Set();
        
        // Helper to flexibly find keys (handles newlines, extra spaces, etc. across tabs)
        const getFlexibleValue = (row, configKey) => {
            if (!configKey) return undefined;
            const target = configKey.toLowerCase().replace(/[\s\n\r]/g, '');
            for (let key in row) {
                const normalizedKey = key.toLowerCase().replace(/[\s\n\r]/g, '');
                if (normalizedKey.includes(target) || target.includes(normalizedKey)) {
                    return row[key];
                }
            }
            return undefined;
        };
        
        // Process File 1 (FDF)
        if (AppState.file1Data) {
            AppState.file1Data.forEach(row => {
                const dateVal = getFlexibleValue(row, CONFIG.file1.dateColumn);
                if (!dateVal) return; // Skip empty rows
                
                const { monthYear, isValid } = this.parseDateToMonthYear(dateVal);
                if (isValid) {
                    availableMonthsSet.add(monthYear);
                    const unitName = row._sheetName || 'Unknown';
                    availableUnitsSet.add(unitName);
                    
                    unifiedData.push({
                        _rawDate: dateVal,
                        monthYear: monthYear,
                        unitName: unitName,
                        category: getFlexibleValue(row, CONFIG.file1.categoryColumn) || 'Unknown',
                        value: parseFloat(getFlexibleValue(row, CONFIG.file1.valueColumn)) || 0,
                        units: parseFloat(getFlexibleValue(row, CONFIG.file1.unitsColumn)) || 0,
                        source: CONFIG.file1.sourceName,
                        originalRow: row
                    });
                }
            });
        }
        
        AppState.processedData = unifiedData;
        
        // Sort months chronologically
        AppState.availableMonths = Array.from(availableMonthsSet).sort((a, b) => {
            return new Date(a) - new Date(b);
        });
        
        // Sort units alphabetically
        AppState.availableUnits = Array.from(availableUnitsSet).sort();
    },
    
    /**
     * Parses various date formats into YYYY-MM
     * @param {any} dateVal 
     * @returns {Object} { monthYear: 'YYYY-MM', isValid: boolean }
     */
    parseDateToMonthYear: function(dateVal) {
        try {
            let dateObj;
            
            if (dateVal instanceof Date) {
                dateObj = dateVal;
            } else if (typeof dateVal === 'number') {
                // Excel serial date (days since Dec 30, 1899)
                dateObj = new Date(Math.round((dateVal - 25569) * 86400 * 1000));
            } else if (typeof dateVal === 'string') {
                // Try parsing string
                // Example: 'Apr-26', '04-2026', '2026-04-01'
                
                // Handle MMM-YY or MMM-YYYY
                const parts = dateVal.split('-');
                if (parts.length >= 2) {
                    // Try letting Date constructor handle it
                    dateObj = new Date(dateVal);
                    if (isNaN(dateObj.getTime())) {
                        // Fallback: prepending '1 ' to make it '1 Apr 2026'
                        dateObj = new Date(`1 ${dateVal}`);
                    }
                } else {
                    dateObj = new Date(dateVal);
                }
            }
            
            if (dateObj && !isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                
                // Extra check for years like "26" parsed as 1926 or 2026
                const finalYear = year < 100 ? year + 2000 : year;
                
                return { 
                    monthYear: `${finalYear}-${month}`, 
                    isValid: true 
                };
            }
        } catch (e) {
            console.warn("Could not parse date:", dateVal);
        }
        
        return { monthYear: '', isValid: false };
    },
    
    /**
     * Get data filtered by year, month and unit
     */
    getFilteredData: function(year = "", month = "", unit = "") {
        return AppState.processedData.filter(row => {
            const rowYear = row.monthYear.split('-')[0];
            const rowMonth = row.monthYear.split('-')[1];
            
            const matchYear = (year === "" || year === "all") ? true : rowYear === year;
            const matchMonth = (month === "" || month === "all") ? true : rowMonth === month;
            const matchUnit = unit === "" || row.unitName === unit;
            
            return matchYear && matchMonth && matchUnit;
        });
    },
    
    /**
     * Calculate KPIs for given data
     */
    calculateKPIs: function(data) {
        if (!data || data.length === 0) {
            return {
                totalRecords: 0,
                totalValue: 0,
                avgValue: 0,
                totalUnits: 0
            };
        }
        
        let totalValue = 0;
        let totalUnits = 0;
        
        data.forEach(row => {
            totalValue += row.value || 0;
            totalUnits += row.units || 0;
        });
        
        return {
            totalRecords: data.length,
            totalValue: totalValue,
            avgValue: totalValue / data.length,
            totalUnits: totalUnits
        };
    },
    
    /**
     * Aggregate data for charts
     */
    getChartData: function(filteredData) {
        // 1. Category Distribution (Pie) based on Units
        const sourceDist = {};
        
        filteredData.forEach(row => {
            // Category Dist
            sourceDist[row.category] = (sourceDist[row.category] || 0) + (row.units || 0);
        });
        
        // 2. Monthly Trend (Filtered months) - Bar Chart (Values)
        const monthlyTrend = {};
        filteredData.forEach(row => {
            if (!monthlyTrend[row.monthYear]) {
                monthlyTrend[row.monthYear] = 0;
            }
            monthlyTrend[row.monthYear] += (row.value || 0);
        });
        
        return {
            sourceDist,
            monthlyTrend
        };
    },
    
    /**
     * Format numbers to Indian Locale
     */
    formatCurrency: function(num) {
        return new Intl.NumberFormat('en-IN', {
            maximumFractionDigits: 0
        }).format(num);
    },
    
    formatMonthName: function(monthYear) {
        if (!monthYear) return "";
        const [year, month] = monthYear.split('-');
        const date = new Date(year, parseInt(month) - 1, 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
};

window.DataProcessor = DataProcessor;
