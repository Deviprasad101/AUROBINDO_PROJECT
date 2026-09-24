/**
 * Charts Module
 * Handles Chart.js initialization and updates
 */
const ChartManager = {
    colors: {
        primary: '#4f46e5',
        primaryLight: 'rgba(79, 70, 229, 0.2)',
        secondary: '#0ea5e9',
        secondaryLight: 'rgba(14, 165, 233, 0.2)',
        success: '#10b981',
        warning: '#f59e0b',
        tertiary: '#8b5cf6',
        text: '#64748b',
        grid: '#e2e8f0',
        tooltipBg: 'rgba(15, 23, 42, 0.95)'
    },
    
    initCharts: function() {
        Chart.defaults.font.family = "'Inter', -apple-system, sans-serif";
        Chart.defaults.color = this.colors.text;
        Chart.defaults.plugins.tooltip.padding = 12;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        Chart.defaults.plugins.tooltip.backgroundColor = this.colors.tooltipBg;
        
        // Destroy existing charts if any
        this.destroyAll();
    },
    
    destroyAll: function() {
        Object.keys(AppState.charts).forEach(key => {
            if (AppState.charts[key]) {
                AppState.charts[key].destroy();
            }
        });
        AppState.charts = {};
    },
    
    updateAllCharts: function(chartData) {
        this.initCharts();
        
        if (Object.keys(chartData.monthlyTrend).length > 0) {
            this.createMonthlyTrendChart(chartData.monthlyTrend);
        }
        
        const pieCard = document.getElementById('pie-chart-card');
        if (Object.keys(chartData.sourceDist).length > 0 && !AppState.selectedUnit) {
            pieCard.style.display = 'block';
            this.createCategoryDistChart(chartData.sourceDist);
            
            // Adjust grid layout for charts if both are showing
            document.querySelector('.charts-section').classList.add('has-pie');
        } else {
            // Hide pie chart if filtering by a single unit
            pieCard.style.display = 'none';
            document.querySelector('.charts-section').classList.remove('has-pie');
        }
    },
    
    createMonthlyTrendChart: function(trendData, wrapperId = 'wrapper-monthly-trend-units', chartKeyBase = 'monthlyTrend', datasetLabels = ['Total Value (Rs.)']) {
        const wrapper = document.getElementById(wrapperId);
        if (!wrapper) return;
        wrapper.innerHTML = '';
        
        const labels = Object.keys(trendData).sort();
        if (labels.length === 0) return;
        
        // Find unique years
        const years = [...new Set(labels.map(l => l.split('-')[0]))];
        
        years.forEach(year => {
            const yearLabels = labels.filter(l => l.startsWith(year));
            const chartKey = chartKeyBase + '_' + year;
            
            if (AppState.charts[chartKey]) {
                AppState.charts[chartKey].destroy();
            }
            
            // Create container for this year
            const yearContainer = document.createElement('div');
            yearContainer.className = 'chart-container';
            yearContainer.style.marginBottom = '2rem';
            yearContainer.style.height = '350px';
            
            const title = document.createElement('h4');
            title.innerText = 'Year: ' + year;
            title.style.textAlign = 'center';
            title.style.marginBottom = '10px';
            title.style.color = 'var(--text-main)';
            title.style.fontWeight = '600';
            
            const canvas = document.createElement('canvas');
            canvas.id = 'canvas_' + chartKey;
            
            yearContainer.appendChild(title);
            yearContainer.appendChild(canvas);
            wrapper.appendChild(yearContainer);
            
            const ctx = canvas.getContext('2d');
            const formattedLabels = yearLabels.map(l => DataProcessor.formatMonthName(l).split(' ')[0] + ' ' + l.split('-')[0].slice(2));
            
            const gradients = [];
            const grad1 = ctx.createLinearGradient(0, 0, 0, 320);
            grad1.addColorStop(0, 'rgba(79, 70, 229, 0.95)');
            grad1.addColorStop(1, 'rgba(79, 70, 229, 0.1)');
            gradients.push({ bg: grad1, hover: this.colors.primary });
            
            const grad2 = ctx.createLinearGradient(0, 0, 0, 320);
            grad2.addColorStop(0, 'rgba(16, 185, 129, 0.95)');
            grad2.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
            gradients.push({ bg: grad2, hover: this.colors.success });
            
            const grad3 = ctx.createLinearGradient(0, 0, 0, 320);
            grad3.addColorStop(0, 'rgba(14, 165, 233, 0.95)');
            grad3.addColorStop(1, 'rgba(14, 165, 233, 0.1)');
            gradients.push({ bg: grad3, hover: this.colors.secondary });
            
            const grad4 = ctx.createLinearGradient(0, 0, 0, 320);
            grad4.addColorStop(0, 'rgba(245, 158, 11, 0.95)');
            grad4.addColorStop(1, 'rgba(245, 158, 11, 0.1)');
            gradients.push({ bg: grad4, hover: this.colors.warning });
            
            const firstMonth = labels[0];
            const keys = firstMonth ? Object.keys(trendData[firstMonth]) : [];
            const datasets = [];
            
            keys.forEach((key, index) => {
                const labelName = datasetLabels[index] || datasetLabels[0];
                const theme = gradients[index % gradients.length];
                
                const baseData = [];
                const incData = [];
                const decData = [];
                const actualData = [];
                
                yearLabels.forEach(l => {
                    const lIndex = labels.indexOf(l);
                    const val = trendData[l][key] || 0;
                    const prev = lIndex === 0 ? val : (trendData[labels[lIndex - 1]][key] || 0);
                    
                    const baseVal = Math.min(val, prev);
                    const incVal = val > prev ? val - prev : 0;
                    const decVal = val < prev ? prev - val : 0;
                    
                    baseData.push(baseVal === 0 ? null : baseVal);
                    incData.push(incVal === 0 ? null : incVal);
                    decData.push(decVal === 0 ? null : decVal);
                    actualData.push(val);
                });
                
                const baseBg = keys.length === 1 ? 'rgba(79, 70, 229, 0.9)' : theme.bg;
                const baseHover = keys.length === 1 ? '#4f46e5' : theme.hover;
                
                datasets.push({
                    label: labelName,
                    data: baseData,
                    backgroundColor: baseBg,
                    hoverBackgroundColor: baseHover,
                    stack: 'stack_' + index,
                    borderRadius: 0,
                    borderWidth: 0,
                    barPercentage: 0.6,
                    minBarLength: 5,
                    categoryPercentage: 0.8,
                    actualData: actualData
                });
                
                datasets.push({
                    label: labelName + ' (Increase)',
                    data: incData,
                    backgroundColor: 'rgba(16, 185, 129, 0.9)',
                    hoverBackgroundColor: '#10b981',
                    stack: 'stack_' + index,
                    borderRadius: 0,
                    borderWidth: 0,
                    barPercentage: 0.6,
                    minBarLength: 5,
                    categoryPercentage: 0.8,
                    actualData: actualData
                });
                
                datasets.push({
                    label: labelName + ' (Decrease)',
                    data: decData,
                    backgroundColor: 'rgba(239, 68, 68, 0.9)',
                    hoverBackgroundColor: '#ef4444',
                    stack: 'stack_' + index,
                    borderRadius: 0,
                    borderWidth: 0,
                    barPercentage: 0.6,
                    minBarLength: 5,
                    categoryPercentage: 0.8,
                    actualData: actualData
                });
            });
            
            AppState.charts[chartKey] = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: formattedLabels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: keys.length > 1,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                font: { size: 12, weight: '500', family: "'Inter', sans-serif" },
                                filter: function(item, chart) {
                                    return !item.text.includes('(Increase)') && !item.text.includes('(Decrease)');
                                }
                            }
                        },
                        tooltip: {
                            titleFont: { size: 14, weight: '600' },
                            bodyFont: { size: 14, weight: '500' },
                            callbacks: {
                                label: function(context) {
                                    const actualVal = context.dataset.actualData[context.dataIndex];
                                    const isRs = context.dataset.label.includes('Rs.');
                                    const prefix = isRs && actualVal > 0 ? '₹' : '';
                                    let title = context.dataset.label;
                                    if (title.includes('Increase') || title.includes('Decrease')) {
                                        return `${title}: ${prefix}${DataProcessor.formatCurrency(context.raw)} (Total: ${prefix}${DataProcessor.formatCurrency(actualVal)})`;
                                    }
                                    return `${title}: ${prefix}${DataProcessor.formatCurrency(actualVal)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            stacked: true,
                            beginAtZero: true,
                            grid: {
                                color: this.colors.grid,
                                drawBorder: false,
                                borderDash: [4, 4]
                            },
                            ticks: {
                                font: { size: 12, weight: '500' },
                                color: '#94a3b8',
                                callback: function(value) {
                                    const allRs = datasetLabels.every(l => l.includes('Rs.'));
                                    const prefix = allRs ? '₹' : '';
                                    let formattedValue = value;
                                    if (value >= 10000000) formattedValue = (value / 10000000).toFixed(1) + ' Cr';
                                    else if (value >= 100000) formattedValue = (value / 100000).toFixed(1) + ' L';
                                    else if (value >= 1000) formattedValue = (value / 1000).toFixed(1) + ' K';
                                    return prefix + formattedValue;
                                }
                            }
                        },
                        x: {
                            stacked: true,
                            grid: {
                                display: false,
                                drawBorder: false
                            },
                            ticks: {
                                font: { size: 12, weight: '500' },
                                color: '#64748b'
                            }
                        }
                    },
                    animation: {
                        duration: 1200,
                        easing: 'easeOutQuart'
                    }
                }
            });
        });
    },
    
    createCategoryDistChart: function(distData, canvasId = 'chart-category-dist', chartKey = 'categoryDist', datasetLabel = 'Total Value (Rs.)') {
        if (AppState.charts[chartKey]) {
            AppState.charts[chartKey].destroy();
        }
        
        const ctx = document.getElementById(canvasId).getContext('2d');
        const labels = Object.keys(distData);
        const data = labels.map(l => distData[l]);
        
        const palette = [
            this.colors.primary,
            this.colors.secondary,
            this.colors.success,
            this.colors.warning,
            this.colors.tertiary
        ];
        
        AppState.charts[chartKey] = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: palette,
                    borderWidth: 0,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { size: 12, weight: '500', family: "'Inter', sans-serif" }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let value = context.raw || 0;
                                let title = context.label || '';
                                
                                // Default prefix to rupees if dataset label indicates it
                                const isRs = datasetLabel.includes('Rs.');
                                const prefix = isRs && value > 0 ? '₹' : '';
                                
                                return `${title}: ${prefix}${DataProcessor.formatCurrency(value)}`;
                            }
                        }
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }
};

window.ChartManager = ChartManager;
