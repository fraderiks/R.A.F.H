let isAddReminder = false; // Status apakah sedang dalam mode menambahkan reminder
let currentReminderStep = null; // Untuk melacak langkah input (time/note)
let timeInput = ""; // Variabel global untuk menyimpan waktu reminder
let userInteracted = false; // Status apakah pengguna sudah berinteraksi dengan halaman

// Ambil username dari elemen HTML
const usernameElement = document.getElementById("username");
const username = usernameElement ? usernameElement.dataset.username : "Guest";

// Pesan selamat datang
window.onload = () => {
    console.log("Loading reminders...");
    fetchReminders();
    const welcomeMessage = `Welcome ${username}, you can speak add reminder, list reminder, refresh, back, exit. Don't forget to click and hold for 3 seconds to speak.`;
    console.log(welcomeMessage);
    speak(welcomeMessage);
};

// Tombol untuk memulai interaksi pengguna
document.addEventListener("click", () => {
    console.log("User interaction detected, initializing SpeechSynthesis.");
    userInteracted = true;
    const utterance = new SpeechSynthesisUtterance("");
    utterance.lang = "en-US";
    window.speechSynthesis.speak(utterance);
}, { once: true }); // Hanya berjalan sekali

// Tangani perintah suara spesifik halaman afterlogin
// Tangani perintah suara spesifik halaman afterlogin
function handleVoiceCommand(command) {
    console.log(`Voice command received in afterlogin: ${command}`);

    if (isAddReminder) {
        console.log("Already in add reminder process. Ignoring command redirection.");
        return;
    }

    const exitVariants = ["exit", "log out", "logout","lock up"];
    const refreshVariants = ["refresh", "reload", "update page"];
    const backVariants = ["back", "go back", "return"];
    const listReminderVariants = ["list reminder", "show reminders", "reminders list", "list all reminders"];
    const addReminderVariants = ["add reminder", "set reminder", "create reminder"];
    const removeReminderVariants = ["remove reminder", "delete reminder"];
    const helpVariants = ["help", "assist", "commands", "what can i say", "guide"];
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

    if (exitVariants.some((variant) => command.includes(variant))) {
        speak("Logging out now.");
        logout();
    } else if (timeVariants.some((variant) => command.includes(variant))) {
        speak(`The current time is ${new Date().toLocaleTimeString()}.`);
    } else if (refreshVariants.some((variant) => command.includes(variant))) {
        speak("Refreshing the page.");
        location.reload();
    } else if (backVariants.some((variant) => command.includes(variant))) {
        speak("Going back to the previous page.");
        window.history.back();
    } else if (listReminderVariants.some((variant) => command.includes(variant))) {
        readAllReminders();
    } else if (addReminderVariants.some((variant) => command.includes(variant))) {
        speak("Please say the time for the reminder in 24-hour format, such as fourteen thirty for 2:30 PM.");
        isAddReminder = true;
        currentReminderStep = "time";
    } else if (removeReminderVariants.some((variant) => command.includes(variant))) {
        speak("Please say the ID of the reminder you want to remove.");
        isRemoveReminder = true; // Enable remove reminder mode
    } else if (helpVariants.some((variant) => command.includes(variant))) {
        const helpMessage =
            "You can say add reminder to create a new reminder, list reminder to hear all your reminders, remove reminder to delete one, back to return to the previous page, refresh to reload the page, or exit to log out. For assistance, you can say help at any time.";
        speak(helpMessage);
    } else {
        speak("Sorry, I didn't understand that command.");
    }
}

// Process input time or note for reminder
function startTimeInputProcess(command) {
    // Convert spoken words to numeric string
    let numericCommand = wordsToNumbers(command).trim(); // "two one five five" -> "2155"
    console.log(`Converted command to numeric: '${numericCommand}'`);

    // Remove any non-numeric characters (like ".")
    numericCommand = numericCommand.replace(/[^0-9]/g, '');
    console.log(`Cleaned numeric command: '${numericCommand}'`);

    if (currentReminderStep === "time") {
        // Ensure numericCommand is formatted correctly
        let formattedTime = numericCommand;

        if (/^\d{4}$/.test(formattedTime)) {
            // Convert "2155" -> "21:55"
            formattedTime = formattedTime.slice(0, 2) + ":" + formattedTime.slice(2);
        } else if (/^\d{3}$/.test(formattedTime)) {
            // Convert "935" -> "09:35"
            formattedTime = "0" + formattedTime.slice(0, 1) + ":" + formattedTime.slice(1);
        } else {
            console.error(`Invalid format: '${formattedTime}'`);
            speak("Invalid time format. Please say the time again.");
            return;
        }

        console.log(`Formatted time for validation: '${formattedTime}'`);
        const validatedTime = validateTime(formattedTime); // Validate the formatted time

        if (!validatedTime) {
            console.error(`Invalid time format after validation: '${formattedTime}'`);
            speak("Invalid time format. Please say the time again.");
            return;
        }

        console.log(`Time received: '${validatedTime}'`);
        timeInput = validatedTime; // Save validated time
        speak("Got it. Now, please say the note for the reminder.");
        currentReminderStep = "note"; // Move to note step
    } else if (currentReminderStep === "note") {
        const noteInput = command.trim();
        if (!noteInput) {
            speak("Invalid note. Please say the note again.");
            return;
        }

        console.log(`Note received: '${noteInput}'`);
        speak(`Adding reminder for ${timeInput}, with note: ${noteInput}.`);
        processReminder(timeInput, noteInput); // Save the reminder
    }
}





// Validasi dan konversi waktu ke format HH:mm
function validateTime(input) {
    console.log(`Validating time input: '${input}'`);

    // Ensure input is trimmed
    input = input.trim();

    // Validation regex for HH:mm format
    const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/; // Match 00:00 to 23:59
    const match = input.match(timeRegex);

    if (!match) {
        console.error(`Invalid time format: '${input}'`);
        return null;
    }

    // Pad hours and minutes with leading zeros if necessary
    const hours = match[1].padStart(2, "0");
    const minutes = match[2].padStart(2, "0");

    const validatedTime = `${hours}:${minutes}`;
    console.log(`Validated time: '${validatedTime}'`);
    return validatedTime;
}



// Proses dan simpan reminder
function processReminder(timeInput, noteInput) {
    const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
    const localTime = new Date(`${today}T${timeInput}:00`); // Gabungkan tanggal dan waktu

    if (isNaN(localTime)) {
        console.error("Failed to create valid date object:", timeInput);
        speak("Invalid time value. Please try adding the reminder again.");
        return;
    }

    // Konversi waktu lokal ke UTC
    const utcTime = new Date(localTime.getTime() - localTime.getTimezoneOffset() * 60000).toISOString();

    console.log("Final reminder data:", { time: utcTime, note: noteInput });

    // Kirim data ke server
    addReminderToDatabase(utcTime, noteInput)
        .then(() => {
            console.log("Reminder successfully added to database.");
            speak("Your reminder has been added successfully.");
        })
        .catch((error) => {
            console.error("Failed to add reminder:", error);
            speak("Sorry, there was an error adding your reminder. Please try again.");
        })
        .finally(() => {
            // Reset state setelah selesai
            isAddReminder = false;
            currentReminderStep = null;
            timeInput = ""; // Reset waktu
        });
}

// Proses hasil pengenalan suara
recognition.onresult = (event) => {
    const command = event.results[0][0].transcript.toLowerCase();
    console.log(`Command received: ${command}`);
    const outputElement = document.getElementById("output");

    // Tampilkan hasil pengenalan suara di box output
    if (outputElement) {
        outputElement.textContent = `${command}`;
    }

    // Tangani berdasarkan context
    if (isAddReminder) {
        startTimeInputProcess(command); // Proses input untuk add reminder
    } else {
        handleVoiceCommand(command); // Tangani perintah umum
    }
};

// Fungsi untuk memastikan suara terinisialisasi sebelum digunakan
function initializeVoices() {
    return new Promise((resolve) => {
        let voices = window.speechSynthesis.getVoices();
        if (voices.length) {
            resolve(voices);
            return;
        }
        // Tunggu hingga suara tersedia
        window.speechSynthesis.onvoiceschanged = () => {
            voices = window.speechSynthesis.getVoices();
            resolve(voices);
        };
    });
}

// Fungsi untuk berbicara menggunakan SpeechSynthesis
async function speak(text) {
    const voices = await initializeVoices();
    if (!voices.length) {
        console.warn("No voices available for SpeechSynthesis.");
        return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.voice = voices[0]; // Gunakan suara pertama
    console.log(`Using voice: ${voices[0].name}`);
    
    return new Promise((resolve) => {
        utterance.onend = resolve; // Selesaikan promise saat selesai berbicara
        utterance.onerror = (event) => {
            console.error("Speech synthesis error:", event.error);
            resolve();
        };

        window.speechSynthesis.speak(utterance);
    });
}

// Fungsi untuk membaca semua reminder
function readAllReminders() {
    if (!reminders || reminders.length === 0) {
        speak("You have no reminders.");
    } else {
        reminders.forEach((reminder, index) => {
            const reminderTime = new Date(reminder.time).toLocaleString(); // Format waktu lokal
            speak(`Reminder ${index + 1}: At ${reminderTime}, ${reminder.note}.`);
        });
    }
}

// Fungsi untuk memonitor reminder
function monitorReminders() {
    console.log("Monitoring reminders...");
    setInterval(() => {
        if (!userInteracted) {
            console.warn("User has not interacted yet. Skipping reminder speech.");
            return;
        }

        const now = new Date();
        reminders.forEach((reminder) => {
            const reminderTime = new Date(reminder.time);

            if (
                reminderTime <= now &&
                now - reminderTime < 1000 && // Waktu tepat
                !reminder.notified
            ) {
                console.log(`Reminder triggered: ${reminder.note}`);
                speak(`It's time for your reminder: ${reminder.note}.`);
                showPopup(reminder.note); // Tampilkan popup
                reminder.notified = true; // Tandai sebagai sudah diberitahukan
            }
        });
    }, 1000);
}

// Fungsi untuk menampilkan popup
function showPopup(message) {
    const popup = document.getElementById("reminder-popup");
    const popupMessage = document.getElementById("popup-message");

    if (popup && popupMessage) {
        popupMessage.textContent = message;
        popup.classList.add("show"); // Tambahkan kelas animasi
        popup.style.display = "flex";

        // Hapus popup otomatis setelah 5 detik
        setTimeout(() => {
            closePopup();
        }, 5000);
    }
}

// Fungsi untuk menutup popup
function closePopup() {
    const popup = document.getElementById("reminder-popup");

    if (popup) {
        popup.classList.remove("show"); // Hapus kelas animasi
        setTimeout(() => {
            popup.style.display = "none"; // Sembunyikan setelah animasi selesai
        }, 500); // Delay sesuai durasi animasi CSS
    }
}
function wordsToNumbers(words) {
    const numberMap = {
        "zero": 0,
        "one": 1,
        "two": 2,
        "three": 3,
        "four": 4,
        "five": 5,
        "six": 6,
        "seven": 7,
        "eight": 8,
        "nine": 9,
        "ten": 10,
        "eleven": 11,
        "twelve": 12,
        "thirteen": 13,
        "fourteen": 14,
        "fifteen": 15,
        "sixteen": 16,
        "seventeen": 17,
        "eighteen": 18,
        "nineteen": 19,
        "twenty": 20,
        "thirty": 30,
        "forty": 40,
        "fifty": 50,
        "sixty": 60,
        "seventy": 70,
        "eighty": 80,
        "ninety": 90,
        "hundred": 100
    };

    const wordsArray = words.toLowerCase().split(" ");
    let numbers = "";
    let currentNumber = 0;

    for (let word of wordsArray) {
        if (numberMap[word] !== undefined) {
            currentNumber += numberMap[word];
        } else if (word === "hundred") {
            currentNumber *= 100;
        } else if (word === "and") {
            continue; // Ignore "and"
        } else {
            if (currentNumber > 0) {
                numbers += currentNumber.toString();
                currentNumber = 0;
            }
            // Append any non-number word to keep original input intact
            numbers += word;
        }
    }

    // Add the last parsed number
    if (currentNumber > 0) {
        numbers += currentNumber.toString();
    }

    return numbers;
}


