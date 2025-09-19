#!/usr/bin/env python3
import json, sqlite3, os, argparse
from pathlib import Path

def derive_generation(n:int):
    if   1 <= n <= 151: return 1
    elif 152 <= n <= 251: return 2
    elif 252 <= n <= 386: return 3
    elif 387 <= n <= 493: return 4
    elif 494 <= n <= 649: return 5
    elif 650 <= n <= 721: return 6
    elif 722 <= n <= 809: return 7
    elif 810 <= n <= 905: return 8
    else: return None

def main(repo_root, db_path):
    pokedex_path = Path(repo_root) / "src" / "data" / "pokedex.json"
    if not pokedex_path.exists():
        raise FileNotFoundError(f"Cannot find {pokedex_path}")
    with open(pokedex_path, "r", encoding="utf-8") as f:
        pokedex = json.load(f)

    indices = sorted(int(k) for k in pokedex["name"].keys())
    rows = []
    for i in indices:
        s = str(i)
        row = {
            "id": int(pokedex["pokedex_number"][s]),
            "name": pokedex["name"][s],
            "type1": pokedex["type1"][s],
            "type2": pokedex["type2"][s],
            "hp": int(pokedex["hp"][s]),
            "attack": int(pokedex["attack"][s]),
            "defense": int(pokedex["defense"][s]),
            "speed": int(pokedex["speed"][s]),
            # new (guarded - set None if key is absent)
            "sp_attack": int(pokedex.get("sp_attack", {}).get(s)) if pokedex.get("sp_attack", {}).get(s) is not None else None,
            "sp_defense": int(pokedex.get("sp_defense", {}).get(s)) if pokedex.get("sp_defense", {}).get(s) is not None else None,
        }
        row["generation"] = derive_generation(row["id"])
        rows.append(row)

    conn = sqlite3.connect(db_path)
    conn.executescript(Path(__file__).parent.joinpath("sql", "schema.sql").read_text(encoding="utf-8"))

    # seed types
    types = sorted({r["type1"] for r in rows} | {r["type2"] for r in rows if r["type2"]})
    conn.executemany("INSERT OR IGNORE INTO types(name) VALUES(?)", [(t,) for t in types])

    conn.executemany(
        """INSERT INTO pokemon (id,name,type1,type2,hp,attack,defense,speed,sp_attack,sp_defense,generation)
            VALUES (:id,:name,:type1,:type2,:hp,:attack,:defense,:speed,:sp_attack,:sp_defense,:generation)
            ON CONFLICT(id) DO UPDATE SET
            name=excluded.name, type1=excluded.type1, type2=excluded.type2,
            hp=excluded.hp, attack=excluded.attack, defense=excluded.defense,
            speed=excluded.speed, sp_attack=excluded.sp_attack, sp_defense=excluded.sp_defense,
            generation=excluded.generation
        """, rows)

    conn.commit()
    conn.close()
    print(f"Loaded {len(rows)} Pokémon into {db_path}")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo-root", default=str(Path(__file__).resolve().parents[2]))
    ap.add_argument("--db", default=str(Path(__file__).resolve().parent / "pokestats.sqlite"))
    args = ap.parse_args()
    main(args.repo_root, args.db)
