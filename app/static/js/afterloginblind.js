let reminders = []; // Simpan daftar reminder di memori lokal

// Panggil fetchReminders saat halaman dimuat
window.onload = () => {
    console.log("Loading reminders...");
    fetchReminders();
};

// Fungsi untuk logout
async function logout() {
    try {
        const response = await fetch('/logout', {
            method: 'GET',
            credentials: 'same-origin', // Sertakan cookies
        });
        if (response.ok) {
            window.location.href = "/"; // Arahkan ke halaman login
        } else {
            alert("Failed to logout. Please try again.");
        }
    } catch (error) {
        console.error("Logout error:", error);
        alert("An error occurred during logout.");
    }
}

// Mengambil data reminder dari server
async function fetchReminders() {
    console.log("Fetching reminders...");
    try {
        const response = await fetch('/api/reminders', {
            method: 'GET',
            credentials: 'same-origin',
        });

        if (response.ok) {
            const data = await response.json(); // Ambil respons JSON mentah
            console.log("Raw reminders data:", data);

            // Validasi apakah data adalah array
            if (Array.isArray(data)) {
                reminders = data.map(reminder => ({
                    ...reminder,
                    notified: false, // Tambahkan flag untuk notifikasi
                }));
                console.log("Reminders processed successfully:", reminders);
                updateReminderList(reminders);

                // Mulai memonitor waktu reminder
                monitorReminders(); // Pindahkan pemanggilan fungsi ini ke sini
            } else {
                console.error("Invalid data format. Expected an array.");
                alert("Failed to load reminders. Please contact support.");
            }
        } else {
            console.error("Failed to fetch reminders:", response.statusText);
            alert("Failed to fetch reminders. Please try again.");
        }
    } catch (error) {
        console.error("Error during fetch:", error);
        alert("An error occurred while fetching reminders.");
    }
}

// Menampilkan daftar reminder di halaman
function updateReminderList(reminders) {
    const reminderListElement = document.getElementById("reminder-list");
    reminderListElement.innerHTML = ""; // Clear existing list
    reminders.forEach((reminder, index) => {
        // Konversi waktu dari UTC ke waktu lokal
        const reminderTime = new Date(reminder.time).toLocaleString(); // Format ke waktu lokal
        const listItem = document.createElement("li");
        listItem.textContent = `${index + 1}. At ${reminderTime}, ${reminder.note}`;
        reminderListElement.appendChild(listItem);
    });
}

// Modal form untuk input reminder manual
function openReminderModal() {
    console.log("Opening reminder modal");
    const modal = document.getElementById("reminder-modal");
    if (modal) {
        modal.style.display = "block";
    }
}

function closeReminderModal() {
    console.log("Closing reminder modal");
    const modal = document.getElementById("reminder-modal");
    if (modal) {
        modal.style.display = "none";
    }
}

function submitReminder() {
    const timeInput = document.getElementById("reminder-time").value; // Format HH:MM
    const note = document.getElementById("reminder-note").value;

    if (timeInput && note) {
        // Ambil tanggal hari ini dan gabungkan dengan waktu input
        const today = new Date().toISOString().split("T")[0]; // Format YYYY-MM-DD
        const localTime = new Date(`${today}T${timeInput}:00`); // Gabungkan tanggal dan waktu

        // Konversi waktu lokal ke UTC
        const utcTime = new Date(localTime.getTime() - localTime.getTimezoneOffset() * 60000).toISOString();

        console.log("Submitting reminder:", { time: utcTime, note }); // Debugging
        addReminderToDatabase(utcTime, note); // Kirim waktu dalam format UTC
    } else {
        alert("Time and note are required to add a reminder.");
    }
}

// Menambahkan reminder ke server
async function addReminderToDatabase(time, note) {
    console.log("Data to send:", { time, note }); // Debugging
    try {
        const response = await fetch('/api/reminders', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ time, note }),
        });

        if (response.ok) {
            // alert("Reminder added successfully.");
            fetchReminders(); // Refresh daftar reminder
            closeReminderModal();
        } else {
            const error = await response.json();
            console.error("Error response from backend:", error);
            alert(`Error adding reminder: ${error.message}`);
        }
    } catch (error) {
        console.error("Error adding reminder:", error);
        alert("An error occurred while adding the reminder.");
    }
}
async function cleanupReminders() {
    console.log("Cleaning up expired reminders...");
    try {
        const response = await fetch("/api/cleanup_reminders", {
            method: "POST",
            credentials: "same-origin",
        });

        const result = await response.json();
        if (response.ok) {
            console.log(result.message); // Log success message
        } else {
            console.error("Failed to cleanup reminders:", result.error);
        }
    } catch (error) {
        console.error("Error during reminder cleanup:", error);
    }
}

// Call cleanupReminders during initialization
window.onload = async () => {
    await cleanupReminders(); // Cleanup expired reminders
    fetchReminders();         // Fetch updated reminders
};

async function fetchReminders() {
    console.log("Fetching reminders...");
    try {
        // Clean up expired reminders before fetching
        await cleanupReminders();

        const response = await fetch('/api/reminders', {
            method: 'GET',
            credentials: 'same-origin',
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Raw reminders data:", data);

            if (Array.isArray(data)) {
                reminders = data.map(reminder => ({
                    ...reminder,
                    notified: false,
                }));
                console.log("Reminders processed successfully:", reminders);
                updateReminderList(reminders);
                monitorReminders(); // Start monitoring reminders
            } else {
                console.error("Invalid data format. Expected an array.");
                alert("Failed to load reminders. Please contact support.");
            }
        } else {
            console.error("Failed to fetch reminders:", response.statusText);
            alert("Failed to fetch reminders. Please try again.");
        }
    } catch (error) {
        console.error("Error during fetch:", error);
        alert("An error occurred while fetching reminders.");
    }
}
function updateReminderList(reminders) {
    const reminderListElement = document.getElementById("reminder-list");
    reminderListElement.innerHTML = ""; // Clear existing list

    reminders.forEach((reminder, index) => {
        const reminderTime = new Date(reminder.time).toLocaleString();
        const listItem = document.createElement("li");
        listItem.textContent = `${index + 1}. At ${reminderTime}, ${reminder.note}`;
        reminderListElement.appendChild(listItem);
    });
}
function monitorReminders() {
    console.log("Monitoring reminders...");
    setInterval(() => {
        const now = new Date();

        reminders = reminders.filter(reminder => {
            const reminderTime = new Date(reminder.time);
            if (reminderTime <= now && !reminder.notified) {
                console.log(`Reminder triggered: ${reminder.note}`);
                speak(`It's time for your reminder: ${reminder.note}`);
                showPopup(reminder.note);
                return false; // Remove expired reminder
            }
            return true;
        });

        // Update the UI after filtering expired reminders
        updateReminderList(reminders);
    }, 1000);
}

