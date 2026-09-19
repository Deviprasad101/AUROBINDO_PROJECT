/**
 * Charts Module
 * Handles Chart.js initialization and updates
 */
const ChartManager = {
    colors: {
        primary: '#4f46e5',
        primaryLight: 'rgba(79, 70, 229, 0.2)',
        secondary: '#10b981',
        secondaryLight: 'rgba(16, 185, 129, 0.2)',
        tertiary: '#f59e0b',
        text: '#64748b',
        grid: '#e2e8f0'
    },
    
    initCharts: function() {
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = this.colors.text;
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.cornerRadius = 8;
        
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
        
        this.createMonthlyTrendChart(chartData.monthlyTrend);
        this.createCategoryDistChart(chartData.sourceDist);
    },
    
    createMonthlyTrendChart: function(trendData) {
        const ctx = document.getElementById('chart-monthly-trend').getContext('2d');
        const labels = Object.keys(trendData).sort();
        const data = labels.map(l => trendData[l]);
        
        const formattedLabels = labels.map(l => DataProcessor.formatMonthName(l).split(' ')[0] + ' ' + l.split('-')[0].slice(2));
        
        // Create a premium looking gradient for the bars
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.9)'); // Deep Indigo
        gradient.addColorStop(1, 'rgba(79, 70, 229, 0.3)'); // Soft Indigo
        
        AppState.charts.monthlyTrend = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: formattedLabels,
                datasets: [{
                    label: 'Total Value (Rs.)',
                    data: data,
                    backgroundColor: gradient,
                    hoverBackgroundColor: this.colors.primary,
                    borderRadius: 8,
                    borderWidth: 0,
                    barPercentage: 0.6
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
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { size: 14, family: "'Inter', sans-serif" },
                        bodyFont: { size: 14, family: "'Inter', sans-serif" },
                        padding: 12,
                        cornerRadius: 8,
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
                            borderDash: [5, 5]
                        },
                        ticks: {
                            font: { family: "'Inter', sans-serif", size: 11 },
                            color: this.colors.text,
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
                            font: { family: "'Inter', sans-serif", size: 11 },
                            color: this.colors.text
                        }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    },
    
    createCategoryDistChart: function(sourceDistData) {
        const ctx = document.getElementById('chart-category-dist').getContext('2d');
        const labels = Object.keys(sourceDistData);
        const data = Object.values(sourceDistData);
        
        if (data.length === 0 || data.every(v => v === 0)) {
            // Handle empty state manually if needed
            return;
        }

        AppState.charts.categoryDist = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        this.colors.primary,
                        this.colors.secondary,
                        this.colors.tertiary
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => ` ${context.label}: ${DataProcessor.formatCurrency(context.raw)} Units`
                        }
                    }
                }
            }
        });
    }
};

window.ChartManager = ChartManager;
