document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // Semplice controllo delle credenziali (da sostituire con un controllo reale)
    if (email === 'utente@example.com' && password === 'password') {
        window.location.href = '../../music_page/scopri.html';
    } else {
        alert('Credenziali non valide');
    }
});