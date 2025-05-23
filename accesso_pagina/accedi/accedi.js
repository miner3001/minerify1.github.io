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

// Hamburger Menu
const hamburgerMenu = document.querySelector('.hamburger-menu');
const nav = document.querySelector('.nav');

hamburgerMenu.addEventListener('click', () => {
    nav.classList.toggle('nav--open');
    hamburgerMenu.classList.toggle('is-active');
    hamburgerMenu.setAttribute('aria-expanded', 
        hamburgerMenu.classList.contains('is-active')
    );
});

// Chiudi il menu quando si clicca su un link
document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('nav--open');
        hamburgerMenu.classList.remove('is-active');
        hamburgerMenu.setAttribute('aria-expanded', 'false');
    });
});