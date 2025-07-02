// Dashboard Configuration
export const DASHBOARD_CONFIG = {
    sections: [
        { id: 'overview', title: 'Current Status Cards', component: 'OverviewPanel', enabled: true },
        { id: 'trends', title: 'Historical Trend Chart', component: 'TrendsPanel', enabled: true },
        { id: 'sources', title: 'Source Label Analysis', component: 'SourcesPanel', enabled: true },
        { id: 'tickets', title: 'Recent Tickets Table', component: 'TicketsPanel', enabled: true }
    ],
    charts: {
        historical: {
            type: 'line',
            height: 300,
            colors: {
                high: '#ef4444',
                medium: '#f59e0b',
                low: '#3b82f6',
                total: '#6b7280'
            }
        },
        sourceLabels: {
            type: 'bar',
            height: 350,
            stackId: 'a'
        },
        averageAge: {
            type: 'line',
            height: 250,
            colors: {
                highAvgAge: '#ef4444',
                mediumAvgAge: '#f59e0b',
                lowAvgAge: '#3b82f6'
            }
        }
    },
    cards: {
        high: { color: 'red', icon: 'AlertIcon' },
        medium: { color: 'yellow', icon: 'TrendingIcon' },
        low: { color: 'blue', icon: 'ClockIcon' },
        total: { color: 'gray', icon: 'DatabaseIcon' }
    },
    labels: {
        sourceLabels: [
            { name: 'Bug Fix', label: 'src-bug-fix', count: 45, percentage: 35, color: '#ef4444' },
            { name: 'Golive Critical', label: 'src-golive-critical', count: 28, percentage: 22, color: '#dc2626' },
            { name: 'New Feature', label: 'src-new-feature', count: 18, percentage: 14, color: '#3b82f6' },
            { name: 'Integration', label: 'src-integration', count: 12, percentage: 9, color: '#8b5cf6' },
            { name: 'Tech Debt', label: 'src-tech-debt', count: 10, percentage: 8, color: '#f59e0b' },
            { name: 'Unknown', label: 'src-unknown', count: 6, percentage: 5, color: '#6b7280' },
            { name: 'Maintenance', label: 'src-maintenance', count: 4, percentage: 3, color: '#10b981' },
            { name: 'Enhancement', label: 'src-enhancement', count: 3, percentage: 2, color: '#ec4899' },
            { name: 'Research', label: 'src-research', count: 2, percentage: 2, color: '#06b6d4' },
            { name: 'Critical', label: 'src-critical', count: 1, percentage: 1, color: '#84cc16' }
        ]
    }
};