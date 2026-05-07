let qrcodeObj = null;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('pass-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const type = document.getElementById('pass-type').value;

        // Auto-assign permissions based on type (since user doesn't have gate/room fields)
        let allowedGates = [];
        let allowedRooms = [];

        if (type === 'chief_guest') allowedGates = [1,2,3,4,5,6,7,8,9,10,11,12,13];
        if (type === 'visitor') allowedGates = [1, 2];
        if (type === 'student') allowedGates = [3, 4, 5];
        if (type === 'labourer') allowedGates = [13];

        const data = {
            name: document.getElementById('pass-name').value,
            idNumber: document.getElementById('pass-idNumber').value,
            contact: document.getElementById('pass-contact').value,
            org: document.getElementById('pass-org').value,
            purpose: document.getElementById('pass-purpose').value,
            type: type,
            allowedGates: allowedGates,
            allowedRooms: allowedRooms,
            // default expiry in 24 hours
            expiresAt: new Date(Date.now() + 86400000).toISOString()
        };

        try {
            const res = await fetch('/api/passes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            
            if (res.ok && result.id) {
                document.getElementById('view-passes').classList.add('hidden');
                showPassPreview(data, result.id);
            } else {
                alert('Failed to generate pass: ' + (result.error || 'Unknown Error'));
            }
        } catch (error) {
            console.error(error);
            alert('Network error while generating pass.');
        }
    });
});

function showPassPreview(data, passId) {
    document.getElementById('pass-preview').classList.remove('hidden');
    
    // Update card styling based on type
    const cardHeader = document.querySelector('.pass-header');
    let bg = '#111';
    let label = 'Pass';
    
    if (data.type === 'chief_guest') { bg = 'linear-gradient(135deg, #ffd700, #ffaa00)'; label = 'Chief Guest'; }
    if (data.type === 'visitor') { bg = 'linear-gradient(135deg, #2979ff, #0d47a1)'; label = 'Visitor Pass'; }
    if (data.type === 'student') { bg = 'linear-gradient(135deg, #00e676, #00b248)'; label = 'Student Pass'; }
    if (data.type === 'labourer') { bg = 'linear-gradient(135deg, #ff9800, #e65100)'; label = 'Labourer Pass'; }
    
    cardHeader.style.background = bg;
    document.getElementById('card-type').textContent = label;
    document.getElementById('card-name').textContent = data.name;
    document.getElementById('card-id').textContent = data.idNumber;
    document.getElementById('card-org').textContent = data.org || data.purpose;

    // Generate QR
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    
    qrcodeObj = new QRCode(qrContainer, {
        text: passId, // Store the UUID in the QR code
        width: 150,
        height: 150,
        colorDark : "#000000",
        colorLight : "#ffffff", // changed to white for better scanning contrast
        correctLevel : QRCode.CorrectLevel.H
    });
}
