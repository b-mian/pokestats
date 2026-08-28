# backend_db/scripts/load_pokedex.py
#
# Builds the pokestats SQLite database from PokeAPI's GraphQL endpoint.
#
# Design goals:
#   * Bulk fetch: a handful of GraphQL queries instead of ~2,600 REST calls.
#   * Stdlib only (urllib) — no extra Python dependencies needed.
#   * Disk cache: raw responses are saved under scripts/cache/ so rebuilds
#     don't refetch; pass --refresh to force a refetch.
#   * Sanity checks after load so a flaky build can't ship a half-empty DB.
#
# Usage:
#   python3 load_pokedex.py --db ./sql/pokestats.sqlite
#   python3 load_pokedex.py --db ./sql/pokestats.sqlite --refresh

import argparse
import json
import os
import sqlite3
import sys
import time
import urllib.request
from pathlib import Path

GRAPHQL_URL = os.getenv("POKEMON_GRAPHQL_URL", "https://beta.pokeapi.co/graphql/v1beta")
SCRIPT_DIR = Path(__file__).resolve().parent
CACHE_DIR = SCRIPT_DIR / "cache"
SCHEMA_CANDIDATES = [SCRIPT_DIR / "sql" / "schema.sql", Path("/app/sql/schema.sql")]

VALID_TYPE_IDS = set(range(1, 19))  # 18 real types; 10001/10002 are unknown/shadow


# ----------------------------------------------------------------------------
# GraphQL plumbing
# ----------------------------------------------------------------------------

def gql(query: str, retries: int = 4, timeout: int = 60) -> dict:
    """POST a GraphQL query with retry/backoff; return the `data` payload."""
    body = json.dumps({"query": query}).encode()
    last_err = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                GRAPHQL_URL, data=body,
                headers={"Content-Type": "application/json", "User-Agent": "pokestats-loader"},
            )
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                payload = json.loads(resp.read())
            if "errors" in payload:
                raise RuntimeError(f"GraphQL errors: {payload['errors']}")
            return payload["data"]
        except Exception as e:  # noqa: BLE001 — retry any transport/parse error
            last_err = e
            wait = 2 ** attempt
            print(f"  fetch failed ({e}); retrying in {wait}s...", file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError(f"GraphQL query failed after {retries} attempts: {last_err}")


def cached(name: str, fetch_fn, refresh: bool = False):
    """Fetch-with-disk-cache: cache/<name>.json holds the raw result."""
    CACHE_DIR.mkdir(exist_ok=True)
    path = CACHE_DIR / f"{name}.json"
    if path.exists() and not refresh:
        print(f"[cache] {name}: using {path.name}")
        return json.loads(path.read_text())
    print(f"[fetch] {name} ...")
    data = fetch_fn()
    path.write_text(json.dumps(data))
    return data


def fetch_paged(root_field: str, inner: str, page: int = 400):
    """Page through a GraphQL collection until an empty page comes back."""
    rows, offset = [], 0
    while True:
        data = gql(f"query {{ {root_field}(limit: {page}, offset: {offset}, order_by: {{id: asc}}) {{ {inner} }} }}")
        batch = data[root_field]
        rows.extend(batch)
        if len(batch) < page:
            return rows
        offset += page


# ----------------------------------------------------------------------------
# Fetchers (one per cached dataset)
# ----------------------------------------------------------------------------

POKEMON_FIELDS = """
    id name height weight base_experience is_default pokemon_species_id
    pokemon_v2_pokemontypes { slot pokemon_v2_type { name } }
    pokemon_v2_pokemonstats { base_stat pokemon_v2_stat { name } }
    pokemon_v2_pokemonabilities { is_hidden slot pokemon_v2_ability { name } }
    pokemon_v2_pokemonforms { form_name }
"""

SPECIES_FIELDS = """
    id name generation_id capture_rate base_happiness is_legendary is_mythical
    evolution_chain_id evolves_from_species_id
    pokemon_v2_pokemonegggroups { pokemon_v2_egggroup { name } }
    pokemon_v2_pokemonspeciesnames(where: {language_id: {_eq: 9}}) { genus }
"""


def fetch_pokemon():
    return fetch_paged("pokemon_v2_pokemon", POKEMON_FIELDS)


def fetch_species():
    return fetch_paged("pokemon_v2_pokemonspecies", SPECIES_FIELDS)


def fetch_flavor():
    # distinct_on species with version_id desc == latest English pokedex entry
    q = """
    query {
      pokemon_v2_pokemonspeciesflavortext(
        where: {language_id: {_eq: 9}},
        distinct_on: pokemon_species_id,
        order_by: [{pokemon_species_id: asc}, {version_id: desc}]
      ) { pokemon_species_id flavor_text }
    }
    """
    return gql(q)["pokemon_v2_pokemonspeciesflavortext"]


def fetch_evolution_details():
    q = """
    query {
      pokemon_v2_pokemonevolution {
        evolved_species_id min_level
        pokemon_v2_evolutiontrigger { name }
        pokemon_v2_item { name }
      }
    }
    """
    return gql(q)["pokemon_v2_pokemonevolution"]


def fetch_type_efficacy():
    q = "query { pokemon_v2_typeefficacy { damage_type_id target_type_id damage_factor } }"
    return gql(q)["pokemon_v2_typeefficacy"]


def fetch_type_names():
    q = "query { pokemon_v2_type { id name } }"
    return gql(q)["pokemon_v2_type"]


# ----------------------------------------------------------------------------
# DB build
# ----------------------------------------------------------------------------

def apply_schema(conn: sqlite3.Connection):
    for cand in SCHEMA_CANDIDATES:
        if cand.exists():
            conn.executescript(cand.read_text())
            return
    raise SystemExit(f"schema.sql not found in any of: {SCHEMA_CANDIDATES}")


def fresh_tables(conn: sqlite3.Connection):
    for t in ["pokemon", "abilities", "egg_groups", "evolutions",
              "type_effectiveness", "types", "type_frequency", "top10", "gen_averages"]:
        conn.execute(f"DROP TABLE IF EXISTS {t}")
    apply_schema(conn)


def clean_flavor(text):
    if not text:
        return None
    # Pokedex entries embed control chars (\n, \f) as line breaks
    return " ".join(text.replace("\f", " ").replace("\n", " ").split())


def build(db_path: str, refresh: bool = False):
    pokemon = cached("pokemon", fetch_pokemon, refresh)
    species = cached("species", fetch_species, refresh)
    flavor = cached("flavor", fetch_flavor, refresh)
    evo_details = cached("evolution_details", fetch_evolution_details, refresh)
    efficacy = cached("type_efficacy", fetch_type_efficacy, refresh)
    type_names = cached("type_names", fetch_type_names, refresh)

    sp_by_id = {s["id"]: s for s in species}
    flavor_by_species = {f["pokemon_species_id"]: clean_flavor(f["flavor_text"]) for f in flavor}
    # A species can have several evolution rows (per game/method); keep the first
    evo_by_species = {}
    for e in evo_details:
        evo_by_species.setdefault(e["evolved_species_id"], e)
    tname = {t["id"]: t["name"] for t in type_names if t["id"] in VALID_TYPE_IDS}

    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA foreign_keys=OFF")  # bulk load; re-enabled by schema on connect
        conn.execute("BEGIN")
        fresh_tables(conn)

        n_pokemon = 0
        for p in pokemon:
            sp = sp_by_id.get(p["pokemon_species_id"])
            if sp is None:
                continue
            types = sorted(p["pokemon_v2_pokemontypes"], key=lambda t: t["slot"])
            if not types:
                continue  # a handful of placeholder forms have no type data
            stats = {s["pokemon_v2_stat"]["name"]: s["base_stat"] for s in p["pokemon_v2_pokemonstats"]}
            if not stats:
                continue
            six = [stats.get(k) for k in ("hp", "attack", "defense", "special-attack", "special-defense", "speed")]
            bst = sum(v or 0 for v in six)
            genus_rows = sp.get("pokemon_v2_pokemonspeciesnames") or []
            genus = genus_rows[0]["genus"] if genus_rows else None
            forms = p.get("pokemon_v2_pokemonforms") or []
            form_name = forms[0]["form_name"] if forms and forms[0]["form_name"] else None

            conn.execute(
                """INSERT INTO pokemon
                   (id, name, species_id, species_name, is_default, form_name,
                    type1, type2, hp, attack, defense, sp_attack, sp_defense, speed, bst,
                    generation, height_m, weight_kg, base_experience, capture_rate,
                    base_happiness, is_legendary, is_mythical, genus, flavor_text,
                    evolution_chain_id, evolves_from_species_id)
                   VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (
                    p["id"], p["name"], sp["id"], sp["name"],
                    1 if p["is_default"] else 0, form_name,
                    types[0]["pokemon_v2_type"]["name"],
                    types[1]["pokemon_v2_type"]["name"] if len(types) > 1 else None,
                    six[0], six[1], six[2], six[3], six[4], six[5], bst,
                    sp.get("generation_id"),
                    round(p["height"] / 10, 2) if p.get("height") is not None else None,
                    round(p["weight"] / 10, 2) if p.get("weight") is not None else None,
                    p.get("base_experience"),
                    sp.get("capture_rate"), sp.get("base_happiness"),
                    1 if sp.get("is_legendary") else 0,
                    1 if sp.get("is_mythical") else 0,
                    genus, flavor_by_species.get(sp["id"]),
                    sp.get("evolution_chain_id"), sp.get("evolves_from_species_id"),
                ),
            )
            n_pokemon += 1

            for a in p.get("pokemon_v2_pokemonabilities") or []:
                conn.execute(
                    "INSERT OR IGNORE INTO abilities (pokemon_id, name, is_hidden, slot) VALUES (?,?,?,?)",
                    (p["id"], a["pokemon_v2_ability"]["name"], 1 if a["is_hidden"] else 0, a["slot"]),
                )

        for sp in species:
            for eg in sp.get("pokemon_v2_pokemonegggroups") or []:
                conn.execute(
                    "INSERT OR IGNORE INTO egg_groups (species_id, egg_group) VALUES (?,?)",
                    (sp["id"], eg["pokemon_v2_egggroup"]["name"]),
                )
            # Evolution edge: this species evolves FROM evolves_from_species_id
            if sp.get("evolves_from_species_id") and sp.get("evolution_chain_id"):
                how = evo_by_species.get(sp["id"], {})
                trigger = (how.get("pokemon_v2_evolutiontrigger") or {}).get("name")
                item = (how.get("pokemon_v2_item") or {}).get("name")
                conn.execute(
                    """INSERT OR REPLACE INTO evolutions
                       (chain_id, from_species_id, to_species_id, trigger, min_level, item)
                       VALUES (?,?,?,?,?,?)""",
                    (sp["evolution_chain_id"], sp["evolves_from_species_id"], sp["id"],
                     trigger, how.get("min_level"), item),
                )

        for name in sorted(tname.values()):
            conn.execute("INSERT OR IGNORE INTO types (name) VALUES (?)", (name,))
        n_chart = 0
        for row in efficacy:
            if row["damage_type_id"] in VALID_TYPE_IDS and row["target_type_id"] in VALID_TYPE_IDS:
                conn.execute(
                    "INSERT INTO type_effectiveness (attacker, defender, multiplier) VALUES (?,?,?)",
                    (tname[row["damage_type_id"]], tname[row["target_type_id"]], row["damage_factor"] / 100),
                )
                n_chart += 1

        conn.commit()
        sanity_check(conn, n_pokemon, n_chart)
        print(f"Loaded {n_pokemon} pokemon rows into {db_path}")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def sanity_check(conn: sqlite3.Connection, n_pokemon: int, n_chart: int):
    """Fail loudly rather than ship a half-empty database."""
    def one(sql):
        return conn.execute(sql).fetchone()[0]

    problems = []
    if one("SELECT COUNT(*) FROM pokemon WHERE is_default=1") < 1000:
        problems.append("fewer than 1000 default-form pokemon")
    if one("""SELECT COUNT(*) FROM pokemon WHERE is_default=1 AND
              (hp IS NULL OR attack IS NULL OR defense IS NULL OR
               sp_attack IS NULL OR sp_defense IS NULL OR speed IS NULL)""") > 0:
        problems.append("default-form pokemon with missing base stats")
    if n_chart != 324:
        problems.append(f"type chart has {n_chart} rows, expected 324 (18x18)")
    gens = one("SELECT COUNT(DISTINCT generation) FROM pokemon WHERE generation IS NOT NULL")
    if gens < 9:
        problems.append(f"only {gens} generations present, expected 9")
    if one("SELECT COUNT(*) FROM evolutions") < 400:
        problems.append("suspiciously few evolution edges")
    if problems:
        raise SystemExit("SANITY CHECK FAILED: " + "; ".join(problems))
    print("Sanity checks passed.")


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--db", required=True)
    p.add_argument("--refresh", action="store_true", help="ignore disk cache and refetch")
    # legacy args kept so existing callers (Dockerfile) don't break
    p.add_argument("--source", choices=["api", "json"], default="api")
    p.add_argument("--repo-root", default="/")
    args = p.parse_args()
    build(args.db, refresh=args.refresh)
