import os
from flask import Flask, render_template, request, jsonify, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, login_user, logout_user, login_required, UserMixin, current_user
import ollama  # Ollama for chatbot
from flask_pymongo import PyMongo
from datetime import datetime, UTC
from flask_cors import CORS  # Enable CORS for all routes

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
app.secret_key = "your_secret_key"

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DB_PATH = os.path.join(BASE_DIR, "users.db")

# Database Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///users.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MONGO_URI"] = "UR MONGO DB URL"

# Initialize Extensions
db = SQLAlchemy(app)
mongo = PyMongo(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"

# User Model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        data = request.get_json() if request.is_json else request.form
        email = data.get("email")
        password = data.get("password")

        user = User.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password, password):
            login_user(user)
            return jsonify({"message": "Login Successful", "redirect": url_for("home")})
        return jsonify({"error": "Invalid Credentials"}), 401

    return render_template("login.html")

@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        data = request.get_json() if request.is_json else request.form
        name = data.get("name")
        email = data.get("email")
        password = bcrypt.generate_password_hash(data.get("password")).decode("utf-8")

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already exists"}), 400

        new_user = User(name=name, email=email, password=password)
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"message": "User Registered Successfully", "redirect": url_for("login")})

    return render_template("signup.html")

@app.route("/logout")
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logout successful", "redirect": url_for("login")})

@app.route("/privacy")
def privacy():
    return render_template("p.html")

@app.route("/about")
def about():
    return render_template("aboutme.html")

# ✅ Fixed Ollama Context Logic
@app.route("/api", methods=["POST"])
def qa():
    print("Received request at /api")
    data = request.get_json()

    if not data or "question" not in data:
        return jsonify({"error": "Invalid request. 'question' is required."}), 400

    user_input = str(data["question"]).strip()
    print(f"📥 Received question: {user_input}")

    if not user_input:
        return jsonify({"error": "Question cannot be empty."}), 400

    try:
        chat_history = []
        user_id = data.get("user_id")

        if user_id:
            chat_history = list(mongo.db.chat_history.find(
                {"user_id": user_id}, {"_id": 0, "question": 1, "answer": 1}
            ).sort("timestamp", -1).limit(5))
            chat_history.reverse()  # Oldest to newest

        messages = []
        for chat in chat_history:
            messages.append({"role": "user", "content": chat["question"]})
            messages.append({"role": "assistant", "content": chat["answer"]})

        messages.append({"role": "user", "content": user_input})

        # If frontend provides history explicitly
        if "history" in data and data["history"]:
            messages = data["history"] + [{"role": "user", "content": user_input}]

        print(f"🛠️ Sending request to Ollama: {user_input}")
        ollama_response = ollama.chat(model="my-mistral:latest", messages=messages)
        bot_response = ollama_response.get("message", {}).get("content", "⚠️ No valid response.")
        print(f"🤖 [Ollama] {bot_response}")

        if user_id:
            mongo.db.chat_history.insert_one({
                "user_id": user_id,
                "question": user_input,
                "answer": bot_response,
                "timestamp": datetime.now(UTC)
            })

        return jsonify({"result": bot_response})

    except ollama.OllamaError:
        return jsonify({"error": "⚠️ Ollama model not found or failed to respond."}), 500
    except Exception as e:
        return jsonify({"error": f"⚠️ Unexpected error: {e}"}), 500

@app.route("/get_history", methods=["GET"])
def get_chat_history():
    user_id = request.args.get("user_id")
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400

    history = list(mongo.db.chat_history.find(
        {"user_id": user_id}, 
        {"_id": 0, "question": 1, "answer": 1, "timestamp": 1}
    ).sort("timestamp", -1))
    
    return jsonify({"history": history})

@app.route("/search_history", methods=["GET"])
def search_history():
    user_id = request.args.get("user_id")
    query = request.args.get("query", "")
    
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    search_results = list(mongo.db.chat_history.find(
        {
            "user_id": user_id,
            "$or": [
                {"question": {"$regex": query, "$options": "i"}},
                {"answer": {"$regex": query, "$options": "i"}}
            ]
        },
        {"_id": 0, "question": 1, "answer": 1, "timestamp": 1}
    ).sort("timestamp", -1))
    
    return jsonify({"results": search_results})

@app.route("/store_message", methods=["POST"])
def store_message():
    data = request.get_json()
    user_id = data.get("user_id")
    message = data.get("message")
    response = data.get("response")

    if not user_id or not message or not response:
        return jsonify({"error": "Missing required fields"}), 400

    mongo.db.chat_history.insert_one({
        "user_id": user_id,
        "question": message,
        "answer": response,
        "timestamp": datetime.now(UTC)
    })

    return jsonify({"message": "Message stored successfully!"})

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
