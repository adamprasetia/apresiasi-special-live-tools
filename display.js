// DOM Elements
const donationAlert = document.getElementById('donationAlert');
const donorName = document.getElementById('donorName');
const donationAmount = document.getElementById('donationAmount');
const donorMessage = document.getElementById('donorMessage');
const recentDonations = document.getElementById('recentDonations');
const donationsList = document.getElementById('donationsList');
const totalCounter = document.getElementById('totalCounter');
const totalAmount = document.getElementById('totalAmount');
const totalDonors = document.getElementById('totalDonors');
const qrSection = document.getElementById('qrSection');
const qrCode = document.getElementById('qrCode');

// Sample data for demonstration
let donations = [];

let totalDonated = 0;
let totalDonorsCount = 0;
let autoAlertEnabled = false;
let alertDuration = 8000; // default 8 seconds
let alertPosition = 'center'; // default center

// Alert queue system
let alertQueue = [];
let isShowingAlert = false;

// Get relative time
function getRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
}

// Position tracking
let elementPositions = {
    recentDonations: 'top-right',
    totalCounter: 'bottom-left',
    qrSection: 'bottom-right'
};

// Change element position
function changeElementPosition(elementId, position) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    // Remove all position classes
    element.classList.remove('top-right', 'top-left', 'bottom-right', 'bottom-left');
    
    // Add new position class
    element.classList.add(position);
    
    // Store position
    elementPositions[elementId] = position;
}

// Format Rupiah
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

// Show donation alert with animation
function showDonationAlert(donation, customDuration) {
    // Update alert content
    donorName.textContent = donation.name;
    donationAmount.textContent = formatRupiah(donation.amount);
    
    if (donation.message) {
        donorMessage.style.display = 'block';
        donorMessage.querySelector('p').textContent = donation.message;
    } else {
        donorMessage.style.display = 'none';
    }
    
    // Apply position class
    donationAlert.classList.remove('alert-center', 'alert-top', 'alert-bottom', 'alert-top-left', 'alert-top-right', 'alert-bottom-left', 'alert-bottom-right');
    donationAlert.classList.add(`alert-${alertPosition}`);
    
    // Show alert
    donationAlert.classList.add('show');
    isShowingAlert = true;
    sendQueueStatusToParent(); // Notify dashboard when alert starts showing
    
    // Use custom duration or default
    const duration = customDuration || alertDuration;
    
    // Hide after duration
    setTimeout(() => {
        donationAlert.classList.remove('show');
        donationAlert.classList.add('hide');
        
        setTimeout(() => {
            donationAlert.classList.remove('hide');
            isShowingAlert = false;
            sendQueueStatusToParent(); // Notify dashboard when alert finishes
            
            // Process next alert in queue
            processAlertQueue();
        }, 500);
    }, duration);
}

// Add alert to queue
function addToAlertQueue(donation, customDuration) {
    alertQueue.push({ donation, customDuration });
    sendQueueStatusToParent(); // Notify dashboard
    processAlertQueue();
}

// Process alert queue
function processAlertQueue() {
    // If already showing alert or queue is empty, do nothing
    if (isShowingAlert || alertQueue.length === 0) {
        return;
    }
    
    // Get next alert from queue
    const nextAlert = alertQueue.shift();
    sendQueueStatusToParent(); // Notify dashboard
    showDonationAlert(nextAlert.donation, nextAlert.customDuration);
}

// Update recent donations list
function updateRecentDonations() {
    donationsList.innerHTML = '';
    
    donations.slice(0, 5).forEach(donation => {
        const item = document.createElement('div');
        item.className = 'donation-item';
        item.innerHTML = `
            <div class="item-left">
                <span class="item-name">${donation.name}</span>
                <span class="item-time">${getRelativeTime(donation.timestamp)}</span>
            </div>
            <div class="item-amount">${formatRupiah(donation.amount)}</div>
        `;
        donationsList.appendChild(item);
    });
}

// Add new donation
function addDonation(donation) {
    // Add to beginning of array
    donations.unshift(donation);
    
    // Update totals
    totalDonated += donation.amount;
    totalDonorsCount++;
    
    // Update display
    totalAmount.textContent = formatRupiah(totalDonated);
    totalDonors.textContent = `${totalDonorsCount} Donatur`;
    
    // Update list
    updateRecentDonations();
    
    // Show alert only if auto alert is enabled
    if (autoAlertEnabled) {
        showDonationAlert(donation);
    }
}

// Add new donation without showing alert (for direct control)
function addDonationQuiet(donation) {
    // Add to beginning of array
    donations.unshift(donation);
    
    // Update totals
    totalDonated += donation.amount;
    totalDonorsCount++;
    
    // Update display
    totalAmount.textContent = formatRupiah(totalDonated);
    totalDonors.textContent = `${totalDonorsCount} Donatur`;
    
    // Update list
    updateRecentDonations();
    
    // No alert shown
}

// Show elements on page load
window.addEventListener('load', () => {
    // Generate QR Code
    new QRCode(qrCode, {
        text: 'https://apresiasi.kompas.com',
        width: 120,
        height: 120,
        colorDark: '#005AA9',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    
    // Elements are hidden by default, controlled by dashboard
});

// Initialize
updateRecentDonations();

// Update timestamps every minute
setInterval(() => {
    updateRecentDonations();
}, 60000); // Update every 60 seconds

// Demo: Simulate new donation (disabled - only manual from dashboard)
let demoNames = ['Andi W.', 'Rina S.', 'Anonim', 'Dedik P.', 'Maya K.', 'Anonim', 'Fajar M.'];
let demoMessages = [
    'Semangat terus!',
    'Untuk jurnalisme yang lebih baik',
    'Terus berkarya! 🎉',
    'Dukung terus KOMPAS.com',
    '',
    'Terima kasih atas beritanya',
    ''
];

let demoIndex = 0;
// Auto demo is disabled - donations only come from dashboard
/* setInterval(() => {
    const randomAmount = [5000, 10000, 20000, 50000, 100000, 250000][Math.floor(Math.random() * 6)];
    const newDonation = {
        name: demoNames[demoIndex % demoNames.length],
        amount: randomAmount,
        time: 'Baru saja',
        message: demoMessages[demoIndex % demoMessages.length]
    };
    
    addDonation(newDonation);
    demoIndex++;
}, 15000); */

// Listen for messages from parent window (for real integration)
window.addEventListener('message', (event) => {
    const data = event.data;
    
    // New Donation
    if (data.type === 'NEW_DONATION') {
        const donation = {
            id: data.id || Date.now(),
            name: data.hideName ? 'Anonim' : data.name,
            amount: data.amount,
            timestamp: Date.now(),
            message: data.message || ''
        };
        
        // Always add donation to list and update counter
        // Add to beginning of array
        donations.unshift(donation);
        
        // Update totals
        totalDonated += donation.amount;
        totalDonorsCount++;
        
        // Update display
        totalAmount.textContent = formatRupiah(totalDonated);
        totalDonors.textContent = `${totalDonorsCount} Donatur`;
        
        // Update list
        updateRecentDonations();
        
        // Show alert only if auto alert is enabled
        if (autoAlertEnabled) {
            addToAlertQueue(donation);
        }
    }
    
    // Toggle Element Visibility
    if (data.type === 'TOGGLE_ELEMENT') {
        const element = document.getElementById(data.element);
        if (element) {
            if (data.show) {
                element.classList.add('show');
            } else {
                element.classList.remove('show');
            }
        }
    }
    
    // Change Element Position
    if (data.type === 'CHANGE_POSITION') {
        changeElementPosition(data.element, data.position);
    }
    
    // Toggle Auto Alert
    if (data.type === 'TOGGLE_AUTO_ALERT') {
        autoAlertEnabled = data.enabled;
        console.log('Auto alert:', data.enabled);
    }
    
    // Set Alert Duration
    if (data.type === 'SET_ALERT_DURATION') {
        alertDuration = data.duration;
        console.log('Alert duration:', data.duration);
    }
    
    // Set Alert Position
    if (data.type === 'SET_ALERT_POSITION') {
        alertPosition = data.position;
        console.log('Alert position:', data.position);
    }
    
    // Show Alert Manually
    if (data.type === 'SHOW_ALERT') {
        const donation = {
            name: data.name || 'Test User',
            amount: data.amount || 50000,
            message: data.message || 'Test alert message'
        };
        addToAlertQueue(donation, data.duration);
    }
    
    // Reset All
    // Reset All - back to default (all hidden)
    if (data.type === 'RESET_ALL') {
        recentDonations.classList.remove('show');
        totalCounter.classList.remove('show');
        qrSection.classList.remove('show');
        donationAlert.classList.remove('show');
    }
    
    // Remove Single Donation
    if (data.type === 'REMOVE_DONATION') {
        const donationId = data.donationId;
        const index = donations.findIndex(d => d.id === donationId);
        
        if (index !== -1) {
            const removed = donations[index];
            donations.splice(index, 1);
            
            // Update totals
            totalDonated -= removed.amount;
            totalDonorsCount--;
            
            // Update display
            totalAmount.textContent = formatRupiah(totalDonated);
            totalDonors.textContent = `${totalDonorsCount} Donatur`;
            
            // Update list
            updateRecentDonations();
        }
    }
    
    // Clear All Donations
    if (data.type === 'CLEAR_ALL_DONATIONS') {
        donations = [];
        totalDonated = 0;
        totalDonorsCount = 0;
        
        // Update display
        totalAmount.textContent = formatRupiah(0);
        totalDonors.textContent = '0 Donatur';
        
        // Update list
        updateRecentDonations();
    }
    
    // Get Queue Status
    if (data.type === 'GET_QUEUE_STATUS') {
        sendQueueStatusToParent();
    }
    
    // Clear Alert Queue
    if (data.type === 'CLEAR_ALERT_QUEUE') {
        alertQueue = [];
        console.log('Alert queue cleared');
        sendQueueStatusToParent();
    }
});

// Send queue status to parent (dashboard)
function sendQueueStatusToParent() {
    const currentAlert = isShowingAlert ? {
        name: donorName.textContent,
        amount: parseInt(donationAmount.textContent.replace(/[^\d]/g, ''))
    } : null;
    
    window.parent.postMessage({
        type: 'QUEUE_STATUS',
        queueLength: alertQueue.length,
        isShowingAlert: isShowingAlert,
        currentAlert: currentAlert,
        queue: alertQueue
    }, '*');
}
