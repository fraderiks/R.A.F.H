from flask import Blueprint, render_template, request, redirect, url_for, jsonify, make_response
from models.database import get_user, add_user, get_connection, check_username
from datetime import datetime
from pytz import timezone, UTC


app_routes = Blueprint("app_routes", __name__)

@app_routes.route("/")
def home():
    user_id = request.cookies.get("user_id")
    username = request.cookies.get("username")
    if user_id and username:
        return redirect(url_for("app_routes.afterlogin"))
    return render_template("home.html")

@app_routes.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]
        user = get_user(email, password)
        if user:
            resp = make_response(redirect(url_for("app_routes.afterlogin")))
            resp.set_cookie("user_id", str(user["id"]), max_age=60*60*24, httponly=True)
            resp.set_cookie("username", user["username"], max_age=60*60*24)
            resp.set_cookie("email", user["email"], max_age=60*60*24)
            return resp
        # Return a JSON response if credentials are invalid
        return jsonify({"error": "Invalid credentials"}), 401
    return render_template("login.html")


@app_routes.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        username = request.form["username"]
        email = request.form["email"]
        password = request.form["password"]
        confirm_password = request.form["confirm_password"]
        is_blind = "blind" if "blind" in request.form else "not_blind"

        if password != confirm_password:
            return "Passwords do not match", 400

        add_user(username, email, password, is_blind)
        return redirect(url_for("app_routes.login"))
    return render_template("signup.html")

@app_routes.route("/afterlogin")
def afterlogin():
    user_id = request.cookies.get("user_id")
    if not user_id:
        return redirect(url_for("app_routes.home"))

    # Ambil informasi pengguna dari database
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT username, is_blind FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()

    conn.close()

    if not user:
        return redirect(url_for("app_routes.home"))

    # Arahkan berdasarkan nilai is_blind
    if user["is_blind"] == "blind":
        return render_template("afterloginblind.html", username=user["username"])
    return render_template("afterlogin.html", username=user["username"])

@app_routes.route("/logout")
def logout():
    resp = make_response(redirect(url_for("app_routes.home")))
    resp.delete_cookie("user_id")
    resp.delete_cookie("username")
    return resp

# API untuk mengelola reminder
@app_routes.route("/api/reminders", methods=["GET", "POST"])
def reminders():
    user_id = request.cookies.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized"}), 401

    # Ambil semua reminder
    if request.method == "GET":
        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, time, note FROM reminders WHERE user_id = %s", (user_id,))
            reminders = cursor.fetchall()

            # Konversi waktu ke format ISO 8601
            for reminder in reminders:
                reminder["time"] = reminder["time"].astimezone(UTC).isoformat()  # Konversi ke UTC
        conn.close()
        return jsonify(reminders)

    # Tambahkan reminder baru
    if request.method == "POST":
        data = request.json
        print("Data received:", data)  # Debugging
        time = data.get("time")
        note = data.get("note")

        if not time or not note:
            return jsonify({"error": "Time and Note are required"}), 400

        try:
            # Pastikan waktu yang diterima adalah format ISO 8601
            time = datetime.fromisoformat(time.replace("Z", "+00:00"))  # Konversi dari ISO 8601 UTC
        except ValueError:
            print("Invalid time format:", time)  # Debugging
            return jsonify({"error": "Invalid time format. Use ISO 8601"}), 400

        conn = get_connection()
        with conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO reminders (user_id, time, note) VALUES (%s, %s, %s)",
                (user_id, time, note)
            )
            conn.commit()
        conn.close()
        return jsonify({"message": "Reminder added successfully"}), 201


@app_routes.route("/api/reminders/<int:reminder_id>", methods=["DELETE"])
def delete_reminder(reminder_id):
    user_id = request.cookies.get("user_id")
    if not user_id:
        return jsonify({"error": "Unauthorized", "message": "User not logged in"}), 401

    try:
        conn = get_connection()
        with conn.cursor() as cursor:
            # Hapus pengingat berdasarkan ID
            cursor.execute(
                "DELETE FROM reminders WHERE id = %s AND user_id = %s",
                (reminder_id, user_id)
            )
            conn.commit()
            if cursor.rowcount == 0:
                return jsonify({
                    "error": "Reminder not found",
                    "message": f"Reminder ID {reminder_id} does not exist or is not yours"
                }), 404
        conn.close()

        return jsonify({"message": f"Reminder ID {reminder_id} deleted successfully"}), 200
    except Exception as e:
        print(f"Error during reminder deletion: {e}")
        return jsonify({"error": "Internal Server Error", "details": str(e)}), 500

@app_routes.route("/api/check_username")
def check_username():
    username = request.args.get("username")
    conn = get_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        result = cursor.fetchone()
    conn.close()

    if result:
        return jsonify({"available": False})  # Username is taken
    return jsonify({"available": True})  # Username is available




