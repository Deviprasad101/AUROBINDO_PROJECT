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
        
        // Process all loaded data (both FDF Power and HT Power)
        if (AppState.file1Data) {
            AppState.file1Data.forEach(row => {
                const fileName = (row._fileName || "").toLowerCase().replace(/[-_]/g, ' ');
                // Check filename OR check if it has the distinct HT columns (APL HC)
                const isHTPower = fileName.includes('ht power') || 
                                  (fileName.includes('ht') && fileName.includes('power')) || 
                                  Object.keys(row).some(k => k.toLowerCase().includes('apl hc'));
                
                // --- HT POWER FORMAT PARSING (Horizontal Columns) ---
                if (isHTPower) {
                    const dateVal = getFlexibleValue(row, 'month');
                    if (!dateVal) return; // Skip empty rows
                    
                    const { monthYear, isValid } = this.parseDateToMonthYear(dateVal);
                    if (isValid) {
                        availableMonthsSet.add(monthYear);
                        availableUnitsSet.add('HT Power (Merged)');
                        
                        // Extract all columns that start with 'UNITS' (e.g. 'UNITS APL HC-01')
                        Object.keys(row).forEach(key => {
                            if (key.toLowerCase().startsWith('units')) {
                                let categoryName = key.replace(/units?\s*/i, '').trim();
                                
                                // Clean up APL HC categories and STRICTLY whitelist only the two requested
                                const upperCat = categoryName.toUpperCase();
                                if (upperCat === 'APL HC-01' || upperCat === 'APL HC-1' || upperCat === 'APL HC - 01') {
                                    categoryName = 'APL HC-01';
                                } else if (upperCat === 'APL HC-03' || upperCat === 'APL HC-3' || upperCat === 'APL HC - 03') {
                                    categoryName = 'APL HC-03';
                                } else {
                                    return; // Skip 'aplh-01', 'aplhc-03', and any other garbage columns
                                }

                                const unitValue = parseFloat(row[key]) || 0;
                                // HT Power doesn't provide monetary value per unit, we store 0
                                unifiedData.push({
                                    _rawDate: dateVal,
                                    monthYear: monthYear,
                                    unitName: 'HT Power (Merged)',
                                    category: categoryName,
                                    value: 0,
                                    units: unitValue,
                                    metrics: {
                                        'UNITS APL HC-01': categoryName === 'APL HC-01' ? unitValue : 0,
                                        'UNITS APL HC-03': categoryName === 'APL HC-03' ? unitValue : 0
                                    },
                                    remarks: '',
                                    source: 'HT power consumption.xlsx',
                                    originalRow: row
                                });
                            }
                        });
                    }
                    return;
                }
                
                // --- STANDARD FORMAT PARSING (Vertical Rows like FDF Power) ---
                const dateVal = getFlexibleValue(row, CONFIG.file1.dateColumn);
                if (!dateVal) return; // Skip empty rows
                
                const { monthYear, isValid } = this.parseDateToMonthYear(dateVal);
                if (isValid) {
                    let unitName = row._sheetName || 'Unknown';
                    unitName = unitName.trim();
                    
                    // Normalize and filter APL HC units
                    if (unitName.toUpperCase().includes('APL HC')) {
                        if (unitName.includes('01') || unitName.includes('1')) {
                            unitName = 'UNITS APL HC-01';
                        } else if (unitName.includes('03') || unitName.includes('3')) {
                            unitName = 'UNITS APL HC-03';
                        } else {
                            // User requested to remove the remaining two APL HC units
                            return;
                        }
                    }
                    
                    availableMonthsSet.add(monthYear);
                    availableUnitsSet.add(unitName);
                    
                    const metricsObj = {
                        'CMD (KVA)': parseFloat(getFlexibleValue(row, 'CMD')) || 0,
                        'RMD (KVA)': parseFloat(getFlexibleValue(row, 'RMD')) || 0,
                        'EB Units (Kvah)': parseFloat(getFlexibleValue(row, 'EB Units')) || 0,
                        'OA Issued IEX (Kvah)': parseFloat(getFlexibleValue(row, 'OA Issued')) || 0,
                        'OA Considered IEX (Kvah)': parseFloat(getFlexibleValue(row, 'OA Considered')) || 0,
                        'IEX-Value (Rs.)': parseFloat(getFlexibleValue(row, 'IEX-Value')) || 0,
                        'Wheeling /CSS/AS': parseFloat(getFlexibleValue(row, 'Wheeling')) || 0,
                        'FSA/FPPCA/Other Charges': parseFloat(getFlexibleValue(row, 'FSA')) || parseFloat(getFlexibleValue(row, 'FPPCA')) || 0,
                        'EB Value Total (Rs.)': parseFloat(getFlexibleValue(row, 'EB Value Total')) || 0,
                        'Solar-Rooftop (Kvah)': parseFloat(getFlexibleValue(row, 'Solar')) || 0,
                        'DG Units (Kvah)': parseFloat(getFlexibleValue(row, 'DG Units')) || 0,
                        'Total Unts (Kvah)': parseFloat(getFlexibleValue(row, 'Total Unts')) || 0,
                        'EB & OA units (Kvah)': parseFloat(getFlexibleValue(row, 'EB & OA units')) || parseFloat(getFlexibleValue(row, 'EB & OA')) || 0,
                        'Total value (Rs.)': parseFloat(getFlexibleValue(row, 'Total value')) || parseFloat(getFlexibleValue(row, 'Total Value')) || 0,
                        'OA/ IEX Rate/Kwh': parseFloat(getFlexibleValue(row, 'OA/ IEX Rate')) || parseFloat(getFlexibleValue(row, 'OA/IEX')) || 0,
                        'Landed Rate/Kwh with FPPC (Rs.)': parseFloat(getFlexibleValue(row, 'Landed Rate/Kwh with FPPC')) || 0,
                        'Landed Rate/Kwh without FPPC (Rs.)': parseFloat(getFlexibleValue(row, 'Landed Rate/Kwh without FPPC')) || 0
                    };
                    
                    const remarksStr = getFlexibleValue(row, 'Remarks') || '';

                    unifiedData.push({
                        _rawDate: dateVal,
                        monthYear: monthYear,
                        unitName: unitName,
                        category: getFlexibleValue(row, CONFIG.file1.categoryColumn) || 'Unknown',
                        value: metricsObj.total_value,
                        units: metricsObj.total_units,
                        metrics: metricsObj,
                        remarks: remarksStr,
                        source: row._fileName || CONFIG.file1.sourceName,
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
                const parts = dateVal.trim().split(/[- \/\.,]+/);
                if (parts.length === 2) {
                    const p1 = parts[0];
                    const p2 = parts[1];
                    let month, year;
                    
                    if (isNaN(p1)) {
                        month = p1; // e.g. 'Apr'
                        year = parseInt(p2);
                    } else if (parseInt(p1) > 1000) {
                        year = parseInt(p1);
                        month = parseInt(p2); // e.g. 2023-04 -> month=4
                    } else if (isNaN(p2)) {
                        month = p2;
                        year = parseInt(p1);
                    } else {
                        month = parseInt(p1);
                        year = parseInt(p2);
                    }
                    
                    if (year < 100) year += 2000;
                    
                    if (typeof month === 'string' && isNaN(month)) {
                        dateObj = new Date(`1 ${month} ${year}`);
                    } else {
                        // month is a number (1-12)
                        dateObj = new Date(year, parseInt(month) - 1, 1);
                    }
                } else {
                    dateObj = new Date(dateVal);
                }
            }
            
            if (dateObj && !isNaN(dateObj.getTime())) {
                // Add 12 hours to push the date to noon, making it immune to timezone shifts
                // (e.g. midnight UTC becoming 8 PM the previous day in EST, or vice versa)
                const noonDate = new Date(dateObj.getTime() + (12 * 60 * 60 * 1000));
                
                const year = noonDate.getFullYear();
                const month = String(noonDate.getMonth() + 1).padStart(2, '0');
                
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
    getFilteredData: function(years = [], months = [], units = []) {
        return AppState.processedData.filter(row => {
            const rowYear = row.monthYear.split('-')[0];
            const rowMonth = row.monthYear.split('-')[1];
            
            const matchYear = years.includes("all") ? true : (years.length > 0 && years.includes(rowYear));
            const matchMonth = months.includes("all") ? true : (months.length > 0 && months.includes(rowMonth));
            const matchUnit = units.includes("all") ? true : (units.length > 0 && units.includes(row.unitName));
            const matchSource = row.unitName !== 'HT Power (Merged)';
            
            return matchYear && matchMonth && matchUnit && matchSource;
        });
    },
    

    
    /**
     * Get data explicitly filtered for HT Power Analysis Tab
     * (Only "HT Power (Merged)")
     */
    getHTPowerData: function(years = [], months = []) {
        return AppState.processedData.filter(row => {
            const rowYear = row.monthYear.split('-')[0];
            const rowMonth = row.monthYear.split('-')[1];
            
            const matchYear = years.includes("all") ? true : (years.length > 0 && years.includes(rowYear));
            const matchMonth = months.includes("all") ? true : (months.length > 0 && months.includes(rowMonth));
            
            // Only include HT Power
            const matchSource = row.unitName === 'HT Power (Merged)';
            
            return matchYear && matchMonth && matchSource;
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
        let maxValue = 0;
        let maxUnits = 0;
        
        const uniqueRows = new Set();
        
        data.forEach(row => {
            totalValue += row.value || 0;
            totalUnits += row.units || 0;
            if ((row.value || 0) > maxValue) maxValue = row.value;
            if ((row.units || 0) > maxUnits) maxUnits = row.units;
            
            if (row.originalRow) {
                uniqueRows.add(row.originalRow);
            }
        });
        
        const count = uniqueRows.size > 0 ? uniqueRows.size : data.length;
        
        return {
            totalRecords: count,
            totalValue: totalValue,
            avgValue: totalValue / data.length,
            totalUnits: totalUnits
        };
    },
    
    /**
     * Calculate detailed KPIs grouped by month for the dynamic grid
     */
    calculateDetailedKPIsByMonth: function(filteredData) {
        if (!filteredData || filteredData.length === 0) return {};
        
        const monthlyGroups = {};
        
        filteredData.forEach(row => {
            const groupKey = `${row.monthYear}|${row.unitName}`;
            
            if (!monthlyGroups[groupKey]) {
                monthlyGroups[groupKey] = {
                    'CMD (KVA)': 0,
                    'RMD (KVA)': 0,
                    'EB Units (Kvah)': 0,
                    'OA Issued IEX (Kvah)': 0,
                    'OA Considered IEX (Kvah)': 0,
                    'IEX-Value (Rs.)': 0,
                    'Wheeling /CSS/AS': 0,
                    'FSA/FPPCA/Other Charges': 0,
                    'EB Value Total (Rs.)': 0,
                    'Solar-Rooftop (Kvah)': 0,
                    'DG Units (Kvah)': 0,
                    'Total Unts (Kvah)': 0,
                    'EB & OA units (Kvah)': 0,
                    'Total value (Rs.)': 0,
                    'OA/ IEX Rate/Kwh': 0,
                    'Landed Rate/Kwh with FPPC (Rs.)': 0,
                    'Landed Rate/Kwh without FPPC (Rs.)': 0,
                    'UNITS APL HC-01': 0,
                    'UNITS APL HC-03': 0
                };
            }
            
            if (row.metrics) {
                for (const key in monthlyGroups[groupKey]) {
                    monthlyGroups[groupKey][key] += (row.metrics[key] || 0);
                }
            }
        });
        
        return monthlyGroups;
    },
    
    /**
     * Aggregate data for charts
     */
    getChartData: function(filteredData, metricKeys = ['total_units']) {
        // 1. Category Distribution (Pie) based on first metric
        const sourceDist = {};
        const primaryMetric = metricKeys[0];
        
        // 2. Monthly Trend (Filtered months) - Bar Chart (multiple metrics)
        const monthlyTrend = {};
        
        filteredData.forEach(row => {
            // Category Dist
            const pieVal = row.metrics ? (row.metrics[primaryMetric] || 0) : (row.units || 0);
            sourceDist[row.category] = (sourceDist[row.category] || 0) + pieVal;
            
            // Monthly Trend
            if (!monthlyTrend[row.monthYear]) {
                monthlyTrend[row.monthYear] = {};
                metricKeys.forEach(k => monthlyTrend[row.monthYear][k] = 0);
            }
            
            metricKeys.forEach(k => {
                const metricVal = row.metrics ? (row.metrics[k] || 0) : (row.units || 0);
                monthlyTrend[row.monthYear][k] += metricVal;
            });
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
