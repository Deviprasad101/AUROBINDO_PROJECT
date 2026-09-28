const EnergyDashboard = (() => {
    const _charts = {};
    function safeDiv(a, b) { return (!b || isNaN(b) || b === 0) ? 0 : (isFinite(a/b) ? a/b : 0); }
    function fmtNum(n, d = 0) { return (n === null || isNaN(n)) ? 'N/A' : new Intl.NumberFormat('en-IN', { maximumFractionDigits: d }).format(n); }
    function fmtRs(n, d = 0) { return (!n && n !== 0) ? 'N/A' : String.fromCharCode(8377) + fmtNum(n, d); }
    function fmtRate(n) { return (!n && n !== 0) ? 'N/A' : String.fromCharCode(8377) + fmtNum(n, 2) + '/KWh'; }
    function sumArr(arr) { return (!arr || !arr.length) ? 0 : arr.reduce((a, b) => a + (parseFloat(b)||0), 0); }
    function avgArr(arr) { const v = (arr||[]).filter(x => x && parseFloat(x) !== 0); return v.length ? sumArr(v)/v.length : 0; }
    function destroyAllCharts() { Object.keys(_charts).forEach(k => { if(_charts[k]){ try{_charts[k].destroy();}catch(e){} delete _charts[k]; } }); }
    function formatMonth(iso) { return iso ? new Date(iso).toLocaleDateString('en-IN', { month:'short', year:'2-digit' }) : ''; }

    function kpi(label, val, color) {
        return `<div class="ed-kpi-card" style="--kpi-accent: var(${color});">
            <div class="ed-kpi-label">${label}</div>
            <div class="ed-kpi-value">${val}</div>
        </div>`;
    }
    function mini(label, val) { return `<div class="ed-mini-kpi"><div class="ed-mini-kpi-label">${label}</div><div class="ed-mini-kpi-value">${val}</div></div>`; }

    function aggregateAllUnits() {
        if (!window.RealTreeData) return null;
        const allDates = new Set();
        Object.values(window.RealTreeData).forEach(u => (u.labels || []).forEach(l => allDates.add(l)));
        const sortedLabels = Array.from(allDates).sort();
        
        const aggDs = {};
        Object.values(window.RealTreeData).forEach(u => {
            if (!u.datasets || !u.labels) return;
            Object.keys(u.datasets).forEach(metric => {
                if (!aggDs[metric]) aggDs[metric] = new Array(sortedLabels.length).fill(0);
                u.labels.forEach((lbl, i) => {
                    const targetIdx = sortedLabels.indexOf(lbl);
                    if (targetIdx !== -1) {
                        aggDs[metric][targetIdx] += (parseFloat(u.datasets[metric][i]) || 0);
                    }
                });
            });
        });
        
        // Fix rates / averages (we should really do weighted avg, but as a simple approx we average the rates that are > 0)
        ['CMD (KVA)', 'RMD (KVA)', 'OA/ IEX Rate/Kwh', 'Landed Rate/Kwh with FPPC (Rs.)', 'Landed Rate/Kwh without FPPC (Rs.)'].forEach(metric => {
            if (!aggDs[metric]) return;
            aggDs[metric] = sortedLabels.map((lbl, idx) => {
                let sum = 0, count = 0;
                Object.values(window.RealTreeData).forEach(u => {
                    if (!u.datasets || !u.labels || !u.datasets[metric]) return;
                    const lIdx = u.labels.indexOf(lbl);
                    if (lIdx !== -1 && u.datasets[metric][lIdx] > 0) { sum += u.datasets[metric][lIdx]; count++; }
                });
                return count > 0 ? sum / count : 0;
            });
        });

        return { labels: sortedLabels, datasets: aggDs };
    }

    function render(unitName, containerId) {
        destroyAllCharts();
        const container = document.getElementById(containerId);
        if (!container) return;
        
        let rawData;
        if (unitName === 'ALL_UNITS') {
            rawData = aggregateAllUnits();
        } else {
            rawData = window.RealTreeData && window.RealTreeData[unitName] ? window.RealTreeData[unitName] : null;
        }

        // Even if there is no data for this specific unit, we still render the layout with empty/zero charts.
        const ds = (rawData && rawData.datasets) ? rawData.datasets : {};
        const labels = (rawData && rawData.labels && rawData.labels.length > 0) ? rawData.labels : ['No Data'];
        const mLabels = labels.map(l => l === 'No Data' ? l : formatMonth(l));
        
        container.innerHTML = buildHTML(labels, mLabels, ds);
        renderCharts(ds, mLabels);
        setupFilters(ds, labels, mLabels, unitName);
    }

    function buildHTML(labels, mLabels, ds) {
        const tUnits = sumArr(ds['Total Unts (Kvah)']), tVal = sumArr(ds['Total value (Rs.)']);
        const ebU = sumArr(ds['EB Units (Kvah)']), ebV = sumArr(ds['EB Value Total (Rs.)']);
        const oaCons = sumArr(ds['OA Considered IEX (Kvah)']);
        const lRateWith = avgArr(ds['Landed Rate/Kwh with FPPC (Rs.)']);
        const cmd = avgArr(ds['CMD (KVA)']), rmd = avgArr(ds['RMD (KVA)']);
        const demUtil = safeDiv(rmd, cmd) * 100;

        const oaIss = sumArr(ds['OA Issued IEX (Kvah)']), iexV = sumArr(ds['IEX-Value (Rs.)']);
        const oaRate = safeDiv(iexV, oaCons), oaUtil = safeDiv(oaCons, oaIss) * 100;

        const solU = sumArr(ds['Solar-Rooftop (Kvah)']), dgU = sumArr(ds['DG Units (Kvah)']);

        return `<div class="ed-root">
            <div class="ed-filter-bar">
                <span class="ed-filter-label">Month:</span>
                <div class="ed-filter-pills" id="ed-pills">
                    <button class="ed-pill active" data-all="true">All</button>
                    ${labels.map((l, i) => `<button class="ed-pill" data-idx="${i}">${mLabels[i]}</button>`).join('')}
                </div>
            </div>
            <div class="ed-kpi-row-7" id="ed-top-kpis">
                ${kpi('Total Energy', fmtNum(tUnits) + ' KVAh', '--kpi-blue')}
                ${kpi('Total Energy Cost', fmtRs(tVal), '--kpi-green')}
                ${kpi('EB Consumption', fmtNum(ebU) + ' KVAh', '--kpi-indigo')}
                ${kpi('EB Cost', fmtRs(ebV), '--kpi-indigo')}
                ${kpi('OA/IEX Consump.', fmtNum(oaCons) + ' KVAh', '--kpi-purple')}
                ${kpi('Landed Rate', fmtRate(lRateWith), '--kpi-orange')}
                ${kpi('Demand Util.', fmtNum(demUtil,1) + '%', '--kpi-teal')}
            </div>
            
            <div class="ed-chart-row-half">
                <div class="ed-chart-card">
                    <div class="ed-chart-title">Energy Source Distribution</div>
                    <div class="ed-chart-wrap"><canvas id="c-donut"></canvas></div>
                </div>
                <div class="ed-chart-card">
                    <div class="ed-chart-title">EB Power Analysis</div>
                    <div class="ed-mini-kpis" id="k-eb">
                        ${mini('EB Rate', fmtRate(safeDiv(ebV, ebU)))}
                    </div>
                    <div class="ed-chart-wrap"><canvas id="c-eb"></canvas></div>
                </div>
            </div>

            <div class="ed-chart-row-full">
                <div class="ed-chart-card">
                    <div class="ed-chart-title">OA / IEX Analysis</div>
                    <div class="ed-mini-kpis" id="k-oa">
                        ${mini('IEX Cost', fmtRs(iexV))}
                        ${mini('OA/IEX Rate', fmtRate(oaRate))}
                        ${mini('OA Utilization', fmtNum(oaUtil, 1) + '%')}
                    </div>
                    <div class="ed-chart-wrap"><canvas id="c-oa"></canvas></div>
                </div>
            </div>

            <div class="ed-chart-row-half">
                <div class="ed-chart-card">
                    <div class="ed-chart-title">Solar Analysis</div>
                    <div class="ed-mini-kpis" id="k-sol">
                        ${mini('Solar Contribution', fmtNum(safeDiv(solU, tUnits)*100, 1) + '%')}
                    </div>
                    <div class="ed-chart-wrap"><canvas id="c-sol"></canvas></div>
                </div>
                <div class="ed-chart-card">
                    <div class="ed-chart-title">DG Analysis</div>
                    <div class="ed-mini-kpis" id="k-dg">
                        ${mini('DG Contribution', fmtNum(safeDiv(dgU, tUnits)*100, 1) + '%')}
                    </div>
                    <div class="ed-chart-wrap"><canvas id="c-dg"></canvas></div>
                </div>
            </div>

            <div class="ed-chart-row-half">
                <div class="ed-chart-card">
                    <div class="ed-chart-title">Contracted vs Recorded Demand</div>
                    <div class="ed-chart-wrap"><canvas id="c-cmd"></canvas></div>
                </div>
                <div class="ed-chart-card">
                    <div class="ed-chart-title">Landed Rate Analysis</div>
                    <div class="ed-mini-kpis" id="k-fppca">
                        ${mini('FPPCA Impact', fmtRate(avgArr(ds['Landed Rate/Kwh with FPPC (Rs.)']) - avgArr(ds['Landed Rate/Kwh without FPPC (Rs.)'])))}
                    </div>
                    <div class="ed-chart-wrap"><canvas id="c-rate"></canvas></div>
                </div>
            </div>

            <div class="ed-chart-row-full">
                <div class="ed-chart-card">
                    <div class="ed-chart-title">Monthly Energy Consumption</div>
                    <div class="ed-chart-wrap"><canvas id="c-trend-e"></canvas></div>
                </div>
                <div class="ed-chart-card">
                    <div class="ed-chart-title">Monthly Energy Cost</div>
                    <div class="ed-chart-wrap"><canvas id="c-trend-c"></canvas></div>
                </div>
            </div>
        </div>`;
    }

    function renderCharts(ds, mLabels) {
        const tU = sumArr(ds['Total Unts (Kvah)']);
        const ebU = sumArr(ds['EB Units (Kvah)']), ebV = sumArr(ds['EB Value Total (Rs.)']);
        const oaIss = sumArr(ds['OA Issued IEX (Kvah)']), oaCons = sumArr(ds['OA Considered IEX (Kvah)']);
        const sol = sumArr(ds['Solar-Rooftop (Kvah)']), dg = sumArr(ds['DG Units (Kvah)']);

        // Donut
        const ctxD = document.getElementById('c-donut');
        if (ctxD) {
            const vals = [ebU, oaCons, sol, dg];
            _charts['donut'] = new Chart(ctxD, {
                type: 'doughnut', data: { labels: ['EB', 'OA/IEX', 'Solar', 'DG'], datasets: [{ data: vals, backgroundColor: ['#6366f1','#8b5cf6','#f59e0b','#ef4444'] }]},
                options: { responsive: true, maintainAspectRatio: false, plugins: {
                    legend: { position: 'bottom' },
                    tooltip: { mode: 'nearest', intersect: true, callbacks: {
                        label: c => ` Units: ${fmtNum(vals[c.dataIndex])} KVAh\n Share: ${fmtNum(safeDiv(vals[c.dataIndex], tU)*100,1)}%`
                    }}
                }}
            });
        }

        // EB Analysis (Dual Axis Bar)
        const ctxEB = document.getElementById('c-eb');
        if (ctxEB) {
            _charts['eb'] = new Chart(ctxEB, {
                type: 'bar', data: { labels: ['EB Analysis'], datasets: [
                    { label: 'EB Units (KVAh)', data: [ebU], backgroundColor: '#6366f1', yAxisID: 'y' },
                    { label: 'EB Value (Rs.)', data: [ebV], backgroundColor: '#10b981', yAxisID: 'y1' }
                ]},
                options: { responsive: true, maintainAspectRatio: false, plugins: { 
                    tooltip: { mode: 'nearest', intersect: true, callbacks: {
                        label: c => c.datasetIndex === 0 ? ` ${fmtNum(c.parsed.y)} KVAh` : ` ${fmtRs(c.parsed.y)}`
                    }}
                }, scales: { 
                    x: { display: false },
                    y: { type: 'linear', position: 'left', title: {display:true, text:'KVAh'} },
                    y1: { type: 'linear', position: 'right', title: {display:true, text:'Rs.'}, grid: {drawOnChartArea:false} }
                }}
            });
        }

        // OA Analysis (Issued vs Considered)
        const ctxOA = document.getElementById('c-oa');
        if (ctxOA) {
            _charts['oa'] = new Chart(ctxOA, {
                type: 'bar', data: { labels: ['OA Analysis'], datasets: [
                    { label: 'OA Issued (KVAh)', data: [oaIss], backgroundColor: '#8b5cf6' },
                    { label: 'OA Considered (KVAh)', data: [oaCons], backgroundColor: '#3b82f6' }
                ]},
                options: { responsive: true, maintainAspectRatio: false, plugins: {
                    tooltip: { mode: 'nearest', intersect: true, callbacks: { label: c => ` ${fmtNum(c.parsed.y)} KVAh` } }
                }, scales: { x: { display: false } }}
            });
        }

        // Solar Bar
        const ctxSol = document.getElementById('c-sol');
        if (ctxSol) {
            _charts['sol'] = new Chart(ctxSol, {
                type: 'bar', data: { labels: ['Solar'], datasets: [{ label: 'Solar Units', data: [sol], backgroundColor: '#f59e0b' }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: {
                    legend: {display: false}, tooltip: { mode: 'nearest', intersect: true, callbacks: { label: c => ` ${fmtNum(c.parsed.y)} KVAh` } }
                }, scales: { x: { display: false } }}
            });
        }

        // DG Bar
        const ctxDG = document.getElementById('c-dg');
        if (ctxDG) {
            _charts['dg'] = new Chart(ctxDG, {
                type: 'bar', data: { labels: ['DG'], datasets: [{ label: 'DG Units', data: [dg], backgroundColor: '#ef4444' }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: {
                    legend: {display: false}, tooltip: { mode: 'nearest', intersect: true, callbacks: { label: c => ` ${fmtNum(c.parsed.y)} KVAh` } }
                }, scales: { x: { display: false } }}
            });
        }

        // CMD vs RMD
        const ctxCMD = document.getElementById('c-cmd');
        if (ctxCMD) {
            const cmdD = (ds['CMD (KVA)']||[]).length > 1 ? ds['CMD (KVA)'] : [avgArr(ds['CMD (KVA)'])];
            const rmdD = (ds['RMD (KVA)']||[]).length > 1 ? ds['RMD (KVA)'] : [avgArr(ds['RMD (KVA)'])];
            const lab = (ds['CMD (KVA)']||[]).length > 1 ? mLabels : ['Demand'];
            _charts['cmd'] = new Chart(ctxCMD, {
                type: 'bar', data: { labels: lab, datasets: [
                    { label: 'CMD (KVA)', data: cmdD, backgroundColor: '#4f46e5' },
                    { label: 'RMD (KVA)', data: rmdD, backgroundColor: '#10b981' }
                ]},
                options: { responsive: true, maintainAspectRatio: false, plugins: {
                    tooltip: { mode: 'nearest', intersect: true, callbacks: { label: c => ` ${fmtNum(c.parsed.y, 1)} KVA` } }
                }}
            });
        }

        // Landed Rate
        const ctxR = document.getElementById('c-rate');
        if (ctxR) {
            _charts['rate'] = new Chart(ctxR, {
                type: 'bar', data: { labels: ['OA Rate', 'No FPPCA', 'With FPPCA'], datasets: [{
                    data: [ avgArr((ds['OA/ IEX Rate/Kwh']||[]).filter(v=>v>0)), avgArr((ds['Landed Rate/Kwh without FPPC (Rs.)']||[]).filter(v=>v>0)), avgArr((ds['Landed Rate/Kwh with FPPC (Rs.)']||[]).filter(v=>v>0)) ],
                    backgroundColor: ['#8b5cf6','#f59e0b','#ef4444']
                }]},
                options: { responsive: true, maintainAspectRatio: false, plugins: {
                    legend: { display: false }, tooltip: { mode: 'nearest', intersect: true, callbacks: { label: c => ` ${fmtRate(c.parsed.y)}` } }
                }}
            });
        }

        // Trends
        const ctxTE = document.getElementById('c-trend-e');
        if (ctxTE) {
            _charts['te'] = new Chart(ctxTE, {
                type: 'line', data: { labels: mLabels, datasets: [{ label: 'Total Units (KVAh)', data: ds['Total Unts (Kvah)']||[], borderColor: '#4f46e5', backgroundColor: 'rgba(79,70,229,0.1)', fill: true }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: {display: false}, tooltip: {mode: 'nearest', intersect: false, callbacks: {label: c => ` ${fmtNum(c.parsed.y)} KVAh`}} } }
            });
        }
        const ctxTC = document.getElementById('c-trend-c');
        if (ctxTC) {
            _charts['tc'] = new Chart(ctxTC, {
                type: 'line', data: { labels: mLabels, datasets: [{ label: 'Total Value (Rs.)', data: ds['Total value (Rs.)']||[], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)', fill: true }] },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: {display: false}, tooltip: {mode: 'nearest', intersect: false, callbacks: {label: c => ` ${fmtRs(c.parsed.y)}`}} } }
            });
        }
    }

    function setupFilters(dsOrig, labelsOrig, mLabelsOrig, unitName) {
        const pills = document.getElementById('ed-pills');
        if (!pills) return;
        let sIdx = labelsOrig.map((_, i) => i);

        pills.addEventListener('click', (e) => {
            const btn = e.target.closest('.ed-pill');
            if (!btn) return;
            if (btn.dataset.all) {
                sIdx = labelsOrig.map((_, i) => i);
                pills.querySelectorAll('.ed-pill').forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
            } else {
                const i = parseInt(btn.dataset.idx);
                pills.querySelector('[data-all]').classList.remove('active');
                if (sIdx.length === labelsOrig.length) { sIdx = [i]; pills.querySelectorAll('.ed-pill').forEach(p => p.classList.remove('active')); btn.classList.add('active'); }
                else {
                    if (btn.classList.contains('active')) { if (sIdx.length > 1) { sIdx = sIdx.filter(x => x !== i); btn.classList.remove('active'); } }
                    else { sIdx.push(i); btn.classList.add('active'); }
                }
                if (sIdx.length === labelsOrig.length) { sIdx = labelsOrig.map((_, i) => i); pills.querySelectorAll('.ed-pill').forEach(p => p.classList.remove('active')); pills.querySelector('[data-all]').classList.add('active'); }
            }
            const ds = {};
            for (const k in dsOrig) ds[k] = (dsOrig[k]||[]).filter((_, i) => sIdx.includes(i));
            const ml = sIdx.map(i => mLabelsOrig[i]);

            const tUnits = sumArr(ds['Total Unts (Kvah)']), tVal = sumArr(ds['Total value (Rs.)']);
            const ebU = sumArr(ds['EB Units (Kvah)']), ebV = sumArr(ds['EB Value Total (Rs.)']);
            const oaCons = sumArr(ds['OA Considered IEX (Kvah)']);
            const lRateWith = avgArr(ds['Landed Rate/Kwh with FPPC (Rs.)']);
            const cmd = avgArr(ds['CMD (KVA)']), rmd = avgArr(ds['RMD (KVA)']);
            
            const oaIss = sumArr(ds['OA Issued IEX (Kvah)']), iexV = sumArr(ds['IEX-Value (Rs.)']);
            const sol = sumArr(ds['Solar-Rooftop (Kvah)']), dg = sumArr(ds['DG Units (Kvah)']);

            const top = document.getElementById('ed-top-kpis');
            if (top) top.innerHTML = 
                kpi('Total Energy', fmtNum(tUnits) + ' KVAh', '--kpi-blue') +
                kpi('Total Energy Cost', fmtRs(tVal), '--kpi-green') +
                kpi('EB Consumption', fmtNum(ebU) + ' KVAh', '--kpi-indigo') +
                kpi('EB Cost', fmtRs(ebV), '--kpi-indigo') +
                kpi('OA/IEX Consump.', fmtNum(oaCons) + ' KVAh', '--kpi-purple') +
                kpi('Landed Rate', fmtRate(lRateWith), '--kpi-orange') +
                kpi('Demand Util.', fmtNum(safeDiv(rmd,cmd)*100,1) + '%', '--kpi-teal');
            
            if (document.getElementById('k-eb')) document.getElementById('k-eb').innerHTML = mini('EB Rate', fmtRate(safeDiv(ebV, ebU)));
            if (document.getElementById('k-oa')) document.getElementById('k-oa').innerHTML = mini('IEX Cost', fmtRs(iexV)) + mini('OA/IEX Rate', fmtRate(safeDiv(iexV, oaCons))) + mini('OA Utilization', fmtNum(safeDiv(oaCons, oaIss)*100, 1) + '%');
            if (document.getElementById('k-sol')) document.getElementById('k-sol').innerHTML = mini('Solar Contribution', fmtNum(safeDiv(sol, tUnits)*100, 1) + '%');
            if (document.getElementById('k-dg')) document.getElementById('k-dg').innerHTML = mini('DG Contribution', fmtNum(safeDiv(dg, tUnits)*100, 1) + '%');
            if (document.getElementById('k-fppca')) document.getElementById('k-fppca').innerHTML = mini('FPPCA Impact', fmtRate(avgArr(ds['Landed Rate/Kwh with FPPC (Rs.)']) - avgArr(ds['Landed Rate/Kwh without FPPC (Rs.)'])));

            destroyAllCharts();
            renderCharts(ds, ml);
        });
    }

    return { render, destroyAllCharts };
})();
window.EnergyDashboard = EnergyDashboard;