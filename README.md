# Pokéstats

A full-stack Pokémon statistics app: a searchable Pokédex with rich per-Pokémon
detail pages, interactive charts, a team builder with type-coverage analysis,
a comparison tool, a stat explorer, and data-driven quiz games.

**Stack:** React 17 (CRA) + Chart.js 4 + react-router v6 on the frontend;
FastAPI + SQLite on the backend. All data is bulk-loaded from
[PokéAPI](https://pokeapi.co)'s GraphQL endpoint at build time — 1,302 Pokémon
(1,025 species + alternate forms), abilities, evolution chains, Pokédex flavor
text, and the full 18×18 type-effectiveness matrix.

## Features

- **Pokédex** — searchable, filterable (type, generation, rarity, forms,
  favorites), sortable grid; 6 Pokémon per page with 10 stats per card.
- **Detail pages** (`/pokemon/:id`) — official artwork, flavor text, abilities,
  radar chart vs. the generation average, computed weaknesses/resistances,
  evolution chain, and alternate forms.
- **Compare** (`/compare?ids=6,9`) — up to 4 Pokémon overlaid on one radar,
  best-stat highlighting, head-to-head type matchups. Shareable URL.
- **Team Builder** (`/team?ids=...`) — 6 slots with defensive hole detection
  and offensive STAB coverage analysis. Shareable URL.
- **Stat Explorer** (`/explorer`) — every Pokémon on a scatter plot of any two
  stats, colored by type, click-through to detail pages.
- **Quiz** (`/quiz`) — generated server-side from the database: silhouette
  ("Who's That Pokémon?"), type, higher-stat, Pokédex-entry, and generation
  questions across three difficulties, with optional timed mode.
- **Higher or Lower** (`/games/higher-lower`) — streak-based stat guessing game.
- **Top Tens & Generation Averages** — leaderboards (including base stat total)
  and per-generation stat charts.
- **Pokémon of the Day** on the home page.

## Running locally

Backend (from `backend_db/`):

```bash
python3 -m venv .venv && .venv/bin/pip install -r backend/requirements.txt
# build the database (uses backend_db/scripts/cache/ if present; --refresh refetches)
python3 scripts/load_pokedex.py --db scripts/sql/pokestats.sqlite
python3 scripts/compute_metrics.py --db scripts/sql/pokestats.sqlite
cd backend && SQLITE_PATH=../scripts/sql/pokestats.sqlite ../.venv/bin/uvicorn app:app --port 8000
```

Frontend (from `frontend/`, expects the API on `http://127.0.0.1:8000` via `.env`):

```bash
npm install
npm start
```

## Docker

One image builds the CRA bundle, regenerates the SQLite database from the
GraphQL cache (or the network on a cache miss), and serves both from FastAPI:

```bash
docker build -t pokestats .
docker run -p 8000:8000 pokestats
```

## Data pipeline notes

- `backend_db/scripts/load_pokedex.py` fetches everything in six bulk GraphQL
  queries, caches the raw responses under `backend_db/scripts/cache/` (~1.7 MB,
  committed so builds are fast and reproducible), and refuses to write a
  half-empty database (sanity checks on counts, stats, the type chart, and
  evolution edges).
- `backend_db/scripts/compute_metrics.py` derives top-10 leaderboards, type
  frequencies, and generation averages over default forms.
- The API is documented interactively at `http://127.0.0.1:8000/docs`.
