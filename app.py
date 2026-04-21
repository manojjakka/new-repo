from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
import random, string
import sqlite3

# ---------------- APP CONFIG ----------------
app = Flask(__name__)
app.secret_key = "secret123"

app.jinja_env.globals.update(enumerate=enumerate)

# ---------------- DATABASE ----------------
def get_db():
    conn = sqlite3.connect("stress.db")
    conn.row_factory = sqlite3.Row
    return conn


def create_tables():
    conn = get_db()
    cursor = conn.cursor()

    # STUDENTS TABLE
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        login_time DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # STRESS RECORDS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS stress_records(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        score INTEGER,
        stress_level TEXT,
        percentage INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    conn.commit()
    conn.close()


create_tables()


# ---------------- CAPTCHA ----------------
def generate_captcha():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))


# ---------------- HOME ----------------
@app.route("/")
def home():
    return redirect(url_for("login"))


# ---------------- LOGIN ----------------
@app.route("/login", methods=["GET", "POST"])
def login():

    if request.method == "GET":
        captcha = generate_captcha()
        session["captcha"] = captcha
        return render_template("login.html", captcha=captcha)

    email = request.form["email"]
    password = request.form["password"]
    user_captcha = request.form["captcha"]

    if user_captcha != session.get("captcha"):
        flash("Captcha incorrect")
        return redirect(url_for("login"))

    if not email.endswith("@srmist.edu.in"):
        flash("Use SRM email only")
        return redirect(url_for("login"))

    roll = email.split("@")[0]

    if password != roll:
        flash("Incorrect password")
        return redirect(url_for("login"))

    session["user"] = email

    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("INSERT INTO students (email) VALUES (?)", (email,))
    conn.commit()
    conn.close()

    return redirect(url_for("dashboard"))


# ---------------- DASHBOARD ----------------
@app.route("/dashboard")
def dashboard():

    if "user" not in session:
        return redirect(url_for("login"))

    return render_template("index.html")


# ---------------- SUBMIT SURVEY ----------------
@app.route("/submit", methods=["POST"])
def submit():

    data = request.get_json()
    answers = data.get("answers", [])

    score = sum(answers)
    max_score = len(answers) * 5 if answers else 50

    pct = max(0, round(100 - (score / max_score) * 100))

    if score <= 15:
        stress = "Low Stress"
    elif score <= 25:
        stress = "Moderate Stress"
    elif score <= 35:
        stress = "High Stress"
    else:
        stress = "Severe Stress"

    session["score"] = score
    session["pct"] = pct
    session["stress"] = stress

    conn = get_db()
    cursor = conn.cursor()

    user_email = session.get("user", "guest@test.com")

    cursor.execute(
        "INSERT INTO stress_records (email,score,stress_level,percentage) VALUES (?,?,?,?)",
        (user_email, score, stress, pct)
    )

    conn.commit()
    conn.close()

    return jsonify({"status": "ok"})


# ---------------- RESULT ----------------
@app.route("/result")
def result():

    user = session.get("user")
    score = session.get("score")
    stress = session.get("stress")

    if score is None:
        conn = get_db()
        cursor = conn.cursor()

        cursor.execute(
            "SELECT * FROM stress_records WHERE email=? ORDER BY created_at DESC LIMIT 1",
            (user,)
        )

        row = cursor.fetchone()

        if row:
            score = row["score"]
            stress = row["stress_level"]

        conn.close()

    return render_template(
        "result.html",
        user=user,
        score=score,
        pct=session.get("pct", 0),
        stress=stress
    )


# ---------------- LOGOUT ----------------
@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("login"))


# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(debug=True)