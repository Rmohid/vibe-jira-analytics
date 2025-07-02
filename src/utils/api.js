// Production API calls (connects to real backend)
export const productionJiraAPI = async (endpoint, data = {}) => {
    try {
        const response = await fetch(`http://localhost:3001/api/jira/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`Backend API error: ${response.status}`);
        }
        
        return await response.json();
    } catch (err) {
        throw new Error('Backend not available. Run server.js first.');
    }
};