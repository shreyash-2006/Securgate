import { initDashboard } from './modules/dashboard.js';
import { initScanner } from './modules/scanner.js';
import { initTracker } from './modules/tracker.js';

document.addEventListener('DOMContentLoaded', () => {
    // Navigation logic
    const navLinks = document.querySelectorAll('.nav-links li');
    const views = document.querySelectorAll('.view');
    const pageTitle = document.getElementById('page-title');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Update active state on nav
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');

            // Switch view
            const targetView = link.getAttribute('data-view');
            views.forEach(view => {
                view.classList.add('hidden');
                view.classList.remove('active');
            });
            document.getElementById(`view-${targetView}`).classList.remove('hidden');
            document.getElementById(`view-${targetView}`).classList.add('active');

            // Update Header
            pageTitle.textContent = link.textContent.trim();

            // Trigger specific view initializers
            if(targetView === 'dashboard') initDashboard();
            if(targetView === 'scanner') initScanner();
            if(targetView === 'tracker' || targetView === 'manage') initTracker(targetView);
        });
    });

    // Initialize first view
    initDashboard();
});
