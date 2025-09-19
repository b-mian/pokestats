# refactor_step1/backend/app.py
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from fastapi.responses import RedirectResponse
import sqlite3, os

DB_PATH = os.environ.get(
    "POKESTATS_DB",
    os.path.join(os.path.dirname(__file__), "..", "scripts", "pokestats.sqlite"),
)

app = FastAPI(title="Pokestats API", version="0.1.0")

# CORS (adjust as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_conn():
    conn = sqlite3.connect(DB_PATH)
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
    # normalize aliases from URL to DB column names
    aliases = {
        "special-attack": "sp_attack",
        "special_attack": "sp_attack",
        "sp-attack": "sp_attack",
        "special-defense": "sp_defense",
        "special_defense": "sp_defense",
        "sp-defense": "sp_defense",
    }
    cat = aliases.get(category.lower(), category.lower())

    allowed = {"hp","attack","defense","speed","sp_attack","sp_defense"}
    if cat not in allowed:
        raise HTTPException(400, f"Unsupported category: {category}")

    with get_conn() as conn:
        rows = conn.execute(
            "SELECT rank, name, id, value FROM top10 WHERE category=? ORDER BY rank ASC",
            (cat,),
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

@app.get("/")
def root():
    return RedirectResponse(url="/docs")

@app.get("/pokemon")
def list_pokemon(
    q: Optional[str] = None,
    type: Optional[str] = Query(None, alias="type"),
    sort: Optional[str] = Query(None, description="one of: id,name,hp,attack,defense,speed,sp_attack,sp_defense"),
    order: Optional[str] = Query("asc", description="asc|desc"),
    limit: int = 50,
    offset: int = 0,
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

    sql = "SELECT id, name, type1, type2, hp, attack, defense, speed, sp_attack, sp_defense, generation FROM pokemon"
    if where:
        sql += " WHERE " + " AND ".join(where)

    sortable = {"id","name","hp","attack","defense","speed","sp_attack","sp_defense","generation"}
    if sort in sortable:
        dir_ = "DESC" if (order or "").lower() == "desc" else "ASC"
        sql += f" ORDER BY {sort} {dir_}"
    else:
        sql += " ORDER BY id ASC"

    sql += " LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]

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

@app.get("/stats/types")
def types(slot: Optional[int] = None, format: Optional[str] = Query(None, description="percent|count")):
    sql = "SELECT slot, type, count FROM type_frequency"
    params = []
    if slot in (1, 2):
        sql += " WHERE slot=?"
        params.append(slot)
    sql += " ORDER BY count DESC, type ASC"
    with get_conn() as conn:
        rows = [dict(r) for r in conn.execute(sql, params).fetchall()]

    if (format or "").lower() == "percent" and rows:
        # compute totals by slot
        from collections import defaultdict
        totals = defaultdict(int)
        for r in rows:
            totals[r["slot"]] += r["count"]
        for r in rows:
            total = totals[r["slot"]] or 1
            r["percent"] = round(100.0 * r["count"] / total, 2)
    return rows
