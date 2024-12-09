from flask import Flask
from app.routes import app_routes
from models.database import init_db

def create_app():
    app = Flask(__name__)
    app.secret_key = "your_secret_key"  # Ubah menjadi secret key Anda
    app.register_blueprint(app_routes)

    # Initialize database
    init_db()

    return app
