# --- Build frontend (CRA) ---
FROM node:20 AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build   # outputs /app/frontend/build

# --- FastAPI runtime ---
FROM python:3.10-slim
WORKDIR /app

# Python deps
COPY backend_db/backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code
COPY backend_db/backend .

# Copy built CRA into backend folder; FastAPI will serve it from ./frontend_build
COPY --from=frontend /app/frontend/build ./frontend_build

# Copy SQLite + schema from backend_db/sql → /app/sql
RUN mkdir -p /app/sql
COPY backend_db/scripts/sql/pokestats.sqlite /app/sql/pokestats.sqlite
COPY backend_db/scripts/sql/schema.sql       /app/sql/schema.sql

# Friendly permissions (usually not required, but removes a variable)
RUN chmod 644 /app/sql/pokestats.sqlite

COPY backend_db/scripts ./scripts

# Install sqlite3 CLI so we can run the schema at build time
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/frontend/src/data
COPY frontend/src/data/ /app/frontend/src/data/

# APPLY SCHEMA to the DB shipped in the image
# RUN sqlite3 /app/sql/pokestats.sqlite < /app/sql/schema.sql

RUN rm -f /app/sql/pokestats.sqlite \
 && python /app/scripts/load_pokedex.py --db /app/sql/pokestats.sqlite --repo-root /app \
 && python /app/scripts/compute_metrics.py --db /app/sql/pokestats.sqlite

# Env so app.py knows where DB is
ENV SQLITE_PATH=/app/sql/pokestats.sqlite
ENV PYTHONPATH=/app PORT=8000
ENV POKEMON_API_BASE=https://pokeapi.co/api/v2

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]