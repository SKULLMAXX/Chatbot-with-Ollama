# ==============================================
# 🤖 AI Chatbot with Ollama (Flask + MongoDB + Tailwind CSS)
# ==============================================
# A powerful AI chatbot project using Flask, Ollama, MongoDB, and Tailwind CSS
# Includes user auth, chat history storage, and local LLM integration via Ollama
#
# 🔧 HOW TO RUN THIS PROJECT:
#
# 📥 STEP 1: DOWNLOAD & EXTRACT
# - Download chatbot.zip
# - Extract it to any folder on your computer
#
# 📦 STEP 2: INSTALL DEPENDENCIES
# Open terminal in the project folder and run:
# pip install Flask Flask-SQLAlchemy Flask-Bcrypt Flask-Login Flask-PyMongo Flask-Cors ollama
#
# 🧠 STEP 3: SET UP OLLAMA
# - Download and install Ollama: https://ollama.com/download
# - In terminal, run:
#   ollama pull llama3
# - In the project folder, create a file named 'model' (no extension)
# - Inside that file, just write:
#   llama3
#   (or any other model name you pulled/trained)
#
# 🛠️ STEP 4: EDIT main.py
# - Open main.py in a code editor
# - Add your MongoDB URI in: app.config["MONGO_URI"]
# - Update the 'About Me' content if needed
# - Make sure the model file is linked correctly
#
# ▶️ STEP 5: RUN THE PROJECT
# Run this command:
# python main.py
# Then open in browser:
# http://127.0.0.1:5000
#
# ✅ FEATURES:
# - User authentication (Flask-Login + bcrypt)
# - Local AI chatbot powered by Ollama
# - MongoDB stores chat history per user
# - Tailwind CSS styled dark-themed frontend
# - Typing animation, chat scroll, mobile-friendly
#
# 🧩 TECH STACK:
# - Backend: Flask, SQLAlchemy, Flask-Bcrypt, Flask-Login, Flask-Cors
# - AI: Ollama (local LLMs like llama3, mistral, etc.)
# - DB: SQLite (auth) + MongoDB (chat history)
# - Frontend: HTML + Tailwind CSS + JS
#
# 🧠 CUSTOM TRAINING:
# - You can fine-tune or create your own Ollama model
# - Link it by writing its name inside the 'model' file
# - Modify Ollama prompts or logic inside main.py
#
# 🚀 YOU'RE READY TO GO!
# Your AI chatbot is live locally. Train it, tweak it, deploy it — your call!
# ==============================================
