# backend_db/backend/app.py
from datetime import date
from pathlib import Path
from fastapi import APIRouter, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from fastapi.responses import FileResponse
import os
import random
import sqlite3

# Where the DB will live in the container (set by Dockerfile ENV)
DEFAULT_DB = "/app/sql/pokestats.sqlite"
DB_PATH = os.getenv("SQLITE_PATH", DEFAULT_DB)

app = FastAPI(title="Pokestats API", version="0.2.0")
router = APIRouter(prefix="/api")

FRONTEND_ORIGINS = [
    "http://localhost:3000",  # CRA dev server
    os.getenv("FRONTEND_ORIGIN", ""),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in FRONTEND_ORIGINS if o],
    allow_methods=["*"],
    allow_headers=["*"],
)

LIST_COLUMNS = (
    "id, name, species_id, species_name, form_name, is_default, type1, type2, "
    "hp, attack, defense, sp_attack, sp_defense, speed, bst, generation, "
    "height_m, weight_kg, base_experience, is_legendary, is_mythical"
)

SORT_WHITELIST = {
    "id", "name", "hp", "attack", "defense", "sp_attack", "sp_defense",
    "speed", "bst", "height_m", "weight_kg", "base_experience", "generation",
}


def get_conn():
    p = Path(DB_PATH)
    if not p.exists():
        raise HTTPException(status_code=500, detail=f"DB not found at {p}")
    conn = sqlite3.connect(str(p), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def pokemon_filters(q, type_, generation, legendary, include_forms, bst_min, bst_max):
    """Shared WHERE-clause builder for /pokemon, /pokemon/count, /pokemon/random."""
    where, params = [], []
    if q:
        where.append("(LOWER(name) LIKE ? OR CAST(id AS TEXT) LIKE ?)")
        like = f"%{q.lower()}%"
        params.extend([like, like])
    if type_:
        where.append("(type1 = ? OR type2 = ?)")
        params.extend([type_, type_])
    if generation is not None:
        where.append("generation = ?")
        params.append(generation)
    if legendary is not None:
        if legendary:
            where.append("(is_legendary = 1 OR is_mythical = 1)")
        else:
            where.append("(is_legendary = 0 AND is_mythical = 0)")
    if not include_forms:
        where.append("is_default = 1")
    if bst_min is not None:
        where.append("bst >= ?")
        params.append(bst_min)
    if bst_max is not None:
        where.append("bst <= ?")
        params.append(bst_max)
    return where, params


@router.get("/health")
def health():
    return {"status": "ok"}


# --------------------------------------------------------------------------
# Pokedex listing (static paths declared before /pokemon/{pid})
# --------------------------------------------------------------------------

@router.get("/pokemon/count")
def pokemon_count(
    q: Optional[str] = None,
    type: Optional[str] = Query(None, alias="type"),
    generation: Optional[int] = None,
    legendary: Optional[bool] = None,
    include_forms: bool = False,
    bst_min: Optional[int] = None,
    bst_max: Optional[int] = None,
):
    where, params = pokemon_filters(q, type, generation, legendary, include_forms, bst_min, bst_max)
    sql = "SELECT COUNT(*) AS n FROM pokemon"
    if where:
        sql += " WHERE " + " AND ".join(where)
    with get_conn() as conn:
        row = conn.execute(sql, params).fetchone()
    return {"count": row["n"]}


@router.get("/pokemon/random")
def pokemon_random(
    generation: Optional[int] = None,
    legendary: Optional[bool] = None,
    include_forms: bool = False,
    exclude: Optional[int] = None,
):
    where, params = pokemon_filters(None, None, generation, legendary, include_forms, None, None)
    if exclude is not None:
        where.append("id != ?")
        params.append(exclude)
    sql = f"SELECT {LIST_COLUMNS} FROM pokemon"
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY RANDOM() LIMIT 1"
    with get_conn() as conn:
        row = conn.execute(sql, params).fetchone()
    if not row:
        raise HTTPException(404, "No pokemon match the filters")
    return dict(row)


@router.get("/pokemon/potd")
def pokemon_of_the_day():
    """Deterministic pick per calendar day."""
    with get_conn() as conn:
        n = conn.execute("SELECT COUNT(*) AS n FROM pokemon WHERE is_default = 1").fetchone()["n"]
        if n == 0:
            raise HTTPException(500, "Empty pokedex")
        offset = date.today().toordinal() % n
        row = conn.execute(
            f"SELECT {LIST_COLUMNS} FROM pokemon WHERE is_default = 1 ORDER BY id LIMIT 1 OFFSET ?",
            (offset,),
        ).fetchone()
    return dict(row)


@router.get("/pokemon")
def list_pokemon(
    q: Optional[str] = None,
    type: Optional[str] = Query(None, alias="type"),
    generation: Optional[int] = None,
    legendary: Optional[bool] = None,
    include_forms: bool = False,
    bst_min: Optional[int] = None,
    bst_max: Optional[int] = None,
    sort: str = "id",
    order: str = "asc",
    limit: int = Query(50, ge=1, le=2000),
    offset: int = Query(0, ge=0),
):
    if sort not in SORT_WHITELIST:
        raise HTTPException(400, f"sort must be one of {sorted(SORT_WHITELIST)}")
    direction = "DESC" if order.lower() == "desc" else "ASC"
    where, params = pokemon_filters(q, type, generation, legendary, include_forms, bst_min, bst_max)
    sql = f"SELECT {LIST_COLUMNS} FROM pokemon"
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += f" ORDER BY {sort} {direction}, id ASC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    with get_conn() as conn:
        rows = conn.execute(sql, params).fetchall()
    return [dict(r) for r in rows]


@router.get("/pokemon/{pid}")
def get_pokemon(pid: int):
    with get_conn() as conn:
        row = conn.execute(f"SELECT {LIST_COLUMNS} FROM pokemon WHERE id=?", (pid,)).fetchone()
    if not row:
        raise HTTPException(404, "Pokémon not found")
    return dict(row)


@router.get("/pokemon/{pid}/detail")
def get_pokemon_detail(pid: int):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM pokemon WHERE id=?", (pid,)).fetchone()
        if not row:
            raise HTTPException(404, "Pokémon not found")
        p = dict(row)

        abilities = [
            dict(r) for r in conn.execute(
                "SELECT name, is_hidden FROM abilities WHERE pokemon_id=? ORDER BY slot", (pid,)
            ).fetchall()
        ]
        egg_groups = [
            r["egg_group"] for r in conn.execute(
                "SELECT egg_group FROM egg_groups WHERE species_id=? ORDER BY egg_group",
                (p["species_id"],),
            ).fetchall()
        ]
        forms = [
            dict(r) for r in conn.execute(
                "SELECT id, name, form_name, is_default, type1, type2, bst "
                "FROM pokemon WHERE species_id=? ORDER BY id",
                (p["species_id"],),
            ).fetchall()
        ]

        chain = {"members": [], "edges": []}
        if p["evolution_chain_id"]:
            members = [
                dict(r) for r in conn.execute(
                    "SELECT id, name, species_id, type1, type2, bst FROM pokemon "
                    "WHERE evolution_chain_id=? AND is_default=1 ORDER BY species_id",
                    (p["evolution_chain_id"],),
                ).fetchall()
            ]
            edges = [
                dict(r) for r in conn.execute(
                    "SELECT from_species_id, to_species_id, trigger, min_level, item "
                    "FROM evolutions WHERE chain_id=?",
                    (p["evolution_chain_id"],),
                ).fetchall()
            ]
            # stage = evolution depth from the chain root (0-based)
            parent = {e["to_species_id"]: e["from_species_id"] for e in edges}

            def stage_of(sid):
                depth = 0
                while sid in parent and depth < 10:
                    sid = parent[sid]
                    depth += 1
                return depth

            for m in members:
                m["stage"] = stage_of(m["species_id"])
            chain = {"members": members, "edges": edges}

    return {**p, "abilities": abilities, "egg_groups": egg_groups, "forms": forms,
            "evolution_chain": chain}


# --------------------------------------------------------------------------
# Stats
# --------------------------------------------------------------------------

@router.get("/stats/top10/{category}")
def top10(category: str):
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT id, name, value FROM top10 WHERE category=? ORDER BY value DESC",
            (category,),
        ).fetchall()
    return [dict(r) for r in rows]


@router.get("/stats/types")
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


@router.get("/stats/gen/{generation}")
def gen_averages(generation: int):
    with get_conn() as conn:
        row = conn.execute(
            "SELECT generation, hp, attack, speed, defense, sp_attack, sp_defense "
            "FROM gen_averages WHERE generation=?",
            (generation,),
        ).fetchone()
    if not row:
        raise HTTPException(404, "Generation not found or no data")
    ordered = [row["hp"], row["attack"], row["speed"], row["defense"], row["sp_attack"], row["sp_defense"]]
    return {
        "generation": generation,
        "labels": ["HP", "Attack", "Speed", "Defense", "Sp. Attack", "Sp. Defense"],
        "values": ordered,
    }


@router.get("/stats/typechart")
def typechart():
    """Full 18x18 matrix as {attacker: {defender: multiplier}}."""
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT attacker, defender, multiplier FROM type_effectiveness"
        ).fetchall()
    chart = {}
    for r in rows:
        chart.setdefault(r["attacker"], {})[r["defender"]] = r["multiplier"]
    return chart


# --------------------------------------------------------------------------
# Quiz generation
# --------------------------------------------------------------------------

STAT_LABELS = {
    "hp": "HP", "attack": "Attack", "defense": "Defense",
    "sp_attack": "Sp. Attack", "sp_defense": "Sp. Defense", "speed": "Speed",
}


def _quiz_pool(conn, difficulty: str):
    if difficulty == "easy":
        where = "is_default = 1 AND generation <= 2"
    elif difficulty == "hard":
        where = "is_default = 1"
    else:  # medium
        where = "is_default = 1 AND generation <= 6"
    return [
        dict(r) for r in conn.execute(
            f"SELECT id, name, species_name, type1, type2, generation, "
            f"hp, attack, defense, sp_attack, sp_defense, speed, bst, flavor_text "
            f"FROM pokemon WHERE {where}"
        ).fetchall()
    ]


def _pretty(name: str) -> str:
    return name.replace("-", " ").title()


def _q_silhouette(rng, pool):
    target = rng.choice(pool)
    same_gen = [p for p in pool if p["generation"] == target["generation"] and p["id"] != target["id"]]
    distractors = rng.sample(same_gen if len(same_gen) >= 3 else
                             [p for p in pool if p["id"] != target["id"]], 3)
    options = distractors + [target]
    rng.shuffle(options)
    return {
        "kind": "silhouette",
        "prompt": "Who's That Pokémon?",
        "image_id": target["id"],
        "options": [{"label": _pretty(o["name"]), "id": o["id"]} for o in options],
        "answer": next(i for i, o in enumerate(options) if o["id"] == target["id"]),
    }


def _q_type(rng, pool):
    target = rng.choice(pool)
    correct = target["type1"] + (f" / {target['type2']}" if target["type2"] else "")
    combos = {correct}
    all_types = sorted({p["type1"] for p in pool})
    while len(combos) < 4:
        t1 = rng.choice(all_types)
        combo = t1 if rng.random() < 0.5 or not target["type2"] else f"{t1} / {rng.choice(all_types)}"
        combos.add(combo)
    options = sorted(combos)
    rng.shuffle(options)
    return {
        "kind": "type",
        "prompt": f"What type is {_pretty(target['name'])}?",
        "image_id": target["id"],
        "options": [{"label": o} for o in options],
        "answer": options.index(correct),
    }


def _q_higher_stat(rng, pool, min_gap):
    stat = rng.choice(list(STAT_LABELS))
    for _ in range(50):
        a, b = rng.sample(pool, 2)
        if a[stat] is None or b[stat] is None:
            continue
        if abs(a[stat] - b[stat]) >= min_gap:
            break
    winner = a if a[stat] > b[stat] else b
    options = [a, b]
    rng.shuffle(options)
    return {
        "kind": "higher_stat",
        "prompt": f"Which Pokémon has higher {STAT_LABELS[stat]}?",
        "options": [{"label": _pretty(o["name"]), "id": o["id"]} for o in options],
        "answer": next(i for i, o in enumerate(options) if o["id"] == winner["id"]),
    }


def _q_flavor(rng, pool):
    with_flavor = [p for p in pool if p["flavor_text"]]
    target = rng.choice(with_flavor)
    # redact the name so the entry doesn't give itself away
    text = target["flavor_text"]
    for token in (_pretty(target["species_name"]), target["species_name"].upper()):
        text = text.replace(token, "▮▮▮▮")
    distractors = rng.sample([p for p in with_flavor if p["id"] != target["id"]], 3)
    options = distractors + [target]
    rng.shuffle(options)
    return {
        "kind": "flavor",
        "prompt": f"Which Pokémon does this Pokédex entry describe? “{text}”",
        "options": [{"label": _pretty(o["name"]), "id": o["id"]} for o in options],
        "answer": next(i for i, o in enumerate(options) if o["id"] == target["id"]),
    }


def _q_generation(rng, pool):
    target = rng.choice(pool)
    gens = list(range(1, 10))
    wrong = rng.sample([g for g in gens if g != target["generation"]], 3)
    options = sorted(wrong + [target["generation"]])
    return {
        "kind": "generation",
        "prompt": f"Which generation introduced {_pretty(target['name'])}?",
        "image_id": target["id"],
        "options": [{"label": f"Generation {g}"} for g in options],
        "answer": options.index(target["generation"]),
    }


@router.get("/quiz")
def quiz(count: int = Query(10, ge=1, le=25), difficulty: str = "medium"):
    if difficulty not in ("easy", "medium", "hard"):
        raise HTTPException(400, "difficulty must be easy|medium|hard")
    rng = random.Random()
    with get_conn() as conn:
        pool = _quiz_pool(conn, difficulty)
    if len(pool) < 8:
        raise HTTPException(500, "Not enough pokemon for a quiz")

    kinds = {
        "easy": ["silhouette", "type", "higher_stat"],
        "medium": ["silhouette", "type", "higher_stat", "flavor"],
        "hard": ["silhouette", "type", "higher_stat", "flavor", "generation"],
    }[difficulty]
    min_gap = {"easy": 40, "medium": 25, "hard": 10}[difficulty]

    makers = {
        "silhouette": lambda: _q_silhouette(rng, pool),
        "type": lambda: _q_type(rng, pool),
        "higher_stat": lambda: _q_higher_stat(rng, pool, min_gap),
        "flavor": lambda: _q_flavor(rng, pool),
        "generation": lambda: _q_generation(rng, pool),
    }
    questions = [makers[rng.choice(kinds)]() for _ in range(count)]
    return {"difficulty": difficulty, "questions": questions}


# --------------------------------------------------------------------------
# Static frontend (production container)
# --------------------------------------------------------------------------

app.include_router(router)

build_dir = Path(__file__).parent / "frontend_build"
if build_dir.exists():
    import re

    ASSET_LIKE = re.compile(r"\.\w{1,8}$")  # paths ending in a file extension

    from fastapi import Request
    from fastapi.responses import RedirectResponse

    LEGACY_API_PREFIXES = ("pokemon", "stats")

    @app.api_route("/{full_path:path}", methods=["GET", "HEAD"], include_in_schema=False)
    def spa_fallback(full_path: str, request: Request):
        """Serve the SPA. Cache policy is the standard SPA recipe:

        - hashed /assets/* files: immutable, cache for a year
        - other real files (favicon, sprites, robots.txt): cache briefly
        - index.html (and client-side routes): no-cache, so every navigation
          revalidates and a fresh deploy takes effect immediately
        - unknown /api/* or asset-like paths: a real 404, never HTML —
          otherwise a stale bundle's API call gets index.html back and dies
          with "<!DOCTYPE ... is not valid JSON"
        - legacy un-prefixed API calls (a stale cached bundle from before the
          /api split): redirected to /api/* so they keep working. Only fetches
          are redirected — page navigations advertise text/html in Accept and
          fall through to the SPA, so deep links like /pokemon/6 still render.
        """
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(404, "Unknown API endpoint")

        root = full_path.split("/", 1)[0]
        wants_html = "text/html" in request.headers.get("accept", "")
        if root in LEGACY_API_PREFIXES and not wants_html:
            target = f"/api/{full_path}"
            if request.url.query:
                target += f"?{request.url.query}"
            return RedirectResponse(target, status_code=307)

        candidate = build_dir / full_path
        if full_path and candidate.is_file():
            if full_path.startswith("assets/"):
                headers = {"Cache-Control": "public, max-age=31536000, immutable"}
            else:
                headers = {"Cache-Control": "public, max-age=3600"}
            return FileResponse(candidate, headers=headers)

        if ASSET_LIKE.search(full_path):
            raise HTTPException(404, "File not found")

        return FileResponse(build_dir / "index.html",
                            headers={"Cache-Control": "no-cache"})
