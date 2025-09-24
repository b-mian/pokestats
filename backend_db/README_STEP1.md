
# Pokestats Refactor — Step 1 (SQLite + FastAPI + Pandas metrics)

**What you get in this step:**
- A SQLite schema to hold your Pokedex and derived metrics.
- Scripts to load `src/data/pokedex.json` and compute metrics (top-10 lists, type frequencies, per-generation averages).
- A FastAPI backend exposing endpoints your React app can call.
- Example frontend code to switch from static JSON imports to API calls.

## Setup

```bash
cd refactor_step1/scripts
python3 load_pokedex.py --repo-root "/mnt/data/pokestats_repo/pokestats" --db ./pokestats.sqlite
python3 compute_metrics.py --db ./pokestats.sqlite
```

Run the API:

```bash
cd ../backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export POKESTATS_DB="$(cd ../scripts && pwd)/pokestats.sqlite"
uvicorn backend:app --reload --port 8000
```

## Endpoints

- `GET /pokemon?q=char&type=fire&limit=50&offset=0`
- `GET /pokemon/6` (Charizard)
- `GET /stats/top10/hp`  (also: attack, defense, speed)
- `GET /stats/types?slot=1` (or omit `slot`)
- `GET /stats/gen/1`  → `{ generation, labels, values }`

## Notes

- Dataset currently lacks **Sp. Attack** and **Sp. Defense**; the API returns `null` for those to keep the six-value arrays compatible with your charts.
- `top_10_legendary.json` / `top_10_non_legendary.json` need extra columns (`sp_attack`, `sp_defense`, `is_legendary`) to perfectly match the old lists. We can extend the loader + schema later when you provide that data.
- Next steps I can do right away:
  1. Replace all static JSON imports in `src/components/` with API-backed hooks.
  2. Add pagination/sorting to `/pokemon` and a `/types` endpoint that returns percentages.
  3. Package with Docker and add a GitHub Action to build & test.
