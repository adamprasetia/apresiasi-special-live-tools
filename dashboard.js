// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');

// Toggle controls
const toggleRecent = document.getElementById('toggleRecent');
const toggleCounter = document.getElementById('toggleCounter');
const toggleQR = document.getElementById('toggleQR');
const autoAlert = document.getElementById('autoAlert');
const enableModeration = document.getElementById('enableModeration');
const moderationBadge = document.getElementById('moderationBadge');

// Auto approve controls
const enableAutoApprove = document.getElementById('enableAutoApprove');
const autoApproveDelay = document.getElementById('autoApproveDelay');
const autoApproveBadge = document.getElementById('autoApproveBadge');
let autoApproveEnabled = false;
let autoApproveMaxWait = 30; // default 30 seconds
let autoApproveTimers = {}; // Store timers for each donation ID

// Position controls
const positionRecent = document.getElementById('positionRecent');
const positionCounter = document.getElementById('positionCounter');
const positionQR = document.getElementById('positionQR');

// Moderation queue
const pendingQueue = document.getElementById('pendingQueue');
const queueList = document.getElementById('queueList');
const queueCount = document.getElementById('queueCount');
const queueBadge = document.getElementById('queueBadge');
const approveAllBtn = document.getElementById('approveAll');
let pendingDonations = [];
let donationIdCounter = 1;

// Live donations
const liveList = document.getElementById('liveList');
const liveDonationCount = document.getElementById('liveDonationCount');
const liveTotalAmount = document.getElementById('liveTotalAmount');
const clearAllLive = document.getElementById('clearAllLive');
let liveDonations = [];

// Alert queue monitoring
const alertQueueList = document.getElementById('alertQueueList');
const alertQueueCount = document.getElementById('alertQueueCount');
const alertQueueBadge = document.getElementById('alertQueueBadge');
const currentAlertStatus = document.getElementById('currentAlertStatus');
const clearAlertQueue = document.getElementById('clearAlertQueue');
let alertQueueData = [];
let isMonitoring = false;

// Test controls
const testName = document.getElementById('testName');
const testAmount = document.getElementById('testAmount');
const testMessage = document.getElementById('testMessage');
const testHideName = document.getElementById('testHideName');
const sendTestDonation = document.getElementById('sendTestDonation');
const quickButtons = document.querySelectorAll('.quick-buttons .btn');
const testAlertBtn = document.getElementById('testAlert');
const alertDuration = document.getElementById('alertDuration');
const alertPosition = document.getElementById('alertPosition');

// Preview controls
const displayPreview = document.getElementById('displayPreview');
const refreshPreview = document.getElementById('refreshPreview');
const openNewWindow = document.getElementById('openNewWindow');

// Other controls
const resetAll = document.getElementById('resetAll');

// Get display window reference
let displayWindow = null;

// Mobile menu elements
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

// Mobile menu toggle
mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');
});

// Close sidebar when overlay clicked
sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
});

// Navigation
navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all items
        navItems.forEach(nav => nav.classList.remove('active'));
        
        // Add active class to clicked item
        item.classList.add('active');
        
        // Hide all sections
        contentSections.forEach(section => section.classList.remove('active'));
        
        // Show selected section
        const sectionId = item.dataset.section + 'Section';
        document.getElementById(sectionId).classList.add('active');
        
        // Close mobile menu after selection
        sidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
    });
});

// Update queue display
function updateQueueDisplay() {
    const count = pendingDonations.length;
    queueCount.textContent = `${count} menunggu`;
    
    // Update badge
    if (count > 0) {
        queueBadge.textContent = count;
        queueBadge.classList.add('show');
    } else {
        queueBadge.classList.remove('show');
    }
    
    if (count > 0) {
        pendingQueue.classList.add('has-items');
        approveAllBtn.style.display = 'inline-flex';
        
        queueList.innerHTML = '';
        
        pendingDonations.forEach((donation, index) => {
            const item = document.createElement('div');
            item.className = 'queue-item';
            
            // Calculate countdown if auto-approve is enabled
            let countdownHtml = '';
            if (autoApproveEnabled) {
                const timeRemaining = getTimeRemaining(donation.receivedAt);
                if (timeRemaining > 0) {
                    const minutes = Math.floor(timeRemaining / 60);
                    const seconds = timeRemaining % 60;
                    const timeText = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                    countdownHtml = `<div class="queue-item-countdown" style="color: #ff9800; font-size: 12px; margin-top: 5px;">⏱️ Auto setujui dalam ${timeText}</div>`;
                } else {
                    countdownHtml = `<div class="queue-item-countdown" style="color: #dc3545; font-size: 12px; margin-top: 5px;">⏱️ Sedang diproses...</div>`;
                }
            }
            
            item.innerHTML = `
                <div class="queue-item-info">
                    <div class="queue-item-meta">
                        <span class="queue-item-name">${donation.displayName}</span>
                        <span class="queue-item-time">${donation.timestamp}</span>
                    </div>
                    <div class="queue-item-amount">${formatRupiah(donation.amount)}</div>
                    ${donation.message ? `<div class="queue-item-message">💬 "${donation.message}"</div>` : '<div class="queue-item-message" style="opacity: 0.5;">Tidak ada pesan</div>'}
                    ${countdownHtml}
                </div>
                <div class="queue-item-actions">
                    <button class="btn btn-sm btn-approve" data-index="${index}">
                        ✓ Setujui
                    </button>
                    <button class="btn btn-sm btn-reject" data-index="${index}">
                        ✕ Tolak
                    </button>
                </div>
            `;
            queueList.appendChild(item);
        });
        
        // Add event listeners to approve/reject buttons
        document.querySelectorAll('.btn-approve').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                approveDonation(index);
            });
        });
        
        document.querySelectorAll('.btn-reject').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.dataset.index);
                rejectDonation(index);
            });
        });
    } else {
        pendingQueue.classList.remove('has-items');
        approveAllBtn.style.display = 'none';
        queueList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <p>Belum ada donasi yang masuk</p>
                <small>Donasi baru akan muncul di sini untuk direview</small>
            </div>
        `;
    }
}

// Add donation to queue
function addToQueue(donation) {
    const now = new Date();
    const timestamp = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    const queueItem = {
        id: donationIdCounter++,
        ...donation,
        displayName: donation.hideName ? 'Anonim' : donation.name,
        timestamp: timestamp,
        receivedAt: Date.now() // Store as milliseconds for timer calculation
    };
    
    pendingDonations.unshift(queueItem);
    
    // Start auto-approve timer if enabled
    if (autoApproveEnabled) {
        startAutoApproveTimer(queueItem);
    }
    
    updateQueueDisplay();
    
    // Show notification
    showNotification(`Donasi baru: ${queueItem.displayName} - ${formatRupiah(queueItem.amount)}`);
}

// Approve donation
function approveDonation(donationIdOrIndex) {
    // Support both ID and index for backwards compatibility
    let index, donation;
    
    if (typeof donationIdOrIndex === 'number' && donationIdOrIndex < pendingDonations.length) {
        // It's an index
        index = donationIdOrIndex;
        donation = pendingDonations[index];
    } else {
        // It's an ID
        index = pendingDonations.findIndex(d => d.id === donationIdOrIndex);
        if (index === -1) return; // Donation not found
        donation = pendingDonations[index];
    }
    
    // Clear auto-approve timer if exists
    if (autoApproveTimers[donation.id]) {
        clearTimeout(autoApproveTimers[donation.id]);
        delete autoApproveTimers[donation.id];
    }
    
    pendingDonations.splice(index, 1);
    
    // Send to display with ID
    const displayData = {
        type: 'NEW_DONATION',
        id: donation.id,
        name: donation.displayName,
        amount: donation.amount,
        message: donation.message,
        hideName: false // Already processed in displayName
    };
    sendToDisplay(displayData);
    
    // Add to live donations
    addToLiveDonations(donation);
    
    // Update queue
    updateQueueDisplay();
    
    // Show notification
    showNotification(`✓ Donasi disetujui: ${donation.displayName} - ${formatRupiah(donation.amount)}`, 'success');
}

// Reject donation
function rejectDonation(index) {
    const donation = pendingDonations[index];
    if (confirm(`Yakin ingin menolak donasi dari ${donation.displayName}?`)) {
        // Clear auto-approve timer if exists
        if (autoApproveTimers[donation.id]) {
            clearTimeout(autoApproveTimers[donation.id]);
            delete autoApproveTimers[donation.id];
        }
        
        pendingDonations.splice(index, 1);
        updateQueueDisplay();
        showNotification(`✕ Donasi ditolak: ${donation.displayName}`, 'error');
    }
}

// Approve all donations
approveAllBtn.addEventListener('click', () => {
    if (confirm(`Setujui semua ${pendingDonations.length} donasi?`)) {
        const count = pendingDonations.length;
        pendingDonations.forEach(donation => {
            // Clear auto-approve timer if exists
            if (autoApproveTimers[donation.id]) {
                clearTimeout(autoApproveTimers[donation.id]);
                delete autoApproveTimers[donation.id];
            }
            
            const displayData = {
                type: 'NEW_DONATION',
                id: donation.id,
                name: donation.displayName,
                amount: donation.amount,
                message: donation.message,
                hideName: false // Already processed in displayName
            };
            sendToDisplay(displayData);
            
            // Add to live donations
            addToLiveDonations(donation);
        });
        pendingDonations = [];
        updateQueueDisplay();
        showNotification(`✓ ${count} donasi disetujui`, 'success');
    }
});

// Simple notification function
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Could be expanded to show toast notifications
}

// Toggle Moderation
enableModeration.addEventListener('change', (e) => {
    if (e.target.checked) {
        moderationBadge.textContent = 'Moderasi Aktif';
        moderationBadge.classList.remove('warning');
        moderationBadge.classList.add('success');
        showNotification('⚠️ Mode Moderasi Aktif - Donasi perlu persetujuan manual', 'warning');
    } else {
        moderationBadge.textContent = 'Langsung Tayang';
        moderationBadge.classList.remove('success');
        moderationBadge.classList.add('warning');
        
        // Auto-approve all pending donations
        if (pendingDonations.length > 0) {
            if (confirm(`Ada ${pendingDonations.length} donasi tertunda. Setujui semua?`)) {
                const count = pendingDonations.length;
                pendingDonations.forEach(donation => {
                    // Clear auto-approve timer if exists
                    if (autoApproveTimers[donation.id]) {
                        clearTimeout(autoApproveTimers[donation.id]);
                        delete autoApproveTimers[donation.id];
                    }
                    
                    const displayData = {
                        type: 'NEW_DONATION',
                        name: donation.displayName,
                        amount: donation.amount,
                        message: donation.message,
                        hideName: donation.hideName
                    };
                    sendToDisplay(displayData);
                });
                pendingDonations = [];
                updateQueueDisplay();
                showNotification(`✓ ${count} donasi disetujui otomatis`, 'success');
            }
        }
        showNotification('✓ Mode Langsung Tayang - Donasi otomatis tampil', 'success');
    }
});

// Auto Approve Toggle
enableAutoApprove.addEventListener('change', (e) => {
    autoApproveEnabled = e.target.checked;
    
    if (autoApproveEnabled) {
        autoApproveBadge.textContent = 'Auto Setujui Aktif';
        autoApproveBadge.classList.add('success');
        autoApproveBadge.style.display = 'inline-block';
        
        // Start timers for existing pending donations
        pendingDonations.forEach(donation => {
            if (!autoApproveTimers[donation.id]) {
                startAutoApproveTimer(donation);
            }
        });
        
        showNotification('Auto approve diaktifkan', 'success');
    } else {
        autoApproveBadge.textContent = 'Tidak Aktif';
        autoApproveBadge.classList.remove('success');
        autoApproveBadge.style.display = 'none';
        
        // Clear all existing timers
        Object.keys(autoApproveTimers).forEach(id => {
            clearTimeout(autoApproveTimers[id]);
            delete autoApproveTimers[id];
        });
        
        showNotification('Auto approve dinonaktifkan', 'info');
    }
    
    updateQueueDisplay();
});

// Auto Approve Delay Change
autoApproveDelay.addEventListener('change', (e) => {
    autoApproveMaxWait = parseInt(e.target.value) || 30;
    
    // Restart timers with new delay if auto-approve is enabled
    if (autoApproveEnabled) {
        // Clear existing timers
        Object.keys(autoApproveTimers).forEach(id => {
            clearTimeout(autoApproveTimers[id]);
            delete autoApproveTimers[id];
        });
        
        // Restart timers for all pending donations
        pendingDonations.forEach(donation => {
            startAutoApproveTimer(donation);
        });
        
        showNotification(`Waktu tunggu diubah menjadi ${autoApproveMaxWait} detik`, 'info');
    }
});

// Start auto-approve timer for a donation
function startAutoApproveTimer(donation) {
    if (!autoApproveEnabled) return;
    
    const timeElapsed = Math.floor((Date.now() - donation.receivedAt) / 1000);
    const timeRemaining = autoApproveMaxWait - timeElapsed;
    
    if (timeRemaining <= 0) {
        // Time already expired, approve immediately
        approveDonation(donation.id);
        return;
    }
    
    // Set timer for remaining time
    autoApproveTimers[donation.id] = setTimeout(() => {
        approveDonation(donation.id);
        delete autoApproveTimers[donation.id];
        showNotification(`✓ Donasi dari ${donation.displayName} disetujui otomatis`, 'success');
    }, timeRemaining * 1000);
}

// Get time remaining for auto-approve
function getTimeRemaining(timestamp) {
    if (!autoApproveEnabled) return null;
    
    const timeElapsed = Math.floor((Date.now() - timestamp) / 1000);
    const timeRemaining = autoApproveMaxWait - timeElapsed;
    
    return Math.max(0, timeRemaining);
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

// Send message to display window
function sendToDisplay(message) {
    // Send to iframe
    if (displayPreview && displayPreview.contentWindow) {
        displayPreview.contentWindow.postMessage(message, '*');
    }
    
    // Send to popup window if exists
    if (displayWindow && !displayWindow.closed) {
        displayWindow.postMessage(message, '*');
    }
}

// Toggle Recent Donations
toggleRecent.addEventListener('change', (e) => {
    sendToDisplay({
        type: 'TOGGLE_ELEMENT',
        element: 'recentDonations',
        show: e.target.checked
    });
});

// Toggle Total Counter
toggleCounter.addEventListener('change', (e) => {
    sendToDisplay({
        type: 'TOGGLE_ELEMENT',
        element: 'totalCounter',
        show: e.target.checked
    });
});

// Toggle QR Code
toggleQR.addEventListener('change', (e) => {
    sendToDisplay({
        type: 'TOGGLE_ELEMENT',
        element: 'qrSection',
        show: e.target.checked
    });
});

// Position Recent Donations
positionRecent.addEventListener('change', (e) => {
    sendToDisplay({
        type: 'CHANGE_POSITION',
        element: 'recentDonations',
        position: e.target.value
    });
});

// Position Total Counter
positionCounter.addEventListener('change', (e) => {
    sendToDisplay({
        type: 'CHANGE_POSITION',
        element: 'totalCounter',
        position: e.target.value
    });
});

// Position QR Code
positionQR.addEventListener('change', (e) => {
    sendToDisplay({
        type: 'CHANGE_POSITION',
        element: 'qrSection',
        position: e.target.value
    });
});

// Toggle Auto Alert
autoAlert.addEventListener('change', (e) => {
    sendToDisplay({
        type: 'TOGGLE_AUTO_ALERT',
        enabled: e.target.checked
    });
});

// Alert Duration Change
alertDuration.addEventListener('change', (e) => {
    const duration = parseInt(e.target.value);
    if (duration >= 3 && duration <= 30) {
        sendToDisplay({
            type: 'SET_ALERT_DURATION',
            duration: duration * 1000 // convert to milliseconds
        });
    }
});

// Alert Position Change
alertPosition.addEventListener('change', (e) => {
    sendToDisplay({
        type: 'SET_ALERT_POSITION',
        position: e.target.value
    });
});

// Alert Duration Change
alertDuration.addEventListener('change', (e) => {
    const duration = parseInt(e.target.value);
    if (duration >= 3 && duration <= 30) {
        sendToDisplay({
            type: 'SET_ALERT_DURATION',
            duration: duration * 1000 // convert to milliseconds
        });
    }
});

// Alert Position Change
alertPosition.addEventListener('change', (e) => {
    sendToDisplay({
        type: 'SET_ALERT_POSITION',
        position: e.target.value
    });
});

// Send Test Donation
sendTestDonation.addEventListener('click', () => {
    const donationId = Date.now();
    const donation = {
        type: 'NEW_DONATION',
        id: donationId,
        name: testName.value.trim() || 'Anonim',
        amount: parseInt(testAmount.value) || 0,
        message: testMessage.value.trim(),
        hideName: testHideName.checked
    };
    
    if (donation.amount < 5000) {
        alert('Minimal donasi Rp 5.000');
        return;
    }
    
    // Check if moderation is enabled
    if (enableModeration.checked) {
        // Add to pending queue
        addToQueue(donation);
        
        alert(`Donasi ditambahkan ke antrian moderasi!\n\nCek tab "Antrian Donasi Masuk" untuk menyetujui.`);
    } else {
        // Send directly
        sendToDisplay(donation);
        
        // Add to live donations
        const displayName = donation.hideName ? 'Anonim' : donation.name;
        addToLiveDonations({
            id: donationId,
            displayName: displayName,
            amount: donation.amount,
            message: donation.message
        });
        
        alert(`Test donasi langsung tayang!\n\nNama: ${displayName}\nJumlah: ${formatRupiah(donation.amount)}`);
    }
});

// Quick Test Buttons
quickButtons.forEach(button => {
    button.addEventListener('click', () => {
        const amount = parseInt(button.dataset.amount);
        testAmount.value = amount;
        
        const donationId = Date.now();
        const donation = {
            type: 'NEW_DONATION',
            id: donationId,
            name: 'Quick Test',
            amount: amount,
            message: 'Quick test donation',
            hideName: false
        };
        
        // Check if moderation is enabled
        if (enableModeration.checked) {
            addToQueue(donation);
            alert(`Donasi ${formatRupiah(amount)} ditambahkan ke antrian`);
        } else {
            sendToDisplay(donation);
            
            // Add to live donations
            addToLiveDonations({
                id: donationId,
                displayName: 'Quick Test',
                amount: amount,
                message: 'Quick test donation'
            });
            
            showNotification(`Quick test ${formatRupiah(amount)} langsung tayang`);
        }
    });
});

// Test Alert Button
testAlertBtn.addEventListener('click', () => {
    if (!autoAlert.checked) {
        alert('Donation Alert sedang OFF. Nyalakan toggle Donation Alert terlebih dahulu.');
        return;
    }
    
    const duration = parseInt(alertDuration.value) * 1000;
    
    sendToDisplay({
        type: 'SHOW_ALERT',
        name: 'Test User',
        amount: 50000,
        message: 'Test alert message',
        duration: duration
    });
});

// Refresh Preview
refreshPreview.addEventListener('click', () => {
    displayPreview.src = displayPreview.src;
});

// Open in New Window
openNewWindow.addEventListener('click', () => {
    displayWindow = window.open('display.html', 'DisplayWindow', 'width=1920,height=1080');
});

// Reset All
resetAll.addEventListener('click', () => {
    if (confirm('Reset semua pengaturan ke default?')) {
        toggleRecent.checked = false;
        toggleCounter.checked = false;
        toggleQR.checked = false;
        autoAlert.checked = true;
        
        positionRecent.value = 'top-right';
        positionCounter.value = 'bottom-left';
        positionQR.value = 'bottom-right';
        
        sendToDisplay({ type: 'RESET_ALL' });
        
        alert('Semua pengaturan telah direset');
    }
});

// Listen for messages from display window
window.addEventListener('message', (event) => {
    console.log('Dashboard received message:', event.data);
    
    // Handle Queue Status from display
    if (event.data.type === 'QUEUE_STATUS') {
        updateAlertQueueDisplay(event.data);
    }
});

// Live Donations Management
function addToLiveDonations(donation) {
    const liveItem = {
        id: donation.id || Date.now(),
        displayName: donation.displayName,
        amount: donation.amount,
        message: donation.message,
        timestamp: Date.now()
    };
    
    liveDonations.unshift(liveItem);
    updateLiveDisplay();
}

function updateLiveDisplay() {
    const count = liveDonations.length;
    const total = liveDonations.reduce((sum, d) => sum + d.amount, 0);
    
    liveDonationCount.textContent = count;
    liveTotalAmount.textContent = formatRupiah(total);
    
    if (count > 0) {
        clearAllLive.style.display = 'inline-flex';
        
        liveList.innerHTML = '';
        
        liveDonations.forEach((donation, index) => {
            const item = document.createElement('div');
            item.className = 'live-item';
            
            const timeDiff = Date.now() - donation.timestamp;
            const minutes = Math.floor(timeDiff / 60000);
            const timeText = minutes < 1 ? 'Baru saja' : `${minutes} menit lalu`;
            
            item.innerHTML = `
                <div class="live-item-info">
                    <span class="live-item-name">${donation.displayName}</span>
                    <span class="live-item-amount">${formatRupiah(donation.amount)}</span>
                    <span class="live-item-time">${timeText}</span>
                    ${donation.message ? `<span class="live-item-message">"${donation.message}"</span>` : ''}
                </div>
                <div class="live-item-actions">
                    <button class="btn btn-sm btn-danger btn-icon" onclick="removeLiveDonation(${index})" title="Hapus">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            `;
            
            liveList.appendChild(item);
        });
    } else {
        clearAllLive.style.display = 'none';
        liveList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect>
                    <polyline points="17 2 12 7 7 2"></polyline>
                </svg>
                <p>Belum ada donasi yang tayang</p>
                <small>Donasi yang disetujui akan muncul di sini</small>
            </div>
        `;
    }
}

function removeLiveDonation(index) {
    const donation = liveDonations[index];
    
    if (confirm(`Hapus donasi dari ${donation.displayName}?`)) {
        // Remove from live donations array
        liveDonations.splice(index, 1);
        
        // Send message to display to remove the donation
        sendToDisplay({
            type: 'REMOVE_DONATION',
            donationId: donation.id
        });
        
        updateLiveDisplay();
        showNotification(`Donasi dari ${donation.displayName} telah dihapus`, 'info');
    }
}

// Clear All Live Donations
clearAllLive.addEventListener('click', () => {
    if (confirm(`Hapus semua ${liveDonations.length} donasi yang sedang tayang?`)) {
        // Send message to display to clear all donations
        sendToDisplay({
            type: 'CLEAR_ALL_DONATIONS'
        });
        
        liveDonations = [];
        updateLiveDisplay();
        showNotification('Semua donasi tayang telah dihapus', 'info');
    }
});

// Update timestamps every minute
setInterval(() => {
    updateLiveDisplay();
}, 60000);

// Update countdown timers every second
setInterval(() => {
    if (autoApproveEnabled && pendingDonations.length > 0) {
        updateQueueDisplay();
    }
}, 1000);

// Alert Queue Management
function requestQueueStatus() {
    sendToDisplay({ type: 'GET_QUEUE_STATUS' });
}

function updateAlertQueueDisplay(queueData) {
    const count = queueData.queueLength || 0;
    const isShowing = queueData.isShowingAlert || false;
    const queue = queueData.queue || [];
    
    // Update badge
    if (count > 0 || isShowing) {
        alertQueueBadge.textContent = isShowing ? count + 1 : count;
        alertQueueBadge.classList.add('show');
    } else {
        alertQueueBadge.classList.remove('show');
    }
    
    // Update count and status
    alertQueueCount.textContent = count;
    currentAlertStatus.textContent = isShowing ? 'Menampilkan Alert' : 'Tidak Ada';
    currentAlertStatus.style.color = isShowing ? '#28a745' : '#6c757d';
    
    if (count > 0 || isShowing) {
        clearAlertQueue.style.display = 'inline-flex';
        alertQueueList.innerHTML = '';
        
        // Show currently displaying alert
        if (isShowing && queueData.currentAlert) {
            const item = document.createElement('div');
            item.className = 'alert-queue-item processing';
            item.innerHTML = `
                <div class="alert-queue-item-info">
                    <span class="alert-queue-item-name">${queueData.currentAlert.name}</span>
                    <span class="alert-queue-item-amount">${formatRupiah(queueData.currentAlert.amount)}</span>
                    <span class="alert-queue-item-status showing">Sedang Tayang</span>
                </div>
            `;
            alertQueueList.appendChild(item);
        }
        
        // Show queue items
        queue.forEach((alert, index) => {
            const item = document.createElement('div');
            item.className = 'alert-queue-item';
            item.innerHTML = `
                <div class="alert-queue-item-info">
                    <span class="alert-queue-item-name">${alert.donation.name}</span>
                    <span class="alert-queue-item-amount">${formatRupiah(alert.donation.amount)}</span>
                    <span class="alert-queue-item-duration">${(alert.customDuration || 8000) / 1000}s</span>
                    <span class="alert-queue-item-status waiting">Posisi #${index + 1}</span>
                </div>
            `;
            alertQueueList.appendChild(item);
        });
    } else {
        clearAlertQueue.style.display = 'none';
        alertQueueList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <p>Tidak ada alert dalam antrian</p>
                <small>Alert akan muncul di sini saat menunggu ditampilkan</small>
            </div>
        `;
    }
}

// Clear Alert Queue
clearAlertQueue.addEventListener('click', () => {
    if (confirm('Bersihkan semua alert dalam antrian?')) {
        sendToDisplay({ type: 'CLEAR_ALERT_QUEUE' });
        showNotification('Queue alert telah dibersihkan', 'info');
    }
});

// Start monitoring queue status every 1 second
setInterval(() => {
    requestQueueStatus();
}, 1000);

// Initial state
console.log('Dashboard initialized');
updateQueueDisplay();
requestQueueStatus(); // Initial queue status request
