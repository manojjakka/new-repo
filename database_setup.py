import sqlite3

# connect to database
conn = sqlite3.connect("stress.db")
cursor = conn.cursor()

# ---------------- STUDENTS TABLE ----------------
cursor.execute("""
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")

# ---------------- STRESS RECORDS ----------------
cursor.execute("""
CREATE TABLE IF NOT EXISTS stress_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    score INTEGER,
    stress_level TEXT,
    percentage INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")

# ---------------- CHAT HISTORY ----------------
cursor.execute("""
CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT,
    user_message TEXT,
    bot_reply TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
""")

print("Database and tables created successfully!")

conn.commit()
conn.close()