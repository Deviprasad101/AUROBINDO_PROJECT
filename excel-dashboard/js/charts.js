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
            document.querySelector('.charts-section').style.gridTemplateColumns = '2fr 1fr';
        } else {
            // Hide pie chart if filtering by a single unit
            pieCard.style.display = 'none';
            document.querySelector('.charts-section').style.gridTemplateColumns = '1fr';
        }
    },
    
    createMonthlyTrendChart: function(trendData, canvasId = 'chart-monthly-trend', chartKey = 'monthlyTrend', datasetLabel = 'Total Value (Rs.)') {
        if (AppState.charts[chartKey]) {
            AppState.charts[chartKey].destroy();
        }
        
        const ctx = document.getElementById(canvasId).getContext('2d');
        const labels = Object.keys(trendData).sort();
        const data = labels.map(l => trendData[l]);
        
        const formattedLabels = labels.map(l => DataProcessor.formatMonthName(l).split(' ')[0] + ' ' + l.split('-')[0].slice(2));
        
        // Create a premium looking gradient for the bars
        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.95)'); // Deep Indigo
        gradient.addColorStop(1, 'rgba(79, 70, 229, 0.1)'); // Soft Indigo
        
        AppState.charts[chartKey] = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: formattedLabels,
                datasets: [{
                    label: datasetLabel,
                    data: data,
                    backgroundColor: gradient,
                    hoverBackgroundColor: this.colors.primary,
                    borderRadius: 6,
                    borderWidth: 0,
                    barPercentage: 0.5,
                    categoryPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        titleFont: { size: 14, weight: '600' },
                        bodyFont: { size: 14, weight: '500' },
                        callbacks: {
                            label: function(context) {
                                return `Value: ₹${DataProcessor.formatCurrency(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
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
                                if (value >= 10000000) return '₹' + (value / 10000000).toFixed(1) + ' Cr';
                                if (value >= 100000) return '₹' + (value / 100000).toFixed(1) + ' L';
                                if (value >= 1000) return '₹' + (value / 1000).toFixed(1) + ' K';
                                return '₹' + value;
                            }
                        }
                    },
                    x: {
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
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.raw / total) * 100).toFixed(1);
                                return ` ${context.label}: ${DataProcessor.formatCurrency(context.raw)} KWH (${percentage}%)`;
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
