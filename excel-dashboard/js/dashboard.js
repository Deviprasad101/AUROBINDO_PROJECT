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
        // File 1
        this.file1Input = document.getElementById('file1-input');
        this.file1Name = document.getElementById('file1-name');
        this.file1Status = document.getElementById('file1-status');
        
        // Filters
        this.unitSelect = document.getElementById('unit-select');
        this.monthSelect = document.getElementById('month-select');
        this.yearSelect = document.getElementById('year-select');
        this.applyFilterBtn = document.getElementById('apply-filter-btn');
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
        this.file1Input.addEventListener('change', (e) => this.onFileUpload(e, 1));
        
        this.unitSelect.addEventListener('change', () => this.onFilterChange());
        this.monthSelect.addEventListener('change', () => this.onFilterChange());
        this.yearSelect.addEventListener('change', () => this.onFilterChange());
        
        this.applyFilterBtn.addEventListener('click', () => this.applyFilter());
        this.resetFilterBtn.addEventListener('click', () => this.resetFilters());
        
        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.tableSearch.addEventListener('input', (e) => this.handleSearch(e.target.value));
    },
    
    onFileUpload: async function(e, fileNum) {
        const file = e.target.files[0];
        if (!file) return;
        
        const nameEl = this.file1Name;
        const statusEl = this.file1Status;
        
        nameEl.textContent = file.name;
        statusEl.textContent = "Uploading & Reading...";
        statusEl.className = "upload-status";
        
        const result = await ExcelReader.handleFile1Upload(file);
            
        if (result.success) {
            statusEl.textContent = `Success! (${result.rows} rows detected)`;
            statusEl.className = "upload-status success";
            
            // Initialize Dashboard since we only need one file
            if (AppState.file1Data) {
                this.initializeDashboard();
            }
        } else {
            statusEl.textContent = `Error: ${result.message}`;
            statusEl.className = "upload-status error";
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
        
        this.updateDashboardView(year, month, unit);
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
    
    updateKPIs: function(kpis) {
        this.kpiTotalRecords.textContent = kpis.totalRecords.toLocaleString('en-IN');
        this.kpiTotalValue.textContent = `₹${DataProcessor.formatCurrency(kpis.totalValue)}`;
        this.kpiAvgValue.textContent = `₹${DataProcessor.formatCurrency(kpis.avgValue)}`;
        this.kpiCategories.textContent = DataProcessor.formatCurrency(kpis.totalUnits); // Repurposed for Units
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
        link.setAttribute("download", `dashboard_export_${AppState.selectedMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

window.Dashboard = Dashboard;
