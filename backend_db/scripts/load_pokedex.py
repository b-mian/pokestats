# backend_db/scripts/load_pokedex.py
import argparse, os, sqlite3, time
from pathlib import Path

try:
    import httpx
except ImportError:
    raise SystemExit("Please add httpx to requirements.txt")

POKEAPI_BASE = os.getenv("POKEMON_API_BASE", "https://pokeapi.co/api/v2")

STAT_MAP = {
    "hp": "hp",
    "attack": "attack",
    "defense": "defense",
    "special-attack": "sp_attack",
    "special-defense": "sp_defense",
    "speed": "speed",
}

def parse_stats(stats_list):
    out = {v: None for v in STAT_MAP.values()}
    for s in stats_list:
        name = s["stat"]["name"]
        col = STAT_MAP.get(name)
        if col:
            out[col] = s["base_stat"]
    return out

def fetch_all_pokemon_from_api(limit=20000, client=None):
    # Use the pokemon endpoint (not species) to get id and stats quickly
    # We page through /pokemon to get URLs, then fetch each detail.
    items = []
    c = client or httpx.Client(timeout=15)
    try:
        # Step 1: get a full list of URLs (name + url gives id)
        r = c.get(f"{POKEAPI_BASE}/pokemon", params={"limit": limit, "offset": 0})
        r.raise_for_status()
        listing = r.json()["results"]

        for i, it in enumerate(listing, 1):
            detail = c.get(it["url"])
            if detail.status_code != 200:
                # backoff + retry light
                time.sleep(0.5)
                detail.raise_for_status()
            d = detail.json()
            # extract id, name, types, stats, generation (via species if you need it)
            pid = d["id"]
            name = d["name"]
            types = d.get("types", [])
            type1 = types[0]["type"]["name"] if len(types) >= 1 else None
            type2 = types[1]["type"]["name"] if len(types) >= 2 else None
            stats = parse_stats(d.get("stats", []))

            # Generation requires an extra call to species endpoint (one per pokemon)
            gen = None
            species_url = d.get("species", {}).get("url")
            if species_url:
                sp = c.get(species_url)
                if sp.status_code == 200:
                    spj = sp.json()
                    # generations come as "generation-i", "generation-ii", ...
                    gname = spj.get("generation", {}).get("name")
                    if gname and gname.startswith("generation-"):
                        roman = gname.split("generation-")[-1]
                        roman_map = {"i":1,"ii":2,"iii":3,"iv":4,"v":5,"vi":6,"vii":7,"viii":8,"ix":9}
                        gen = roman_map.get(roman, None)

            items.append({
                "id": pid,
                "name": name,
                "type1": type1,
                "type2": type2,
                "generation": gen,
                **stats,
            })

            # be nice to the API
            if i % 50 == 0:
                time.sleep(0.2)

        return items
    finally:
        if client is None:
            c.close()

def _norm_stat(row, *keys):
    for k in keys:
        if k in row and row[k] is not None:
            return row[k]
    return None  # keep NULL in DB if truly missing

def upsert_pokemon(conn, rows):
    sql = """
    INSERT INTO pokemon
      (id, name, type1, type2, generation, hp, attack, defense, sp_attack, sp_defense, speed)
    VALUES
      (?,  ?,    ?,     ?,     ?,          ?,  ?,      ?,       ?,         ?,          ?)
    ON CONFLICT(id) DO UPDATE SET
      name=excluded.name,
      type1=excluded.type1,
      type2=excluded.type2,
      generation=excluded.generation,
      hp=excluded.hp,
      attack=excluded.attack,
      defense=excluded.defense,
      sp_attack=excluded.sp_attack,
      sp_defense=excluded.sp_defense,
      speed=excluded.speed
    """
    def to_tuple(r):
        # normalize the special stats no matter how they’re named upstream
        sp_atk = _norm_stat(r, "sp_attack", "special_attack", "special-attack")
        sp_def = _norm_stat(r, "sp_defense", "special_defense", "special-defense")
        return (
            r.get("id"),
            r.get("name"),
            r.get("type1"),
            r.get("type2"),
            r.get("generation"),
            r.get("hp"),
            r.get("attack"),
            r.get("defense"),
            sp_atk,
            sp_def,
            r.get("speed"),
        )

    vals = [to_tuple(r) for r in rows]
    conn.executemany(sql, vals)

def ensure_schema(conn):
    # Minimal schema needed for the UPSERT; expand if you have more fields
    conn.executescript("""
    CREATE TABLE IF NOT EXISTS pokemon (
      id           INTEGER PRIMARY KEY,
      name         TEXT NOT NULL,
      type1        TEXT,
      type2        TEXT,
      generation   INTEGER,
      hp           INTEGER,
      attack       INTEGER,
      defense      INTEGER,
      sp_attack    INTEGER,
      sp_defense   INTEGER,
      speed        INTEGER
    );
    """)
    # Useful indexes
    conn.executescript("""
    CREATE INDEX IF NOT EXISTS idx_pokemon_name ON pokemon(name);
    CREATE INDEX IF NOT EXISTS idx_pokemon_generation ON pokemon(generation);
    CREATE INDEX IF NOT EXISTS idx_pokemon_type1 ON pokemon(type1);
    CREATE INDEX IF NOT EXISTS idx_pokemon_type2 ON pokemon(type2);
    """)

def main(mode, db_path):
    conn = sqlite3.connect(db_path, check_same_thread=False)
    try:
        ensure_schema(conn)

        if mode == "api":
            rows = fetch_all_pokemon_from_api()

        upsert_pokemon(conn, rows)
        conn.commit()
        print(f"Loaded {len(rows)} Pokémon into {db_path}")
    finally:
        conn.close()

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--db", required=True)
    p.add_argument("--source", choices=["api", "json"], default="api")  # ← default to API
    # (keep --repo-root if other scripts still use it; it’s not needed here anymore)
    p.add_argument("--repo-root", default="/")
    args = p.parse_args()
    main(args.source, args.db)
