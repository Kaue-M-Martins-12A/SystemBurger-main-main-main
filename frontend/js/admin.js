// ==========================================
// Admin Dashboard Controller
// ==========================================
const Admin = {
    salesChart: null,
    pieChart: null,
    refreshInterval: null,
    currentRange: 'week',

    init: async function() {
        this.fetchDashboard();
    },

    startAutoRefresh: function() {
        if (this.refreshInterval) clearInterval(this.refreshInterval);
        if (this.currentRange === 'week') {
            this.refreshInterval = setInterval(() => {
                this.fetchDashboard('week');
            }, 30000);
        }
    },

    stopAutoRefresh: function() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    },

    // --- DASHBOARD ---
    fetchDashboard: async function(range = 'week') {
        try {
            this.currentRange = range;
            this.stopAutoRefresh();

            const res = await fetch(`/api/admin/dashboard?range=${range}`);
            const data = await res.json();

            // KPIs
            document.getElementById('kpi-vendas').textContent = `R$ ${data.kpis.vendas.toFixed(2).replace('.', ',')}`;
            document.getElementById('kpi-vendas-totais').textContent = `R$ ${data.kpis.vendas.toFixed(2).replace('.', ',')}`;
            document.getElementById('kpi-media').textContent = `R$ ${data.kpis.mediaPedidos.toFixed(2).replace('.', ',')}`;
            document.getElementById('kpi-clientes').textContent = data.kpis.clientesAtivos;
            document.getElementById('kpi-entregas').textContent = data.kpis.entregasAndamento;

            // 1. Gráfico de Vendas (Linha)
            this.renderSalesChart(data.charts.sales, range);

            // 2. Gráfico de Itens (Pizza)
            this.renderProductChart(data.charts.topProducts);

            // 3. Nichos / Líderes por Categoria
            this.renderNiches(data.charts.niches);

            // Auto-refresh only for week
            if (range === 'week') this.startAutoRefresh();

        } catch(e) {
            console.error('Error dashboard', e);
        }
    },

    // ==========================================
    // RENDER SALES CHART (dispatcher)
    // ==========================================
    renderSalesChart: function(sales, range) {
        const canvas = document.getElementById('salesChart');
        const ctx = canvas.getContext('2d');

        if (this.salesChart) {
            this.salesChart.destroy();
            this.salesChart = null;
        }

        if (range === 'week') {
            this.renderWeekChart(ctx, sales);
        } else {
            this.renderDefaultChart(ctx, sales);
        }
    },

    // ==========================================
    // GRÁFICO SEMANAL - Estilo Plataforma de Investimento
    // ==========================================
    renderWeekChart: function(ctx, sales) {
        // O backend já retorna os 7 dias completos com valores preenchidos
        // Basta adicionar o Dia 0 como baseline

        // Labels reais
        const labels = sales.map(s => s.isToday ? 'Hoje' : s.dayName);
        const values = sales.map(s => s.value || 0);
        const todayIdx = values.length - 1;

        // Informações extras para tooltip
        const dateInfo = sales;

        // Gradient de preenchimento
        const canvasEl = ctx.canvas;
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasEl.parentElement.clientHeight || 350);
        gradient.addColorStop(0, 'rgba(224, 26, 26, 0.18)');
        gradient.addColorStop(0.5, 'rgba(224, 26, 26, 0.06)');
        gradient.addColorStop(1, 'rgba(224, 26, 26, 0)');

        // Estilos por ponto
        const pointRadius = values.map((_, i) => {
            if (i === todayIdx) return 7;
            return 4;
        });
        const pointBgColor = values.map((_, i) => {
            if (i === todayIdx) return '#fff';
            return 'rgba(224, 26, 26, 0.2)';
        });

        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vendas (R$)',
                    data: values,
                    borderColor: '#E01A1A',
                    backgroundColor: gradient,
                    borderWidth: 2.5,
                    tension: 0.35,
                    fill: true,
                    pointRadius: pointRadius,
                    pointBorderWidth: values.map((_, i) => i === todayIdx ? 3 : 2),
                    pointBackgroundColor: pointBgColor,
                    pointBorderColor: '#E01A1A',
                    pointHoverRadius: 8,
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#E01A1A',
                    pointHoverBorderWidth: 3,
                    segment: {
                        borderDash: function(segCtx) {
                            return segCtx.p1DataIndex === todayIdx ? [6, 4] : undefined;
                        },
                        borderColor: function(segCtx) {
                            return segCtx.p1DataIndex === todayIdx ? 'rgba(224, 26, 26, 0.55)' : undefined;
                        }
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                },
                layout: {
                    padding: { top: 10, right: 20, bottom: 20, left: 5 }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(20, 20, 30, 0.92)',
                        titleFont: { size: 13, weight: '600', family: 'Inter' },
                        bodyFont: { size: 12, family: 'Inter' },
                        footerFont: { size: 10, family: 'Inter', style: 'italic' },
                        padding: { top: 10, bottom: 10, left: 14, right: 14 },
                        cornerRadius: 8,
                        displayColors: false,
                        borderColor: 'rgba(224, 26, 26, 0.3)',
                        borderWidth: 1,
                        callbacks: {
                            title: function(items) {
                                const idx = items[0].dataIndex;
                                const info = dateInfo[idx];
                                if (info && info.isToday) return '📊 Hoje (' + info.label + ')';
                                if (info) return '📅 ' + info.dayName + ' (' + info.label + ')';
                                return items[0].label;
                            },
                            label: function(item) {
                                return 'Vendas: R$ ' + item.parsed.y.toFixed(2).replace('.', ',');
                            },
                            footer: function(items) {
                                const idx = items[0].dataIndex;
                                const info = dateInfo[idx];
                                if (info && info.isToday) return '⏳ Dia em andamento...';
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        border: { display: false },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.04)',
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) { return 'R$ ' + value; },
                            font: { size: 11, family: 'Inter' },
                            color: '#aaa',
                            padding: 8,
                            maxTicksLimit: 6
                        }
                    },
                    x: {
                        border: { display: false },
                        grid: { display: false },
                        ticks: {
                            autoSkip: false,
                            maxRotation: 0,
                            minRotation: 0,
                            font: function(context) {
                                if (context.index === todayIdx) {
                                    return { size: 12, family: 'Inter', weight: '700' };
                                }
                                return { size: 11, family: 'Inter', weight: '400' };
                            },
                            color: function(context) {
                                if (context.index === todayIdx) return '#E01A1A';
                                return '#999';
                            },
                            padding: 10
                        }
                    }
                }
            }
        });
    },

    // ==========================================
    // GRÁFICO PADRÃO (Mensal / Anual) — Sem alterações
    // ==========================================
    renderDefaultChart: function(ctx, sales) {
        const labels = sales.map(s => s.label);
        const values = sales.map(s => s.value);

        this.salesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Vendas (R$)',
                    data: values,
                    borderColor: '#E01A1A',
                    backgroundColor: 'rgba(224, 26, 26, 0.1)',
                    borderWidth: 3,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#E01A1A',
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: true, color: '#f0f0f0' },
                        ticks: { callback: (value) => 'R$ ' + value }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    },

    renderProductChart: function(products) {
        const ctx = document.getElementById('pieChart').getContext('2d');

        if (this.pieChart) this.pieChart.destroy();

        const labels = products.map(p => p.name);
        const values = products.map(p => p.value);

        this.pieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } }
                },
                cutout: '70%'
            }
        });
    },

    renderNiches: function(niches) {
        const grid = document.getElementById('niche-grid');
        if (!grid) return;

        const catMap = {
            'burgers': '🍔 Lanche',
            'acompanhamentos': '🍟 Acomp.',
            'bebidas': '🥤 Bebida',
            'sobremesas': '🍰 Sobremesa',
            'combos': '📦 Combo'
        };

        // Encontrar o líder absoluto para o topo
        const absoluteLeader = niches.reduce((prev, current) => (prev.total_sold > current.total_sold) ? prev : current, {total_sold: 0});

        let html = '';

        if (absoluteLeader.name) {
            html += `
                <div class="niche-card active-leader" style="background: linear-gradient(135deg, #E01A1A, #C01515); color: white;">
                    <span class="niche-category" style="color: rgba(255,255,255,0.7)">🏆 Top Geral</span>
                    <h4 class="niche-product">${absoluteLeader.name}</h4>
                    <p class="niche-count" style="color: white;">${absoluteLeader.total_sold} vendidos</p>
                </div>
            `;
        }

        html += niches.map(n => `
            <div class="niche-card">
                <span class="niche-category">${catMap[n.category] || n.category}</span>
                <h4 class="niche-product">${n.name}</h4>
                <p class="niche-count">${n.total_sold} vendidos</p>
            </div>
        `).join('');

        grid.innerHTML = html;
    }
};

document.addEventListener('DOMContentLoaded', () => Admin.init());
window.Admin = Admin;
