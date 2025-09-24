# compute_metrics.py
import argparse
import os
import sqlite3

# COALESCE_SP_ATK = "COALESCE('special-attack', sp_attack)"
# COALESCE_SP_DEF = "COALESCE('special-defense', sp_defense)"

def ensure_metrics_tables(conn: sqlite3.Connection):
    conn.executescript(f"""
    CREATE TABLE IF NOT EXISTS type_frequency (
        type TEXT NOT NULL,
        slot INTEGER NOT NULL CHECK (slot IN (1,2)),
        count INTEGER NOT NULL,
        PRIMARY KEY (type, slot)
    );

    CREATE TABLE IF NOT EXISTS top10 (
        id INTEGER NOT NULL,
        category TEXT NOT NULL,            -- hp|attack|defense|sp_attack|sp_defense|speed
        name TEXT NOT NULL,                -- pokemon name
        value INTEGER NOT NULL,            -- stat value
        PRIMARY KEY (category, id)
    );

    CREATE TABLE IF NOT EXISTS gen_averages (
        generation INTEGER PRIMARY KEY,    -- 1..9
        hp REAL, attack REAL, defense REAL,
        sp_attack REAL, sp_defense REAL, speed REAL
    );
    """)

def rebuild_type_frequency(conn: sqlite3.Connection):
    # Use pokemon.type1/type2; fall back to computing directly if needed
    conn.execute("DELETE FROM type_frequency")
    # slot 1
    conn.execute("""
        INSERT INTO type_frequency(type, slot, count)
        SELECT type1 AS type, 1 AS slot, COUNT(*) AS cnt
        FROM pokemon
        WHERE type1 IS NOT NULL AND type1 <> ''
        GROUP BY type1
        ORDER BY cnt DESC, type1 ASC
    """)
    # slot 2
    conn.execute("""
        INSERT INTO type_frequency(type, slot, count)
        SELECT type2 AS type, 2 AS slot, COUNT(*) AS cnt
        FROM pokemon
        WHERE type2 IS NOT NULL AND type2 <> ''
        GROUP BY type2
        ORDER BY cnt DESC, type2 ASC
    """)

def rebuild_top10(conn: sqlite3.Connection):
    conn.execute("DELETE FROM top10")
    # categories and their SQL expressions (coalescing special stats)
    categories = {
        "hp": "hp",
        "attack": "attack",
        "defense": "defense",
        "sp_attack": "sp_attack",
        "sp_defense": "sp_defense",
        "speed": "speed",
    }
    for cat, expr in categories.items():
        conn.execute(f"""
            INSERT INTO top10(id, category, name, value)
            SELECT id, ?, name, {expr} AS value
            FROM pokemon
            WHERE {expr} IS NOT NULL
            ORDER BY value DESC, name ASC
            LIMIT 10
        """, (cat,))

def rebuild_gen_averages(conn: sqlite3.Connection):
    conn.execute("DELETE FROM gen_averages")
    # only consider rows with generation not null
    conn.execute(f"""
        INSERT INTO gen_averages(generation, hp, attack, defense, sp_attack, sp_defense, speed)
        SELECT
            generation,
            CAST(AVG(hp) AS INT),
            CAST(AVG(attack) AS INT),
            CAST(AVG(defense) AS INT),
            CAST(AVG(sp_attack) AS INT),
            CAST(AVG(sp_defense) AS INT),
            CAST(AVG(speed) AS INT)
        FROM pokemon
        WHERE generation IS NOT NULL
        GROUP BY generation
        ORDER BY generation
    """)

def main(db_path: str):
    conn = sqlite3.connect(db_path)
    try:
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("BEGIN IMMEDIATE")  # single transaction

        ensure_metrics_tables(conn)
        rebuild_type_frequency(conn)
        rebuild_top10(conn)
        rebuild_gen_averages(conn)

        conn.commit()
        print("Metrics rebuilt: type_frequency, top10, gen_averages")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=os.getenv("SQLITE_PATH", "/app/sql/pokestats.sqlite"))
    args = ap.parse_args()
    main(args.db)
