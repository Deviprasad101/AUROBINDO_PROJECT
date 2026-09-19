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
        
        // Tabs
        this.tabNavigation = document.getElementById('tab-navigation');
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.dashboardContent = document.getElementById('dashboard-content');
        this.powerDashboardContent = document.getElementById('power-dashboard-content');
        this.htDashboardContent = document.getElementById('ht-dashboard-content');
        
        // Filters
        this.unitSelect = document.getElementById('unit-select');
        this.monthSelect = document.getElementById('month-select');
        this.yearSelect = document.getElementById('year-select');
        this.applyFilterBtn = document.getElementById('apply-filter-btn');
        this.applyFilterText = document.getElementById('apply-filter-text');
        this.resetFilterBtn = document.getElementById('reset-filter-btn');
        this.exportBtn = document.getElementById('export-btn');
        
        // Power Filters (Tab 2)
        this.powerMonthSelect = document.getElementById('power-month-select');
        this.powerYearSelect = document.getElementById('power-year-select');
        this.powerApplyFilterBtn = document.getElementById('power-apply-filter-btn');
        this.powerApplyFilterText = document.getElementById('power-apply-filter-text');
        this.powerResetFilterBtn = document.getElementById('power-reset-filter-btn');
        
        // HT Filters (Tab 3)
        this.htMonthSelect = document.getElementById('ht-month-select');
        this.htYearSelect = document.getElementById('ht-year-select');
        this.htApplyFilterBtn = document.getElementById('ht-apply-filter-btn');
        this.htApplyFilterText = document.getElementById('ht-apply-filter-text');
        this.htResetFilterBtn = document.getElementById('ht-reset-filter-btn');
        
        // Content
        // (Handled above in Tabs)
        
        // KPIs
        this.kpiTotalRecords = document.getElementById('kpi-total-records');
        this.kpiTotalValue = document.getElementById('kpi-total-value');
        this.kpiAvgValue = document.getElementById('kpi-avg-value');
        this.kpiCategories = document.getElementById('kpi-categories');
        
        // Table
        this.dataTableBody = document.getElementById('data-table-body');
        this.tableEmptyState = document.getElementById('table-empty-state');
        this.tableSearch = document.getElementById('table-search');
        
        // Power Specific DOM
        this.powerDataTableBody = document.getElementById('power-data-table-body');
        this.powerTableEmptyState = document.getElementById('power-table-empty-state');
        this.powerTableSearch = document.getElementById('power-table-search');
        
        this.kpiPowerTotalRecords = document.getElementById('kpi-power-total-records');
        this.kpiPowerTotalValue = document.getElementById('kpi-power-total-value');
        this.kpiPowerAvgValue = document.getElementById('kpi-power-avg-value');
        this.kpiPowerCategories = document.getElementById('kpi-power-categories');
        
        // HT Specific DOM
        this.htDataTableBody = document.getElementById('ht-data-table-body');
        this.htTableEmptyState = document.getElementById('ht-table-empty-state');
        this.htTableSearch = document.getElementById('ht-table-search');
        // HT KPIs
        this.kpiHtTotalRecords = document.getElementById('kpi-ht-total-records');
        this.kpiHtAvgUnits = document.getElementById('kpi-ht-avg-units');
        this.kpiHtMaxUnits = document.getElementById('kpi-ht-max-units');
        this.kpiHtTotalUnits = document.getElementById('kpi-ht-total-units');
    },
    
    bindEvents: function() {
        this.file1Input.addEventListener('change', (e) => {
            if (e.target.files.length) this.onFileUpload(Array.from(e.target.files));
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
                if (dt.files && dt.files.length > 0) {
                    this.onFileUpload(Array.from(dt.files));
                }
            }, false);
        }
        
        this.unitSelect.addEventListener('change', () => this.onFilterChange());
        this.monthSelect.addEventListener('change', () => this.onFilterChange());
        this.yearSelect.addEventListener('change', () => this.onFilterChange());
        
        this.applyFilterBtn.addEventListener('click', () => this.applyFilter());
        this.resetFilterBtn.addEventListener('click', () => this.resetFilters());
        
        this.powerMonthSelect.addEventListener('change', () => this.onPowerFilterChange());
        this.powerYearSelect.addEventListener('change', () => this.onPowerFilterChange());
        this.powerApplyFilterBtn.addEventListener('click', () => this.applyPowerFilter());
        this.powerResetFilterBtn.addEventListener('click', () => this.resetPowerFilters());
        
        this.htMonthSelect.addEventListener('change', () => this.onHtFilterChange());
        this.htYearSelect.addEventListener('change', () => this.onHtFilterChange());
        this.htApplyFilterBtn.addEventListener('click', () => this.applyHtFilter());
        this.htResetFilterBtn.addEventListener('click', () => this.resetHtFilters());
        
        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.tableSearch.addEventListener('input', (e) => this.handleSearch(e.target.value));
        this.powerTableSearch.addEventListener('input', (e) => this.handlePowerSearch(e.target.value));
        this.htTableSearch.addEventListener('input', (e) => this.handleHtSearch(e.target.value));
        
        // Tab switching
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active from all
                this.tabBtns.forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
                
                // Add active to current
                btn.classList.add('active');
                const target = document.getElementById(btn.dataset.target);
                if (target) {
                    target.classList.add('active');
                    target.classList.remove('hidden');
                }
            });
        });
    },
    
    preventDefaults: function(e) {
        e.preventDefault();
        e.stopPropagation();
    },

    onFileUpload: async function(files) {
        if (!files || files.length === 0) return;
        
        const nameEl = this.file1Name;
        const textEl = this.fileNameText;
        const statusEl = this.file1Status;
        
        nameEl.style.display = 'inline-flex';
        textEl.textContent = files.length > 1 ? `${files.length} files selected` : files[0].name;
        
        statusEl.innerHTML = `<svg class="spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg> Reading Excel...`;
        statusEl.className = "upload-status show loading";
        
        const result = await ExcelReader.handleFile1Upload(files);
            
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
        
        this.powerMonthSelect.disabled = false;
        this.powerYearSelect.disabled = false;
        this.powerApplyFilterBtn.disabled = false;
        this.powerResetFilterBtn.disabled = false;
        
        this.htMonthSelect.disabled = false;
        this.htYearSelect.disabled = false;
        this.htApplyFilterBtn.disabled = false;
        this.htResetFilterBtn.disabled = false;
        
        // Show Content and Tabs
        this.tabNavigation.classList.remove('hidden');
        
        // Only remove hidden from the active pane
        const activeTabBtn = document.querySelector('.tab-btn.active');
        if (activeTabBtn) {
            const activePane = document.getElementById(activeTabBtn.dataset.target);
            if (activePane) activePane.classList.remove('hidden');
        }
        
        // Select latest month by default
        if (AppState.availableMonths.length > 0) {
            const latest = AppState.availableMonths[AppState.availableMonths.length - 1];
            const [year, month] = latest.split('-');
            
            AppState.selectedYear = year;
            AppState.selectedMonthOnly = month;
            AppState.selectedUnit = "";
            
            AppState.powerSelectedYear = year;
            AppState.powerSelectedMonthOnly = month;
            
            AppState.htSelectedYear = year;
            AppState.htSelectedMonthOnly = month;
            
            // Set dropdowns
            this.yearSelect.value = year;
            this.monthSelect.value = month;
            this.unitSelect.value = "";
            
            this.powerYearSelect.value = year;
            this.powerMonthSelect.value = month;
            
            this.htYearSelect.value = year;
            this.htMonthSelect.value = month;
            
            this.updateDashboardView(year, month, "");
            this.updatePowerDashboardView(year, month);
            this.updateHTDashboardView(year, month);
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
        this.powerYearSelect.innerHTML = '<option value="">All Years</option>';
        this.htYearSelect.innerHTML = '<option value="">All Years</option>';
        Array.from(years).sort().reverse().forEach(y => {
            const opt = document.createElement('option');
            opt.value = y;
            opt.textContent = y;
            this.yearSelect.appendChild(opt);
            
            const pOpt = document.createElement('option');
            pOpt.value = y;
            pOpt.textContent = y;
            this.powerYearSelect.appendChild(pOpt);
            
            const hOpt = document.createElement('option');
            hOpt.value = y;
            hOpt.textContent = y;
            this.htYearSelect.appendChild(hOpt);
        });
        
        // Populate Month
        this.monthSelect.innerHTML = '<option value="">All Months</option>';
        this.powerMonthSelect.innerHTML = '<option value="">All Months</option>';
        this.htMonthSelect.innerHTML = '<option value="">All Months</option>';
        const monthNames = ["January", "February", "March", "April", "May", "June", 
                            "July", "August", "September", "October", "November", "December"];
        Array.from(months).sort().forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = monthNames[parseInt(m) - 1];
            this.monthSelect.appendChild(opt);
            
            const pOpt = document.createElement('option');
            pOpt.value = m;
            pOpt.textContent = monthNames[parseInt(m) - 1];
            this.powerMonthSelect.appendChild(pOpt);
            
            const hOpt = document.createElement('option');
            hOpt.value = m;
            hOpt.textContent = monthNames[parseInt(m) - 1];
            this.htMonthSelect.appendChild(hOpt);
        });
        
        // Populate Unit
        this.unitSelect.innerHTML = '<option value="">All Units</option>';
        Array.from(AppState.availableUnits)
            .filter(u => u !== 'HT Power (Merged)')
            .sort().forEach(u => {
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
        this.updateTable(filteredData, this.dataTableBody, this.tableEmptyState);
        
        // Update Charts
        const chartData = DataProcessor.getChartData(filteredData);
        
        if (Object.keys(chartData.monthlyTrend).length > 0) {
            ChartManager.createMonthlyTrendChart(chartData.monthlyTrend, 'chart-monthly-trend', 'monthlyTrend');
        }
        
        const pieCard = document.getElementById('pie-chart-card');
        if (Object.keys(chartData.sourceDist).length > 0 && !AppState.selectedUnit) {
            pieCard.style.display = 'block';
            ChartManager.createCategoryDistChart(chartData.sourceDist, 'chart-category-dist', 'categoryDist');
            pieCard.parentElement.style.gridTemplateColumns = '2fr 1fr';
        } else {
            pieCard.style.display = 'none';
            pieCard.parentElement.style.gridTemplateColumns = '1fr';
        }
    },
    
    // --- POWER DASHBOARD LOGIC ---
    
    onPowerFilterChange: function() {
        // Only validation, handled in apply
    },
    
    applyPowerFilter: function() {
        const year = this.powerYearSelect.value;
        const month = this.powerMonthSelect.value;
        
        AppState.powerSelectedYear = year;
        AppState.powerSelectedMonthOnly = month;
        
        const originalText = this.powerApplyFilterText.textContent;
        this.powerApplyFilterText.textContent = "Applying...";
        this.powerApplyFilterBtn.disabled = true;
        
        setTimeout(() => {
            this.updatePowerDashboardView(year, month);
            this.powerApplyFilterText.textContent = originalText;
            this.powerApplyFilterBtn.disabled = false;
        }, 150);
    },
    
    resetPowerFilters: function() {
        if (AppState.availableMonths.length > 0) {
            const latest = AppState.availableMonths[AppState.availableMonths.length - 1];
            const [year, month] = latest.split('-');
            
            AppState.powerSelectedYear = year;
            AppState.powerSelectedMonthOnly = month;
            
            this.powerYearSelect.value = year;
            this.powerMonthSelect.value = month;
            
            this.updatePowerDashboardView(year, month);
            this.powerTableSearch.value = "";
        }
    },
    
    updatePowerDashboardView: function(year, month) {
        // Filter specific to Power Dashboard
        const filteredData = DataProcessor.getPowerConsumptionData(year, month);
        
        // Update KPIs
        const kpis = DataProcessor.calculateKPIs(filteredData);
        this.updatePowerKPIs(kpis);
        
        // Update Table
        this.updateTable(filteredData, this.powerDataTableBody, this.powerTableEmptyState);
        
        // Update Charts
        const chartData = DataProcessor.getChartData(filteredData);
        
        if (Object.keys(chartData.monthlyTrend).length > 0) {
            // Plot combined UNITS instead of Values
            const trendData = {};
            filteredData.forEach(row => {
                if (!trendData[row.monthYear]) trendData[row.monthYear] = 0;
                trendData[row.monthYear] += (row.units || 0);
            });
            ChartManager.createMonthlyTrendChart(trendData, 'chart-power-monthly-trend', 'powerMonthlyTrend', 'Total Units (KWH)');
        }
        
        const pieCard = document.getElementById('power-pie-chart-card');
        if (Object.keys(chartData.sourceDist).length > 0) {
            pieCard.style.display = 'block';
            ChartManager.createCategoryDistChart(chartData.sourceDist, 'chart-power-category-dist', 'powerCategoryDist', 'Total Units (KWH)');
            pieCard.parentElement.style.gridTemplateColumns = '2fr 1fr';
        } else {
            pieCard.style.display = 'none';
            pieCard.parentElement.style.gridTemplateColumns = '1fr';
        }
    },
    
    updatePowerKPIs: function(kpis) {
        this.animateValue(this.kpiPowerTotalRecords, 0, kpis.totalRecords, 800, val => val.toLocaleString('en-IN'));
        this.animateValue(this.kpiPowerTotalValue, 0, kpis.totalValue, 1000, val => '₹' + DataProcessor.formatCurrency(val));
        this.animateValue(this.kpiPowerAvgValue, 0, kpis.avgValue, 1000, val => '₹' + DataProcessor.formatCurrency(val));
        this.animateValue(this.kpiPowerCategories, 0, kpis.totalUnits, 1000, val => DataProcessor.formatCurrency(val));
    },
    
    // --- HT DASHBOARD LOGIC (Tab 3) ---
    
    onHtFilterChange: function() {},
    
    applyHtFilter: function() {
        const year = this.htYearSelect.value;
        const month = this.htMonthSelect.value;
        
        AppState.htSelectedYear = year;
        AppState.htSelectedMonthOnly = month;
        
        const originalText = this.htApplyFilterText.textContent;
        this.htApplyFilterText.textContent = "Applying...";
        this.htApplyFilterBtn.disabled = true;
        
        setTimeout(() => {
            this.updateHTDashboardView(year, month);
            this.htApplyFilterText.textContent = originalText;
            this.htApplyFilterBtn.disabled = false;
        }, 150);
    },
    
    resetHtFilters: function() {
        if (AppState.availableMonths.length > 0) {
            const latest = AppState.availableMonths[AppState.availableMonths.length - 1];
            const [year, month] = latest.split('-');
            
            AppState.htSelectedYear = year;
            AppState.htSelectedMonthOnly = month;
            
            this.htYearSelect.value = year;
            this.htMonthSelect.value = month;
            
            this.updateHTDashboardView(year, month);
            this.htTableSearch.value = "";
        }
    },
    
    updateHTDashboardView: function(year, month) {
        const filteredData = DataProcessor.getHTPowerData(year, month);
        
        const kpis = DataProcessor.calculateKPIs(filteredData);
        
        let maxUnits = 0;
        let avgUnits = 0;
        if (filteredData.length > 0) {
            maxUnits = Math.max(...filteredData.map(r => r.units || 0));
            avgUnits = kpis.totalUnits / filteredData.length;
        }

        this.animateValue(this.kpiHtTotalRecords, 0, kpis.totalRecords, 800, val => val.toLocaleString('en-IN'));
        this.animateValue(this.kpiHtAvgUnits, 0, avgUnits, 1000, val => DataProcessor.formatCurrency(val));
        this.animateValue(this.kpiHtMaxUnits, 0, maxUnits, 1000, val => DataProcessor.formatCurrency(val));
        this.animateValue(this.kpiHtTotalUnits, 0, kpis.totalUnits, 1000, val => DataProcessor.formatCurrency(val));
        
        // Update HT Table
        this.htDataTableBody.innerHTML = '';
        if (filteredData.length === 0) {
            this.htTableEmptyState.classList.remove('hidden');
            this.htDataTableBody.parentElement.style.display = 'none';
        } else {
            this.htTableEmptyState.classList.add('hidden');
            this.htDataTableBody.parentElement.style.display = 'table';
            filteredData.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${DataProcessor.formatMonthName(row.monthYear)}</td>
                    <td>${row.source}</td>
                    <td>${row.category}</td>
                    <td>${DataProcessor.formatCurrency(row.units)}</td>
                `;
                this.htDataTableBody.appendChild(tr);
            });
        }
        
        const chartData = DataProcessor.getChartData(filteredData);
        
        if (Object.keys(chartData.monthlyTrend).length > 0) {
            // Re-use monthly trend but map to units instead of value (since value is 0 for HT)
            const trendData = {};
            filteredData.forEach(row => {
                if (!trendData[row.monthYear]) trendData[row.monthYear] = 0;
                trendData[row.monthYear] += (row.units || 0);
            });
            ChartManager.createMonthlyTrendChart(trendData, 'chart-ht-monthly-trend', 'htMonthlyTrend', 'Total Units (KWH)');
        }
        
        const pieCard = document.getElementById('ht-pie-chart-card');
        if (Object.keys(chartData.sourceDist).length > 0) {
            pieCard.style.display = 'block';
            ChartManager.createCategoryDistChart(chartData.sourceDist, 'chart-ht-category-dist', 'htCategoryDist', 'Total Units (KWH)');
            pieCard.parentElement.style.gridTemplateColumns = '2fr 1fr';
        } else {
            pieCard.style.display = 'none';
            pieCard.parentElement.style.gridTemplateColumns = '1fr';
        }
    },
    
    // ----------------------------
    
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
    
    updateTable: function(data, tbodyEl, emptyStateEl, searchTerm = "") {
        tbodyEl.innerHTML = '';
        
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
            emptyStateEl.classList.remove('hidden');
            tbodyEl.parentElement.style.display = 'none';
        } else {
            emptyStateEl.classList.add('hidden');
            tbodyEl.parentElement.style.display = 'table';
            
            displayData.forEach(row => {
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td>${DataProcessor.formatMonthName(row.monthYear)}</td>
                    <td>${row.category}</td>
                    <td>${row.value > 0 ? '₹' + DataProcessor.formatCurrency(row.value) : '-'}</td>
                    <td>${DataProcessor.formatCurrency(row.units)}</td>
                `;
                
                tbodyEl.appendChild(tr);
            });
        }
    },
    
    handleSearch: function(term) {
        if (!AppState.selectedYear && !AppState.selectedMonthOnly && !AppState.selectedUnit && AppState.processedData.length === 0) return;
        const filteredData = DataProcessor.getFilteredData(AppState.selectedYear, AppState.selectedMonthOnly, AppState.selectedUnit);
        this.updateTable(filteredData, this.dataTableBody, this.tableEmptyState, term);
    },
    
    handlePowerSearch: function(term) {
        if (!AppState.powerSelectedYear && !AppState.powerSelectedMonthOnly && AppState.processedData.length === 0) return;
        const filteredData = DataProcessor.getPowerConsumptionData(AppState.powerSelectedYear, AppState.powerSelectedMonthOnly);
        this.updateTable(filteredData, this.powerDataTableBody, this.powerTableEmptyState, term);
    },
    
    handleHtSearch: function(term) {
        if (!AppState.htSelectedYear && !AppState.htSelectedMonthOnly && AppState.processedData.length === 0) return;
        const filteredData = DataProcessor.getHTPowerData(AppState.htSelectedYear, AppState.htSelectedMonthOnly);
        
        let displayData = filteredData;
        if (term) {
            const t = term.toLowerCase();
            displayData = filteredData.filter(row => 
                (row.category || '').toLowerCase().includes(t) ||
                (row.source || '').toLowerCase().includes(t) ||
                (row.monthYear || '').toLowerCase().includes(t)
            );
        }
        
        this.htDataTableBody.innerHTML = '';
        if (displayData.length === 0) {
            this.htTableEmptyState.classList.remove('hidden');
            this.htDataTableBody.parentElement.style.display = 'none';
        } else {
            this.htTableEmptyState.classList.add('hidden');
            this.htDataTableBody.parentElement.style.display = 'table';
            displayData.forEach(row => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${DataProcessor.formatMonthName(row.monthYear)}</td>
                    <td>${row.source}</td>
                    <td>${row.category}</td>
                    <td>${DataProcessor.formatCurrency(row.units)}</td>
                `;
                this.htDataTableBody.appendChild(tr);
            });
        }
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
