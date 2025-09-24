PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pokemon (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type1 TEXT NOT NULL,
    type2 TEXT,
    hp INTEGER NOT NULL,
    attack INTEGER NOT NULL,
    defense INTEGER NOT NULL,
    speed INTEGER NOT NULL,
    sp_attack INTEGER,
    sp_defense INTEGER,
    generation INTEGER
);

CREATE TABLE IF NOT EXISTS types (
    name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS type_frequency (
    slot INTEGER NOT NULL CHECK (slot IN (1,2)),
    type TEXT NOT NULL,
    count INTEGER NOT NULL,
    PRIMARY KEY (slot, type),
    FOREIGN KEY (type) REFERENCES types(name) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS top10 (
    category TEXT NOT NULL,
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
    sp_attack INTEGER,
    sp_defense INTEGER
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_pokemon_name ON pokemon(name);
CREATE INDEX IF NOT EXISTS idx_pokemon_types ON pokemon(type1, type2);
CREATE INDEX IF NOT EXISTS idx_pokemon_generation ON pokemon(generation);
