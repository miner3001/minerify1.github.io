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

// Aggiungi l'evento al pulsante di pagamento
document.querySelector('.submit-btn').addEventListener('click', function (event) {
    event.preventDefault(); // Previene l'invio del form
    showPaymentOverlay();
});