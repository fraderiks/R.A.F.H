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
function handleVoiceCommand(command) {
    console.log(`Voice command received in afterlogin: ${command}`);

    if (isAddReminder) {
        console.log("Already in add reminder process. Ignoring command redirection.");
        return; // Abaikan perintah lain selama proses add reminder
    }

    if (command.includes("exit")) {
        speak("Logging out now.");
        logout(); // Fungsi logout dari afterlogin.js
    } else if (command.includes("refresh")) {
        speak("Refreshing the page.");
        location.reload(); // Memuat ulang halaman
    } else if (command.includes("back")) {
        speak("Going back to the previous page.");
        window.history.back(); // Kembali ke halaman sebelumnya
    } else if (command.includes("list reminder")) {
        readAllReminders(); // Bacakan semua reminder
    } else if (command.includes("add reminder")) {
        speak("Please say the time for the reminder in 24-hour format, such as fourteen thirty for 2:30 PM.");
        isAddReminder = true; // Aktifkan mode add reminder
        currentReminderStep = "time"; // Set langkah awal ke input waktu
    } else {
        speak("Sorry, I didn't understand that command.");
    }
}

// Proses input waktu atau note untuk reminder
function startTimeInputProcess(command) {
    if (currentReminderStep === "time") {
        timeInput = validateTime(command.toLowerCase()); // Validasi dan simpan waktu
        if (!timeInput) {
            speak("Invalid time format. Please say the time again.");
            return; // Minta ulang input waktu
        }
        console.log(`Time received: ${timeInput}`);
        speak("Got it. Now, please say the note for the reminder.");
        currentReminderStep = "note"; // Pindah ke langkah berikutnya
    } else if (currentReminderStep === "note") {
        const noteInput = command;
        console.log(`Note received: ${noteInput}`);
        speak(`Adding reminder for ${timeInput}, with note: ${noteInput}.`);
        processReminder(timeInput, noteInput); // Proses penyimpanan reminder
    }
}

// Validasi dan konversi waktu ke format HH:mm
function validateTime(input) {
    const timeRegex = /^([01]?[0-9]|2[0-3]):?([0-5][0-9])$/; // Format HH:mm atau H:mm
    const match = input.match(timeRegex);
    if (!match) {
        console.error("Invalid time format:", input);
        return null; // Waktu tidak valid
    }
    const hours = match[1].padStart(2, "0"); // Tambahkan 0 jika perlu
    const minutes = match[2].padStart(2, "0");
    return `${hours}:${minutes}`; // Kembalikan format HH:mm
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
