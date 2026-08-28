PRAGMA foreign_keys = ON;

-- Core pokedex. One row per PokeAPI "pokemon" (includes alternate forms, id > 10000).
-- is_default = 1 marks the canonical form of each species.
CREATE TABLE IF NOT EXISTS pokemon (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    species_id INTEGER NOT NULL,
    species_name TEXT NOT NULL,
    is_default INTEGER NOT NULL DEFAULT 1,
    form_name TEXT,                       -- e.g. 'mega', 'alola', 'gmax'; NULL for base forms
    type1 TEXT NOT NULL,
    type2 TEXT,
    hp INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    sp_attack INTEGER,
    sp_defense INTEGER,
    speed INTEGER NOT NULL,
    bst INTEGER NOT NULL,                 -- base stat total
    generation INTEGER,
    height_m REAL,
    weight_kg REAL,
    base_experience INTEGER,
    capture_rate INTEGER,
    base_happiness INTEGER,
    is_legendary INTEGER NOT NULL DEFAULT 0,
    is_mythical INTEGER NOT NULL DEFAULT 0,
    genus TEXT,                           -- e.g. 'Seed Pokémon'
    flavor_text TEXT,                     -- latest English pokedex entry
    evolution_chain_id INTEGER,
    evolves_from_species_id INTEGER
);

CREATE TABLE IF NOT EXISTS abilities (
    pokemon_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    is_hidden INTEGER NOT NULL DEFAULT 0,
    slot INTEGER NOT NULL,
    PRIMARY KEY (pokemon_id, slot),
    FOREIGN KEY (pokemon_id) REFERENCES pokemon(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS egg_groups (
    species_id INTEGER NOT NULL,
    egg_group TEXT NOT NULL,
    PRIMARY KEY (species_id, egg_group)
);

-- One row per evolution edge (species -> species), with how it happens.
CREATE TABLE IF NOT EXISTS evolutions (
    chain_id INTEGER NOT NULL,
    from_species_id INTEGER,
    to_species_id INTEGER NOT NULL,
    trigger TEXT,                         -- level-up | use-item | trade | ...
    min_level INTEGER,
    item TEXT,
    PRIMARY KEY (chain_id, to_species_id)
);

-- 18x18 attack-vs-defense matrix; multiplier in {0, 0.5, 1, 2}.
CREATE TABLE IF NOT EXISTS type_effectiveness (
    attacker TEXT NOT NULL,
    defender TEXT NOT NULL,
    multiplier REAL NOT NULL,
    PRIMARY KEY (attacker, defender)
);

CREATE TABLE IF NOT EXISTS types (
    name TEXT PRIMARY KEY
);

-- Derived metric tables (rebuilt by compute_metrics.py) --------------------

CREATE TABLE IF NOT EXISTS type_frequency (
    slot INTEGER NOT NULL CHECK (slot IN (1,2)),
    type TEXT NOT NULL,
    count INTEGER NOT NULL,
    PRIMARY KEY (slot, type)
);

CREATE TABLE IF NOT EXISTS top10 (
    category TEXT NOT NULL,               -- hp|attack|defense|sp_attack|sp_defense|speed|bst
    rank INTEGER NOT NULL,
    name TEXT NOT NULL,
    id INTEGER NOT NULL,
    value INTEGER NOT NULL,
    PRIMARY KEY (category, id)
);

CREATE TABLE IF NOT EXISTS gen_averages (
    generation INTEGER PRIMARY KEY,
    hp REAL NOT NULL,
    attack REAL NOT NULL,
    speed REAL NOT NULL,
    defense REAL NOT NULL,
    sp_attack REAL,
    sp_defense REAL
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_pokemon_name ON pokemon(name);
CREATE INDEX IF NOT EXISTS idx_pokemon_types ON pokemon(type1, type2);
CREATE INDEX IF NOT EXISTS idx_pokemon_generation ON pokemon(generation);
CREATE INDEX IF NOT EXISTS idx_pokemon_species ON pokemon(species_id);
CREATE INDEX IF NOT EXISTS idx_pokemon_default ON pokemon(is_default);
CREATE INDEX IF NOT EXISTS idx_pokemon_bst ON pokemon(bst);
CREATE INDEX IF NOT EXISTS idx_evolutions_chain ON evolutions(chain_id);
