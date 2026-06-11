# AeroKeep | Predictive Vehicle Maintenance Platform

AeroKeep is a production-ready, full-stack Predictive Vehicle Maintenance Platform designed for vehicle owners and fleet managers. The system is designed with a completely decoupled architecture, separating the React.js + Vite frontend dashboard from the Node.js + Express REST APIs, making it ready for future native iOS, Android, and Flutter mobile applications without backend alterations.

---

## 🛠️ Technology Stack

- **Frontend:** React.js, Vite, Tailwind CSS, React Router, Axios, Recharts, Lucide React
- **Backend:** Node.js, Express.js, Mongoose
- **Database:** MongoDB (with an automatic **in-memory database fallback** in development)
- **Authentication:** JWT Access Tokens (JSON payload) + Refresh Tokens (HTTP-Only cookies)

---

## 🧠 Predictive Maintenance Engine Heuristics

AeroKeep has a dedicated `predictionService.js` in the backend that calculates maintenance statuses, remaining distances/days, priority indices, and composite health scores for 6 critical systems.

### 1. Monitored Systems and Intervals

| Component | Mileage Interval | Time Interval |
| :--- | :---: | :---: |
| **Engine Oil** | 10,000 km | 180 days (6 months) |
| **Brake System** | 30,000 km | 365 days (1 year) |
| **Battery** | 50,000 km | 730 days (2 years) |
| **Coolant** | 40,000 km | 730 days (2 years) |
| **Air Filter** | 15,000 km | 365 days (1 year) |
| **Tires** | 60,000 km | 1,095 days (3 years) |

### 2. Status Determination

For each category, calculations are relative to the **most recent service date/odometer** of that category (or the vehicle purchase date and `0` km if no service log exists):
- **Overdue:** Remaining Distance $\le 0$ OR Remaining Days $\le 0$.
- **Due Soon:** Remaining Distance is within 15% of the interval OR Remaining Days $\le 30$ days.
- **Healthy:** All criteria are within normal operating bounds.

### 3. Vehicle Health Score (0–100)

A composite index starting at `100` with the following deductions:
- **Age:** Deduct `2` points for each year since manufacture (up to `20` max).
- **Mileage:** Deduct `1` point for every `20,000` km on the odometer (up to `15` max).
- **Compliance Delays:** Deduct `25` points for each **Overdue** component and `10` points for each **Due Soon** component.
- Clamped between `0` and `100`.

---

## 🚀 Local Development Setup

AeroKeep is configured for a **zero-dependency setup**. If you do not have MongoDB running locally, the backend will automatically spin up an in-memory MongoDB database instance (`mongodb-memory-server`) and seed it with mock data on first startup.

### Prerequisites
- Node.js (v18 or higher recommended)
- NPM (v9 or higher)

### Step 1: Clone and Setup Backend
1. Open a terminal in `/backend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (auto-seeds if database is empty):
   ```bash
   npm start
   ```
   The backend server will run on `http://localhost:5000`.

### Step 2: Setup Frontend
1. Open a new terminal in `/frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## 🔑 Demo Access Credentials

The database auto-seeder creates two testing accounts with mock vehicles, service logs, and scheduled appointments:

### 1. Standard Fleet User
- **Email:** `user@fleet.com`
- **Password:** `password123`
- *Features:* Register vehicles, log maintenance histories, book service slot appointments, view personal diagnostics trends.

### 2. Platform Administrator
- **Email:** `admin@fleet.com`
- **Password:** `password123`
- *Features:* Access administrative metrics, manage user directory, adjust authorization roles, approve/reject/complete user service appointments.

---

## 📂 Project Structure

```
/vehicle maintenance
├── /backend
│   ├── /config          # Database connection
│   ├── /controllers     # Business logic controllers
│   ├── /middleware      # Auth, validations and error handlers
│   ├── /models          # Mongoose database models
│   ├── /routes          # REST API endpoints mapping
│   ├── /services        # Prediction and notification engine
│   ├── server.js        # Server bootstrap
│   └── seed.js          # DB seeder helper
└── /frontend
    ├── /src
    │   ├── /components  # Reusable UI widgets
    │   ├── /context     # AuthContext state
    │   ├── /pages       # Dashboard, Vehicles, and Logs views
    │   ├── /utils       # Axios clients and formatters
    │   ├── App.jsx      # Navigation routers
    │   ├── main.jsx     # App mounting
    │   └── index.css    # Premium CSS styling
    ├── tailwind.config.js
    └── vite.config.js
```
