// Enhanced Logging System for Debugging
export const Logger = {
    debug: (category, message, data = null) => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${category.toUpperCase()}] ${message}`;
        console.log(logEntry, data || '');
        
        // Store in session for Claude debugging
        const logs = JSON.parse(sessionStorage.getItem('dashboardLogs') || '[]');
        logs.push({ timestamp, category, message, data });
        if (logs.length > 100) logs.shift(); // Keep last 100 logs
        sessionStorage.setItem('dashboardLogs', JSON.stringify(logs));
    },
    
    error: (category, message, error = null) => {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [ERROR:${category.toUpperCase()}] ${message}`;
        console.error(logEntry, error || '');
        
        const logs = JSON.parse(sessionStorage.getItem('dashboardLogs') || '[]');
        logs.push({ 
            timestamp, 
            category: `ERROR:${category}`, 
            message, 
            data: error ? { 
                message: error.message, 
                stack: error.stack,
                name: error.name 
            } : null 
        });
        if (logs.length > 100) logs.shift();
        sessionStorage.setItem('dashboardLogs', JSON.stringify(logs));
    },
    
    performance: (operation, duration, metadata = null) => {
        const message = `${operation} completed in ${duration}ms`;
        Logger.debug('PERFORMANCE', message, metadata);
    },
    
    state: (component, state, action = 'UPDATE') => {
        Logger.debug('STATE', `${component} ${action}`, state);
    },
    
    getLogs: () => JSON.parse(sessionStorage.getItem('dashboardLogs') || '[]'),
    
    clearLogs: () => sessionStorage.removeItem('dashboardLogs'),
    
    exportLogs: () => {
        const logs = Logger.getLogs();
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-logs-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
};