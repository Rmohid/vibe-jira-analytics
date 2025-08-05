// Helper utility functions

// Load saved config from localStorage
export const loadSavedConfig = () => {
    try {
        const saved = localStorage.getItem('jiraConfig');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                baseUrl: parsed.baseUrl || 'https://komutel.atlassian.net',
                email: parsed.email || 'robert.mohid@versaterm.com',
                apiToken: parsed.apiToken || '',
                project: parsed.project || 'KSD',
                jqlQuery: parsed.jqlQuery || 'project = KSD AND (cf[11129] > 0 or labels = "unplanned") AND created >= -30d ORDER BY created DESC'
            };
        }
    } catch (e) {
        console.error('Error loading saved config:', e);
    }
    return {
        baseUrl: 'https://komutel.atlassian.net',
        email: 'robert.mohid@versaterm.com',
        apiToken: '',
        project: 'KSD',
        jqlQuery: 'project = KSD AND (cf[11129] > 0 or labels = "unplanned") AND created >= -30d ORDER BY created DESC'
    };
};

// Calculate number of days from time period selection
export const calculateDaysFromTimePeriod = (timePeriod, customDays, startDate, endDate) => {
    if (timePeriod === 'dateRange' && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    }
    
    if (timePeriod === 'custom') {
        return customDays;
    }
    
    // Handle standard time periods like "7d", "30d", "90d", etc.
    const match = timePeriod.match(/^(\d+)d$/);
    if (match) {
        return parseInt(match[1]);
    }
    
    // Fallback for unknown formats
    console.warn(`Unknown time period format: ${timePeriod}`);
    return 30; // Default to 30 days
};

// Generate JQL query based on time period
export const generateJQL = (project, timePeriod, customDays, startDate, endDate) => {
    if (timePeriod === 'dateRange' && startDate && endDate) {
        return `project = ${project} AND (cf[11129] > 0 or labels = "unplanned") AND created >= "${startDate}" AND created <= "${endDate}" ORDER BY created DESC`;
    }
    
    const days = calculateDaysFromTimePeriod(timePeriod, customDays, startDate, endDate);
    return `project = ${project} AND (cf[11129] > 0 or labels = "unplanned") AND created >= -${days}d ORDER BY created DESC`;
};

// Note: Chart availability check removed - now using proper npm imports