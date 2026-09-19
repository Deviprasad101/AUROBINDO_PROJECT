/**
 * Configuration and State Management
 */

// Configuration mapping columns
const CONFIG = {
    file1: {
        id: "file1",
        dateColumn: "Month",
        categoryColumn: "Unit Name",
        valueColumn: "Total Value",
        unitsColumn: "Total Unts",
        sourceName: "File 1 Data"
    }
};

// Global App State
const AppState = {
    file1Data: null, // Raw JSON from File 1
    processedData: [], // Combined and standardized data
    availableMonths: [], // List of unique "YYYY-MM"
    availableUnits: [], // List of unique tab names
    selectedYear: "", // Currently selected year
    selectedMonthOnly: "", // Currently selected month
    selectedUnit: "", // Currently selected tab filter
    charts: {} // Store chart instances
};

// Expose globally
window.CONFIG = CONFIG;
window.AppState = AppState;
