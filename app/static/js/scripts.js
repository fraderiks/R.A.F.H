// Inisialisasi SpeechRecognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.lang = 'en-US'; // Default ke Bahasa Inggris
recognition.interimResults = false;
recognition.maxAlternatives = 1;

let isRecording = false; // Status rekaman
let holdTimeout; // Timer untuk klik tahan
let isRecognitionActive = false;

// Tambahkan audio untuk efek suara
const startSound = new Audio('/static/audio/start.mp3');
const stopSound = new Audio('/static/audio/stop.mp3');

// Fungsi untuk memperbarui status visual dan feedback
function updateStatus(status) {
    const statusElement = document.getElementById("status");
    if (statusElement) {
        if (status === "start") {
            statusElement.style.display = "block";
            statusElement.textContent = "Listening..."; // Teks untuk pengguna tunanetra bisa diubah jadi audio
        } else if (status === "stop") {
            statusElement.style.display = "none";
        }
    }
}

// Fungsi untuk memulai pengenalan suara secara manual
function startVoiceRecognition() {
    if (!isRecognitionActive) {
        console.log("Voice recognition started manually...");
        isRecognitionActive = true;
        const outputElement = document.getElementById("output");
        if (outputElement) {
            outputElement.textContent = ""; // Reset output
        }
        updateStatus("start");
        startSound.play(); // Mainkan suara mulai
        recognition.start();

        // Timeout untuk otomatis menghentikan jika tidak ada suara
        recognitionTimeout = setTimeout(() => {
            console.warn("No voice detected. Stopping recognition...");
            stopVoiceRecognition();
        }, 10000); // Timeout 10 detik
    } else {
        console.warn("Voice recognition is already active.");
    }
}

// Fungsi untuk menghentikan pengenalan suara
function stopVoiceRecognition() {
    if (isRecognitionActive) {
        console.log("Voice recognition stopped.");
        recognition.stop(); // Pastikan `stop()` dipanggil sebelum mengatur ulang state
        isRecognitionActive = false;
        clearTimeout(recognitionTimeout); // Hapus timeout
        updateStatus("stop");
        stopSound.play(); // Mainkan suara berhenti
    }
}


// Proses hasil dari pengenalan suara
recognition.onresult = (event) => {
    clearTimeout(recognitionTimeout); // Hapus timeout jika suara terdeteksi
    const command = event.results[0][0].transcript.toLowerCase();
    console.log(`Command received: ${command}`);
    const outputElement = document.getElementById("output");

    if (outputElement) {
        outputElement.textContent = `${command}`; // Tampilkan hasil
    }

    // Panggil fungsi untuk memproses perintah suara
    if (typeof handleVoiceCommand === "function") {
        handleVoiceCommand(command);
    } else {
        console.warn("handleVoiceCommand function is not defined on this page.");
    }

    stopVoiceRecognition(); // Hentikan pengenalan setelah memproses perintah
};

// Tangani jika pengenalan suara selesai tanpa hasil
recognition.onend = () => {
    console.log("No command detected or recognition ended.");
    isRecognitionActive = false;
};

// Tangani kesalahan
recognition.onerror = (event) => {
    console.error(`Recognition error: ${event.error}`);
    isRecognitionActive = false;

    const errorElement = document.getElementById("error");
    if (errorElement) {
        errorElement.style.display = "block";
        errorElement.textContent = `Error: ${event.error}`; // Feedback kesalahan
    }

    updateStatus("stop");
};

// Fungsi untuk berbicara waktu atau tanggal
function speak(command) {
    const now = new Date();
    let response = "";
    if (command === 'time') {
        response = `The time is ${now.toLocaleTimeString()}`;
    } else if (command === 'date') {
        response = `The date is ${now.toDateString()}`;
    }
    const speech = new SpeechSynthesisUtterance(response);
    window.speechSynthesis.speak(speech);
}

// Dukungan multibahasa
const languageSelector = document.getElementById("languageSelector");
if (languageSelector) {
    languageSelector.addEventListener("change", (event) => {
        recognition.lang = event.target.value; // Ubah bahasa berdasarkan pilihan
        console.log(`Language changed to: ${recognition.lang}`);
    });
}

// Event listener untuk klik dan tahan selama 3 detik
document.addEventListener('mousedown', () => {
    holdTimeout = setTimeout(() => {
        startVoiceRecognition(); // Mulai pengenalan suara setelah 3 detik
    }, 3000);
});

document.addEventListener('mouseup', () => {
    clearTimeout(holdTimeout); // Batalkan timer jika mouse dilepas sebelum 3 detik
});
