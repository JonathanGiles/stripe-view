// Dashboard Application
class PaymentDashboard {
    constructor() {
        this.config = null;
        this.viewLayout = null;
        this.charts = {};
        this.draggedElement = null;
        this.draggedIndex = null;
        this.widgets = [];
        this.viewMode = 'compact'; // 'compact' or 'detailed'
        this.sortBy = 'default';
        this.filterBy = 'all';
        this.preferredCurrency = 'NZD';
        this.themeMode = 'light'; // 'light' or 'dark'
        this.themeColor = 'purple'; // 'purple', 'blue', 'green', 'red', 'orange', 'yellow'
        this.exchangeRates = {};
        this.pollingInterval = null;
        this.lastSalesCount = new Map(); // Track sales count per project for change detection
        this.saleSound = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZRQ0PVqzn77BgGQc+ltryxnMoBSuAzvLZiTcIGWm98OScTgwNUajk7bdfGgY5ktjzyn0tBSV+zPDbjUEKFGG36+yjWBULSKLi8r1nHwYziM/z1YU2Bhxrwu7mnEQOD1Ot5++1YhsGPJbe8sd0KAUrgM3y2Yk3CBlqvfDknE4MDFKp5O2+YRoFOpPY88p9LQUlfsz/3Y5BCRVju+njpFsVDEmj4PG9aBwGM4nQ89WFNgYcbcLu5JtEDg5TrOfvtGIbBTuV3vPIdSgFK4HO8tmJOAgaarz/5JxODAxSqeTtvmEaBTuV2PPK/S0FJn/N8N2OQgkUYrvp5KNbFQxJo+DxvWkcBjOJ0PPVhTYGHG7D7uSbRA4OU6vn77NjGwU7ld7zyHYoBSuBzvLZiTgIGmq88OSbTgwMUqnk7b5hGgU7ldjzyv0tBSZ/zfDejkIJFGK76eOkWxUMSaPg8b1pHAYzidDz1YU2Bhxvw+7km0QODlOr5++yYhsFO5Xe88h2KAUrgc7y2Yk4CBpqvPDkm04MDFKp5O2+YRoFO5XY88r9LQUmf83w3o5CCRRiu+njpFsVDEmj4PG9aRwGM4nQ89WFNgYcb8Pu5JtEDg5Tq+fvsmIbBTuV3vPIdigFK4HO8tmJOAgaarzw5JtODAxSqeTtvmEaBTuV2PPK/S0FJn/N8N6OQgkUYrvp46RbFQxJo+DxvWkcBjOJ0PPVhTYGHG/D7uSbRA4OU6vn77JiGwU7ld7zyHYoBSuBzvLZiTgIGmq88OSbTgwMUqnk7b5hGgU7ldjzyv0tBSZ/zfDejkIJFGK76eOkWxUMSaPg8b1pHAYzidDz1YU2Bhxvw+7km0QODlOr5++yYhsFO5Xe88h2KAUrgc7y2Yk4CBpqvPDkm04MDFKp5O2+YRoFO5XY88r9LQUmf83w3o5CCRRiu+njpFsVDEmj4PG9aRwGM4nQ89WFNgYcb8Pu5JtEDg5Tq+fvsmIbBTuV3vPIdigFK4HO8tmJOAgaarzw5JtODAxSqeTtvmEaBTuV2PPK/S0FJn/N8N6OQgkUYrvp46RbFQxJo+DxvWkcBjOJ0PPVhTYGHG/D7uSbRA4OU6vn77JiGwU7ld7zyHYoBSuBzvLZiTgIGmq88OSbTgwMUqnk7b5hGgU7ldjzyv0tBSZ/zfDejkIJFGK76eOkWxUMSaPg8b1pHAYzidDz1YU2Bhxvw+7km0QODlOr5++yYhsFO5Xe88h2KAUrgc7y2Yk4CBpqvPDkm04MDFKp5O2+YRoFO5XY88r9LQUmf83w3o5CCRRiu+njpFsVDEmj4PG9aRwGM4nQ89WFNgYcb8Pu5JtEDg5Tq+fvsmIbBTuV3vPIdigFK4HO8tmJOAgaarzw5JtODAxSqeTtvmEaBTuV2PPK/S0FJn/N8N6OQgkUYrvp46RbFQxJo+DxvWkcBjOJ0PPVhTYGHG/D7uSbRA4OU6vn77JiGwU7ld7zyHYoBSuBzvLZiTgIGmq88OSbTgwMUqnk7b5hGgU7ldjzyv0tBSZ/zfDejkIJFGK76eOkWxUMSaPg8b1pHAYzidDz1YU2Bhxvw+7km0QODlOr5++yYhsFO5Xe88h2KAUrgc7y2Yk4CBpqvPDkm04MDFKp5O2+YRoFO5XY88r9LQUmf83w3o5CCRRiu+njpFsVDEmj4PG9aRwGM4nQ89WFNgYcb8Pu5JtEDg5Tq+fvsmIbBTuV3vPIdigFK4HO8tmJOAgaarzw5JtODAxSqeTtvmEa');
        this.overviewChart = null; // Store overview chart instance
        this.projectsData = new Map();
        
        this.loadPreferences();
        this.init();
    }

    async init() {
        try {
            await this.loadConfig();
            await this.loadViewLayout();
            await this.fetchExchangeRates();
            await this.renderDashboard();
            this.setupEventListeners();
            this.hideLoading();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize dashboard. Please check your config files.');
            this.hideLoading();
        }
    }

    async fetchExchangeRates() {
        try {
            // Use exchangerate-api.com free tier (no API key needed for basic usage)
            const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            if (!response.ok) throw new Error('Failed to fetch exchange rates');
            const data = await response.json();
            this.exchangeRates = data.rates;
            console.log(`✓ Exchange rates loaded (1 USD = ${this.exchangeRates[this.preferredCurrency]} ${this.preferredCurrency})`);
            console.log(`Available currencies: ${Object.keys(this.exchangeRates).join(', ')}`);
        } catch (error) {
            console.warn('Could not fetch exchange rates, using defaults:', error);
            // Fallback rates if API fails
            this.exchangeRates = {
                USD: 1,
                NZD: 1.65,
                AUD: 1.52,
                EUR: 0.92,
                GBP: 0.79,
                CAD: 1.36
            };
        }
    }

    convertCurrency(amount, fromCurrency, toCurrency = null) {
        if (!amount || isNaN(amount)) return 0;
        
        const from = (fromCurrency || 'USD').toUpperCase();
        const to = (toCurrency || this.preferredCurrency).toUpperCase();
        
        // No conversion needed
        if (from === to) return amount;
        
        // Get exchange rates (all rates are relative to USD)
        const fromRate = this.exchangeRates[from] || 1;
        const toRate = this.exchangeRates[to] || 1;
        
        // Convert: amount in FROM currency -> USD -> TO currency
        // Step 1: Convert to USD (divide by from rate)
        // Step 2: Convert to target (multiply by to rate)
        // Example: 100 NZD to AUD where NZD=1.65, AUD=1.52
        //   100 / 1.65 = 60.61 USD
        //   60.61 * 1.52 = 92.12 AUD
        return (amount / fromRate) * toRate;
    }

    startAutoRefresh() {
        // Get polling interval from config (default 60 seconds)
        const intervalSeconds = this.config.pollingIntervalSeconds || 60;
        console.log(`🔄 Auto-refresh enabled: every ${intervalSeconds} seconds`);
        
        // Clear any existing interval
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }
        
        // Start polling
        this.pollingInterval = setInterval(async () => {
            await this.refreshData();
        }, intervalSeconds * 1000);
    }

    async refreshData() {
        try {
            console.log('🔄 Background refresh...');
            const oldProjectsData = new Map(this.projectsData);
            
            // Clear cached data to fetch fresh from APIs
            this.projectsData.clear();
            
            // Re-fetch all project data
            await this.renderDashboard();
            
            // Check for new sales and play sound
            this.detectNewSales(oldProjectsData);
        } catch (error) {
            console.error('Background refresh failed:', error);
        }
    }

    detectNewSales(oldProjectsData) {
        let hasNewSales = false;
        
        for (const [projectId, newData] of this.projectsData.entries()) {
            const oldData = oldProjectsData.get(projectId);
            if (!oldData) continue;
            
            // Check if order count increased
            if (newData.orders > oldData.orders) {
                const newSalesCount = newData.orders - oldData.orders;
                console.log(`🎉 New sale detected in ${projectId}: ${newSalesCount} new order(s)!`);
                hasNewSales = true;
            }
        }
        
        if (hasNewSales) {
            this.playSaleSound();
        }
    }

    playSaleSound() {
        try {
            // Create a simple pleasant notification sound
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Pleasant chime sound (C5, E5, G5)
            const notes = [523.25, 659.25, 783.99];
            let time = audioContext.currentTime;
            
            notes.forEach((freq, i) => {
                oscillator.frequency.setValueAtTime(freq, time);
                gainNode.gain.setValueAtTime(0.3, time);
                gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.3);
                time += 0.15;
            });
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.6);
        } catch (error) {
            console.warn('Could not play sound:', error);
        }
    }

    formatCurrency(amount, sourceCurrency = null) {
        // If no source currency specified, assume amount is already in display currency
        const finalAmount = sourceCurrency 
            ? this.convertCurrency(amount, sourceCurrency, this.preferredCurrency)
            : amount;
        
        const symbol = this.preferredCurrency === 'EUR' ? '€' : 
                      this.preferredCurrency === 'GBP' ? '£' : '$';
        return `${symbol}${Math.round(finalAmount).toLocaleString()}`;
    }

    async loadConfig() {
        try {
            const response = await fetch('config.json');
            if (!response.ok) throw new Error('Failed to load config.json');
            this.config = await response.json();
        } catch (error) {
            throw new Error(`Config loading failed: ${error.message}`);
        }
    }

    async loadViewLayout() {
        try {
            const response = await fetch('view.json');
            if (!response.ok) throw new Error('Failed to load view.json');
            this.viewLayout = await response.json();
        } catch (error) {
            console.warn('View layout not found, using defaults');
            this.viewLayout = { layout: { widgets: [] } };
        }
    }

    loadPreferences() {
        // Load from view.json (already loaded in loadViewLayout)
        if (this.viewLayout && this.viewLayout.preferences) {
            const { viewMode, sortBy, filterBy, preferredCurrency, themeMode, themeColor } = this.viewLayout.preferences;
            this.viewMode = viewMode || 'compact';
            this.sortBy = sortBy || 'default';
            this.filterBy = filterBy || 'all';
            this.preferredCurrency = preferredCurrency || 'NZD';
            this.themeMode = themeMode || 'light';
            this.themeColor = themeColor || 'purple';
        }
        this.applyTheme();
    }

    savePreferences() {
        // Preferences are saved together with layout in saveViewLayout
        this.saveViewLayout();
    }

    async saveViewLayout() {
        try {
            const layoutData = {
                layout: {
                    widgets: this.widgets.map((widget, index) => ({
                        projectId: widget.projectId,
                        position: index
                    }))
                },
                preferences: {
                    viewMode: this.viewMode,
                    sortBy: this.sortBy,
                    filterBy: this.filterBy,
                    preferredCurrency: this.preferredCurrency,
                    themeMode: this.themeMode,
                    themeColor: this.themeColor
                }
            };

            // Save to server (view.json file)
            const response = await fetch('http://localhost:3000/api/save-view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(layoutData)
            });

            if (!response.ok) throw new Error('Failed to save to server');
            
            console.log('Layout saved to view.json:', layoutData);
            this.showNotification('Layout saved successfully!');
        } catch (error) {
            console.error('Failed to save layout:', error);
            this.showNotification('Failed to save layout', 'error');
        }
    }

    applyTheme() {
        const root = document.documentElement;
        root.setAttribute('data-theme-mode', this.themeMode);
        root.setAttribute('data-theme-color', this.themeColor);
        
        // Update active states in UI
        document.querySelectorAll('.btn-theme-mode').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.themeMode);
        });
        document.querySelectorAll('.theme-color-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.color === this.themeColor);
        });
        
        console.log(`✓ Theme applied: ${this.themeMode} mode, ${this.themeColor} color`);
    }

    getThemeColors() {
        const root = document.documentElement;
        const styles = getComputedStyle(root);
        const primary = styles.getPropertyValue('--theme-primary').trim();
        const primaryRgb = styles.getPropertyValue('--theme-primary-rgb').trim();
        
        return {
            primary: primary,
            primaryRgba: (alpha) => `rgba(${primaryRgb}, ${alpha})`
        };
    }

    async renderDashboard() {
        // Get ordered projects immediately
        let orderedProjects = this.getOrderedProjects();
        orderedProjects = this.sortProjects(orderedProjects);
        orderedProjects = this.filterProjects(orderedProjects);

        // Render empty widgets immediately (loading state)
        const container = document.getElementById('widgetContainer');
        container.innerHTML = '';
        container.className = `widget-container ${this.viewMode}-view`;
        this.widgets = [];

        // Create loading widgets for each project
        orderedProjects.forEach(project => {
            const widget = this.createLoadingWidget(project);
            container.appendChild(widget);
        });

        // Fetch data for all projects asynchronously and update widgets as they complete
        this.config.projects.forEach(async (project) => {
            try {
                if (!this.projectsData.has(project.id)) {
                    const data = await this.fetchProjectSalesData(project);
                    this.projectsData.set(project.id, data);
                }
                // Update the specific widget with data
                this.updateProjectWidget(project);
            } catch (error) {
                console.error(`Failed to fetch data for ${project.name}:`, error);
                // Update widget to show error
                this.updateProjectWidget(project, error);
            }
        });

        // Initialize drag and drop
        this.initializeDragAndDrop();
        
        // Update UI controls
        this.updateUIControls();
    }

    getOrderedProjects() {
        const savedLayout = localStorage.getItem('dashboardLayout');
        let orderedProjects = [...this.config.projects];

        if (savedLayout && this.sortBy === 'default') {
            try {
                const layout = JSON.parse(savedLayout);
                const layoutMap = new Map(layout.layout.widgets.map(w => [w.projectId, w.position]));
                orderedProjects.sort((a, b) => {
                    const posA = layoutMap.get(a.id) ?? 999;
                    const posB = layoutMap.get(b.id) ?? 999;
                    return posA - posB;
                });
            } catch (error) {
                console.error('Failed to parse saved layout:', error);
            }
        }

        return orderedProjects;
    }

    sortProjects(projects) {
        const sorted = [...projects];
        
        switch(this.sortBy) {
            case 'revenue-desc':
                sorted.sort((a, b) => {
                    const dataA = this.projectsData.get(a.id);
                    const dataB = this.projectsData.get(b.id);
                    return dataB.revenue - dataA.revenue;
                });
                break;
            case 'revenue-asc':
                sorted.sort((a, b) => {
                    const dataA = this.projectsData.get(a.id);
                    const dataB = this.projectsData.get(b.id);
                    return dataA.revenue - dataB.revenue;
                });
                break;
            case 'growth-desc':
                sorted.sort((a, b) => {
                    const dataA = this.projectsData.get(a.id);
                    const dataB = this.projectsData.get(b.id);
                    return parseFloat(dataB.growth) - parseFloat(dataA.growth);
                });
                break;
            case 'name-asc':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
        }
        
        return sorted;
    }

    filterProjects(projects) {
        switch(this.filterBy) {
            case 'stripe':
                return projects.filter(p => p.stripe?.enabled && !p.paypal?.enabled);
            case 'paypal':
                return projects.filter(p => p.paypal?.enabled && !p.stripe?.enabled);
            case 'both':
                return projects.filter(p => p.stripe?.enabled && p.paypal?.enabled);
            default:
                return projects;
        }
    }

    updateUIControls() {
        // Update view mode buttons
        document.getElementById('compactViewBtn').classList.toggle('active', this.viewMode === 'compact');
        document.getElementById('detailedViewBtn').classList.toggle('active', this.viewMode === 'detailed');
        
        // Update sort select
        document.getElementById('sortSelect').value = this.sortBy;
        
        // Update filter select
        document.getElementById('filterSelect').value = this.filterBy;
    }

    renderSummarySection(projects) {
        const summaryData = this.calculateSummaryData(projects);
        const section = document.getElementById('summarySection');
        
        section.innerHTML = `
            <div class="summary-stats">
                <div class="summary-stat-card">
                    <div class="summary-stat-label">Total Revenue (30 Days)</div>
                    <div class="summary-stat-value">${this.formatCurrency(summaryData.totalRevenue)}</div>
                    <div class="summary-stat-change">Last 30 days across all projects</div>
                </div>
                <div class="summary-stat-card">
                    <div class="summary-stat-label">Month to Date</div>
                    <div class="summary-stat-value">${this.formatCurrency(summaryData.monthToDateRevenue)}</div>
                    <div class="summary-stat-change">Revenue since ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).split(' ')[0]} 1</div>
                </div>
                <div class="summary-stat-card">
                    <div class="summary-stat-label">Today</div>
                    <div class="summary-stat-value">${this.formatCurrency(summaryData.todayRevenue)}</div>
                    <div class="summary-stat-change">Revenue for ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                </div>
            </div>
        `;
    }

    renderOverviewGraph(projects) {
        // Combine revenue data from all projects for the last 30 days
        const today = new Date();
        const combinedData = new Map();
        const labels = [];
        
        // Initialize all 30 days
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            labels.push(label);
            combinedData.set(dateKey, 0);
        }
        
        // Sum revenue from all projects for each day
        projects.forEach(project => {
            const salesData = this.projectsData.get(project.id);
            if (salesData && salesData.revenueData) {
                salesData.revenueData.forEach((revenue, index) => {
                    const daysBack = 29 - index;
                    const date = new Date(today);
                    date.setDate(date.getDate() - daysBack);
                    const dateKey = date.toISOString().split('T')[0];
                    
                    if (combinedData.has(dateKey)) {
                        combinedData.set(dateKey, combinedData.get(dateKey) + revenue);
                    }
                });
            }
        });
        
        // Convert map to array
        const revenueData = Array.from(combinedData.values());
        
        // Destroy existing chart if it exists
        if (this.overviewChart) {
            this.overviewChart.destroy();
        }
        
        // Create the chart
        const ctx = document.getElementById('overviewChart').getContext('2d');
        const currencySymbol = this.preferredCurrency === 'EUR' ? '€' : 
                              this.preferredCurrency === 'GBP' ? '£' : '$';
        const themeColors = this.getThemeColors();
        
        this.overviewChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Revenue (${this.preferredCurrency})`,
                    data: revenueData,
                    borderColor: themeColors.primary,
                    backgroundColor: themeColors.primaryRgba(0.1),
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    pointBackgroundColor: themeColors.primary,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: themeColors.primary,
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                return `${currencySymbol}${Math.round(context.parsed.y).toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return currencySymbol + Math.round(value).toLocaleString();
                            },
                            font: {
                                size: 11
                            },
                            color: this.themeMode === 'dark' ? '#9ca3af' : '#6B7280'
                        },
                        grid: {
                            color: this.themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 10
                            },
                            maxRotation: 45,
                            minRotation: 45,
                            color: this.themeMode === 'dark' ? '#9ca3af' : '#6B7280'
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    createProjectWidget(container, project, index) {
        const salesData = this.projectsData.get(project.id);
        
        // If no data, show error widget
        if (!salesData) {
            return this.createErrorWidget(container, project, index, 'No data available');
        }
        
        const hasStripe = project.stripe?.enabled;
        const hasPaypal = project.paypal?.enabled;
        const providerClass = hasStripe && hasPaypal ? 'both' : hasStripe ? 'stripe' : 'paypal';
        const providerText = hasStripe && hasPaypal ? 'Stripe + PayPal' : hasStripe ? 'Stripe' : 'PayPal';

        // Calculate health status
        const healthStatus = this.calculateHealthStatus(salesData);
        const healthIcon = healthStatus === 'excellent' ? '🟢' : healthStatus === 'good' ? '🟢' : healthStatus === 'average' ? '🟡' : '🔴';
        
        // Determine if top or bottom performer
        const allRevenues = Array.from(this.projectsData.values()).filter(d => d && d.revenue).map(d => d.revenue).sort((a, b) => b - a);
        const isTop = allRevenues.length > 0 && salesData.revenue === allRevenues[0];
        const isBottom = allRevenues.length > 2 && salesData.revenue === allRevenues[allRevenues.length - 1];

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.projectId = project.id;
        widget.dataset.index = index;
        widget.draggable = true;
        
        const trendIcon = parseFloat(salesData.growth) > 0 ? '↗' : parseFloat(salesData.growth) < 0 ? '↘' : '→';
        const trendClass = parseFloat(salesData.growth) > 0 ? 'up' : parseFloat(salesData.growth) < 0 ? 'down' : 'flat';
        
        widget.innerHTML = `
            <div class="widget-header">
                <div>
                    <h2 class="widget-title">
                        <span class="health-indicator ${healthStatus}">${healthIcon}</span>
                        ${project.name}
                        ${isTop ? '<span class="performance-badge top">Top</span>' : ''}
                        ${isBottom ? '<span class="performance-badge bottom">Low</span>' : ''}
                    </h2>
                    <span class="provider-badge ${providerClass}">${providerText}</span>
                </div>
                <div class="widget-drag-handle" title="Drag to reorder">⋮⋮</div>
            </div>
            <div class="widget-content">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Revenue (30d)</div>
                        <div class="stat-value">$${salesData.revenue.toLocaleString()}</div>
                        <div class="stat-change ${trendClass}">
                            <span class="trend-indicator ${trendClass}">${trendIcon} ${salesData.growth}%</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Orders</div>
                        <div class="stat-value">${salesData.orders}</div>
                        <div class="stat-change">Avg: $${salesData.avgOrderValue}</div>
                    </div>
                </div>
                
                ${(hasStripe || hasPaypal) && this.viewMode === 'detailed' ? `
                <div class="balance-section">
                    ${hasStripe && salesData.stripeBalance !== undefined ? `
                    <div class="balance-card">
                        <span class="balance-label">💳 Stripe Balance</span>
                        <span class="balance-value">$${salesData.stripeBalance.toLocaleString()}</span>
                    </div>
                    ` : ''}
                    ${hasPaypal && salesData.paypalBalance !== undefined ? `
                    <div class="balance-card">
                        <span class="balance-label">🅿️ PayPal Balance</span>
                        <span class="balance-value">$${salesData.paypalBalance.toLocaleString()}</span>
                    </div>
                    ` : ''}
                </div>
                ` : ''}
                
                <div class="chart-container">
                    <canvas id="chart-${project.id}"></canvas>
                </div>
                
                ${this.viewMode === 'detailed' ? `
                <div class="metric-row">
                    <span class="metric-label">Avg Order Value</span>
                    <span class="metric-value">$${salesData.avgOrderValue}</span>
                </div>
                <div class="metric-row">
                    <span class="metric-label">Conversion Rate</span>
                    <span class="metric-value">${salesData.conversionRate}%</span>
                </div>
                ` : ''}
                
                ${salesData.errors && salesData.errors.length > 0 ? `
                <div class="widget-errors">
                    <div class="error-icon">⚠️</div>
                    <div class="error-messages">
                        ${salesData.errors.map(err => `<div class="error-item">${err}</div>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        container.appendChild(widget);
        this.widgets.push({ projectId: project.id, element: widget });
        
        // Create chart after widget is added to DOM
        setTimeout(() => this.createProjectChart(project, salesData), 0);
    }

    createLoadingWidget(project) {
        const hasStripe = project.stripe?.enabled;
        const hasPaypal = project.paypal?.enabled;
        const providerClass = hasStripe && hasPaypal ? 'both' : hasStripe ? 'stripe' : 'paypal';
        const providerText = hasStripe && hasPaypal ? 'Stripe + PayPal' : hasStripe ? 'Stripe' : 'PayPal';

        const widget = document.createElement('div');
        widget.className = 'widget widget-loading';
        widget.dataset.projectId = project.id;
        
        widget.innerHTML = `
            <div class="widget-header">
                <div>
                    <h2 class="widget-title">${project.name}</h2>
                    <span class="provider-badge ${providerClass}">${providerText}</span>
                </div>
            </div>
            <div class="widget-content">
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>Loading data...</p>
                </div>
            </div>
        `;
        
        this.widgets.push({ projectId: project.id, element: widget });
        return widget;
    }

    updateProjectWidget(project, error = null) {
        const widgetData = this.widgets.find(w => w.projectId === project.id);
        if (!widgetData) return;

        const widget = widgetData.element;
        const salesData = this.projectsData.get(project.id);
        
        if (error || !salesData) {
            // Replace with error widget
            widget.className = 'widget widget-error';
            const errorMessage = error ? error.message : 'No data available';
            widget.innerHTML = this.getErrorWidgetHTML(project, errorMessage);
            return;
        }

        // Replace with full widget
        widget.className = 'widget';
        widget.draggable = true;
        widget.innerHTML = this.getProjectWidgetHTML(project, salesData);
        
        // Create chart after widget is updated
        setTimeout(() => this.createProjectChart(project, salesData), 0);
        
        // Update summary section and overview graph
        this.renderSummarySection(this.config.projects);
        this.renderOverviewGraph(this.config.projects);
    }

    getProjectWidgetHTML(project, salesData) {
        const hasStripe = project.stripe?.enabled;
        const hasPaypal = project.paypal?.enabled;
        const providerClass = hasStripe && hasPaypal ? 'both' : hasStripe ? 'stripe' : 'paypal';
        const providerText = hasStripe && hasPaypal ? 'Stripe + PayPal' : hasStripe ? 'Stripe' : 'PayPal';

        const healthStatus = this.calculateHealthStatus(salesData);
        const healthIcon = healthStatus === 'excellent' ? '🟢' : healthStatus === 'good' ? '🟢' : healthStatus === 'average' ? '🟡' : '🔴';
        
        const allRevenues = Array.from(this.projectsData.values()).filter(d => d && d.revenue).map(d => d.revenue).sort((a, b) => b - a);
        const isTop = allRevenues.length > 0 && salesData.revenue === allRevenues[0];
        const isBottom = allRevenues.length > 2 && salesData.revenue === allRevenues[allRevenues.length - 1];
        
        const trendIcon = parseFloat(salesData.growth) > 0 ? '↗' : parseFloat(salesData.growth) < 0 ? '↘' : '→';
        const trendClass = parseFloat(salesData.growth) > 0 ? 'up' : parseFloat(salesData.growth) < 0 ? 'down' : 'flat';
        
        // Calculate today's metrics
        const today = salesData.todayRevenue || 0;
        const yesterday = salesData.yesterdayRevenue || 0;
        const todayChange = yesterday > 0 ? (((today - yesterday) / yesterday) * 100).toFixed(1) : '0.0';
        const todayTrend = parseFloat(todayChange) > 0 ? 'up' : parseFloat(todayChange) < 0 ? 'down' : 'flat';
        
        return `
            <div class="widget-header">
                <div>
                    <h2 class="widget-title">
                        <span class="health-indicator ${healthStatus}">${healthIcon}</span>
                        ${project.name}
                        ${isTop ? '<span class="performance-badge top">Top</span>' : ''}
                        ${isBottom ? '<span class="performance-badge bottom">Low</span>' : ''}
                    </h2>
                    <span class="provider-badge ${providerClass}">${providerText}</span>
                </div>
                <div class="widget-drag-handle" title="Drag to reorder">⋮⋮</div>
            </div>
            <div class="widget-content">
                <!-- Key Metrics Row -->
                <div class="metrics-compact">
                    <div class="metric-item">
                        <div class="metric-label">Today</div>
                        <div class="metric-value-large">${this.formatCurrency(today)}</div>
                        <div class="metric-change ${todayTrend}">${todayChange}%</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">30 Days</div>
                        <div class="metric-value-large">${this.formatCurrency(salesData.revenue)}</div>
                        <div class="metric-change ${trendClass}">${trendIcon} ${salesData.growth}%</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Orders</div>
                        <div class="metric-value-large">${salesData.orders}</div>
                        <div class="metric-sub">${this.formatCurrency(salesData.avgOrderValue)} avg</div>
                    </div>
                    ${(hasStripe || hasPaypal) ? `
                    <div class="metric-item">
                        <div class="metric-label">Balance</div>
                        <div class="metric-value-large">${this.formatCurrency(salesData.stripeBalance + salesData.paypalBalance)}</div>
                        <div class="metric-sub">${hasStripe ? 'S: ' + this.formatCurrency(salesData.stripeBalance) : ''}${hasStripe && hasPaypal ? ' ' : ''}${hasPaypal ? 'P: ' + this.formatCurrency(salesData.paypalBalance) : ''}</div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Chart -->
                <div class="chart-container">
                    <canvas id="chart-${project.id}"></canvas>
                </div>
                
                <!-- Recent Activity Feed -->
                ${this.viewMode === 'detailed' && salesData.recentActivity && salesData.recentActivity.length > 0 ? `
                <div class="activity-feed">
                    <div class="activity-header">
                        <span class="activity-title">💰 Recent Sales (24h)</span>
                        <span class="activity-count">${salesData.recentActivity.length} transactions</span>
                    </div>
                    <div class="activity-list">
                        ${salesData.recentActivity.slice(0, 10).map(activity => `
                            <div class="activity-item">
                                <span class="activity-time">${activity.timeAgo}</span>
                                <span class="activity-amount">${this.formatCurrency(activity.amount)}</span>
                                <span class="activity-desc">${activity.description}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${salesData.errors && salesData.errors.length > 0 ? `
                <div class="widget-errors">
                    <div class="error-icon">⚠️</div>
                    <div class="error-messages">
                        ${salesData.errors.map(err => `<div class="error-item">${err}</div>`).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    getErrorWidgetHTML(project, errorMessage) {
        const hasStripe = project.stripe?.enabled;
        const hasPaypal = project.paypal?.enabled;
        const providerClass = hasStripe && hasPaypal ? 'both' : hasStripe ? 'stripe' : 'paypal';
        const providerText = hasStripe && hasPaypal ? 'Stripe + PayPal' : hasStripe ? 'Stripe' : 'PayPal';

        return `
            <div class="widget-header">
                <div>
                    <h2 class="widget-title">🔴 ${project.name}</h2>
                    <span class="provider-badge ${providerClass}">${providerText}</span>
                </div>
            </div>
            <div class="widget-content">
                <div class="error-state-large">
                    <div class="error-icon">⚠️</div>
                    <div class="error-title">Failed to Load Data</div>
                    <div class="error-details">${errorMessage}</div>
                    <button class="btn btn-retry" onclick="location.reload()">Retry</button>
                </div>
            </div>
        `;
    }

    createErrorWidget(container, project, index, errorMessage) {
        const hasStripe = project.stripe?.enabled;
        const hasPaypal = project.paypal?.enabled;
        const providerClass = hasStripe && hasPaypal ? 'both' : hasStripe ? 'stripe' : 'paypal';
        const providerText = hasStripe && hasPaypal ? 'Stripe + PayPal' : hasStripe ? 'Stripe' : 'PayPal';

        const widget = document.createElement('div');
        widget.className = 'widget widget-error';
        widget.dataset.projectId = project.id;
        widget.dataset.index = index;
        
        widget.innerHTML = `
            <div class="widget-header">
                <div>
                    <h2 class="widget-title">
                        🔴 ${project.name}
                    </h2>
                    <span class="provider-badge ${providerClass}">${providerText}</span>
                </div>
            </div>
            <div class="widget-content">
                <div class="error-state-large">
                    <div class="error-icon-large">❌</div>
                    <h3>Failed to Load Data</h3>
                    <p class="error-details">${errorMessage}</p>
                    <button class="btn btn-primary" onclick="location.reload()">Retry</button>
                </div>
            </div>
        `;
        
        container.appendChild(widget);
        this.widgets.push({ projectId: project.id, element: widget });
    }

    calculateHealthStatus(salesData) {
        const growth = parseFloat(salesData.growth);
        const conversionRate = parseFloat(salesData.conversionRate);
        
        if (growth > 15 && conversionRate > 3) return 'excellent';
        if (growth > 8 && conversionRate > 2) return 'good';
        if (growth > 0) return 'average';
        return 'poor';
    }

    createProjectChart(project, salesData) {
        const canvas = document.getElementById(`chart-${project.id}`);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts[project.id]) {
            this.charts[project.id].destroy();
        }

        const isCompact = this.viewMode === 'compact';
        const themeColors = this.getThemeColors();
        
        this.charts[project.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: salesData.labels,
                datasets: [{
                    label: 'Daily Sales (Past 30 Days)',
                    data: salesData.revenueData,
                    borderColor: themeColors.primary,
                    backgroundColor: themeColors.primaryRgba(0.1),
                    tension: 0.4,
                    fill: true,
                    borderWidth: isCompact ? 2 : 2.5,
                    pointRadius: isCompact ? 0 : 3,
                    pointHoverRadius: isCompact ? 3 : 5
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
                        enabled: !isCompact,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return '$' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        display: !isCompact,
                        beginAtZero: true,
                        grid: {
                            color: this.themeMode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            display: !isCompact
                        },
                        ticks: {
                            display: !isCompact,
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            },
                            color: this.themeMode === 'dark' ? '#9ca3af' : '#6B7280'
                        }
                    },
                    x: {
                        display: !isCompact,
                        grid: {
                            display: false
                        },
                        ticks: {
                            display: !isCompact,
                            color: this.themeMode === 'dark' ? '#9ca3af' : '#6B7280'
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }



    calculateSummaryData(projects) {
        let totalRevenue = 0;
        let todayRevenue = 0;
        let monthToDateRevenue = 0;
        let activeStripe = 0;
        let activePaypal = 0;

        const today = new Date();
        const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const todayDateKey = today.toISOString().split('T')[0];

        projects.forEach(project => {
            const salesData = this.projectsData.get(project.id);
            if (salesData) {
                totalRevenue += salesData.revenue;
                todayRevenue += salesData.todayRevenue || 0;
                
                // Calculate month-to-date by iterating through the 30-day window
                // and summing only dates that fall in the current month
                if (salesData.revenueData && salesData.labels) {
                    for (let i = 0; i < salesData.labels.length; i++) {
                        // Reconstruct the date from our 30-day window
                        const daysBack = 29 - i;
                        const date = new Date(today);
                        date.setDate(date.getDate() - daysBack);
                        
                        // If this date is in the current month, add its revenue
                        if (date >= firstOfMonth && date <= today) {
                            monthToDateRevenue += salesData.revenueData[i] || 0;
                        }
                    }
                }
            }
            if (project.stripe?.enabled) activeStripe++;
            if (project.paypal?.enabled) activePaypal++;
        });

        return { totalRevenue, todayRevenue, monthToDateRevenue, activeStripe, activePaypal };
    }

    async fetchProjectSalesData(project) {
        // Fetch real sales data from Stripe and/or PayPal for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoTimestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);
        
        let stripeData = null;
        let paypalData = null;
        const errors = [];
        
        // Fetch Stripe data if enabled
        if (project.stripe?.enabled && project.stripe?.apiKey) {
            try {
                stripeData = await this.fetchStripeData(project.stripe.apiKey, thirtyDaysAgoTimestamp);
            } catch (error) {
                errors.push(`Stripe: ${error.message}`);
                console.error(`Stripe error for ${project.name}:`, error);
            }
        }
        
        // Fetch PayPal data if enabled
        const hasPayPalRestAPI = project.paypal?.restApi?.clientId && project.paypal?.restApi?.secret;
        const hasPayPalClassicAPI = project.paypal?.classicApi?.username && project.paypal?.classicApi?.password && project.paypal?.classicApi?.signature;
        const hasPayPalLegacy = project.paypal?.clientId && project.paypal?.secret;
        
        if (project.paypal?.enabled && (hasPayPalRestAPI || hasPayPalClassicAPI || hasPayPalLegacy)) {
            try {
                paypalData = await this.fetchPayPalData(project.paypal, thirtyDaysAgoTimestamp);
                
                // Check if PayPal returned empty data (account limitation)
                if (paypalData && (!paypalData.transactions || paypalData.transactions.length === 0)) {
                    errors.push('PayPal: Account lacks Transaction API access - showing Stripe data only. Contact PayPal to enable API access or use Sandbox credentials.');
                }
            } catch (error) {
                errors.push(`PayPal: ${error.message}`);
                console.error(`PayPal error for ${project.name}:`, error);
            }
        }
        
        // If no data sources are configured or all failed, throw error
        if (!stripeData && !paypalData) {
            if (errors.length > 0) {
                throw new Error(errors.join(' | '));
            }
            throw new Error('No payment providers configured or enabled');
        }
        
        // Combine the data from both sources
        const data = this.combineSalesData(stripeData, paypalData, project);
        if (errors.length > 0) {
            data.errors = errors;
        }
        return data;
    }

    async fetchStripeData(apiKey, startTimestamp) {
        try {
            // Call backend proxy that uses official Stripe SDK
            const response = await fetch('http://localhost:3000/api/stripe/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    apiKey: apiKey,
                    startTimestamp: startTimestamp
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Backend error (${response.status})`);
            }
            
            const data = await response.json();
            
            return {
                charges: data.charges || [],
                balance: data.balance
            };
        } catch (error) {
            console.error('Stripe API error:', error);
            throw error;
        }
    }

    async fetchPayPalData(paypalConfig, startTimestamp) {
        // Determine which PayPal API to use
        let credentials = null;
        
        // Check for Classic API credentials (username/password/signature)
        if (paypalConfig.classicApi?.username && paypalConfig.classicApi?.password && paypalConfig.classicApi?.signature) {
            credentials = {
                username: paypalConfig.classicApi.username,
                password: paypalConfig.classicApi.password,
                signature: paypalConfig.classicApi.signature
            };
        }
        // Check for REST API credentials (clientId/secret)
        else if (paypalConfig.restApi?.clientId && paypalConfig.restApi?.secret) {
            credentials = {
                clientId: paypalConfig.restApi.clientId,
                secret: paypalConfig.restApi.secret
            };
        }
        // Fallback to old format (direct clientId/secret)
        else if (paypalConfig.clientId && paypalConfig.secret) {
            credentials = {
                clientId: paypalConfig.clientId,
                secret: paypalConfig.secret
            };
        }
        else {
            throw new Error('PayPal credentials missing. Need either (username/password/signature) or (clientId/secret)');
        }
        
        try {
            // Call backend proxy for PayPal data
            const response = await fetch('http://localhost:3000/api/paypal/data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    credentials: credentials,
                    startTimestamp: startTimestamp
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Backend error (${response.status})`);
            }
            
            const data = await response.json();
            
            return {
                transactions: data.transaction_details || data.transactions || [],
                balance: data.balance
            };
        } catch (error) {
            console.error('PayPal API error:', error);
            throw error;
        }
    }

    combineSalesData(stripeData, paypalData, project) {
        // Create a map of daily sales for the last 30 days
        const dailySales = new Map();
        const today = new Date();
        
        // Initialize all 30 days with zero
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0];
            dailySales.set(dateKey, {
                amounts: [], // Store {amount, currency} objects
                orders: 0
            });
        }
        
        let totalRevenue = 0;
        let totalOrders = 0;
        let stripeBalance = 0;
        let paypalBalance = 0;
        
        // Process Stripe charges - store with original currency
        const stripeBalances = [];
        if (stripeData?.charges) {
            stripeData.charges.forEach(charge => {
                if (charge.paid && !charge.refunded) {
                    const date = new Date(charge.created * 1000);
                    const dateKey = date.toISOString().split('T')[0];
                    const currency = (charge.currency || 'usd').toUpperCase();
                    const amount = charge.amount / 100; // Convert from cents
                    
                    if (dailySales.has(dateKey)) {
                        const day = dailySales.get(dateKey);
                        day.amounts.push({ amount, currency });
                        day.orders += 1;
                        totalOrders += 1;
                    }
                }
            });
            
            if (stripeData.balance?.available) {
                stripeData.balance.available.forEach(bal => {
                    const currency = (bal.currency || 'usd').toUpperCase();
                    const amount = bal.amount / 100;
                    stripeBalances.push({ amount, currency });
                });
            }
        }
        
        // Process PayPal transactions - store with original currency
        const paypalBalances = [];
        if (paypalData?.transactions) {
            paypalData.transactions.forEach(transaction => {
                if (transaction.transaction_info?.transaction_status === 'S') { // Success
                    const date = new Date(transaction.transaction_info.transaction_initiation_date);
                    const dateKey = date.toISOString().split('T')[0];
                    const currency = (transaction.transaction_info?.transaction_amount?.currency_code || 'USD').toUpperCase();
                    const amount = Math.abs(parseFloat(transaction.transaction_info?.transaction_amount?.value || 0));
                    
                    if (dailySales.has(dateKey)) {
                        const day = dailySales.get(dateKey);
                        day.amounts.push({ amount, currency });
                        day.orders += 1;
                        totalOrders += 1;
                    }
                }
            });
            
            if (paypalData.balance?.balances) {
                paypalData.balance.balances.forEach(bal => {
                    const currency = (bal.total_balance?.currency_code || 'USD').toUpperCase();
                    const amount = parseFloat(bal.total_balance?.value || 0);
                    paypalBalances.push({ amount, currency });
                });
            }
        }
        
        // Convert to display currency at calculation time
        const labels = [];
        const revenueData = [];
        const sortedDates = Array.from(dailySales.keys()).sort();
        
        sortedDates.forEach(dateKey => {
            const date = new Date(dateKey);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Sum all amounts for this day, converting to preferred currency
            const dayTotal = dailySales.get(dateKey).amounts.reduce((sum, item) => {
                return sum + this.convertCurrency(item.amount, item.currency);
            }, 0);
            
            revenueData.push(dayTotal);
            totalRevenue += dayTotal;
        });
        
        // Calculate metrics (already in display currency)
        const avgOrderValue = totalOrders > 0 ? Math.floor(totalRevenue / totalOrders) : 0;
        
        // Calculate balances in display currency
        stripeBalance = stripeBalances.reduce((sum, item) => {
            return sum + this.convertCurrency(item.amount, item.currency);
        }, 0);
        
        paypalBalance = paypalBalances.reduce((sum, item) => {
            return sum + this.convertCurrency(item.amount, item.currency);
        }, 0);
        
        // Calculate growth (compare last 15 days to previous 15 days)
        const recentRevenue = revenueData.slice(15).reduce((sum, val) => sum + val, 0);
        const previousRevenue = revenueData.slice(0, 15).reduce((sum, val) => sum + val, 0);
        const growth = previousRevenue > 0 
            ? (((recentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
            : '0.0';
        
        // Calculate today and yesterday revenue (already converted)
        const todayKey = today.toISOString().split('T')[0];
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().split('T')[0];
        
        const todayRevenue = Math.round(revenueData[revenueData.length - 1] || 0);
        const yesterdayRevenue = Math.round(revenueData[revenueData.length - 2] || 0);
        
        // Format recent activity from charges
        const recentActivity = [];
        const now = Date.now();
        
        if (stripeData?.recentCharges) {
            stripeData.recentCharges.forEach(charge => {
                if (charge.paid && !charge.refunded) {
                    const chargeTime = charge.created * 1000;
                    const minutesAgo = Math.floor((now - chargeTime) / 60000);
                    let timeAgo;
                    if (minutesAgo < 60) {
                        timeAgo = `${minutesAgo}m ago`;
                    } else if (minutesAgo < 1440) {
                        timeAgo = `${Math.floor(minutesAgo / 60)}h ago`;
                    } else {
                        timeAgo = `${Math.floor(minutesAgo / 1440)}d ago`;
                    }
                    
                    const currency = (charge.currency || 'usd').toUpperCase();
                    const amount = charge.amount / 100;
                    
                    recentActivity.push({
                        time: chargeTime,
                        timeAgo,
                        amount,
                        currency,
                        description: charge.description || 'Payment',
                        source: 'stripe'
                    });
                }
            });
        }
        
        if (paypalData?.transactions) {
            paypalData.transactions.forEach(transaction => {
                if (transaction.transaction_info?.transaction_status === 'S') {
                    const txTime = new Date(transaction.transaction_info.transaction_initiation_date).getTime();
                    const minutesAgo = Math.floor((now - txTime) / 60000);
                    let timeAgo;
                    if (minutesAgo < 60) {
                        timeAgo = `${minutesAgo}m ago`;
                    } else if (minutesAgo < 1440) {
                        timeAgo = `${Math.floor(minutesAgo / 60)}h ago`;
                    } else {
                        timeAgo = `${Math.floor(minutesAgo / 1440)}d ago`;
                    }
                    
                    const currency = (transaction.transaction_info?.transaction_amount?.currency_code || 'USD').toUpperCase();
                    const amount = Math.abs(parseFloat(transaction.transaction_info?.transaction_amount?.value || 0));
                    
                    recentActivity.push({
                        time: txTime,
                        timeAgo,
                        amount,
                        currency,
                        description: transaction.transaction_info?.transaction_type || 'Payment',
                        source: 'paypal'
                    });
                }
            });
        }
        
        // Sort by time (most recent first)
        recentActivity.sort((a, b) => b.time - a.time);
        
        // Mock conversion rate (would need traffic data for real calculation)
        const conversionRate = (Math.random() * 2 + 1.5).toFixed(2);
        
        // All amounts already in display currency - no double conversion
        return {
            revenue: Math.round(totalRevenue),
            orders: totalOrders,
            avgOrderValue: Math.round(avgOrderValue),
            conversionRate,
            growth,
            todayRevenue: Math.round(todayRevenue),
            yesterdayRevenue: Math.round(yesterdayRevenue),
            labels,
            revenueData: revenueData.map(v => Math.round(v)),
            stripeBalance: Math.round(stripeBalance),
            paypalBalance: Math.round(paypalBalance),
            dailySales: Array.from(dailySales.values()),
            recentActivity: recentActivity.slice(0, 20).map(activity => ({
                ...activity,
                amount: this.convertCurrency(activity.amount, activity.currency)
            }))
        };
    }

    generateMockSalesData(project) {
        // Fallback mock data when APIs aren't configured or fail
        const dailySales = [];
        const labels = [];
        const revenueData = [];
        const today = new Date();
        
        let totalRevenue = 0;
        let totalOrders = 0;
        
        // Use project ID as seed for consistent mock data
        const seed = project.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const seededRandom = (min, max) => {
            const x = Math.sin(seed + totalRevenue) * 10000;
            const rand = x - Math.floor(x);
            return Math.floor(rand * (max - min) + min);
        };
        
        // Generate 30 days of data
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            
            // Generate revenue with realistic patterns
            const baseDaily = 1000 + seededRandom(0, 2000);
            const weekendMultiplier = date.getDay() === 0 || date.getDay() === 6 ? 0.7 : 1;
            const dailyRevenue = Math.floor(baseDaily * weekendMultiplier);
            
            revenueData.push(dailyRevenue);
            totalRevenue += dailyRevenue;
            const dailyOrders = seededRandom(5, 25);
            totalOrders += dailyOrders;
            
            dailySales.push({
                revenue: dailyRevenue,
                orders: dailyOrders
            });
        }
        
        const avgOrderValue = Math.floor(totalRevenue / totalOrders);
        const conversionRate = (seededRandom(150, 350) / 100).toFixed(2);
        
        // Calculate growth
        const recentRevenue = revenueData.slice(15).reduce((sum, val) => sum + val, 0);
        const previousRevenue = revenueData.slice(0, 15).reduce((sum, val) => sum + val, 0);
        const growth = previousRevenue > 0 
            ? (((recentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
            : '0.0';
        
        return {
            revenue: totalRevenue,
            orders: totalOrders,
            avgOrderValue,
            conversionRate,
            growth,
            labels,
            revenueData,
            stripeBalance: seededRandom(2000, 7000),
            paypalBalance: seededRandom(2000, 7000),
            dailySales,
            isMockData: true
        };
    }



    initializeDragAndDrop() {
        // Only enable drag and drop in default sort mode
        if (this.sortBy !== 'default') return;
        
        const widgets = document.querySelectorAll('.widget');
        
        widgets.forEach(widget => {
            widget.addEventListener('dragstart', this.handleDragStart.bind(this));
            widget.addEventListener('dragend', this.handleDragEnd.bind(this));
            widget.addEventListener('dragover', this.handleDragOver.bind(this));
            widget.addEventListener('drop', this.handleDrop.bind(this));
            widget.addEventListener('dragenter', this.handleDragEnter.bind(this));
            widget.addEventListener('dragleave', this.handleDragLeave.bind(this));
        });
    }

    handleDragStart(e) {
        this.draggedElement = e.currentTarget;
        this.draggedIndex = parseInt(e.currentTarget.dataset.index);
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
    }

    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        
        // Remove all drag-over classes
        document.querySelectorAll('.widget').forEach(widget => {
            widget.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        e.dataTransfer.dropEffect = 'move';
        return false;
    }

    handleDragEnter(e) {
        if (e.currentTarget !== this.draggedElement && !e.currentTarget.classList.contains('summary-widget')) {
            e.currentTarget.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    handleDrop(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
        }

        const dropTarget = e.currentTarget;
        
        if (this.draggedElement !== dropTarget) {
            const container = document.getElementById('widgetContainer');
            const allWidgets = [...container.querySelectorAll('.widget')];
            
            const draggedIndex = allWidgets.indexOf(this.draggedElement);
            const dropIndex = allWidgets.indexOf(dropTarget);
            
            if (draggedIndex < dropIndex) {
                dropTarget.parentNode.insertBefore(this.draggedElement, dropTarget.nextSibling);
            } else {
                dropTarget.parentNode.insertBefore(this.draggedElement, dropTarget);
            }
            
            // Update widgets array
            this.updateWidgetsOrder();
            
            // Save the new layout
            this.saveViewLayout();
        }

        dropTarget.classList.remove('drag-over');
        return false;
    }

    updateWidgetsOrder() {
        const container = document.getElementById('widgetContainer');
        const widgetElements = [...container.querySelectorAll('.widget')];
        
        this.widgets = widgetElements.map((element, index) => {
            element.dataset.index = index;
            return {
                projectId: element.dataset.projectId,
                element: element
            };
        });
    }

    setupEventListeners() {
        // View mode toggle
        document.getElementById('compactViewBtn').addEventListener('click', async () => {
            this.viewMode = 'compact';
            this.savePreferences();
            await this.renderDashboard();
            this.showNotification('Switched to compact view');
        });

        document.getElementById('detailedViewBtn').addEventListener('click', async () => {
            this.viewMode = 'detailed';
            this.savePreferences();
            await this.renderDashboard();
            this.showNotification('Switched to detailed view');
        });

        // Sort control
        document.getElementById('sortSelect').addEventListener('change', async (e) => {
            this.sortBy = e.target.value;
            this.savePreferences();
            await this.renderDashboard();
        });

        // Filter control
        document.getElementById('filterSelect').addEventListener('change', async (e) => {
            this.filterBy = e.target.value;
            this.savePreferences();
            await this.renderDashboard();
        });

        // Currency control
        document.getElementById('currencySelect').addEventListener('change', async (e) => {
            this.preferredCurrency = e.target.value;
            this.savePreferences();
            await this.fetchExchangeRates();
            await this.renderDashboard();
            this.showNotification(`Currency changed to ${this.preferredCurrency}`);
        });

        // Set initial currency selector value
        document.getElementById('currencySelect').value = this.preferredCurrency;

        // Theme mode toggles
        document.querySelectorAll('.btn-theme-mode').forEach(btn => {
            btn.addEventListener('click', async () => {
                this.themeMode = btn.dataset.mode;
                this.applyTheme();
                this.savePreferences();
                await this.renderDashboard();
                this.showNotification(`Switched to ${this.themeMode} mode`);
            });
        });

        // Theme color selection
        document.querySelectorAll('.theme-color-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                this.themeColor = btn.dataset.color;
                this.applyTheme();
                this.savePreferences();
                await this.renderDashboard();
                this.showNotification(`Theme color changed to ${this.themeColor}`);
            });
        });

        // Settings blade toggle
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsBlade = document.getElementById('settingsBlade');
        const settingsOverlay = document.getElementById('settingsOverlay');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');

        const openSettings = () => {
            settingsBlade.classList.add('active');
            settingsOverlay.classList.add('active');
        };

        const closeSettings = () => {
            settingsBlade.classList.remove('active');
            settingsOverlay.classList.remove('active');
        };

        settingsBtn.addEventListener('click', openSettings);
        closeSettingsBtn.addEventListener('click', closeSettings);
        settingsOverlay.addEventListener('click', closeSettings);

        // Close settings on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && settingsBlade.classList.contains('active')) {
                closeSettings();
            }
        });
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    showError(message) {
        const container = document.getElementById('widgetContainer');
        container.innerHTML = `
            <div class="error-message">
                <h3>⚠️ Error</h3>
                <p>${message}</p>
            </div>
        `;
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' : '#EF4444'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    .drag-over {
        border: 2px dashed var(--primary-color);
        opacity: 0.7;
    }
`;
document.head.appendChild(style);

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PaymentDashboard());
} else {
    new PaymentDashboard();
}
