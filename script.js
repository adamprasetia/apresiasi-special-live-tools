// DOM Elements
const amountButtons = document.querySelectorAll('.amount-btn');
const customAmountInput = document.getElementById('customAmount');
const nameInput = document.getElementById('name');
const emailInput = document.getElementById('email');
const messageInput = document.getElementById('message');
const hideNameCheckbox = document.getElementById('hideNameCheckbox');
const charCount = document.getElementById('charCount');
const termsCheckbox = document.getElementById('termsCheckbox');
const totalAmountDisplay = document.getElementById('totalAmount');
const submitBtn = document.getElementById('submitBtn');
const donationForm = document.getElementById('donationForm');

// Modal Elements
const termsModal = document.getElementById('termsModal');
const openTermsModal = document.getElementById('openTermsModal');
const closeModal = document.getElementById('closeModal');
const acceptTerms = document.getElementById('acceptTerms');

// State
let selectedAmount = 0;

// Format number to Indonesian Rupiah format
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(number);
}

// Format input as number with thousand separators
function formatNumberInput(value) {
    // Remove all non-digit characters
    const number = value.replace(/\D/g, '');
    // Format with thousand separators
    return new Intl.NumberFormat('id-ID').format(number);
}

// Parse formatted number to integer
function parseFormattedNumber(value) {
    return parseInt(value.replace(/\D/g, '')) || 0;
}

// Update total amount display
function updateTotalAmount() {
    totalAmountDisplay.textContent = formatRupiah(selectedAmount);
}

// Validate form and enable/disable submit button
function validateForm() {
    const hasAmount = selectedAmount >= 5000;
    const hasName = nameInput.value.trim().length > 0;
    const hasEmail = emailInput.value.trim().length > 0 && emailInput.validity.valid;
    const hasAcceptedTerms = termsCheckbox.checked;
    
    submitBtn.disabled = !(hasAmount && hasName && hasEmail && hasAcceptedTerms);
}

// Handle amount button click
amountButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        amountButtons.forEach(btn => btn.classList.remove('active'));
        
        // Add active class to clicked button
        button.classList.add('active');
        
        // Update selected amount
        selectedAmount = parseInt(button.dataset.amount);
        
        // Clear custom amount input
        customAmountInput.value = '';
        
        // Update display and validate
        updateTotalAmount();
        validateForm();
    });
});

// Handle custom amount input
customAmountInput.addEventListener('input', (e) => {
    // Format the input value
    const formatted = formatNumberInput(e.target.value);
    e.target.value = formatted;
    
    // Remove active class from all buttons
    amountButtons.forEach(btn => btn.classList.remove('active'));
    
    // Update selected amount
    selectedAmount = parseFormattedNumber(formatted);
    
    // Update display and validate
    updateTotalAmount();
    validateForm();
});

// Handle name input
nameInput.addEventListener('input', validateForm);

// Handle email input
emailInput.addEventListener('input', validateForm);

// Handle message input with character counter
messageInput.addEventListener('input', (e) => {
    const length = e.target.value.length;
    charCount.textContent = `${length}/500 karakter`;
});

// Handle terms checkbox
termsCheckbox.addEventListener('change', validateForm);

// Modal Functions
function openModal() {
    termsModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModalFunc() {
    termsModal.classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Open modal
openTermsModal.addEventListener('click', openModal);

// Close modal
closeModal.addEventListener('click', closeModalFunc);

// Accept terms
acceptTerms.addEventListener('click', () => {
    termsCheckbox.checked = true;
    validateForm();
    closeModalFunc();
});

// Close modal when clicking outside
termsModal.addEventListener('click', (e) => {
    if (e.target === termsModal) {
        closeModalFunc();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && termsModal.classList.contains('show')) {
        closeModalFunc();
    }
});

// Handle form submission
donationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (selectedAmount < 5000) {
        alert('Minimal donasi adalah Rp 5.000');
        return;
    }
    
    // Disable submit button to prevent double submission
    submitBtn.disabled = true;
    submitBtn.textContent = 'Memproses...';
    
    try {
        // Prepare payload
        const payload = {
            urlpage: "https://apresiasi.kompas.com",
            user_name: nameInput.value.trim(),
            user_email: emailInput.value.trim(),
            price: selectedAmount,
            message: messageInput.value.trim(),
            anonim: hideNameCheckbox.checked ? 1 : 0
        };
        
        console.log('Sending payload:', payload);
        
        // Send to API
        const response = await fetch('http://api-staging.kompas.com/superthank/message', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        console.log('API Response:', result);
        
        if (result.status && result.data && result.data.payment_link) {
            // Redirect to payment link
            window.location.href = result.data.payment_link;
        } else {
            throw new Error('Invalid response from server');
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat memproses donasi. Silakan coba lagi.');
        
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Lanjutkan Pembayaran';
        validateForm();
    }
});

// Initialize
updateTotalAmount();
validateForm();
