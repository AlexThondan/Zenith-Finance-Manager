// Professional Dashboard with Chart.js
class ZenithDashboard {
    constructor() {
        this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (!this.currentUser) {
            window.location.href = 'index.html';
            return;
        }

        this.transactions = this.loadTransactions();
        this.currency = this.currentUser.currencySymbol || '₹';
        this.currencyCode = this.currentUser.currency || 'INR';
        this.charts = {};

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
        this.initCharts();
    }

    loadTransactions() {
        const key = `transactions_${this.currentUser.id}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    saveTransactions() {
        const key = `transactions_${this.currentUser.id}`;
        localStorage.setItem(key, JSON.stringify(this.transactions));
    }

    setupEventListeners() {
        // Logout
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('currentUser');
                window.location.href = 'index.html';
            }
        });

        // Add transaction
        document.getElementById('addTransactionBtn')?.addEventListener('click', () => {
            this.openModal();
        });

        // Modal
        document.getElementById('modalClose')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.querySelector('.modal-overlay')?.addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('cancelBtn')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Form submission
        document.getElementById('transactionForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Chart tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateSpendingChart(e.target.dataset.period);
            });
        });
    }

    openModal() {
        document.getElementById('transactionModal').classList.add('active');
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    closeModal() {
        document.getElementById('transactionModal').classList.remove('active');
        document.getElementById('transactionForm').reset();
    }

    addTransaction() {
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value);
        const type = document.getElementById('type').value;
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        const transaction = {
            id: Date.now().toString(),
            description,
            amount,
            type,
            category,
            date
        };

        this.transactions.unshift(transaction);
        this.saveTransactions();
        this.closeModal();
        this.render();
        this.updateCharts();
        this.showNotification('Transaction added successfully! 🎉', 'success');
    }

    calculateStats() {
        const income = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            balance: income - expense,
            income,
            expense,
            savings: income - expense
        };
    }

    getCategoryData() {
        const expenses = this.transactions.filter(t => t.type === 'expense');
        const categoryMap = {};

        expenses.forEach(t => {
            if (!categoryMap[t.category]) {
                categoryMap[t.category] = 0;
            }
            categoryMap[t.category] += t.amount;
        });

        return Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }

    render() {
        this.renderStats();
        this.renderTransactions();
        this.renderCategories();
    }

    renderStats() {
        const stats = this.calculateStats();

        document.getElementById('totalBalance').textContent =
            `${this.currency}${this.formatNumber(stats.balance)}`;
        document.getElementById('totalIncome').textContent =
            `${this.currency}${this.formatNumber(stats.income)}`;
        document.getElementById('totalExpenses').textContent =
            `${this.currency}${this.formatNumber(stats.expense)}`;
        document.getElementById('savingsGoal').textContent =
            `${this.currency}${this.formatNumber(stats.savings)}`;
    }

    renderTransactions() {
        const container = document.getElementById('transactionsList');
        const recent = this.transactions.slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #94a3b8;">No transactions yet</p>';
            return;
        }

        const icons = {
            'Food': { icon: '🍔', bg: '#fef3c7' },
            'Shopping': { icon: '🛍️', bg: '#fce7f3' },
            'Transport': { icon: '🚗', bg: '#dbeafe' },
            'Entertainment': { icon: '🎬', bg: '#e9d5ff' },
            'Healthcare': { icon: '🏥', bg: '#dcfce7' },
            'Utilities': { icon: '💡', bg: '#fef9c3' },
            'Rent': { icon: '🏠', bg: '#fed7aa' },
            'Education': { icon: '📚', bg: '#ddd6fe' },
            'Salary': { icon: '💰', bg: '#d1fae5' },
            'Other': { icon: '📦', bg: '#e2e8f0' }
        };

        const html = recent.map(t => {
            const iconData = icons[t.category] || icons['Other'];
            return `
                <div class="transaction-item">
                    <div class="transaction-icon" style="background: ${iconData.bg}">
                        ${iconData.icon}
                    </div>
                    <div class="transaction-details">
                        <div class="transaction-name">${this.escapeHtml(t.description)}</div>
                        <div class="transaction-date">${this.formatDate(t.date)}</div>
                    </div>
                    <div class="transaction-amount ${t.type}">
                        ${t.type === 'income' ? '+' : '-'}${this.currency}${this.formatNumber(t.amount)}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    renderCategories() {
        const container = document.getElementById('categoriesList');
        const categories = this.getCategoryData().slice(0, 5);

        if (categories.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #94a3b8;">No categories yet</p>';
            return;
        }

        const icons = {
            'Food': { icon: '🍔', bg: '#fef3c7', color: '#f59e0b' },
            'Shopping': { icon: '🛍️', bg: '#fce7f3', color: '#ec4899' },
            'Transport': { icon: '🚗', bg: '#dbeafe', color: '#3b82f6' },
            'Entertainment': { icon: '🎬', bg: '#e9d5ff', color: '#8b5cf6' },
            'Healthcare': { icon: '🏥', bg: '#dcfce7', color: '#10b981' },
            'Utilities': { icon: '💡', bg: '#fef9c3', color: '#eab308' },
            'Rent': { icon: '🏠', bg: '#fed7aa', color: '#f97316' },
            'Education': { icon: '📚', bg: '#ddd6fe', color: '#6366f1' },
            'Salary': { icon: '💰', bg: '#d1fae5', color: '#059669' },
            'Other': { icon: '📦', bg: '#e2e8f0', color: '#64748b' }
        };

        const total = categories.reduce((sum, cat) => sum + cat.value, 0);

        const html = categories.map(cat => {
            const iconData = icons[cat.name] || icons['Other'];
            const percentage = (cat.value / total) * 100;

            return `
                <div class="category-item">
                    <div class="category-icon" style="background: ${iconData.bg}">
                        ${iconData.icon}
                    </div>
                    <div class="category-info">
                        <div class="category-name">${cat.name}</div>
                        <div class="category-progress">
                            <div class="category-progress-fill" style="width: ${percentage}%; background: ${iconData.color}"></div>
                        </div>
                    </div>
                    <div class="category-amount">${this.currency}${this.formatNumber(cat.value)}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    // Chart.js Integration
    initCharts() {
        this.createSpendingChart();
        this.createCategoryChart();
    }

    createSpendingChart() {
        const ctx = document.getElementById('spendingChart');
        if (!ctx) return;

        const data = this.getSpendingData('month');

        this.charts.spending = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Income',
                        data: data.income,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Expenses',
                        data: data.expenses,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 6,
                        pointHoverRadius: 8,
                        pointBackgroundColor: '#ef4444',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 13,
                                family: 'Poppins',
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            family: 'Poppins',
                            weight: '600'
                        },
                        bodyFont: {
                            size: 13,
                            family: 'Poppins'
                        },
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this.currency}${this.formatNumber(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                family: 'Poppins',
                                size: 12
                            },
                            callback: (value) => this.currency + this.formatNumber(value)
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                family: 'Poppins',
                                size: 12,
                                weight: '500'
                            }
                        }
                    }
                }
            }
        });
    }

    createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;

        const categories = this.getCategoryData();
        const colors = [
            '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6',
            '#3b82f6', '#ef4444', '#14b8a6', '#f97316', '#a855f7'
        ];

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(c => c.name),
                datasets: [{
                    data: categories.map(c => c.value),
                    backgroundColor: colors,
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12,
                                family: 'Poppins',
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            family: 'Poppins',
                            weight: '600'
                        },
                        bodyFont: {
                            size: 13,
                            family: 'Poppins'
                        },
                        callbacks: {
                            label: (context) => {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${this.currency}${this.formatNumber(context.parsed)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });
    }

    getSpendingData(period) {
        const labels = [];
        const income = [];
        const expenses = [];

        if (period === 'week') {
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

                const dayData = this.getDataForDate(date);
                income.push(dayData.income);
                expenses.push(dayData.expense);
            }
        } else if (period === 'month') {
            for (let i = 29; i >= 0; i -= 5) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                labels.push(date.getDate());

                const dayData = this.getDataForDate(date);
                income.push(dayData.income);
                expenses.push(dayData.expense);
            }
        } else {
            for (let i = 11; i >= 0; i--) {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                labels.push(date.toLocaleDateString('en-US', { month: 'short' }));

                const monthData = this.getDataForMonth(date);
                income.push(monthData.income);
                expenses.push(monthData.expense);
            }
        }

        return { labels, income, expenses };
    }

    getDataForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        const dayTransactions = this.transactions.filter(t => t.date === dateStr);

        return {
            income: dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            expense: dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
        };
    }

    getDataForMonth(date) {
        const month = date.getMonth();
        const year = date.getFullYear();
        const monthTransactions = this.transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getMonth() === month && tDate.getFullYear() === year;
        });

        return {
            income: monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
            expense: monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
        };
    }

    updateSpendingChart(period) {
        if (!this.charts.spending) return;

        const data = this.getSpendingData(period);
        this.charts.spending.data.labels = data.labels;
        this.charts.spending.data.datasets[0].data = data.income;
        this.charts.spending.data.datasets[1].data = data.expenses;
        this.charts.spending.update();
    }

    updateCharts() {
        if (this.charts.spending) {
            const data = this.getSpendingData('month');
            this.charts.spending.data.datasets[0].data = data.income;
            this.charts.spending.data.datasets[1].data = data.expenses;
            this.charts.spending.update();
        }

        if (this.charts.category) {
            const categories = this.getCategoryData();
            this.charts.category.data.labels = categories.map(c => c.name);
            this.charts.category.data.datasets[0].data = categories.map(c => c.value);
            this.charts.category.update();
        }
    }

    formatNumber(num) {
        return new Intl.NumberFormat('en-IN').format(Math.round(num));
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric'
            }).format(date);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.textContent = message;

        const colors = {
            success: 'linear-gradient(135deg, #10b981, #059669)',
            error: 'linear-gradient(135deg, #ef4444, #dc2626)',
            info: 'linear-gradient(135deg, #6366f1, #8b5cf6)'
        };

        notification.style.cssText = `
            position: fixed;
            top: 24px;
            right: 24px;
            background: ${colors[type]};
            color: white;
            padding: 16px 24px;
            border-radius: 14px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideInRight 0.4s ease;
            font-weight: 600;
            font-family: Poppins, sans-serif;
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.4s ease';
            setTimeout(() => notification.remove(), 400);
        }, 3000);
    }
}

// Animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOutRight {
        from { opacity: 1; transform: translateX(0); }
        to { opacity: 0; transform: translateX(100px); }
    }
`;
document.head.appendChild(style);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new ZenithDashboard();

    // Add demo data if empty
    if (window.dashboard.transactions.length === 0) {
        const demoTransactions = [
            { id: '1', description: 'Monthly Salary', amount: 75000, type: 'income', category: 'Salary', date: new Date().toISOString().split('T')[0] },
            { id: '2', description: 'Freelance Project', amount: 25000, type: 'income', category: 'Other', date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0] },
            { id: '3', description: 'Grocery Shopping', amount: 3500, type: 'expense', category: 'Food', date: new Date().toISOString().split('T')[0] },
            { id: '4', description: 'New Laptop', amount: 65000, type: 'expense', category: 'Shopping', date: new Date(Date.now() - 86400000).toISOString().split('T')[0] },
            { id: '5', description: 'Uber Rides', amount: 1200, type: 'expense', category: 'Transport', date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0] },
            { id: '6', description: 'Netflix Subscription', amount: 649, type: 'expense', category: 'Entertainment', date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0] },
            { id: '7', description: 'Electricity Bill', amount: 2500, type: 'expense', category: 'Utilities', date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0] },
            { id: '8', description: 'House Rent', amount: 15000, type: 'expense', category: 'Rent', date: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0] }
        ];

        window.dashboard.transactions = demoTransactions;
        window.dashboard.saveTransactions();
        window.dashboard.render();
        window.dashboard.updateCharts();
    }
});
