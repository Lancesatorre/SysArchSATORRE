# 🖥️ CCS Sit-In System — PC Transfer & Setup Guide

> Follow these steps in order when setting up the project on a new PC.

---

## ✅ Prerequisites (Install These First)

| Software | Download Link |
|---|---|
| **XAMPP** (PHP + MySQL + Apache) | https://www.apachefriends.org |
| **Node.js** (v18 or later) | https://nodejs.org |
| **Git** (optional, if using GitHub) | https://git-scm.com |

---

## 📁 STEP 1 — Copy the Project Files

**Option A: USB / Flash Drive**
1. Copy the entire folder: `C:\xampp\htdocs\SysArchSATORRE\`
2. Paste it on the new PC at the same path: `C:\xampp\htdocs\SysArchSATORRE\`

**Option B: GitHub**
```bash
cd C:\xampp\htdocs\SysArchSATORRE
git clone https://github.com/Lancesatorre/SysArchSATORRE.git
```

---

## ⚙️ STEP 2 — Start XAMPP Services

1. Open **XAMPP Control Panel**
2. Click **Start** on **Apache**
3. Click **Start** on **MySQL**

> Both status lights should turn **green** ✅

---

## 📦 STEP 3 — Install Node Dependencies

Open a terminal (Command Prompt or PowerShell) and run:

```powershell
cd C:\xampp\htdocs\SysArchSATORRE\SitInSatorre
npm install
```

> This installs all React packages listed in `package.json`. Wait until it finishes.

---

## 🗄️ STEP 4 — Initialize & Seed the Database

Open your browser and go to:

```
http://localhost/SysArchSATORRE/SitInSatorre/server/seed.php?action=fresh
```

This will automatically:
- ✅ Create the `sitin_satorre` database
- ✅ Create all tables (students, labs, PCs, reservations, sessions, etc.)
- ✅ Seed 6 laboratories with 50 PCs each
- ✅ Register 21 students (IDs: `23760001–23760021`, password: `123123`)
- ✅ Create 5 announcements (Rules, Maintenance, Exams, Updates, General)
- ✅ Create 6 sample reservations
- ✅ Start 5 active walk-in sessions
- ✅ Generate 63 completed session records
- ✅ Seed 5 testimonials
- ✅ Seed software catalog

> You should see a green log output confirming each step.

---

## 🚀 STEP 5 — Start the Dev Server

In the terminal:

```powershell
cd C:\xampp\htdocs\SysArchSATORRE\SitInSatorre
npm run dev
```

The app will be available at:

```
http://localhost:5173
```

---

## 🔐 Default Login Credentials

### Admin Account
| Field | Value |
|---|---|
| ID Number | `A-0000` |
| Password | `admin123` |

### Student Accounts (any of the 21 seeded students)
| Field | Value |
|---|---|
| ID Number | `23760001` to `23760021` |
| Password | `123123` |

---

## 🛠️ Troubleshooting

| Problem | Fix |
|---|---|
| `npm install` fails | Make sure Node.js is installed: run `node -v` to check |
| Database not created | Make sure MySQL is **running** in XAMPP Control Panel |
| Seed page shows error | Check that Apache is running and the path is correct |
| Port 5173 already in use | Kill the process or run `npm run dev -- --port 3000` |
| `php` not recognized in terminal | Use `C:\xampp\php\php.exe` instead |

---

## 📝 Notes

- The seed **wipes and recreates** all data — only run `?action=fresh` when you want a clean slate.
- The `database.php` file auto-creates missing columns on every page load, so the schema always stays up to date.
- Software catalog is seeded automatically by `database.php` on first run (no need to re-seed separately).
