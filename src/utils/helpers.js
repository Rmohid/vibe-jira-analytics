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
                jqlQuery: parsed.jqlQuery || 'project = KSD AND cf[11129] > 0 AND created >= -30d ORDER BY created DESC'
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
        jqlQuery: 'project = KSD AND cf[11129] > 0 AND created >= -30d ORDER BY created DESC'
    };
};

// Generate JQL query based on time period
export const generateJQL = (project, timePeriod, customDays) => {
    const days = timePeriod === 'custom' ? customDays : timePeriod.replace('d', '');
    return `project = ${project} AND cf[11129] > 0 AND created >= -${days}d ORDER BY created DESC`;
};

// Note: Chart availability check removed - now using proper npm imports