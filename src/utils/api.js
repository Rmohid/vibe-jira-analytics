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
            throw new Error(`Backend API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (err) {
        console.error('API call failed:', err);
        throw new Error('Backend not available. Check your connection or try refreshing the page.');
    }
};