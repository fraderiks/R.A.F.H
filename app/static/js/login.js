// Bacakan pesan saat halaman dimuat
window.onload = () => {
    const speech = new SpeechSynthesisUtterance(
        "Do you already have an account? If not, say signup. If you do, say email to fill your email, password to fill your password, or login to submit. For help, say help."
    );
    window.speechSynthesis.speak(speech);
};

// Tangani perintah suara khusus halaman login
function handleVoiceCommand(command) {
    const emailVariants = ["email", "emale", "amail", "imail", "emeil", "ehmail", "amel", "emel", "e-mail"];
    const passwordVariants = ["password", "pasword", "paswod", "paseword", "passwood", "paswurt", "paswat","passport","posord"];
    const loginVariants = ["login", "log in", "loggin", "loging", "lodging"];
    const signUpVariants = ["sign up", "signup", "signap", "signuph", "sigup", "sinap", "sinup", "senap", "signet"];
    const helpVariants = ["help", "assist", "commands", "what can i say", "guide"];

    if (emailVariants.some((variant) => command.includes(variant))) {
        document.getElementById("email").focus();
        const speech = new SpeechSynthesisUtterance("Email.");
        window.speechSynthesis.speak(speech);
    } else if (passwordVariants.some((variant) => command.includes(variant))) {
        document.getElementById("password").focus();
        const speech = new SpeechSynthesisUtterance("Password.");
        window.speechSynthesis.speak(speech);
    } else if (loginVariants.some((variant) => command.includes(variant))) {
        submitLoginForm();
    } else if (signUpVariants.some((variant) => command.includes(variant))) {
        window.location.href = "/signup";
    } else if (command.includes("back")) {
        const speech = new SpeechSynthesisUtterance("Going back to the previous page.");
        window.speechSynthesis.speak(speech);
        window.history.back();
    } else if (command.includes("refresh")) {
        const speech = new SpeechSynthesisUtterance("Refreshing the page.");
        window.speechSynthesis.speak(speech);
        location.reload();
    } else if (helpVariants.some((variant) => command.includes(variant))) {
        const helpMessage =
            "You can say email to fill your email field, password to fill your password field, login to submit the form, signup to create a new account, back to return to the previous page, refresh to reload the page, or help to hear this guide.";
        const speech = new SpeechSynthesisUtterance(helpMessage);
        window.speechSynthesis.speak(speech);
    } else {
        const speech = new SpeechSynthesisUtterance("Sorry, I didn't understand that command.");
        window.speechSynthesis.speak(speech);
    }
}


// Function to handle form submission
async function submitLoginForm() {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: new URLSearchParams({ email, password })
        });

        if (response.ok) {
            // Redirect to the afterlogin page if successful
            window.location.href = "/afterlogin";
        } else {
            const result = await response.json(); // Parse the JSON error response
            if (result.error) {
                // Display the error in the #error-message div
                const errorMessage = document.getElementById("error-message");
                if (errorMessage) {
                    errorMessage.textContent = result.error; // Use the error message from the response
                }

                // Provide audible feedback for visually impaired users
                const speech = new SpeechSynthesisUtterance(result.error);
                window.speechSynthesis.speak(speech);
            }
        }
    } catch (error) {
        console.error("Error logging in:", error);
        const speech = new SpeechSynthesisUtterance(
            "An error occurred while trying to log in. Please try again later."
        );
        window.speechSynthesis.speak(speech);
    }
}

// Attach an event listener for form submission
document.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent default form submission
    submitLoginForm(); // Handle login via async function
});
