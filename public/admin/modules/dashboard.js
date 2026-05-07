import { api } from './api.js';

let gatesChartInstance = null;

export async function initDashboard() {
    const stats = await api.get('/stats');
    if (!stats) return;

    // Update Counters
    document.getElementById('stat-active-passes').textContent = stats.totalActive || 0;
    document.getElementById('stat-entries-today').textContent = stats.entriesToday || 0;
    document.getElementById('stat-exits-today').textContent = stats.exitsToday || 0;

    // Render Chart
    renderChart(stats.gateOccupancy || []);

    // Load recent events
    loadRecentEvents();
}

function renderChart(gateData) {
    const ctx = document.getElementById('gatesChart').getContext('2d');
    
    const labels = [];
    const data = [];
    
    // Ensure all 13 gates are represented
    for(let i = 1; i <= 13; i++) {
        labels.push(`Gate ${i}`);
        const match = gateData.find(g => g.gate === i);
        data.push(match ? match.occupancy : 0);
    }

    if (gatesChartInstance) gatesChartInstance.destroy();

    gatesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Current Occupancy',
                data: data,
                backgroundColor: 'rgba(0, 212, 255, 0.5)',
                borderColor: '#00d4ff',
                borderWidth: 1,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { 
                    beginAtZero: true,
                    ticks: { color: '#8c9baf' },
                    grid: { color: 'rgba(255, 255, 255, 0.05)' }
                },
                x: {
                    ticks: { color: '#8c9baf' },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { labels: { color: '#f0f4f8' } }
            }
        }
    });
}

async function loadRecentEvents() {
    const events = await api.get('/events');
    const list = document.getElementById('activity-feed');
    list.innerHTML = '';
    
    if(!events) return;

    events.slice(0, 10).forEach(ev => {
        const li = document.createElement('li');
        let icon = '';
        let colorClass = '';
        
        if (ev.eventType.includes('entry')) {
            icon = 'fa-arrow-right-to-bracket';
            colorClass = 'text-green';
        } else if (ev.eventType.includes('exit')) {
            icon = 'fa-arrow-right-from-bracket';
            colorClass = 'text-orange';
        } else {
            icon = 'fa-ban';
            colorClass = 'text-red';
        }

        const location = ev.gate ? `Gate ${ev.gate}` : ev.room;
        const time = new Date(ev.timestamp).toLocaleTimeString();

        li.innerHTML = `
            <div>
                <strong>${ev.passengerName || 'Unknown'}</strong> 
                <span class="badge badge-${ev.passType || 'visitor'}">${ev.passType || 'Unknown'}</span>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 5px;">
                    <i class="fa-solid ${icon} ${colorClass}"></i> ${ev.eventType.replace('_', ' ')} at ${location}
                </p>
            </div>
            <div style="text-align: right; color: var(--text-muted); font-size: 0.8rem;">
                ${time}
            </div>
        `;
        list.appendChild(li);
    });
}
