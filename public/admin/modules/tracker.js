import { api } from './api.js';

export function initTracker(viewId) {
    if (viewId === 'tracker') {
        loadEvents();
    } else if (viewId === 'manage') {
        loadPasses();
    }
}

async function loadEvents() {
    const events = await api.get('/events');
    const tbody = document.querySelector('#tracker-table tbody');
    tbody.innerHTML = '';

    if (!events) return;

    events.forEach(ev => {
        const tr = document.createElement('tr');
        const location = ev.gate ? `Gate ${ev.gate}` : ev.room;
        const time = new Date(ev.timestamp).toLocaleString();
        
        let statusHtml = '';
        if (ev.eventType.includes('denied')) {
            statusHtml = `<span class="badge badge-denied">Denied: ${ev.reason || ''}</span>`;
        } else if (ev.eventType.includes('entry')) {
            statusHtml = `<span class="badge badge-entry">Entry</span>`;
        } else {
            statusHtml = `<span class="badge badge-exit">Exit</span>`;
        }

        tr.innerHTML = `
            <td>${time}</td>
            <td><strong>${ev.passengerName || 'Unknown'}</strong></td>
            <td><span class="badge badge-${ev.passType || 'visitor'}">${ev.passType || 'Unknown'}</span></td>
            <td>${location}</td>
            <td>${ev.eventType.replace('_', ' ')}</td>
            <td>${statusHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadPasses() {
    const passes = await api.get('/passes');
    const tbody = document.querySelector('#passes-table tbody');
    tbody.innerHTML = '';

    if (!passes) return;

    passes.forEach(pass => {
        const tr = document.createElement('tr');
        const time = new Date(pass.issuedAt).toLocaleDateString();
        const active = pass.status === 'active';
        
        const actionBtn = active 
            ? `<button class="btn-secondary" style="color:var(--status-red); border-color:var(--status-red)" onclick="window.revokePass('${pass.id}')">Revoke</button>`
            : `<button class="btn-secondary" style="color:var(--status-green); border-color:var(--status-green)" onclick="window.activatePass('${pass.id}')">Activate</button>`;

        tr.innerHTML = `
            <td><strong>${pass.name}</strong></td>
            <td>${pass.idNumber}</td>
            <td><span class="badge badge-${pass.type}">${pass.type}</span></td>
            <td><span style="color: ${active ? 'var(--status-green)' : 'var(--status-red)'}">${pass.status.toUpperCase()}</span></td>
            <td>${time}</td>
            <td>${actionBtn}</td>
        `;
        tbody.appendChild(tr);
    });
}

window.revokePass = async function(id) {
    if(confirm('Are you sure you want to revoke this pass?')) {
        await api.patch(`/passes/${id}/status`, { status: 'revoked' });
        loadPasses();
    }
};

window.activatePass = async function(id) {
    await api.patch(`/passes/${id}/status`, { status: 'active' });
    loadPasses();
};
