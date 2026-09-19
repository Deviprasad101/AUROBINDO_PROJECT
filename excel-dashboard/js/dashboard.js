/**
 * Dashboard Module
 * Handles UI interactions, DOM updates, and wiring up the events
 */
const Dashboard = {
    init: function() {
        this.cacheDOM();
        this.bindEvents();
    },
    
    cacheDOM: function() {
        this.file1Input = document.getElementById('file1-input');
        this.file1Name = document.getElementById('file1-name');
        this.fileNameText = document.getElementById('file-name-text');
        this.file1Status = document.getElementById('file1-status');
        this.dropZone = document.getElementById('drop-zone');
        
        // Filters
        this.unitSelect = document.getElementById('unit-select');
        this.monthSelect = document.getElementById('month-select');
        this.yearSelect = document.getElementById('year-select');
        this.applyFilterBtn = document.getElementById('apply-filter-btn');
        this.applyFilterText = document.getElementById('apply-filter-text');
        this.resetFilterBtn = document.getElementById('reset-filter-btn');
        this.exportBtn = document.getElementById('export-btn');
        
        // Content
        this.dashboardContent = document.getElementById('dashboard-content');
        
        // KPIs
        this.kpiTotalRecords = document.getElementById('kpi-total-records');
        this.kpiTotalValue = document.getElementById('kpi-total-value');
        this.kpiAvgValue = document.getElementById('kpi-avg-value');
        this.kpiCategories = document.getElementById('kpi-categories');
        
        // Table
        this.dataTableBody = document.getElementById('data-table-body');
        this.tableEmptyState = document.getElementById('table-empty-state');
        this.tableSearch = document.getElementById('table-search');
    },
    
    bindEvents: function() {
        this.file1Input.addEventListener('change', (e) => {
            if (e.target.files.length) this.onFileUpload(e.target.files[0]);
        });
        
        // Drag and Drop
        if (this.dropZone) {
            ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                this.dropZone.addEventListener(eventName, this.preventDefaults, false);
            });
            
            ['dragenter', 'dragover'].forEach(eventName => {
                this.dropZone.addEventListener(eventName, () => this.dropZone.style.borderColor = 'var(--primary)', false);
            });
            
            ['dragleave', 'drop'].forEach(eventName => {
                this.dropZone.addEventListener(eventName, () => this.dropZone.style.borderColor = '', false);
            });
            
            this.dropZone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const file = dt.files[0];
                if (file) this.onFileUpload(file);
            }, false);
        }
        
        this.unitSelect.addEventListener('change', () => this.onFilterChange());
        this.monthSelect.addEventListener('change', () => this.onFilterChange());
        this.yearSelect.addEventListener('change', () => this.onFilterChange());
        
        this.applyFilterBtn.addEventListener('click', () => this.applyFilter());
        this.resetFilterBtn.addEventListener('click', () => this.resetFilters());
        
        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.tableSearch.addEventListener('input', (e) => this.handleSearch(e.target.value));
    },
    
    preventDefaults: function(e) {
        e.preventDefault();
        e.stopPropagation();
    },

    onFileUpload: async function(file) {
        if (!file) return;
        
        const nameEl = this.file1Name;
        const textEl = this.fileNameText;
        const statusEl = this.file1Status;
        
        nameEl.style.display = 'inline-flex';
        textEl.textContent = file.name;
        
        statusEl.innerHTML = `<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg> Reading Excel...`;
        statusEl.className = "upload-status show loading";
        
        const result = await ExcelReader.handleFile1Upload(file);
            
        if (result.success) {
            statusEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Success! (${result.rows} rows)`;
            statusEl.className = "upload-status show success";
            
            if (AppState.file1Data) {
                this.initializeDashboard();
            }
        } else {
            statusEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> ${result.message}`;
            statusEl.className = "upload-status show error";
        }
    },
    
    initializeDashboard: function() {
        // Process data
        DataProcessor.processData();
        
        if (AppState.processedData.length === 0) {
            alert("No valid dates found in the uploaded files based on the configuration.");
            return;
        }
        
        // Populate Filters
        this.populateFilters();
        
        // Enable Filters
        this.unitSelect.disabled = false;
        this.monthSelect.disabled = false;
        this.yearSelect.disabled = false;
        this.applyFilterBtn.disabled = false;
        this.resetFilterBtn.disabled = false;
        this.exportBtn.disabled = false;
        
        // Show Content
        this.dashboardContent.classList.remove('hidden');
        
        // Select latest month by default
        if (AppState.availableMonths.length > 0) {
            const latest = AppState.availableMonths[AppState.availableMonths.length - 1];
            const [year, month] = latest.split('-');
            
            AppState.selectedYear = year;
            AppState.selectedMonthOnly = month;
            AppState.selectedUnit = "";
            
            // Set dropdowns
            this.yearSelect.value = year;
            this.monthSelect.value = month;
            this.unitSelect.value = "";
            
            this.updateDashboardView(year, month, "");
        }
    },
    
    populateFilters: function() {
        const years = new Set();
        const months = new Set();
        
        AppState.availableMonths.forEach(my => {
            const [year, month] = my.split('-');
            years.add(year);
            months.add(month);
        });
        
        // Populate Year
        this.yearSelect.innerHTML = '<option value="">All Years</option>';
        Array.from(years).sort().reverse().forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            this.yearSelect.appendChild(opt);
        });
        
        // Populate Month
        this.monthSelect.innerHTML = '<option value="">All Months</option>';
        const monthNames = ["January", "February", "March", "April", "May", "June", 
                            "July", "August", "September", "October", "November", "December"];
        Array.from(months).sort().forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = monthNames[parseInt(m) - 1];
            this.monthSelect.appendChild(opt);
        });
        
        // Populate Units
        this.unitSelect.innerHTML = '<option value="">All Units</option>';
        AppState.availableUnits.forEach(u => {
            const opt = document.createElement('option');
            opt.value = u;
            opt.textContent = u;
            this.unitSelect.appendChild(opt);
        });
    },
    
    onFilterChange: function() {
        const year = this.yearSelect.value;
        const month = this.monthSelect.value;
        
        if (year && month) {
            const targetMonth = `${year}-${month}`;
            if (AppState.availableMonths.includes(targetMonth)) {
                // valid combo
            } else {
                console.warn("Selected month/year has no data.");
            }
        }
    },
    
    applyFilter: function() {
        const year = this.yearSelect.value;
        const month = this.monthSelect.value;
        const unit = this.unitSelect.value;
        
        AppState.selectedYear = year;
        AppState.selectedMonthOnly = month;
        AppState.selectedUnit = unit;
        
        // Visual loading state
        const originalText = this.applyFilterText.textContent;
        this.applyFilterText.textContent = "Applying...";
        this.applyFilterBtn.disabled = true;
        
        setTimeout(() => {
            this.updateDashboardView(year, month, unit);
            this.applyFilterText.textContent = originalText;
            this.applyFilterBtn.disabled = false;
        }, 150); // Give UI time to update
    },
    
    resetFilters: function() {
        if (AppState.availableMonths.length > 0) {
            const latest = AppState.availableMonths[AppState.availableMonths.length - 1];
            const [year, month] = latest.split('-');
            
            AppState.selectedYear = year;
            AppState.selectedMonthOnly = month;
            AppState.selectedUnit = "";
            
            this.yearSelect.value = year;
            this.monthSelect.value = month;
            this.unitSelect.value = "";
            
            this.updateDashboardView(year, month, "");
            this.tableSearch.value = "";
        }
    },
    
    updateDashboardView: function(year, month, unit = "") {
        // Filter Data
        const filteredData = DataProcessor.getFilteredData(year, month, unit);
        
        // Update KPIs
        const kpis = DataProcessor.calculateKPIs(filteredData);
        this.updateKPIs(kpis);
        
        // Update Table
        this.updateTable(filteredData);
        
        // Update Charts
        // We pass ALL data logic to the ChartManager so it can show trends too
        const chartData = DataProcessor.getChartData(filteredData);
        ChartManager.updateAllCharts(chartData);
    },
    
    animateValue: function(element, start, end, duration, formatter = val => val) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            // Ease out quad
            const easeProgress = progress * (2 - progress);
            const current = Math.floor(easeProgress * (end - start) + start);
            element.textContent = formatter(current);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            } else {
                element.textContent = formatter(end);
            }
        };
        window.requestAnimationFrame(step);
    },

    updateKPIs: function(kpis) {
        this.animateValue(this.kpiTotalRecords, 0, kpis.totalRecords, 800, val => val.toLocaleString('en-IN'));
        this.animateValue(this.kpiTotalValue, 0, kpis.totalValue, 1000, val => '₹' + DataProcessor.formatCurrency(val));
        this.animateValue(this.kpiAvgValue, 0, kpis.avgValue, 1000, val => '₹' + DataProcessor.formatCurrency(val));
        this.animateValue(this.kpiCategories, 0, kpis.totalUnits, 1000, val => DataProcessor.formatCurrency(val));
    },
    
    updateTable: function(data, searchTerm = "") {
        this.dataTableBody.innerHTML = '';
        
        let displayData = data;
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            displayData = data.filter(row => 
                (row.category || '').toLowerCase().includes(term) ||
                (row.source || '').toLowerCase().includes(term) ||
                (row.monthYear || '').toLowerCase().includes(term)
            );
        }
        
        if (displayData.length === 0) {
            this.tableEmptyState.classList.remove('hidden');
            this.dataTableBody.parentElement.style.display = 'none';
        } else {
            this.tableEmptyState.classList.add('hidden');
            this.dataTableBody.parentElement.style.display = 'table';
            
            displayData.forEach(row => {
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>${DataProcessor.formatMonthName(row.monthYear)}</td>
                    <td>${row.category}</td>
                    <td>${row.value > 0 ? '₹' + DataProcessor.formatCurrency(row.value) : '-'}</td>
                    <td>${DataProcessor.formatCurrency(row.units)}</td>
                `;
                
                this.dataTableBody.appendChild(tr);
            });
        }
    },
    
    handleSearch: function(term) {
        if (!AppState.selectedYear && !AppState.selectedMonthOnly && !AppState.selectedUnit && AppState.processedData.length === 0) return;
        const filteredData = DataProcessor.getFilteredData(AppState.selectedYear, AppState.selectedMonthOnly, AppState.selectedUnit);
        this.updateTable(filteredData, term);
    },
    
    exportToCSV: function() {
        const filteredData = DataProcessor.getFilteredData(AppState.selectedYear, AppState.selectedMonthOnly, AppState.selectedUnit);
        if (filteredData.length === 0) {
            alert("No data to export.");
            return;
        }
        
        // Add subtle loading state
        const originalHtml = this.exportBtn.innerHTML;
        this.exportBtn.innerHTML = "Exporting...";
        this.exportBtn.disabled = true;
        
        setTimeout(() => {
        
        // Create CSV Content
        const headers = ["Month", "Category/Unit", "Value (Rs.)", "Units (KWH)"];
        let csvContent = headers.join(",") + "\n";
        
        filteredData.forEach(row => {
            const rowData = [
                DataProcessor.formatMonthName(row.monthYear),
                `"${row.category}"`,
                row.value,
                row.units
            ];
            csvContent += rowData.join(",") + "\n";
        });
        
        // Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `dashboard_export_${AppState.selectedMonthOnly || 'all'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Reset export button
        setTimeout(() => {
            this.exportBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Exported!`;
            setTimeout(() => {
                this.exportBtn.innerHTML = originalHtml;
                this.exportBtn.disabled = false;
            }, 2000);
        }, 300);
        
        }, 100);
    }
};

window.Dashboard = Dashboard;

// Initialize the dashboard when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
    
    // Check if ChartManager needs initialization
    if (window.ChartManager && typeof ChartManager.init === 'function') {
        ChartManager.init();
    }
});
