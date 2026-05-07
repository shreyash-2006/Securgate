const API_BASE = '/api';

export const api = {
    async get(endpoint) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`);
            if (!res.ok) throw new Error('API Error');
            return await res.json();
        } catch (error) {
            console.error('API Get Error:', error);
            return null;
        }
    },
    
    async post(endpoint, data) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (error) {
            console.error('API Post Error:', error);
            return null;
        }
    },
    
    async patch(endpoint, data) {
        try {
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await res.json();
        } catch (error) {
            console.error('API Patch Error:', error);
            return null;
        }
    }
};
