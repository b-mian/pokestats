# refactor_step1/backend/app.py
from pathlib import Path
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from fastapi.responses import FileResponse, RedirectResponse
import sqlite3, os
from fastapi.staticfiles import StaticFiles

# Where the DB will live in the container (set by Dockerfile ENV)
DEFAULT_DB = "/app/sql/pokestats.sqlite"
DB_PATH = os.getenv("SQLITE_PATH", DEFAULT_DB)  # keep existing code that uses DB_PATH

app = FastAPI(title="Pokestats API", version="0.1.0")

# Allow your dev + prod origins (update the prod URL after first deploy)
FRONTEND_ORIGINS = [
    "http://localhost:3000",  # CRA dev server
    os.getenv("FRONTEND_ORIGIN", ""),  # e.g., https://pokestats-xxxxx-uc.a.run.app
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in FRONTEND_ORIGINS if o],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_conn():
    p = Path(DB_PATH)
    if not p.exists():
        # Either return an empty response in routes, OR raise with a clear message:
        raise HTTPException(status_code=500, detail=f"DB not found at {p}")
    conn = sqlite3.connect(str(p), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/pokemon")
def list_pokemon(
    q: Optional[str] = None,
    type: Optional[str] = Query(None, alias="type"),
    limit: int = 50,
    offset: int = 0,
):
    where = []
    params = []
    if q:
        where.append("(LOWER(name) LIKE ? OR CAST(id as TEXT) LIKE ?)")
        like = f"%{(q or '').lower()}%"
        params.extend([like, like]) 
    if type:
        where.append("(type1 = ? OR type2 = ?)")
        params.extend([type, type])
    sql = "SELECT id, name, type1, type2, hp, attack, defense, speed, sp_attack, sp_defense, generation FROM pokemon"
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY id LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]

@app.get("/pokemon/{pid:int}")
def get_pokemon(pid: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT id, name, type1, type2, hp, attack, defense, speed, sp_attack, sp_defense, generation FROM pokemon WHERE id=?",
            (pid,),
        ).fetchone()
    if not row:
        raise HTTPException(404, "Pokémon not found")
    return dict(row)

@app.get("/stats/top10/{category}")
def top10(category: str):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, name, value FROM top10 WHERE category=? ORDER BY value DESC",
            (category,),
        ).fetchall()
    return [dict(r) for r in rows]

@app.get("/stats/types")
def types(slot: Optional[int] = None):
    sql = "SELECT slot, type, count FROM type_frequency"
    params = []
    if slot in (1, 2):
        sql += " WHERE slot=?"
        params.append(slot)
    sql += " ORDER BY count DESC, type ASC"
    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]

@app.get("/stats/gen/{generation}")
def gen_averages(generation: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT generation, hp, attack, speed, defense, sp_attack, sp_defense FROM gen_averages WHERE generation=?",
            (generation,),
        ).fetchone()
    if not row:
        raise HTTPException(404, "Generation not found or no data")
    # Keep 6-value array compatible with your labels
    ordered = [row["hp"], row["attack"], row["speed"], row["defense"], row["sp_attack"], row["sp_defense"]]
    return {
        "generation": generation,
        "labels": ["HP", "Attack", "Speed", "Defense", "Sp. Attack", "Sp. Defense"],
        "values": ordered,
    }

@app.get("/pokemon/count")
def pokemon_count(
    q: Optional[str] = None,
    type: Optional[str] = Query(None, alias="type"),
):
    where = []
    params = []
    if q:
        where.append("(name LIKE ? OR CAST(id as TEXT) LIKE ?)")
        like = f"%{q}%"
        params.extend([like, like])
    if type:
        where.append("(type1 = ? OR type2 = ?)")
        params.extend([type, type])
    sql = "SELECT COUNT(*) AS n FROM pokemon"
    if where:
        sql += " WHERE " + " AND ".join(where)
    with get_conn() as conn:
        row = conn.execute(sql, params).fetchone()
    return {"count": row["n"]}

build_dir = os.path.join(os.path.dirname(__file__), "frontend_build")
if os.path.exists(build_dir):
    app.mount("/", StaticFiles(directory=build_dir, html=True), name="static")
    # Serve index.html at root
    @app.get("/", include_in_schema=False)
    def index():
        return FileResponse(build_dir/"index.html")