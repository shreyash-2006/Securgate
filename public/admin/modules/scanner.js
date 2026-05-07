import { api } from './api.js';

let html5QrcodeScanner = null;

export function initScanner() {
    const scanModeEl = document.getElementById('scan-mode');
    const gateGroup = document.getElementById('gate-select-group');
    const roomGroup = document.getElementById('room-select-group');
    
    // Toggle between Gate and Room mode
    scanModeEl.addEventListener('change', (e) => {
        if (e.target.value === 'gate') {
            gateGroup.classList.remove('hidden');
            roomGroup.classList.add('hidden');
        } else {
            gateGroup.classList.add('hidden');
            roomGroup.classList.remove('hidden');
        }
    });

    document.getElementById('start-scanner-btn').onclick = startScanner;
    document.getElementById('stop-scanner-btn').onclick = stopScanner;
}

function startScanner() {
    document.getElementById('scanner-container').classList.remove('hidden');
    
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
    }
    
    html5QrcodeScanner = new Html5QrcodeScanner(
        "reader",
        { fps: 10, qrbox: {width: 250, height: 250} },
        /* verbose= */ false
    );
    
    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
}

function stopScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
        document.getElementById('scanner-container').classList.add('hidden');
    }
}

async function onScanSuccess(decodedText, decodedResult) {
    // Pause scanning briefly to prevent rapid fires
    if (html5QrcodeScanner) html5QrcodeScanner.pause();

    const mode = document.getElementById('scan-mode').value;
    const gate = parseInt(document.getElementById('scan-gate-number').value);
    const room = document.getElementById('scan-room-name').value;

    const feedbackEl = document.getElementById('scan-result');
    feedbackEl.textContent = "Processing...";
    feedbackEl.className = "scan-feedback"; // reset classes

    try {
        const payload = {
            passId: decodedText,
            type: mode,
            gate: mode === 'gate' ? gate : null,
            room: mode === 'room' ? room : null
        };

        const res = await api.post('/events/scan', payload);
        
        if (res.allowed) {
            feedbackEl.classList.add('scan-success');
            const action = res.eventType.replace('_', ' ').toUpperCase();
            feedbackEl.innerHTML = `<i class="fa-solid fa-check-circle"></i> ALLOWED: ${action}<br><small>${res.pass.name}</small>`;
            
            // Beep sound
            playBeep(800, 150);
        } else {
            feedbackEl.classList.add('scan-error');
            feedbackEl.innerHTML = `<i class="fa-solid fa-xmark-circle"></i> DENIED: ${res.reason}`;
            playBeep(300, 400);
        }
    } catch (e) {
        feedbackEl.classList.add('scan-error');
        feedbackEl.textContent = "Network Error";
    }

    // Resume after 2.5 seconds
    setTimeout(() => {
        feedbackEl.textContent = "";
        feedbackEl.className = "scan-feedback";
        if (html5QrcodeScanner) html5QrcodeScanner.resume();
    }, 2500);
}

function onScanFailure(error) {
    // ignore
}

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playBeep(frequency, duration) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    
    gainNode.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration/1000);
    setTimeout(() => oscillator.stop(), duration);
}
