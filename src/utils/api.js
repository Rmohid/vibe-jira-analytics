// Production API calls (connects to real backend)
export const productionJiraAPI = async (endpoint, data = {}) => {
    try {
        // Use relative URL so it works both through nginx proxy and direct access
        const apiUrl = `/api/jira/${endpoint}`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            // Try to get the error message from the response
            let errorMessage = `API error: ${response.status}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
            } catch (e) {
                // If response is not JSON, use status text
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }
        
        return await response.json();
    } catch (err) {
        console.error('API call failed:', err);
        // Pass through the actual error message instead of generic one
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            throw new Error('Backend not available. Check your connection or try refreshing the page.');
        }
        throw err;
    }
};