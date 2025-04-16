window.onload = function() {

    submitButton = document.getElementById("submit");
    if (submitButton) {
        submitButton.addEventListener("click", function(event) {
            event.preventDefault(); // Impedisce l'invio del modulo
            const email = document.getElementById("email").value;
            const errorMessage = document.getElementById("error-message");
            if (email === "" ) {
                errorMessage.textContent = "Compila tutti i campi.";
                errorMessage.style.color = "red";
            } else {
                errorMessage.textContent = "";
                // Qui puoi aggiungere la logica per inviare i dati al server
                console.log("Email:", email);

            }
        });
    }
}