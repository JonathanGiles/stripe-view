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
        this.projectsData = new Map();
        
        this.loadPreferences();
        this.init();
    }

    async init() {
        try {
            await this.loadConfig();
            await this.loadViewLayout();
            await this.renderDashboard();
            this.setupEventListeners();
            this.hideLoading();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize dashboard. Please check your config files.');
            this.hideLoading();
        }
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
        const prefs = localStorage.getItem('dashboardPreferences');
        if (prefs) {
            try {
                const { viewMode, sortBy, filterBy } = JSON.parse(prefs);
                this.viewMode = viewMode || 'compact';
                this.sortBy = sortBy || 'default';
                this.filterBy = filterBy || 'all';
            } catch (error) {
                console.error('Failed to load preferences:', error);
            }
        }
    }

    savePreferences() {
        const prefs = {
            viewMode: this.viewMode,
            sortBy: this.sortBy,
            filterBy: this.filterBy
        };
        localStorage.setItem('dashboardPreferences', JSON.stringify(prefs));
    }

    async saveViewLayout() {
        try {
            const layoutData = {
                layout: {
                    widgets: this.widgets.map((widget, index) => ({
                        projectId: widget.projectId,
                        position: index
                    }))
                }
            };

            localStorage.setItem('dashboardLayout', JSON.stringify(layoutData));
            console.log('Layout saved to localStorage:', layoutData);
            this.showNotification('Layout saved successfully!');
        } catch (error) {
            console.error('Failed to save layout:', error);
            this.showNotification('Failed to save layout', 'error');
        }
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
        
        // Calculate additional metrics
        const avgRevenue = summaryData.totalRevenue / projects.length;
        const totalOrders = Array.from(this.projectsData.values()).reduce((sum, data) => sum + data.orders, 0);
        const avgGrowth = (Array.from(this.projectsData.values()).reduce((sum, data) => sum + parseFloat(data.growth), 0) / projects.length).toFixed(1);
        
        // Find top and bottom performers
        const sortedByRevenue = [...projects].sort((a, b) => {
            return this.projectsData.get(b.id).revenue - this.projectsData.get(a.id).revenue;
        });
        const topProject = sortedByRevenue[0];
        const bottomProject = sortedByRevenue[sortedByRevenue.length - 1];
        
        section.innerHTML = `
            <div class="summary-stats">
                <div class="summary-stat-card">
                    <div class="summary-stat-label">Total Revenue (30 Days)</div>
                    <div class="summary-stat-value">$${summaryData.totalRevenue.toLocaleString()}</div>
                    <div class="summary-stat-change">↗ Avg Growth: ${avgGrowth}%</div>
                </div>
                <div class="summary-stat-card">
                    <div class="summary-stat-label">Total Projects</div>
                    <div class="summary-stat-value">${projects.length}</div>
                    <div class="summary-stat-change">Avg: $${Math.round(avgRevenue).toLocaleString()}</div>
                </div>
                <div class="summary-stat-card">
                    <div class="summary-stat-label">Total Orders (30 Days)</div>
                    <div class="summary-stat-value">${totalOrders.toLocaleString()}</div>
                    <div class="summary-stat-change">Across all projects</div>
                </div>
                <div class="summary-stat-card">
                    <div class="summary-stat-label">Payment Providers</div>
                    <div class="summary-stat-value">${summaryData.activeStripe + summaryData.activePaypal}</div>
                    <div class="summary-stat-change">Stripe: ${summaryData.activeStripe} • PayPal: ${summaryData.activePaypal}</div>
                </div>
                <div class="summary-stat-card">
                    <div class="summary-stat-label">🏆 Top Performer</div>
                    <div class="summary-stat-value" style="font-size: 1.25rem;">${topProject.name}</div>
                    <div class="summary-stat-change">$${this.projectsData.get(topProject.id).revenue.toLocaleString()}</div>
                </div>
                <div class="summary-stat-card">
                    <div class="summary-stat-label">Growth Opportunity</div>
                    <div class="summary-stat-value" style="font-size: 1.25rem;">${bottomProject.name}</div>
                    <div class="summary-stat-change">$${this.projectsData.get(bottomProject.id).revenue.toLocaleString()}</div>
                </div>
            </div>
        `;
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
        
        // Update summary section
        this.renderSummarySection(this.config.projects);
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
        
        this.charts[project.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: salesData.labels,
                datasets: [{
                    label: 'Daily Sales (Past 30 Days)',
                    data: salesData.revenueData,
                    borderColor: project.stripe?.enabled ? '#635BFF' : '#0070BA',
                    backgroundColor: project.stripe?.enabled ? 'rgba(99, 91, 255, 0.1)' : 'rgba(0, 112, 186, 0.1)',
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
                            color: 'rgba(0, 0, 0, 0.05)',
                            display: !isCompact
                        },
                        ticks: {
                            display: !isCompact,
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        display: !isCompact,
                        grid: {
                            display: false
                        },
                        ticks: {
                            display: !isCompact
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
        let activeStripe = 0;
        let activePaypal = 0;

        projects.forEach(project => {
            const salesData = this.projectsData.get(project.id);
            if (salesData) {
                totalRevenue += salesData.revenue;
            }
            if (project.stripe?.enabled) activeStripe++;
            if (project.paypal?.enabled) activePaypal++;
        });

        return { totalRevenue, activeStripe, activePaypal };
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
                revenue: 0,
                orders: 0,
                stripe: 0,
                paypal: 0
            });
        }
        
        let totalRevenue = 0;
        let totalOrders = 0;
        let stripeBalance = 0;
        let paypalBalance = 0;
        
        // Process Stripe charges
        if (stripeData?.charges) {
            stripeData.charges.forEach(charge => {
                if (charge.paid && !charge.refunded) {
                    const date = new Date(charge.created * 1000);
                    const dateKey = date.toISOString().split('T')[0];
                    const amount = charge.amount / 100; // Convert from cents
                    
                    if (dailySales.has(dateKey)) {
                        const day = dailySales.get(dateKey);
                        day.revenue += amount;
                        day.stripe += amount;
                        day.orders += 1;
                        totalRevenue += amount;
                        totalOrders += 1;
                    }
                }
            });
            
            if (stripeData.balance?.available) {
                stripeBalance = stripeData.balance.available.reduce((sum, bal) => {
                    return sum + (bal.amount / 100);
                }, 0);
            }
        }
        
        // Process PayPal transactions
        if (paypalData?.transactions) {
            paypalData.transactions.forEach(transaction => {
                if (transaction.transaction_info?.transaction_status === 'S') { // Success
                    const date = new Date(transaction.transaction_info.transaction_initiation_date);
                    const dateKey = date.toISOString().split('T')[0];
                    const amount = Math.abs(parseFloat(transaction.transaction_info?.transaction_amount?.value || 0));
                    
                    if (dailySales.has(dateKey)) {
                        const day = dailySales.get(dateKey);
                        day.revenue += amount;
                        day.paypal += amount;
                        day.orders += 1;
                        totalRevenue += amount;
                        totalOrders += 1;
                    }
                }
            });
            
            if (paypalData.balance?.balances) {
                paypalBalance = paypalData.balance.balances.reduce((sum, bal) => {
                    return sum + parseFloat(bal.total_balance?.value || 0);
                }, 0);
            }
        }
        
        // Convert map to arrays for charting
        const labels = [];
        const revenueData = [];
        const sortedDates = Array.from(dailySales.keys()).sort();
        
        sortedDates.forEach(dateKey => {
            const date = new Date(dateKey);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
            revenueData.push(dailySales.get(dateKey).revenue);
        });
        
        // Calculate metrics
        const avgOrderValue = totalOrders > 0 ? Math.floor(totalRevenue / totalOrders) : 0;
        
        // Calculate growth (compare last 15 days to previous 15 days)
        const recentRevenue = revenueData.slice(15).reduce((sum, val) => sum + val, 0);
        const previousRevenue = revenueData.slice(0, 15).reduce((sum, val) => sum + val, 0);
        const growth = previousRevenue > 0 
            ? (((recentRevenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
            : '0.0';
        
        // Mock conversion rate (would need traffic data for real calculation)
        const conversionRate = (Math.random() * 2 + 1.5).toFixed(2);
        
        return {
            revenue: Math.round(totalRevenue),
            orders: totalOrders,
            avgOrderValue,
            conversionRate,
            growth,
            labels,
            revenueData: revenueData.map(v => Math.round(v)),
            stripeBalance: Math.round(stripeBalance),
            paypalBalance: Math.round(paypalBalance),
            dailySales: Array.from(dailySales.values())
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

        // Refresh button - fetches fresh data from APIs
        document.getElementById('refreshBtn').addEventListener('click', async () => {
            this.showLoading();
            // Clear cached data to fetch fresh from APIs
            this.projectsData.clear();
            try {
                await this.renderDashboard();
                this.showNotification('Dashboard refreshed with latest data!');
            } catch (error) {
                console.error('Refresh failed:', error);
                this.showNotification('Refresh failed - check console', 'error');
            }
            this.hideLoading();
        });

        // Reset layout button
        document.getElementById('resetLayoutBtn').addEventListener('click', async () => {
            if (confirm('Are you sure you want to reset the layout to default?')) {
                localStorage.removeItem('dashboardLayout');
                this.showLoading();
                await this.renderDashboard();
                this.hideLoading();
                this.showNotification('Layout reset to default!');
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
