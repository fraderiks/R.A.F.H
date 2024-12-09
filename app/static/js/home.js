// Bacakan pesan saat halaman dimuat
window.onload = () => {
    const speech = new SpeechSynthesisUtterance(
        "Welcome to Rafh. Click and hold anywhere for 3 seconds to activate voice recognition. Say login, what time is it, or what date is it. For help, say help."
    );
    window.speechSynthesis.speak(speech);
};

// Tangani perintah suara khusus halaman home
function handleVoiceCommand(command) {
    const outputElement = document.getElementById("output");
    if (outputElement) {
        outputElement.textContent = `Detected: ${command}`;
    }

    const timeVariants = [
        "what time is it",
        "what's the time",
        "what time",
        "time now",
        "tell me the time",
        "current time",
        "wot time",
        "wut time"
    ];

    const dateVariants = [
        "what date is it",
        "what's the date",
        "what date",
        "date today",
        "tell me the date",
        "current date",
        "wot date",
        "wut date"
    ];

    const loginVariants = ["login", "log in", "loggin", "loging", "logn","lodging", "logginh"];
    const helpVariants = ["help", "assist", "commands", "what can i say", "guide"];

    if (timeVariants.some((variant) => command.includes(variant))) {
        speak(`The current time is ${new Date().toLocaleTimeString()}.`);
    } else if (dateVariants.some((variant) => command.includes(variant))) {
        speak(`Today's date is ${new Date().toLocaleDateString()}.`);
    } else if (loginVariants.some((variant) => command.includes(variant))) {
        window.location.href = "/login";
    } else if (command.includes("refresh")) {
        speak("Refreshing the page.");
        location.reload();
    } else if (helpVariants.some((variant) => command.includes(variant))) {
        const helpMessage =
            "You can say login to navigate to the login page, what time is it to hear the current time, what date is it to know today's date, refresh to reload the page, or help to hear this guide.";
        speak(helpMessage);
    } else {
        const speech = new SpeechSynthesisUtterance("Sorry, I didn't understand that command.");
        window.speechSynthesis.speak(speech);
    }
}

// Helper function to speak responses
function speak(message) {
    const speech = new SpeechSynthesisUtterance(message);
    window.speechSynthesis.speak(speech);
}
