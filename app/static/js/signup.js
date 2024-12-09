// Bacakan pesan saat halaman dimuat
window.onload = () => {
    const speech = new SpeechSynthesisUtterance(
        "Please fill in your username, email, password, and confirm your password. If you are visually impaired, say blind. To submit, say signup. For help, say help."
    );
    window.speechSynthesis.speak(speech);
};

// Validasi password dan username sebelum pengiriman formulir
async function validateAndSubmitForm(event) {
    if (event) event.preventDefault(); // Mencegah pengiriman form langsung jika ada event

    const username = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // Elemen feedback
    const usernameFeedback = document.getElementById("username-feedback");
    const passwordFeedback = document.getElementById("password-feedback");
    const emailFeedback = document.getElementById("email-feedback");

    // Reset feedback
    usernameFeedback.style.display = "none";
    passwordFeedback.style.display = "none";
    emailFeedback.style.display = "none";

    // Validasi email
    if (!email.includes("@")) {
        const errorMessage = "Please include an '@' in the email address.";
        emailFeedback.textContent = errorMessage;
        emailFeedback.style.display = "block";

        // Bacakan pesan error
        const speech = new SpeechSynthesisUtterance(errorMessage);
        window.speechSynthesis.speak(speech);
        return;
    }

    // Validasi password
    if (password !== confirmPassword) {
        const errorMessage = "Passwords do not match!";
        passwordFeedback.textContent = errorMessage;
        passwordFeedback.style.display = "block";

        // Bacakan pesan error
        const speech = new SpeechSynthesisUtterance(errorMessage);
        window.speechSynthesis.speak(speech);
        return;
    }

    // Validasi username melalui API
    try {
        const response = await fetch(`/api/check_username?username=${encodeURIComponent(username)}`);
        const result = await response.json();

        if (!result.available) {
            const errorMessage = "Username already taken.";
            usernameFeedback.textContent = errorMessage;
            usernameFeedback.style.display = "block";

            // Bacakan pesan error
            const speech = new SpeechSynthesisUtterance(errorMessage);
            window.speechSynthesis.speak(speech);
            return;
        }

        // Jika valid, kirim form
        document.querySelector("form").submit();
    } catch (error) {
        const errorMessage = "Error checking username. Please try again.";
        usernameFeedback.textContent = errorMessage;
        usernameFeedback.style.display = "block";

        // Bacakan pesan error
        const speech = new SpeechSynthesisUtterance(errorMessage);
        window.speechSynthesis.speak(speech);
    }
}

// Tambahkan event listener untuk form submit
document.querySelector("form").addEventListener("submit", validateAndSubmitForm);

// Tangani perintah suara khusus halaman signup
async function handleVoiceCommand(command) {
    const usernameVariants = ["username", "usename", "user neme", "usarname", "usurname", "yourname", "yuzername"];
    const emailVariants = ["email", "emale", "amail", "imail", "emeil", "ehmail", "amel", "emel", "e-mail"];
    const passwordVariants = ["password", "pasword", "paswod", "paseword", "passwood", "paswurt", "paswat", "passport", "posord"];
    const confirmPasswordVariants = ["confirm password", "konfirm password", "conform password", "konfram password"];
    const signUpVariants = ["sign up", "signup"];
    const blindVariants = ["blind", "blin", "blynd"];
    const helpVariants = ["help", "assistance", "commands", "guide", "what can i say"];

    if (confirmPasswordVariants.some((variant) => command.includes(variant))) {
        focusAndSpeak("confirm-password", "Confirm Password.");
    } else if (passwordVariants.some((variant) => command.includes(variant))) {
        focusAndSpeak("password", "Password.");
    } else if (usernameVariants.some((variant) => command.includes(variant))) {
        focusAndSpeak("username", "Username.");
    } else if (emailVariants.some((variant) => command.includes(variant))) {
        focusAndSpeak("email", "Email.");
    } else if (signUpVariants.some((variant) => command.includes(variant))) {
        // Perform the same validations as on form submission
        await validateAndSubmitForm(null); // Pass null for event since it's triggered by voice
    } else if (blindVariants.some((variant) => command.includes(variant))) {
        document.querySelector("input[name='blind']").checked = true;
        const speech = new SpeechSynthesisUtterance("Blind mode activated.");
        window.speechSynthesis.speak(speech);
    } else if (command.includes("back")) {
        window.history.back();
        const speech = new SpeechSynthesisUtterance("Going back to the previous page.");
        window.speechSynthesis.speak(speech);
    } else if (command.includes("refresh")) {
        location.reload();
        const speech = new SpeechSynthesisUtterance("Refreshing the page.");
        window.speechSynthesis.speak(speech);
    } else if (helpVariants.some((variant) => command.includes(variant))) {
        const helpMessage = "You can say username, email, password, confirm password, blind to activate blind mode, sign up to submit, back to go to the previous page, refresh to reload the page, or help to hear this guide.";
        const speech = new SpeechSynthesisUtterance(helpMessage);
        window.speechSynthesis.speak(speech);
    } else {
        const speech = new SpeechSynthesisUtterance("Sorry, I didn't understand that command.");
        window.speechSynthesis.speak(speech);
    }
}

// Fungsi untuk memfokuskan elemen dan memberikan umpan balik suara
function focusAndSpeak(elementId, message) {
    document.getElementById(elementId).focus();
    const speech = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(speech);
}
