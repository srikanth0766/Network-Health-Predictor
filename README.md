# NetWatch: AI-Powered Campus Network Health Predictor

NetWatch is a full-stack, AI-powered system designed to monitor campus network telemetry and predict network congestion using a Random Forest Classifier trained on simulated telemetry metrics.

---

## Technical Stack

- **Frontend**: React (Vite), Recharts, Axios, and Raw Inline CSS
- **Backend**: FastAPI, SQLAlchemy (async), PostgreSQL (asyncpg), WebSockets (native)
- **ML**: scikit-learn, pandas, numpy, joblib
- **Orchestration**: Docker & docker-compose

---

## UI/UX Design System Spec
- Minimalist terminal-like UI using the Google Font **IBM Plex Mono**.
- Pure black/white aesthetics with no gradients, no shadows, and sharp boxy 90-degree corners (no border-radius).
- Standardized color system for status signaling:
  - `#4caf50`: OK / low risk / excellent health
  - `#ffcc00`: Warning / medium risk
  - `#ff4444`: Danger / high risk / critical health

---

## Startup Methods

### Method A: Docker Compose (Recommended)

To start the database, backend services, and frontend web server automatically inside coordinated Docker containers:

1. In the project root, build and start all containers:
   ```bash
   docker compose up --build
   ```
2. Open the application in your browser at [http://localhost](http://localhost) (port 80).
3. Log in using one of the pre-seeded accounts:
   - **Administrator**: username `admin`, password `admin123`
   - **Viewer**: username `viewer`, password `viewer123`

---

### Method B: Local Development Startup (Without Docker)

Ensure you have **Python 3.11+**, **Node.js 20+**, and a running **PostgreSQL** instance.

#### Step 1: Generate & Train ML Model
From the project root:
1. Create a virtual environment and install dependencies:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r backend/requirements.txt
   ```
2. Generate the simulation dataset (creates `ml/network_data.csv`):
   ```bash
   python ml/generate_dataset.py
   ```
3. Train the Random Forest classifier model (asserts >85% classification accuracy and exports `ml/congestion_model.pkl`):
   ```bash
   python ml/train_model.py
   ```

#### Step 2: Start PostgreSQL Database
1. Run local Postgres server and ensure a database named `postgres` is available on port `5432` with username `postgres` and password `postgres`.
2. If database credentials differ, set the `DATABASE_URL` environment variable:
   ```bash
   export DATABASE_URL="postgresql+asyncpg://<username>:<password>@<host>:<port>/<dbname>"
   ```

#### Step 3: Run Backend Service
1. Activate the python virtual environment.
2. Launch the FastAPI server using Uvicorn:
   ```bash
   cd backend
   uvicorn app:app --reload --host 0.0.0.0 --port 8000
   ```

#### Step 4: Run Frontend Development Server
1. Open a new terminal instance.
2. Install package nodes and run Vite development server:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. Access the dev interface in your browser at [http://localhost:5173](http://localhost:5173).
