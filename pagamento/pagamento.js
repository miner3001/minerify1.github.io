// Funzione per mostrare l'overlay
function showPaymentOverlay() {
    const overlay = document.createElement('div');
    overlay.classList.add('payment-overlay');

    const messageBox = document.createElement('div');
    messageBox.classList.add('payment-message');
    messageBox.innerHTML = `
        <h2>Pagamento effettuato!</h2>
        <p>Ora puoi ascoltare la tua musica senza interruzioni.</p>
        <button onclick="closePaymentOverlay()">Chiudi</button>
    `;

    overlay.appendChild(messageBox);
    document.body.appendChild(overlay);
}

// Funzione per chiudere l'overlay
function closePaymentOverlay() {
    const overlay = document.querySelector('.payment-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Funzione per validare i campi del modulo
function validateForm() {
    const fullName = document.getElementById('full-name').value.trim();
    const email = document.getElementById('email').value.trim();
    const cardNumber = document.getElementById('card-number').value.trim();
    const expiryDate = document.getElementById('expiry-date').value.trim();
    const cvv = document.getElementById('cvv').value.trim();

    if (!fullName || !email || !cardNumber || !expiryDate || !cvv) {
        alert('Per favore, compila tutti i campi obbligatori.');
        return false;
    }

    return true;
}

// Aggiungi l'evento al pulsante di pagamento
document.querySelector('.submit-btn').addEventListener('click', function (event) {
    event.preventDefault(); // Previene l'invio del form

    if (validateForm()) {
        showPaymentOverlay();
    }
});