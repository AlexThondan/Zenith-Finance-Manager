// Comprehensive Multi-Page Dashboard
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
        this.currentPage = 'dashboard';

        // Exchange rates (base: USD)
        this.exchangeRates = {
            USD: 1,
            INR: 83.12,
            GBP: 0.79,
            EUR: 0.92,
            AED: 3.67
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.render();
        this.initCharts();
        this.setupCurrencyConverter();
    }

    loadTransactions() {
        const key = `transactions_${this.currentUser.id}`;
        return JSON.parse(localStorage.getItem(key) || '[]');
    }

    saveTransactions() {
        const key = `transactions_${this.currentUser.id}`;
        localStorage.setItem(key, JSON.stringify(this.transactions));
    }

    setupNavigation() {
        // Navigation links
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.target.dataset.page || e.target.closest('[data-page]').dataset.page;
                this.navigateTo(page);
            });
        });
    }

    navigateTo(page) {
        // Hide all pages
        document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));

        // Show selected page
        document.getElementById(`${page}Page`).classList.add('active');

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
            if (link.dataset.page === page) {
                link.classList.add('active');
            }
        });

        // Close dropdown
        document.getElementById('userDropdown')?.classList.remove('active');

        this.currentPage = page;

        // Load page-specific content
        switch (page) {
            case 'transactions':
                this.loadTransactionsPage();
                break;
            case 'analytics':
                this.loadAnalyticsPage();
                break;
            case 'budget':
                this.loadBudgetPage();
                break;
            case 'goals':
                this.loadGoalsPage();
                break;
            case 'reports':
                this.loadReportsPage();
                break;
            case 'profile':
                this.loadProfilePage();
                break;
            case 'settings':
                this.loadSettingsPage();
                break;
        }
    }

    setupEventListeners() {
        // User menu
        document.getElementById('userAvatar')?.addEventListener('click', () => {
            document.getElementById('userDropdown').classList.toggle('active');
        });

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

        // Chart period buttons
        document.querySelectorAll('.chart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.chart-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateMainChart(e.target.dataset.period);
            });
        });

        // Currency selector
        document.getElementById('currencySelect')?.addEventListener('change', (e) => {
            this.changeCurrency(e.target.value);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu')) {
                document.getElementById('userDropdown')?.classList.remove('active');
            }
        });

        // User initial
        document.getElementById('userInitial').textContent = this.currentUser.name.charAt(0).toUpperCase();
    }

    changeCurrency(newCurrency) {
        const symbols = {
            INR: '₹',
            USD: '$',
            GBP: '£',
            EUR: '€',
            AED: 'د.إ'
        };

        this.currencyCode = newCurrency;
        this.currency = symbols[newCurrency];
        this.render();
        this.showNotification(`Currency changed to ${newCurrency}`, 'success');
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
        this.showNotification('Transaction added successfully!', 'success');
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

    convertCurrency(amount, fromCurrency) {
        const amountInUSD = amount / this.exchangeRates[fromCurrency];
        return amountInUSD * this.exchangeRates[this.currencyCode];
    }

    render() {
        this.renderStats();
        this.renderTransactions();
        this.renderCategories();
    }

    renderStats() {
        const stats = this.calculateStats();
        const originalCurrency = this.currentUser.currency || 'INR';
        const balance = this.convertCurrency(stats.balance, originalCurrency);
        const income = this.convertCurrency(stats.income, originalCurrency);
        const expense = this.convertCurrency(stats.expense, originalCurrency);
        const savings = this.convertCurrency(stats.savings, originalCurrency);

        document.getElementById('totalBalance').textContent =
            `${this.currency}${this.formatNumber(balance)}`;
        document.getElementById('totalIncome').textContent =
            `${this.currency}${this.formatNumber(income)}`;
        document.getElementById('totalExpenses').textContent =
            `${this.currency}${this.formatNumber(expense)}`;
        document.getElementById('totalSavings').textContent =
            `${this.currency}${this.formatNumber(savings)}`;
    }

    renderTransactions() {
        const container = document.getElementById('transactionsList');
        const recent = this.transactions.slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No transactions yet</p>';
            return;
        }

        const html = recent.map(t => {
            const originalCurrency = this.currentUser.currency || 'INR';
            const convertedAmount = this.convertCurrency(t.amount, originalCurrency);

            return `
                <div class="transaction-item">
                    <div class="transaction-info">
                        <div class="transaction-name">${this.escapeHtml(t.description)}</div>
                        <div class="transaction-category">${t.category} • ${this.formatDate(t.date)}</div>
                    </div>
                    <div class="transaction-amount ${t.type}">
                        ${t.type === 'income' ? '+' : '-'}${this.currency}${this.formatNumber(convertedAmount)}
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
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 20px;">No categories yet</p>';
            return;
        }

        const html = categories.map(cat => {
            const originalCurrency = this.currentUser.currency || 'INR';
            const convertedAmount = this.convertCurrency(cat.value, originalCurrency);

            return `
                <div class="category-item">
                    <div class="category-name">${cat.name}</div>
                    <div class="category-amount">${this.currency}${this.formatNumber(convertedAmount)}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = html;
    }

    // Transactions Page
    loadTransactionsPage() {
        const container = document.getElementById('allTransactionsTable');

        if (this.transactions.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 40px;">No transactions yet</p>';
            return;
        }

        let html = `
            <div class="transaction-row header">
                <div>Description</div>
                <div>Category</div>
                <div>Type</div>
                <div>Date</div>
                <div>Amount</div>
                <div></div>
            </div>
        `;

        this.transactions.forEach(t => {
            const originalCurrency = this.currentUser.currency || 'INR';
            const convertedAmount = this.convertCurrency(t.amount, originalCurrency);

            html += `
                <div class="transaction-row">
                    <div>${this.escapeHtml(t.description)}</div>
                    <div>${t.category}</div>
                    <div style="color: ${t.type === 'income' ? '#10b981' : '#ef4444'}">${t.type}</div>
                    <div>${this.formatDate(t.date)}</div>
                    <div style="font-weight: 700; color: ${t.type === 'income' ? '#10b981' : '#ef4444'}">
                        ${t.type === 'income' ? '+' : '-'}${this.currency}${this.formatNumber(convertedAmount)}
                    </div>
                    <div>
                        <button onclick="dashboard.deleteTransaction('${t.id}')" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">Delete</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;

        // Setup filters
        this.setupTransactionFilters();
    }

    setupTransactionFilters() {
        const searchInput = document.getElementById('searchTransactions');
        const categoryFilter = document.getElementById('filterCategory');
        const typeFilter = document.getElementById('filterType');

        const applyFilters = () => {
            const searchTerm = searchInput.value.toLowerCase();
            const category = categoryFilter.value;
            const type = typeFilter.value;

            const filtered = this.transactions.filter(t => {
                const matchesSearch = t.description.toLowerCase().includes(searchTerm);
                const matchesCategory = category === 'all' || t.category === category;
                const matchesType = type === 'all' || t.type === type;
                return matchesSearch && matchesCategory && matchesType;
            });

            this.renderFilteredTransactions(filtered);
        };

        searchInput?.addEventListener('input', applyFilters);
        categoryFilter?.addEventListener('change', applyFilters);
        typeFilter?.addEventListener('change', applyFilters);
    }

    renderFilteredTransactions(filtered) {
        const container = document.getElementById('allTransactionsTable');

        let html = `
            <div class="transaction-row header">
                <div>Description</div>
                <div>Category</div>
                <div>Type</div>
                <div>Date</div>
                <div>Amount</div>
                <div></div>
            </div>
        `;

        filtered.forEach(t => {
            const originalCurrency = this.currentUser.currency || 'INR';
            const convertedAmount = this.convertCurrency(t.amount, originalCurrency);

            html += `
                <div class="transaction-row">
                    <div>${this.escapeHtml(t.description)}</div>
                    <div>${t.category}</div>
                    <div style="color: ${t.type === 'income' ? '#10b981' : '#ef4444'}">${t.type}</div>
                    <div>${this.formatDate(t.date)}</div>
                    <div style="font-weight: 700; color: ${t.type === 'income' ? '#10b981' : '#ef4444'}">
                        ${t.type === 'income' ? '+' : '-'}${this.currency}${this.formatNumber(convertedAmount)}
                    </div>
                    <div>
                        <button onclick="dashboard.deleteTransaction('${t.id}')" style="padding: 6px 12px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;">Delete</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    deleteTransaction(id) {
        if (confirm('Are you sure you want to delete this transaction?')) {
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveTransactions();
            this.loadTransactionsPage();
            this.render();
            this.updateCharts();
            this.showNotification('Transaction deleted', 'success');
        }
    }

    // Analytics Page
    loadAnalyticsPage() {
        setTimeout(() => {
            this.createAnalyticsCharts();
            this.generateInsights();
        }, 100);
    }

    createAnalyticsCharts() {
        // Monthly Trend Chart
        const monthlyCtx = document.getElementById('monthlyTrendChart');
        if (monthlyCtx && !this.charts.monthlyTrend) {
            const data = this.getMonthlyTrendData();
            this.charts.monthlyTrend = new Chart(monthlyCtx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Net Savings',
                        data: data.values,
                        backgroundColor: '#10b981'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Category Bar Chart
        const categoryBarCtx = document.getElementById('categoryBarChart');
        if (categoryBarCtx && !this.charts.categoryBar) {
            const categories = this.getCategoryData();
            this.charts.categoryBar = new Chart(categoryBarCtx, {
                type: 'bar',
                data: {
                    labels: categories.map(c => c.name),
                    datasets: [{
                        label: 'Spending',
                        data: categories.map(c => c.value),
                        backgroundColor: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y'
                }
            });
        }

        // Income Sources Chart
        const incomeCtx = document.getElementById('incomeSourcesChart');
        if (incomeCtx && !this.charts.incomeSources) {
            const incomeData = this.getIncomeSourcesData();
            this.charts.incomeSources = new Chart(incomeCtx, {
                type: 'pie',
                data: {
                    labels: incomeData.labels,
                    datasets: [{
                        data: incomeData.values,
                        backgroundColor: ['#10b981', '#059669', '#34d399', '#6ee7b7']
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Daily Average Chart
        const dailyCtx = document.getElementById('dailyAverageChart');
        if (dailyCtx && !this.charts.dailyAverage) {
            const dailyData = this.getDailyAverageData();
            this.charts.dailyAverage = new Chart(dailyCtx, {
                type: 'line',
                data: {
                    labels: dailyData.labels,
                    datasets: [{
                        label: 'Daily Spending',
                        data: dailyData.values,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    getMonthlyTrendData() {
        const labels = [];
        const values = [];

        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short' }));

            const monthData = this.getDataForMonth(date);
            values.push(monthData.income - monthData.expense);
        }

        return { labels, values };
    }

    getIncomeSourcesData() {
        const incomeTransactions = this.transactions.filter(t => t.type === 'income');
        const sourceMap = {};

        incomeTransactions.forEach(t => {
            if (!sourceMap[t.category]) {
                sourceMap[t.category] = 0;
            }
            sourceMap[t.category] += t.amount;
        });

        return {
            labels: Object.keys(sourceMap),
            values: Object.values(sourceMap)
        };
    }

    getDailyAverageData() {
        const labels = [];
        const values = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

            const dayData = this.getDataForDate(date);
            values.push(dayData.expense);
        }

        return { labels, values };
    }

    generateInsights() {
        const container = document.getElementById('insightsGrid');
        const stats = this.calculateStats();
        const avgDaily = stats.expense / 30;
        const topCategory = this.getCategoryData()[0];

        const insights = [
            {
                title: 'Average Daily Spending',
                description: `You spend an average of ${this.currency}${this.formatNumber(avgDaily)} per day`
            },
            {
                title: 'Top Spending Category',
                description: `${topCategory?.name || 'None'} is your highest expense category`
            },
            {
                title: 'Savings Rate',
                description: `You're saving ${((stats.savings / stats.income) * 100).toFixed(1)}% of your income`
            }
        ];

        container.innerHTML = insights.map(insight => `
            <div class="insight-card">
                <h4>${insight.title}</h4>
                <p>${insight.description}</p>
            </div>
        `).join('');
    }

    // Profile Page
    loadProfilePage() {
        document.getElementById('profileName').value = this.currentUser.name;
        document.getElementById('profileEmail').value = this.currentUser.email;
        document.getElementById('profilePhone').value = this.currentUser.phone;

        document.getElementById('memberSince').textContent =
            new Date(this.currentUser.createdAt).toLocaleDateString();
        document.getElementById('totalTransCount').textContent = this.transactions.length;
        document.getElementById('categoriesUsed').textContent = this.getCategoryData().length;

        const stats = this.calculateStats();
        const avgDaily = stats.expense / 30;
        document.getElementById('avgDailySpending').textContent =
            `${this.currency}${this.formatNumber(avgDaily)}`;

        // Profile form submission
        document.getElementById('profileForm').onsubmit = (e) => {
            e.preventDefault();
            this.updateProfile();
        };
    }

    updateProfile() {
        this.currentUser.name = document.getElementById('profileName').value;
        this.currentUser.email = document.getElementById('profileEmail').value;
        this.currentUser.phone = document.getElementById('profilePhone').value;

        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));

        // Update users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const index = users.findIndex(u => u.id === this.currentUser.id);
        if (index !== -1) {
            users[index] = this.currentUser;
            localStorage.setItem('users', JSON.stringify(users));
        }

        this.showNotification('Profile updated successfully!', 'success');
    }

    // Settings Page
    loadSettingsPage() {
        document.getElementById('defaultCurrency').value = this.currencyCode;
        document.getElementById('budgetLimit').value = localStorage.getItem('budgetLimit') || 35000;

        // Save preferences
        document.getElementById('savePreferences').onclick = () => {
            const currency = document.getElementById('defaultCurrency').value;
            const budget = document.getElementById('budgetLimit').value;

            localStorage.setItem('budgetLimit', budget);
            this.changeCurrency(currency);
            this.showNotification('Preferences saved!', 'success');
        };

        // Export data
        document.getElementById('exportData').onclick = () => {
            this.exportData();
        };

        // Import data
        document.getElementById('importData').onclick = () => {
            document.getElementById('importFile').click();
        };

        document.getElementById('importFile').onchange = (e) => {
            this.importData(e.target.files[0]);
        };

        // Clear data
        document.getElementById('clearData').onclick = () => {
            if (confirm('Are you sure? This will delete all transactions permanently!')) {
                this.transactions = [];
                this.saveTransactions();
                this.render();
                this.showNotification('All data cleared', 'success');
            }
        };
    }

    exportData() {
        const data = {
            user: this.currentUser,
            transactions: this.transactions,
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zenith-finance-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showNotification('Data exported successfully!', 'success');
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.transactions && Array.isArray(data.transactions)) {
                    this.transactions = data.transactions;
                    this.saveTransactions();
                    this.render();
                    this.showNotification('Data imported successfully!', 'success');
                } else {
                    this.showNotification('Invalid data format', 'error');
                }
            } catch (error) {
                this.showNotification('Error importing data', 'error');
            }
        };
        reader.readAsText(file);
    }

    // Chart.js Integration
    initCharts() {
        this.createMainChart();
        this.createCategoryChart();
    }

    createMainChart() {
        const ctx = document.getElementById('mainChart');
        if (!ctx) return;

        const data = this.getChartData('month');

        this.charts.main = new Chart(ctx, {
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
                        tension: 0.4
                    },
                    {
                        label: 'Expenses',
                        data: data.expenses,
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.currency + this.formatNumber(value)
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
        const colors = ['#10b981', '#059669', '#34d399', '#6ee7b7', '#a7f3d0'];

        this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories.map(c => c.name),
                datasets: [{
                    data: categories.map(c => c.value),
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    getChartData(period) {
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

    updateMainChart(period) {
        if (!this.charts.main) return;

        const data = this.getChartData(period);
        this.charts.main.data.labels = data.labels;
        this.charts.main.data.datasets[0].data = data.income;
        this.charts.main.data.datasets[1].data = data.expenses;
        this.charts.main.update();
    }

    updateCharts() {
        if (this.charts.main) {
            const data = this.getChartData('month');
            this.charts.main.data.datasets[0].data = data.income;
            this.charts.main.data.datasets[1].data = data.expenses;
            this.charts.main.update();
        }

        if (this.charts.category) {
            const categories = this.getCategoryData();
            this.charts.category.data.labels = categories.map(c => c.name);
            this.charts.category.data.datasets[0].data = categories.map(c => c.value);
            this.charts.category.update();
        }
    }

    // Currency Converter
    setupCurrencyConverter() {
        const convertBtn = document.getElementById('convertBtn');
        const swapBtn = document.getElementById('swapCurrencies');

        convertBtn?.addEventListener('click', () => {
            this.performConversion();
        });

        swapBtn?.addEventListener('click', () => {
            const from = document.getElementById('convertFrom');
            const to = document.getElementById('convertTo');
            const temp = from.value;
            from.value = to.value;
            to.value = temp;
            this.performConversion();
        });

        document.getElementById('convertAmount')?.addEventListener('input', () => {
            this.performConversion();
        });

        document.getElementById('convertFrom')?.addEventListener('change', () => {
            this.performConversion();
        });

        document.getElementById('convertTo')?.addEventListener('change', () => {
            this.performConversion();
        });

        this.performConversion();
    }

    performConversion() {
        const amount = parseFloat(document.getElementById('convertAmount').value) || 0;
        const from = document.getElementById('convertFrom').value;
        const to = document.getElementById('convertTo').value;

        const symbols = {
            INR: '₹',
            USD: '$',
            GBP: '£',
            EUR: '€',
            AED: 'د.إ'
        };

        const amountInUSD = amount / this.exchangeRates[from];
        const result = amountInUSD * this.exchangeRates[to];

        document.getElementById('conversionResult').textContent =
            `${symbols[to]}${this.formatNumber(result)}`;
    }

    formatNumber(num) {
        return new Intl.NumberFormat('en-IN').format(Math.round(num * 100) / 100);
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
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };

        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 24px;
            background: ${colors[type]};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
            font-size: 15px;
        `;

        @keyframes slideIn {
        from { opacity: 0; transform: translateX(100px); }
        to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideOut {
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
            { id: '6', description: 'Netflix', amount: 649, type: 'expense', category: 'Entertainment', date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0] },
            { id: '7', description: 'Electricity Bill', amount: 2500, type: 'expense', category: 'Utilities', date: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0] }
        ];

        window.dashboard.transactions = demoTransactions;
        window.dashboard.saveTransactions();
        window.dashboard.render();
        window.dashboard.updateCharts();
    }
});

    // Budget Page
    loadBudgetPage() {
        const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
        const container = document.getElementById('budgetsGrid');
        
        if (budgets.length === 0) {
            budgets.push(
                { id: '1', category: 'Food', limit: 10000, icon: '', color: '#f59e0b' },
                { id: '2', category: 'Transport', limit: 5000, icon: '', color: '#3b82f6' },
                { id: '3', category: 'Entertainment', limit: 3000, icon: '', color: '#8b5cf6' },
                { id: '4', category: 'Shopping', limit: 8000, icon: '', color: '#ec4899' }
            );
            localStorage.setItem('budgets', JSON.stringify(budgets));
        }
        
        const html = budgets.map(budget => {
            const spent = this.transactions
                .filter(t => t.type === 'expense' && t.category === budget.category)
                .reduce((sum, t) => sum + t.amount, 0);
            const percentage = (spent / budget.limit) * 100;
            const remaining = budget.limit - spent;
            const status = percentage > 90 ? 'danger' : percentage > 70 ? 'warning' : '';
            
            return \
                <div class="budget-card">
                    <h4>\ \</h4>
                    <div class="budget-progress">
                        <div class="budget-progress-bar">
                            <div class="budget-progress-fill \" style="width: \%"></div>
                        </div>
                        <div class="budget-info">
                            <span>\\ / \\</span>
                            <span style="color: \">\\ \</span>
                        </div>
                    </div>
                </div>
            \;
        }).join('');
        
        container.innerHTML = html;
    }

    // Goals Page
    loadGoalsPage() {
        const goals = JSON.parse(localStorage.getItem('goals') || '[]');
        const container = document.getElementById('goalsGrid');
        
        if (goals.length === 0) {
            goals.push(
                { id: '1', name: 'Emergency Fund', target: 100000, current: 45000, deadline: '2024-12-31', icon: '' },
                { id: '2', name: 'Vacation', target: 50000, current: 32000, deadline: '2024-06-30', icon: '' },
                { id: '3', name: 'New Laptop', target: 80000, current: 55000, deadline: '2024-03-31', icon: '' }
            );
            localStorage.setItem('goals', JSON.stringify(goals));
        }
        
        const html = goals.map(goal => {
            const percentage = (goal.current / goal.target) * 100;
            const remaining = goal.target - goal.current;
            
            return \
                <div class="goal-card">
                    <div class="goal-header">
                        <h4>\</h4>
                        <div class="goal-icon">\</div>
                    </div>
                    <div class="goal-amount">\\</div>
                    <div class="goal-target">of \\ goal</div>
                    <div class="goal-progress">
                        <div class="goal-progress-bar">
                            <div class="goal-progress-fill" style="width: \%"></div>
                        </div>
                        <div class="goal-percentage">\% Complete</div>
                    </div>
                    <div class="goal-deadline">Target: \</div>
                </div>
            \;
        }).join('');
        
        container.innerHTML = html;
    }

    // Reports Page
    loadReportsPage() {
        setTimeout(() => {
            this.createReportCharts();
            this.generateCashFlow();
        }, 100);
    }

    createReportCharts() {
        // Income Report Chart
        const incomeCtx = document.getElementById('incomeReportChart');
        if (incomeCtx && !this.charts.incomeReport) {
            const data = this.getIncomeReportData();
            this.charts.incomeReport = new Chart(incomeCtx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Income',
                        data: data.values,
                        backgroundColor: '#10b981'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }

        // Expense Report Chart
        const expenseCtx = document.getElementById('expenseReportChart');
        if (expenseCtx && !this.charts.expenseReport) {
            const data = this.getExpenseReportData();
            this.charts.expenseReport = new Chart(expenseCtx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Expenses',
                        data: data.values,
                        backgroundColor: '#ef4444'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }
    }

    getIncomeReportData() {
        const labels = [];
        const values = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
            
            const monthData = this.getDataForMonth(date);
            values.push(monthData.income);
        }
        
        return { labels, values };
    }

    getExpenseReportData() {
        const labels = [];
        const values = [];
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short' }));
            
            const monthData = this.getDataForMonth(date);
            values.push(monthData.expense);
        }
        
        return { labels, values };
    }

    generateCashFlow() {
        const container = document.getElementById('cashFlowTable');
        const stats = this.calculateStats();
        
        const html = \
            <div class="cash-flow-row">
                <div>Description</div>
                <div>This Month</div>
                <div>Last Month</div>
                <div>Change</div>
            </div>
            <div class="cash-flow-row">
                <div>Total Income</div>
                <div>\\</div>
                <div>\\</div>
                <div style="color: #10b981">+8%</div>
            </div>
            <div class="cash-flow-row">
                <div>Total Expenses</div>
                <div>\\</div>
                <div>\\</div>
                <div style="color: #ef4444">+5%</div>
            </div>
            <div class="cash-flow-row">
                <div><strong>Net Cash Flow</strong></div>
                <div><strong>\\</strong></div>
                <div><strong>\\</strong></div>
                <div style="color: #10b981"><strong>+15%</strong></div>
            </div>
        \;
        
        container.innerHTML = html;
    }
