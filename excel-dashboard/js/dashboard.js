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
        this.htDashboardContent = document.getElementById('ht-dashboard-content');
        
        // Filters (Multi-Select Containers)
        this.unitSelect = document.getElementById('unit-multi-select');
        this.monthSelect = document.getElementById('month-multi-select');
        this.yearSelect = document.getElementById('year-multi-select');
        this.metricSelect = document.getElementById('metric-multi-select');
        this.applyFilterBtn = document.getElementById('apply-filter-btn');
        this.applyFilterText = document.getElementById('apply-filter-text');
        this.resetFilterBtn = document.getElementById('reset-filter-btn');
        this.exportBtn = document.getElementById('export-btn');
        
        
        // HT Filters (Tab 3)
        this.htMonthSelect = document.getElementById('ht-month-multi-select');
        this.htYearSelect = document.getElementById('ht-year-multi-select');
        this.htMetricSelect = document.getElementById('ht-metric-multi-select');
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
        
        
        // HT Specific DOM
        this.htDataTableBody = document.getElementById('ht-data-table-body');
        this.htTableEmptyState = document.getElementById('ht-table-empty-state');
        this.htTableSearch = document.getElementById('ht-table-search');
        // Dynamic container instead of static cards
        this.htDynamicKpiContainer = document.getElementById('ht-dynamic-kpi-container');
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
        
        // Setup Custom Multi-Selects for instant filtering
        this.setupMultiSelect(this.unitSelect, () => this.applyFilter());
        this.setupMultiSelect(this.monthSelect, () => this.applyFilter());
        this.setupMultiSelect(this.yearSelect, () => this.applyFilter());
        this.setupMultiSelect(this.metricSelect, () => this.applyFilter());
        
        this.applyFilterBtn.addEventListener('click', () => this.applyFilter());
        this.resetFilterBtn.addEventListener('click', () => this.resetFilters());
        
        
        this.setupMultiSelect(this.htMonthSelect, () => this.onHtFilterChange());
        this.setupMultiSelect(this.htYearSelect, () => this.onHtFilterChange());
        this.setupMultiSelect(this.htMetricSelect, () => this.onHtFilterChange());
        this.htApplyFilterBtn.addEventListener('click', () => this.applyHtFilter());
        this.htResetFilterBtn.addEventListener('click', () => this.resetHtFilters());
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            document.querySelectorAll('.custom-multi-select .select-items').forEach(items => {
                if (!items.parentElement.contains(e.target)) {
                    items.classList.add('hidden');
                }
            });
        });
        
        this.exportBtn.addEventListener('click', () => this.exportToCSV());
        this.tableSearch.addEventListener('input', (e) => this.handleSearch(e.target.value));
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
    
    // --- Multi-Select Helpers ---
    setupMultiSelect: function(containerElement, changeCallback) {
        if (!containerElement) return;
        
        const selectedDiv = containerElement.querySelector('.select-selected');
        const itemsDiv = containerElement.querySelector('.select-items');
        
        if (!selectedDiv || !itemsDiv) return;
        
        // Toggle dropdown
        selectedDiv.addEventListener('click', (e) => {
            if (containerElement.dataset.disabled === "true") return;
            
            // Close others
            document.querySelectorAll('.custom-multi-select .select-items').forEach(items => {
                if (items !== itemsDiv) items.classList.add('hidden');
            });
            
            itemsDiv.classList.toggle('hidden');
        });
        
        // Handle checkbox changes
        itemsDiv.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const allCheckboxes = Array.from(itemsDiv.querySelectorAll('input[type="checkbox"]'));
                const allOption = allCheckboxes.find(cb => cb.value === 'all');
                
                if (allOption) {
                    if (e.target.value === 'all') {
                        // If "All" was checked, check everything. If unchecked, uncheck everything.
                        allCheckboxes.forEach(cb => cb.checked = e.target.checked);
                    } else {
                        // If a specific option was checked/unchecked
                        const otherCheckboxes = allCheckboxes.filter(cb => cb.value !== 'all');
                        const allOthersChecked = otherCheckboxes.every(cb => cb.checked);
                        allOption.checked = allOthersChecked;
                    }
                }
                
                this.updateMultiSelectText(containerElement);
                if (changeCallback) changeCallback();
            }
        });
    },
    
    updateMultiSelectText: function(containerElement) {
        if (!containerElement) return;
        const textSpan = containerElement.querySelector('.selected-text');
        const checkboxes = Array.from(containerElement.querySelectorAll('input[type="checkbox"]:checked'));
        const allCheckboxes = Array.from(containerElement.querySelectorAll('input[type="checkbox"]'));
        const allOption = allCheckboxes.find(cb => cb.value === 'all');
        
        if (checkboxes.length === 0) {
            textSpan.textContent = "None Selected";
        } else if (allOption && allOption.checked && checkboxes.length === allCheckboxes.length) {
            // Everything is checked, show the "all" text
            textSpan.textContent = allOption.parentElement.textContent.trim();
        } else if (checkboxes.length === 1) {
            // Only one item checked
            if (checkboxes[0].value === 'all') {
                textSpan.textContent = checkboxes[0].parentElement.textContent.trim();
            } else {
                textSpan.textContent = checkboxes[0].dataset.name || checkboxes[0].parentElement.textContent.trim();
            }
        } else {
            // Multiple items checked but not all
            // exclude 'all' checkbox from count if it was somehow checked alone (shouldn't happen with logic above)
            const count = checkboxes.filter(cb => cb.value !== 'all').length;
            textSpan.textContent = `${count} Selected`;
        }
    },
    
    getMultiSelectValues: function(containerElement) {
        if (!containerElement) return [];
        const allOption = containerElement.querySelector('input[type="checkbox"][value="all"]');
        if (allOption && allOption.checked) {
            return ['all'];
        }
        const checked = Array.from(containerElement.querySelectorAll('input[type="checkbox"]:checked'));
        return checked.filter(cb => cb.value !== 'all').map(cb => cb.value);
    },
    
    getMultiSelectNames: function(containerElement) {
        if (!containerElement) return [];
        const checked = Array.from(containerElement.querySelectorAll('input[type="checkbox"]:checked'));
        return checked.filter(cb => cb.value !== 'all').map(cb => cb.dataset.name || cb.parentElement.textContent.trim());
    },
    
    setMultiSelectValues: function(containerElement, valuesArray) {
        if (!containerElement) return;
        const checkboxes = containerElement.querySelectorAll('input[type="checkbox"]');
        const hasAll = valuesArray.includes('all');
        
        checkboxes.forEach(cb => {
            if (hasAll) {
                cb.checked = true;
            } else {
                cb.checked = valuesArray.includes(cb.value);
            }
        });
        this.updateMultiSelectText(containerElement);
    },
    // ----------------------------
    
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
        this.unitSelect.dataset.disabled = "false";
        this.monthSelect.dataset.disabled = "false";
        this.yearSelect.dataset.disabled = "false";
        if (this.metricSelect) this.metricSelect.dataset.disabled = "false";
        this.applyFilterBtn.disabled = false;
        this.resetFilterBtn.disabled = false;
        this.exportBtn.disabled = false;
        
        
        this.htMonthSelect.dataset.disabled = "false";
        this.htYearSelect.dataset.disabled = "false";
        if (this.htMetricSelect) this.htMetricSelect.dataset.disabled = "false";
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
        
        // Do not select any filters by default
        if (AppState.availableMonths.length > 0) {
            AppState.selectedYear = [];
            AppState.selectedMonthOnly = [];
            AppState.selectedUnit = [];
            
            AppState.htSelectedYear = [];
            AppState.htSelectedMonthOnly = [];
            
            // Set dropdowns
            this.setMultiSelectValues(this.yearSelect, []);
            this.setMultiSelectValues(this.monthSelect, []);
            this.setMultiSelectValues(this.unitSelect, []);
            if (this.metricSelect) this.setMultiSelectValues(this.metricSelect, []);
            
            this.setMultiSelectValues(this.htYearSelect, []);
            this.setMultiSelectValues(this.htMonthSelect, []);
            
            this.updateDashboardView([], [], []);
            this.updateHTDashboardView([], []);
        }
    },
    
    populateMultiSelect: function(containerElement, options, allText = "All") {
        if (!containerElement) return;
        const itemsDiv = containerElement.querySelector('.select-items');
        if (!itemsDiv) return;
        
        // Reset with 'all' option
        itemsDiv.innerHTML = `<label class="checkbox-container"><input type="checkbox" value="all"> ${allText}<span class="checkmark"></span></label>`;
        
        options.forEach(opt => {
            itemsDiv.innerHTML += `<label class="checkbox-container"><input type="checkbox" value="${opt.value}"> ${opt.text}<span class="checkmark"></span></label>`;
        });
        this.updateMultiSelectText(containerElement);
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
        const yearOptions = Array.from(years).sort().reverse().map(y => ({value: y, text: y}));
        this.populateMultiSelect(this.yearSelect, yearOptions, "All Years");
        this.populateMultiSelect(this.htYearSelect, yearOptions, "All Years");
        
        // Populate Month
        const monthNames = ["January", "February", "March", "April", "May", "June", 
                            "July", "August", "September", "October", "November", "December"];
        const monthOptions = Array.from(months).sort().map(m => ({value: m, text: monthNames[parseInt(m) - 1]}));
        this.populateMultiSelect(this.monthSelect, monthOptions, "All Months");
        this.populateMultiSelect(this.htMonthSelect, monthOptions, "All Months");
        
        // Populate Unit
        const unitOptions = Array.from(AppState.availableUnits)
            .filter(u => u !== 'HT Power (Merged)')
            .sort().map(u => ({value: u, text: u}));
        this.populateMultiSelect(this.unitSelect, unitOptions, "All Units");
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
        const years = this.getMultiSelectValues(this.yearSelect);
        const months = this.getMultiSelectValues(this.monthSelect);
        const units = this.getMultiSelectValues(this.unitSelect);
        
        AppState.selectedYear = years;
        AppState.selectedMonthOnly = months;
        AppState.selectedUnit = units;
        
        // Visual loading state
        const originalText = this.applyFilterText.textContent;
        this.applyFilterText.textContent = "Applying...";
        this.applyFilterBtn.disabled = true;
        
        setTimeout(() => {
            this.updateDashboardView(years, months, units);
            this.applyFilterText.textContent = originalText;
            this.applyFilterBtn.disabled = false;
        }, 150); // Give UI time to update
    },
    
    resetFilters: function() {
        if (AppState.availableMonths.length > 0) {
            AppState.selectedYear = [];
            AppState.selectedMonthOnly = [];
            AppState.selectedUnit = [];
            
            this.setMultiSelectValues(this.yearSelect, []);
            this.setMultiSelectValues(this.monthSelect, []);
            this.setMultiSelectValues(this.unitSelect, []);
            if (this.metricSelect) this.setMultiSelectValues(this.metricSelect, []);
            
            this.updateDashboardView([], [], []);
            this.tableSearch.value = "";
        }
    },
    
    updateDashboardView: function(years, months, units) {
        // Get selected metrics
        let metricKeys = this.getMultiSelectValues(this.metricSelect);
        let metricNames = this.getMultiSelectNames(this.metricSelect);
        
        if (years.length === 0 || months.length === 0 || units.length === 0 || metricKeys.length === 0) {
            // If any filter is completely unselected, forcefully return empty data
            // to fulfill the user request that "nothing will not come".
            const emptyData = [];
            this.updateKPIs(emptyData, metricNames);
            this.updateTable(emptyData, this.dataTableBody, this.tableEmptyState, "", metricKeys, metricNames);
            
            // Hide charts
            document.getElementById('chart-units-card').style.display = 'none';
            document.getElementById('chart-rupees-card').style.display = 'none';
            document.getElementById('pie-chart-card').style.display = 'none';
            
            return;
        }
        
        // Get filtered data
        const filteredData = DataProcessor.getFilteredData(years, months, units);
        
        // Update KPIs (Dynamic generation by month, filtered by selected metrics)
        this.updateKPIs(filteredData, metricNames);
        
        // Update Table
        this.updateTable(filteredData, this.dataTableBody, this.tableEmptyState, "", metricKeys, metricNames);
        
        // Update Charts with selected metric NAMES (since dataProcessor now uses actual names as keys)
        const unitMetrics = metricNames.filter(m => !m.toLowerCase().includes('(rs.)') && !m.toLowerCase().includes('rate'));
        const rupeesMetrics = metricNames.filter(m => m.toLowerCase().includes('(rs.)') || m.toLowerCase().includes('rate'));
        
        // 1. Units Chart
        const unitsCard = document.getElementById('chart-units-card');
        if (unitMetrics.length > 0) {
            unitsCard.style.display = 'block';
            const unitChartData = DataProcessor.getChartData(filteredData, unitMetrics);
            if (Object.keys(unitChartData.monthlyTrend).length > 0) {
                ChartManager.createMonthlyTrendChart(unitChartData.monthlyTrend, 'chart-monthly-trend-units', 'monthlyTrendUnits', unitMetrics);
            }
        } else {
            unitsCard.style.display = 'none';
        }

        // 2. Rupees Chart
        const rupeesCard = document.getElementById('chart-rupees-card');
        if (rupeesMetrics.length > 0) {
            rupeesCard.style.display = 'block';
            const rupeesChartData = DataProcessor.getChartData(filteredData, rupeesMetrics);
            if (Object.keys(rupeesChartData.monthlyTrend).length > 0) {
                ChartManager.createMonthlyTrendChart(rupeesChartData.monthlyTrend, 'chart-monthly-trend-rupees', 'monthlyTrendRupees', rupeesMetrics);
            }
        } else {
            rupeesCard.style.display = 'none';
        }
        
        // Use the first metric for Pie Chart Distribution
        const pieCard = document.getElementById('pie-chart-card');
        if (units && (units.includes('all') || units.length > 1)) {
            const allChartData = DataProcessor.getChartData(filteredData, [metricNames[0]]);
            if (Object.keys(allChartData.sourceDist).length > 0) {
                pieCard.style.display = 'block';
                ChartManager.createCategoryDistChart(allChartData.sourceDist, 'chart-category-dist', 'categoryDist', metricNames[0]);
                pieCard.parentElement.classList.add('has-pie');
            } else {
                pieCard.style.display = 'none';
                pieCard.parentElement.classList.remove('has-pie');
            }
        } else {
            pieCard.style.display = 'none';
            pieCard.parentElement.classList.remove('has-pie');
        }
    },
    
    // --- HT DASHBOARD LOGIC (Tab 3) ---
    
    onHtFilterChange: function() {},
    
    applyHtFilter: function() {
        const years = this.getMultiSelectValues(this.htYearSelect);
        const months = this.getMultiSelectValues(this.htMonthSelect);
        const metricKeys = this.getMultiSelectValues(this.htMetricSelect);
        const metricNames = this.getMultiSelectNames(this.htMetricSelect);
        
        AppState.htSelectedYear = years;
        AppState.htSelectedMonthOnly = months;
        AppState.htMetricKeys = metricKeys;
        AppState.htMetricNames = metricNames;
        
        const originalText = this.htApplyFilterText.textContent;
        this.htApplyFilterText.textContent = "Applying...";
        this.htApplyFilterBtn.disabled = true;
        
        setTimeout(() => {
            this.updateHTDashboardView(years, months, metricKeys, metricNames);
            this.htApplyFilterText.textContent = originalText;
            this.htApplyFilterBtn.disabled = false;
        }, 150);
    },
    
    resetHtFilters: function() {
        if (AppState.availableMonths.length > 0) {
            AppState.htSelectedYear = [];
            AppState.htSelectedMonthOnly = [];
            
            this.setMultiSelectValues(this.htYearSelect, []);
            this.setMultiSelectValues(this.htMonthSelect, []);
            if (this.htMetricSelect) this.setMultiSelectValues(this.htMetricSelect, []);
            
            this.updateHTDashboardView([], []);
            this.htTableSearch.value = "";
        }
    },
    
    updateHTDashboardView: function(years, months, metricKeys = null, metricNames = null) {
        if (!metricKeys) {
            metricKeys = this.getMultiSelectValues(this.htMetricSelect);
            metricNames = this.getMultiSelectNames(this.htMetricSelect);
        }
        
        if (years.length === 0 || months.length === 0 || metricKeys.length === 0) {
            this.updateKPIs([], metricNames, this.htDynamicKpiContainer);
            this.updateTable([], this.htDataTableBody, this.htTableEmptyState, "", metricKeys, metricNames);
            document.getElementById('ht-pie-chart-card').style.display = 'none';
            ChartManager.createMonthlyTrendChart({}, 'chart-ht-monthly-trend', 'htMonthlyTrend', metricNames);
            return;
        }
        
        const filteredData = DataProcessor.getHTPowerData(years, months);
        
        // 1. Dynamic KPI Cards
        this.updateKPIs(filteredData, metricNames, this.htDynamicKpiContainer);
        
        // 2. Data Table
        this.updateTable(filteredData, this.htDataTableBody, this.htTableEmptyState, "", metricKeys, metricNames);
        
        // 3. Charts
        const chartData = DataProcessor.getChartData(filteredData);
        if (Object.keys(chartData.monthlyTrend).length > 0) {
            // Because our chart manager expects an object of metrics per month:
            // But we can just pass the same trendData structure.
            // For HT Power, `chartData.monthlyTrend` doesn't know about these specific metrics, it just averages total value etc.
            // Let's build a custom trend data that maps exactly to metricKeys.
            
            const trendData = {};
            filteredData.forEach(row => {
                if (!trendData[row.monthYear]) trendData[row.monthYear] = {};
                
                metricNames.forEach(metricName => {
                    if (!trendData[row.monthYear][metricName]) trendData[row.monthYear][metricName] = 0;
                    trendData[row.monthYear][metricName] += (row.metrics ? (row.metrics[metricName] || 0) : 0);
                });
            });
            ChartManager.createMonthlyTrendChart(trendData, 'chart-ht-monthly-trend', 'htMonthlyTrend', metricNames);
        }
        
        const pieCard = document.getElementById('ht-pie-chart-card');
        if (Object.keys(chartData.sourceDist).length > 0) {
            pieCard.style.display = 'block';
            ChartManager.createCategoryDistChart(chartData.sourceDist, 'chart-ht-category-dist', 'htCategoryDist', 'Total Units (KWH)');
            pieCard.parentElement.classList.add('has-pie');
        } else {
            pieCard.style.display = 'none';
            pieCard.parentElement.classList.remove('has-pie');
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

    updateKPIs: function(filteredData, metricNames, targetContainer = null) {
        const container = targetContainer || document.getElementById('dynamic-kpi-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!filteredData || filteredData.length === 0) {
            container.innerHTML = '<div class="kpi-card" style="grid-column: 1 / -1; text-align: center;">No data available for the selected filters.</div>';
            return;
        }
        
        const monthlyGroups = DataProcessor.calculateDetailedKPIsByMonth(filteredData);
        
        // Normalize selected metric names for robust matching
        let normalizedSelected = [];
        if (metricNames && !metricNames.includes('All Metrics')) {
            normalizedSelected = metricNames.map(m => m.toLowerCase().replace(/[^a-z0-9]/g, ''));
        }
        
        // Sort groups chronologically by month, then by unit
        const sortedGroups = Object.keys(monthlyGroups).sort((a, b) => {
            const [monthA, unitA] = a.split('|');
            const [monthB, unitB] = b.split('|');
            const dateA = new Date(monthA);
            const dateB = new Date(monthB);
            if (dateA.getTime() !== dateB.getTime()) {
                return dateA - dateB;
            }
            return unitA.localeCompare(unitB);
        });
        
        sortedGroups.forEach((groupKey, groupIndex) => {
            const data = monthlyGroups[groupKey];
            const [monthStr, unitName] = groupKey.split('|');
            const monthName = DataProcessor.formatMonthName(monthStr);
            
            // Create group container
            const groupDiv = document.createElement('div');
            groupDiv.className = 'month-group';
            groupDiv.style.animationDelay = `${groupIndex * 0.1}s`;
            
            // Create title
            const titleEl = document.createElement('h3');
            titleEl.className = 'month-group-title';
            titleEl.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                </svg>
                Data for ${monthName} — ${unitName}
            `;
            groupDiv.appendChild(titleEl);
            
            // Create grid
            const gridDiv = document.createElement('div');
            gridDiv.className = 'kpi-section';
            
            // Build cards for all 17 metrics
            Object.entries(data).forEach(([key, value], index) => {
                // If specific metrics are selected, filter out the rest
                if (normalizedSelected.length > 0) {
                    const normKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
                    // Special fallbacks due to slight naming mismatches between dashboard dropdown & dataProcessor keys
                    const isMatch = normalizedSelected.includes(normKey) || 
                                    (normKey.includes('iex') && normalizedSelected.some(n => n.includes('iex'))) ||
                                    (normKey.includes('ebunits') && normalizedSelected.some(n => n.includes('ebunits'))) ||
                                    (normKey.includes('wheeling') && normalizedSelected.some(n => n.includes('wheeling')));
                    if (!isMatch) return;
                }
                
                const isRupees = key.includes('(Rs.)') || key.includes('Rate');
                const isRate = key.toLowerCase().includes('rate');
                
                // Formatting logic
                let displayVal = '';
                if (isRate) {
                    displayVal = value.toFixed(2);
                } else if (value >= 1000 || value < -1000) {
                    displayVal = DataProcessor.formatCurrency(value);
                } else {
                    // Small whole numbers or decimals
                    displayVal = Number.isInteger(value) ? value : value.toFixed(2);
                }
                
                const prefix = (isRupees && value !== 0) ? '₹' : '';
                
                const card = document.createElement('div');
                card.className = 'kpi-card';
                // Remove individual animation delays to let the grid animate as a group
                card.innerHTML = `
                    <div class="kpi-header">
                        <div class="kpi-title">${key}</div>
                        <div class="kpi-icon" style="opacity: 0.5;">
                            <!-- Generic metric icon -->
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                            </svg>
                        </div>
                    </div>
                    <div class="kpi-value">${prefix}${displayVal}</div>
                `;
                
                gridDiv.appendChild(card);
            });
            
            groupDiv.appendChild(gridDiv);
            container.appendChild(groupDiv);
        });
    },
    
    updateTable: function(data, tbodyEl, emptyStateEl, searchTerm = "", metricKeys = ["total_units"], metricNames = ["Total Units (KWH)"]) {
        tbodyEl.innerHTML = '';
        
        // Update Table Header if it's the main dashboard table
        // Update Table Header if it's a dynamic table
        if (tbodyEl.id === 'data-table-body' || tbodyEl.id === 'ht-data-table-body') {
            const table = tbodyEl.parentElement;
            if (table && table.tagName === 'TABLE') {
                const thead = table.querySelector('thead tr');
                if (thead) {
                    if (tbodyEl.id === 'data-table-body') {
                        thead.innerHTML = `
                            <th>Date/Month</th>
                            <th>Category / Unit</th>
                            <th>Value (Rs.)</th>
                        `;
                    } else {
                        thead.innerHTML = `
                            <th>Date/Month</th>
                            <th>Source / Unit</th>
                            <th>Category</th>
                        `;
                    }
                    metricNames.forEach(name => {
                        thead.innerHTML += `<th>${name}</th>`;
                    });
                }
            }
        }
        
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
            if (emptyStateEl) emptyStateEl.classList.remove('hidden');
            tbodyEl.parentElement.style.display = 'none';
        } else {
            if (emptyStateEl) emptyStateEl.classList.add('hidden');
            tbodyEl.parentElement.style.display = 'table';
            
            displayData.forEach(row => {
                const tr = document.createElement('tr');
                
                if (tbodyEl.id === 'data-table-body') {
                    // Main Dashboard Table
                    let html = `
                        <td>${DataProcessor.formatMonthName(row.monthYear)}</td>
                        <td>${row.category}</td>
                        <td>${row.value > 0 ? '₹' + DataProcessor.formatCurrency(row.value) : '-'}</td>
                    `;
                    metricNames.forEach(name => {
                        const metricVal = row.metrics ? (row.metrics[name] || 0) : (row.units || 0);
                        const isRupees = name.toLowerCase().includes('(rs.)') || name.toLowerCase().includes('rate');
                        const prefix = isRupees && metricVal > 0 ? '₹' : '';
                        html += `<td>${prefix}${DataProcessor.formatCurrency(metricVal)}</td>`;
                    });
                    tr.innerHTML = html;
                } else if (tbodyEl.id === 'ht-data-table-body') {
                    // HT Power Dashboard Table (Dynamic)
                    let html = `
                        <td>${DataProcessor.formatMonthName(row.monthYear)}</td>
                        <td>${row.source}</td>
                        <td>${row.category}</td>
                    `;
                    metricNames.forEach(name => {
                        const metricVal = row.metrics ? (row.metrics[name] || 0) : (row.units || 0);
                        html += `<td>${DataProcessor.formatCurrency(metricVal)}</td>`;
                    });
                    tr.innerHTML = html;
                }
                
                tbodyEl.appendChild(tr);
            });
        }
    },
    
    handleSearch: function(term) {
        if (!AppState.selectedYear && !AppState.selectedMonthOnly && !AppState.selectedUnit && AppState.processedData.length === 0) return;
        const filteredData = DataProcessor.getFilteredData(AppState.selectedYear, AppState.selectedMonthOnly, AppState.selectedUnit);
        this.updateTable(filteredData, this.dataTableBody, this.tableEmptyState, term);
    },
    

    
    handleHtSearch: function(term) {
        if (!AppState.htSelectedYear && !AppState.htSelectedMonthOnly && AppState.processedData.length === 0) return;
        const filteredData = DataProcessor.getHTPowerData(AppState.htSelectedYear, AppState.htSelectedMonthOnly);
        this.updateTable(filteredData, this.htDataTableBody, this.htTableEmptyState, term, AppState.htMetricKeys, AppState.htMetricNames);
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
