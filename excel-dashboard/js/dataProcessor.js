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
                                const categoryName = key.replace(/units?\s*/i, '').trim();
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
                                        'cmd_kva': 0, 'rmd_kva': 0, 'eb_units_kvah': 0,
                                        'wheeling_css_as': 0, 'eb_value_total': 0,
                                        'oa_issued_iex': 0, 'oa_considered_iex': 0,
                                        'iex_value': 0, 'oa_unit_ltppa': 0,
                                        'ltppa_value': 0, 'solar_rooftop': 0,
                                        'dg_units': 0, 'total_units': unitValue,
                                        'total_value': 0, 'avg_rate': 0
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
                    availableMonthsSet.add(monthYear);
                    const unitName = row._sheetName || 'Unknown';
                    availableUnitsSet.add(unitName);
                    
                    const metricsObj = {
                        'cmd_kva': parseFloat(getFlexibleValue(row, 'CMD')) || 0,
                        'rmd_kva': parseFloat(getFlexibleValue(row, 'RMD')) || 0,
                        'eb_units_kvah': parseFloat(getFlexibleValue(row, 'EB Units')) || 0,
                        'wheeling_css_as': parseFloat(getFlexibleValue(row, 'Wheeling')) || 0,
                        'eb_value_total': parseFloat(getFlexibleValue(row, 'EB Value Total')) || 0,
                        'oa_issued_iex': parseFloat(getFlexibleValue(row, 'OA Issued')) || 0,
                        'oa_considered_iex': parseFloat(getFlexibleValue(row, 'OA Considered')) || 0,
                        'iex_value': parseFloat(getFlexibleValue(row, 'IEX-Value')) || 0,
                        'oa_unit_ltppa': parseFloat(getFlexibleValue(row, 'LTPPA (KWh)') || getFlexibleValue(row, 'OA Unit')) || 0,
                        'ltppa_value': parseFloat(getFlexibleValue(row, 'LTPPA-Value')) || 0,
                        'solar_rooftop': parseFloat(getFlexibleValue(row, 'Solar')) || 0,
                        'dg_units': parseFloat(getFlexibleValue(row, 'DG Units')) || 0,
                        'total_units': parseFloat(getFlexibleValue(row, 'Total Unts')) || 0,
                        'total_value': parseFloat(getFlexibleValue(row, 'Total Value')) || 0,
                        'avg_rate': parseFloat(getFlexibleValue(row, 'Avg. Rate')) || 0
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
    getFilteredData: function(year = "", month = "", unit = "") {
        return AppState.processedData.filter(row => {
            const rowYear = row.monthYear.split('-')[0];
            const rowMonth = row.monthYear.split('-')[1];
            
            const matchYear = (year === "" || year === "all") ? true : rowYear === year;
            const matchMonth = (month === "" || month === "all") ? true : rowMonth === month;
            const matchUnit = unit === "" || row.unitName === unit;
            const matchSource = row.unitName !== 'HT Power (Merged)';
            
            return matchYear && matchMonth && matchUnit && matchSource;
        });
    },
    
    /**
     * Get data explicitly filtered for Power Consumption Analysis Tab
     * (Merges "Unit-VII" from FDF Power and "HT Power (Merged)")
     */
    getPowerConsumptionData: function(year = "", month = "") {
        return AppState.processedData.filter(row => {
            const rowYear = row.monthYear.split('-')[0];
            const rowMonth = row.monthYear.split('-')[1];
            
            const matchYear = (year === "" || year === "all") ? true : rowYear === year;
            const matchMonth = (month === "" || month === "all") ? true : rowMonth === month;
            
            // Only include Unit VII or HT Power
            const matchSource = row.unitName.replace(/\s+/g, '').toLowerCase() === 'unit-vii' || 
                                row.unitName === 'HT Power (Merged)';
            
            return matchYear && matchMonth && matchSource;
        });
    },
    
    /**
     * Get data explicitly filtered for HT Power Analysis Tab
     * (Only "HT Power (Merged)")
     */
    getHTPowerData: function(year = "", month = "") {
        return AppState.processedData.filter(row => {
            const rowYear = row.monthYear.split('-')[0];
            const rowMonth = row.monthYear.split('-')[1];
            
            const matchYear = (year === "" || year === "all") ? true : rowYear === year;
            const matchMonth = (month === "" || month === "all") ? true : rowMonth === month;
            
            // Only HT Power
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
     * Aggregate data for charts
     */
    getChartData: function(filteredData, metricKey = 'total_units') {
        // 1. Category Distribution (Pie) based on metric
        const sourceDist = {};
        
        filteredData.forEach(row => {
            // Category Dist
            const metricVal = row.metrics ? (row.metrics[metricKey] || 0) : 0;
            sourceDist[row.category] = (sourceDist[row.category] || 0) + metricVal;
        });
        
        // 2. Monthly Trend (Filtered months) - Bar Chart (metric)
        const monthlyTrend = {};
        filteredData.forEach(row => {
            if (!monthlyTrend[row.monthYear]) {
                monthlyTrend[row.monthYear] = 0;
            }
            const metricVal = row.metrics ? (row.metrics[metricKey] || 0) : 0;
            monthlyTrend[row.monthYear] += metricVal;
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
