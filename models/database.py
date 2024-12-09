import pymysql

# Konfigurasi koneksi ke MySQL
DB_HOST = "localhost"
DB_USER = "root"  # Ganti jika menggunakan user lain
DB_PASSWORD = ""  # Password MySQL Anda
DB_NAME = "voice_assistant_db"

def get_connection():
    return pymysql.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        cursorclass=pymysql.cursors.DictCursor
    )

def init_db():
    conn = get_connection()
    with conn.cursor() as cursor:
        # Membuat tabel users dengan kolom email
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) NOT NULL UNIQUE,
            email VARCHAR(100) NOT NULL UNIQUE,  -- Menambahkan kolom email
            password VARCHAR(50) NOT NULL,
            is_blind ENUM('blind', 'not_blind') NOT NULL
        )
        """)

        # Membuat tabel reminders
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS reminders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            time DATETIME NOT NULL,
            note TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """)
        conn.commit()
    conn.close()

def get_user(email, password):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT id, username, email, is_blind FROM users WHERE email = %s AND password = %s",
            (email, password)
        )
        user = cursor.fetchone()
    conn.close()
    return user

def add_user(username, email, password, is_blind):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute(
            "INSERT INTO users (username, email, password, is_blind) VALUES (%s, %s, %s, %s)",
            (username, email, password, is_blind)
        )
    conn.commit()
    conn.close()

def check_blind_status(username):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT is_blind FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
    conn.close()
    return result and result["is_blind"] == "blind"

def check_username(username):
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) AS count FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
        user_exists = result and result["count"] > 0  # Periksa jika result tidak None
    conn.close()
    return user_exists
