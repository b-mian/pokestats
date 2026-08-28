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

# Schema + loader scripts (scripts/cache/ ships the raw GraphQL responses, so
# the DB build below is hermetic and needs no network on a warm cache)
RUN mkdir -p /app/sql
COPY backend_db/scripts/sql/schema.sql /app/sql/schema.sql
COPY backend_db/scripts ./scripts

# Build the SQLite database from the cached PokeAPI GraphQL data
RUN python /app/scripts/load_pokedex.py --db /app/sql/pokestats.sqlite \
 && python /app/scripts/compute_metrics.py --db /app/sql/pokestats.sqlite

# Env so app.py knows where DB is
ENV SQLITE_PATH=/app/sql/pokestats.sqlite
ENV PYTHONPATH=/app PORT=8000

EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
