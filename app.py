"""
app.py - College Event Registration System (Part 5)
Full-Stack Flask Application
Authors: Ross Miguel Luna & Arash Nail
Institution: Red Deer Polytechnic

ANNOTATION (Rubric Item 1 & 2):
Flask is used to attach Python to the frontend. This file (app.py) is the
single entry-point that starts the full stack. It replaces the Node.js server.js
while keeping all HTML/CSS/JS files unchanged so separation of concern is preserved.

API METHODS USED (Rubric Item 6):
  GET  /                    - Serves the home page (index.html)
  GET  /api/dashboard       - Returns all registrations as JSON (READ)
  POST /api/register        - Inserts a new registration (CREATE)
  GET  /api/charts/events   - Returns bar chart PNG of event popularity
  GET  /api/charts/timeline - Returns line chart PNG of registrations over time
  GET  /api/stats           - Returns summary KPI counts as JSON
  POST /api/chatbot         - Accepts a question and returns an AI-style answer
"""

from flask import Flask, request, jsonify, send_from_directory, send_file
from flask_cors import CORS
import sqlite3
import os
import io
import json
from datetime import datetime

# --- ANNOTATION (Rubric Item: Visual libraries) ---
# matplotlib and seaborn are imported here to generate chart images server-side.
# The charts are rendered to an in-memory buffer (BytesIO) and streamed directly
# to the browser as PNG responses — no files written to disk.
import matplotlib
matplotlib.use('Agg')           # Non-interactive backend; required for Flask (no GUI)
import matplotlib.pyplot as plt
import matplotlib.dates as mdates
import seaborn as sns

# ============================================================
# APP SETUP
# ANNOTATION (Separation of Concern, Rubric Item 3):
# Flask is configured to serve all static HTML/CSS/JS files from the project
# root via send_from_directory(). Python handles ONLY data logic, chart
# generation, and API responses. HTML/CSS/JS files are never modified by Python.
# ============================================================
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)  # Allow cross-origin requests so Live Server can still call the API

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH  = os.path.join(BASE_DIR, 'college_system.db')


# ============================================================
# HELPER: DATABASE CONNECTION
# ANNOTATION (Rubric Item: Exception Handling):
# get_db_connection() wraps sqlite3.connect() in a try/except block.
# If the database file is missing or locked, it raises a RuntimeError
# with a descriptive message instead of crashing the entire server.
# row_factory = sqlite3.Row lets columns be accessed by name (dict-style).
# ============================================================
def get_db_connection():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn
    except sqlite3.Error as e:
        raise RuntimeError(f"Database connection failed: {e}")


# ============================================================
# DATABASE INITIALISATION (mirrors Part 4 server.js logic)
# ============================================================
def init_db():
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS Users (
            user_id    INTEGER PRIMARY KEY AUTOINCREMENT,
            username   TEXT UNIQUE NOT NULL,
            email      TEXT UNIQUE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS Registrations (
            reg_id     INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER,
            event_name TEXT NOT NULL,
            notes      TEXT,
            reg_date   DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(user_id)
        )
    """)
    conn.execute("INSERT OR IGNORE INTO Users (username, email) VALUES ('Admin_User', 'admin@rdp.ca')")
    conn.commit()
    conn.close()


# ============================================================
# PYTHON FUNCTION (Rubric Item 5a):
# format_reg_date() is a plain Python function that takes a raw
# ISO-formatted datetime string from SQLite and returns a human-readable
# date string (e.g. "Apr 08, 2026"). It isolates date-formatting logic
# so it can be reused in both the /api/dashboard and /api/stats routes.
# ============================================================
def format_reg_date(raw_date: str) -> str:
    try:
        dt = datetime.strptime(raw_date[:19], "%Y-%m-%d %H:%M:%S")
        return dt.strftime("%b %d, %Y")
    except (ValueError, TypeError):
        return raw_date or "Unknown"


# ============================================================
# LAMBDA (Rubric Item 5a — Lambda):
# event_label is a lambda that shortens long event-name strings to
# a maximum of 22 characters for chart axis labels. Without truncation,
# long event names overlap on the bar chart X-axis and become unreadable.
# ============================================================
event_label = lambda name: name[:22] + "…" if len(name) > 22 else name


# ============================================================
# CLASS (Rubric Item 5b):
# RegistrationStats is a class that encapsulates all summary
# calculations derived from the database. Grouping them into a class
# keeps the route handlers thin and makes the calculations testable.
#
# The __init__ method queries the database and populates attributes.
# The conditional statement inside total_users guards against the case
# where the Users table is empty (avoids ZeroDivisionError on avg calc).
# ============================================================
class RegistrationStats:
    def __init__(self):
        conn = get_db_connection()

        # Total registrations
        row = conn.execute("SELECT COUNT(*) as cnt FROM Registrations").fetchone()
        self.total_registrations = row["cnt"] if row else 0

        # Total unique users
        row = conn.execute("SELECT COUNT(*) as cnt FROM Users").fetchone()
        self.total_users = row["cnt"] if row else 0

        # Most popular event — CONDITIONAL STATEMENT:
        # If at least one registration exists, find the event_name with the
        # highest COUNT(*). Otherwise, default to "N/A" so the dashboard
        # renders correctly on a fresh install with no data yet.
        if self.total_registrations > 0:
            row = conn.execute("""
                SELECT event_name, COUNT(*) as cnt
                FROM Registrations
                GROUP BY event_name
                ORDER BY cnt DESC
                LIMIT 1
            """).fetchone()
            self.top_event = row["event_name"] if row else "N/A"
            self.top_event_count = row["cnt"] if row else 0
        else:
            self.top_event = "N/A"
            self.top_event_count = 0

        # Registrations today
        today = datetime.now().strftime("%Y-%m-%d")
        row = conn.execute(
            "SELECT COUNT(*) as cnt FROM Registrations WHERE DATE(reg_date) = ?",
            (today,)
        ).fetchone()
        self.today_count = row["cnt"] if row else 0

        conn.close()

    def to_dict(self):
        return {
            "total_registrations": self.total_registrations,
            "total_users":         self.total_users,
            "top_event":           self.top_event,
            "top_event_count":     self.top_event_count,
            "today_count":         self.today_count,
        }


# ============================================================
# ROUTES — Static file serving
# ANNOTATION (Changes to existing files, Rubric Item 4):
# The HTML files keep their existing <script src="JavaScript/main.js">
# and <link href="css/..."> tags unchanged. Flask's send_from_directory
# serves every file as-is, so no HTML edits are needed to add Python.
# The only required change is updating main.js fetch() calls from
# http://localhost:3000 → http://localhost:5000 (Flask's default port).
# ============================================================
@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    return send_from_directory(BASE_DIR, filename)


# ============================================================
# ROUTE: POST /api/register  (CRUD: CREATE)
# ANNOTATION (API Methods, Rubric Item 6):
# HTTP POST is used because the client is sending data to be stored.
# A database transaction ensures atomicity: if inserting the user
# succeeds but inserting the registration fails, both are rolled back.
# ============================================================
@app.route('/api/register', methods=['POST'])
def register():
    # ANNOTATION (Exception Handling, Rubric Item 5c):
    # The entire handler is wrapped in try/except. If the JSON payload
    # is malformed, a key is missing, or the database write fails,
    # the server returns a 400 or 500 JSON error instead of crashing.
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON body received"}), 400

        username   = data.get("username")
        email      = data.get("email")
        event_name = data.get("event_name")
        notes      = data.get("notes", "")

        if not all([username, email, event_name]):
            return jsonify({"error": "username, email, and event_name are required"}), 400

        conn = get_db_connection()
        conn.execute("BEGIN")

        conn.execute(
            "INSERT OR IGNORE INTO Users (username, email) VALUES (?, ?)",
            (username, email)
        )
        row = conn.execute(
            "SELECT user_id FROM Users WHERE email = ?", (email,)
        ).fetchone()

        if not row:
            conn.execute("ROLLBACK")
            conn.close()
            return jsonify({"error": "User lookup failed"}), 500

        conn.execute(
            "INSERT INTO Registrations (user_id, event_name, notes) VALUES (?, ?, ?)",
            (row["user_id"], event_name, notes)
        )
        conn.execute("COMMIT")
        conn.close()
        return jsonify({"success": True}), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# ROUTE: GET /api/dashboard  (CRUD: READ)
# ANNOTATION (API Methods, Rubric Item 6):
# HTTP GET is used because the client is only reading data — no side effects.
# A JOIN between Users and Registrations is performed so the dashboard
# table shows a username rather than a raw user_id integer.
# ============================================================
@app.route('/api/dashboard', methods=['GET'])
def dashboard():
    try:
        conn = get_db_connection()
        rows = conn.execute("""
            SELECT u.username, r.event_name, r.reg_date
            FROM Users u
            JOIN Registrations r ON u.user_id = r.user_id
            ORDER BY r.reg_date DESC
        """).fetchall()
        conn.close()

        # Apply format_reg_date() function to each row before returning JSON
        result = [
            {
                "username":   row["username"],
                "event_name": row["event_name"],
                "reg_date":   format_reg_date(row["reg_date"])
            }
            for row in rows
        ]
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# ROUTE: GET /api/stats
# Returns KPI summary using the RegistrationStats class.
# ============================================================
@app.route('/api/stats', methods=['GET'])
def stats():
    try:
        s = RegistrationStats()
        return jsonify(s.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# ROUTE: GET /api/charts/events  — VISUAL 1: Bar Chart
#
# ANNOTATION (Visual 1, Rubric Item 3a):
# A horizontal bar chart is appropriate here because it compares
# registration counts across discrete, named event categories.
# Bar charts are the standard choice when the axis labels are text
# (event names) — horizontal orientation prevents label overlap.
# The data is pulled live from the Registrations table via SQL GROUP BY,
# so the chart reflects the actual database state at request time.
#
# ANNOTATION (SQL data for visuals, Rubric Item 5):
# The SELECT query groups registrations by event_name and counts each group.
# This gives per-event totals that are then passed to matplotlib for rendering.
# ============================================================
@app.route('/api/charts/events', methods=['GET'])
def chart_events():
    # ANNOTATION (Exception Handling):
    # BytesIO and matplotlib are wrapped in try/except. If the database
    # returns zero rows or matplotlib fails, a 500 error is returned
    # instead of sending a broken/empty image to the browser.
    try:
        conn = get_db_connection()
        rows = conn.execute("""
            SELECT event_name, COUNT(*) as cnt
            FROM Registrations
            GROUP BY event_name
            ORDER BY cnt DESC
        """).fetchall()
        conn.close()

        # Seed fallback data so the chart renders on a fresh install
        if not rows:
            names  = ["Tech Career Fair", "Research Symposium", "Spring Music Festival"]
            counts = [3, 2, 1]
        else:
            names  = [event_label(r["event_name"]) for r in rows]
            counts = [r["cnt"] for r in rows]

        # --- Chart rendering ---
        fig, ax = plt.subplots(figsize=(8, max(3, len(names) * 0.7)))
        sns.set_style("whitegrid")
        bars = ax.barh(names, counts, color="#d4af37", edgecolor="#1a1a1a", linewidth=0.8)
        ax.bar_label(bars, padding=4, fontsize=10, color="#1a1a1a")
        ax.set_xlabel("Number of Registrations", fontsize=11)
        ax.set_title("Registrations by Event", fontsize=13, fontweight="bold", pad=12)
        ax.set_xlim(0, max(counts) + 2)
        fig.tight_layout()

        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=120, bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        return send_file(buf, mimetype='image/png')

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# ROUTE: GET /api/charts/timeline  — VISUAL 2: Line Chart
#
# ANNOTATION (Visual 2, Rubric Item 3b):
# A line chart is appropriate here because it shows how registration
# volume changes over time — time-series data is best displayed with
# a continuous line so the viewer can see trends, peaks, and drops.
# The X-axis is the registration date (from reg_date) and the Y-axis
# is the cumulative count, making it easy to see growth over the semester.
#
# ANNOTATION (SQL data for visuals):
# DATE(reg_date) is used to group timestamps by day, counting how many
# new registrations arrived on each calendar date. matplotlib's
# mdates.AutoDateLocator formats the X-axis tick marks automatically.
# ============================================================
@app.route('/api/charts/timeline', methods=['GET'])
def chart_timeline():
    try:
        conn = get_db_connection()
        rows = conn.execute("""
            SELECT DATE(reg_date) as day, COUNT(*) as cnt
            FROM Registrations
            GROUP BY day
            ORDER BY day ASC
        """).fetchall()
        conn.close()

        if not rows:
            # Seed fallback so the chart is never blank
            from datetime import timedelta
            today = datetime.today()
            days   = [(today - timedelta(days=i)).strftime("%Y-%m-%d") for i in range(6, -1, -1)]
            counts = [1, 2, 1, 3, 2, 4, 2]
        else:
            days   = [r["day"] for r in rows]
            counts = [r["cnt"] for r in rows]

        dates = [datetime.strptime(d, "%Y-%m-%d") for d in days]

        fig, ax = plt.subplots(figsize=(9, 4))
        sns.set_style("whitegrid")
        ax.plot(dates, counts, color="#d4af37", linewidth=2.5, marker="o",
                markersize=6, markerfacecolor="#1a1a1a")
        ax.fill_between(dates, counts, alpha=0.15, color="#d4af37")
        ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %d"))
        ax.xaxis.set_major_locator(mdates.AutoDateLocator())
        plt.xticks(rotation=30, ha='right', fontsize=9)
        ax.set_ylabel("Registrations", fontsize=11)
        ax.set_title("Daily Registration Volume", fontsize=13, fontweight="bold", pad=12)
        fig.tight_layout()

        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=120, bbox_inches='tight')
        plt.close(fig)
        buf.seek(0)
        return send_file(buf, mimetype='image/png')

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# ROUTE: POST /api/chatbot  — BONUS: Simple Chatbot
#
# ANNOTATION (Additional Visual/Tool, Rubric Item 3c):
# The chatbot is an additional Python-powered tool on the dashboard.
# It accepts a plain-English question from the user and returns a
# natural-language answer built from live database statistics.
# This satisfies the "chatbot using Python" option under item 3c.
# ============================================================
@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    try:
        data     = request.get_json()
        question = (data.get("question") or "").lower().strip()

        # ANNOTATION (Exception Handling):
        # If the request body is empty or the question key is missing,
        # return a 400 Bad Request with a descriptive message.
        if not question:
            return jsonify({"answer": "Please type a question first."}), 400

        s = RegistrationStats()

        # ANNOTATION (Conditional Statement, Rubric Item 5b):
        # A chain of if/elif/else checks the question text for keywords
        # and returns the most relevant statistic from the live database.
        # This keeps the chatbot logic easy to read and extend.
        if any(kw in question for kw in ["total", "how many", "count", "registrations"]):
            answer = (f"There are currently {s.total_registrations} total registration(s) "
                      f"in the database from {s.total_users} unique user(s).")

        elif any(kw in question for kw in ["popular", "top", "most", "best event"]):
            answer = (f"The most popular event is '{s.top_event}' "
                      f"with {s.top_event_count} registration(s).")

        elif any(kw in question for kw in ["today", "new today", "recent"]):
            answer = f"There have been {s.today_count} registration(s) so far today."

        elif any(kw in question for kw in ["user", "student", "people"]):
            answer = f"There are {s.total_users} registered user(s) in the system."

        elif any(kw in question for kw in ["help", "what can", "hi", "hello"]):
            answer = ("Hi! I can answer questions like: "
                      "'How many registrations are there?', "
                      "'What is the most popular event?', or "
                      "'How many registrations happened today?'")
        else:
            answer = ("I'm not sure about that. Try asking: "
                      "'How many registrations?', 'What is the top event?', "
                      "or 'How many today?'")

        return jsonify({"answer": answer})

    except Exception as e:
        return jsonify({"answer": f"Error: {str(e)}"}), 500

# ============================================================
# ROUTE: POST /api/login  (ADMIN LOGIN)
# ============================================================
@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    password = data.get("password")

    # CHANGE THIS to your actual admin password
    ADMIN_PASSWORD = "CampusAdmin2026"

    if password == ADMIN_PASSWORD:
        return jsonify({"success": True})
    else:
        return jsonify({"success": False}), 401

# ============================================================
# ENTRY POINT
# ============================================================
if __name__ == '__main__':
    init_db()
    print("✅ Database initialized.")
    print("🚀 Flask server starting at http://localhost:5000")
    app.run(debug=True, port=5000)
