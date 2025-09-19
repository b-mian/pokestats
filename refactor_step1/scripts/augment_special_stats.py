#!/usr/bin/env python3
import sqlite3, time, sys, json
from urllib.request import urlopen
from urllib.error import URLError, HTTPError

DB = "pokestats.sqlite"
BASE = "https://pokeapi.co/api/v2/pokemon/{id}"

def fetch_stats(pid: int):
    url = BASE.format(id=pid)
    try:
        with urlopen(url, timeout=10) as r:
            data = json.load(r)
    except (HTTPError, URLError) as e:
        print(f"[{pid}] fetch error: {e}", file=sys.stderr)
        return None, None
    # Map PokeAPI hyphenated keys to numeric base stats
    stats = { s["stat"]["name"]: int(s["base_stat"]) for s in data.get("stats", []) }
    return stats.get("special-attack"), stats.get("special-defense")

def main():
    conn = sqlite3.connect(DB)
    cur = conn.cursor()
    # only update rows that are missing either special stat
    cur.execute("SELECT id FROM pokemon WHERE sp_attack IS NULL OR sp_defense IS NULL ORDER BY id")
    ids = [row[0] for row in cur.fetchall()]
    print(f"Updating {len(ids)} Pokémon…")
    for i, pid in enumerate(ids, 1):
        spatk, spdef = fetch_stats(pid)
        if spatk is not None or spdef is not None:
            cur.execute(
                "UPDATE pokemon SET sp_attack = COALESCE(?, sp_attack), sp_defense = COALESCE(?, sp_defense) WHERE id=?",
                (spatk, spdef, pid),
            )
            if i % 25 == 0:
                conn.commit()
        # be polite to the public API
        time.sleep(0.15)
    conn.commit(); conn.close()
    print("Done.")

if __name__ == "__main__":
    main()