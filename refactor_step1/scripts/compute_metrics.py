#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import sqlite3
from typing import List

import numpy as np
import pandas as pd


def compute_type_frequency(df: pd.DataFrame) -> pd.DataFrame:
    """Count types for slot1 and slot2 separately."""
    t1 = df["type1"].value_counts(dropna=True).rename_axis("type").reset_index(name="count")
    t1["slot"] = 1

    if "type2" in df.columns:
        t2 = df["type2"].dropna().value_counts().rename_axis("type").reset_index(name="count")
        t2["slot"] = 2
    else:
        t2 = pd.DataFrame(columns=["type", "count", "slot"])

    out = pd.concat([t1[["slot", "type", "count"]], t2[["slot", "type", "count"]]], ignore_index=True)
    out = out.sort_values(["slot", "count", "type"], ascending=[True, False, True]).reset_index(drop=True)
    return out


def compute_top10(df: pd.DataFrame, stat: str) -> pd.DataFrame:
    """Return top 10 rows for a stat, skipping nulls and ensuring ints for NOT NULL SQLite columns."""
    if stat not in df.columns:
        return pd.DataFrame(columns=["category", "rank", "name", "id", "value"])

    sub = df[["id", "name", stat]].copy()
    sub = sub.dropna(subset=[stat])
    if sub.empty:
        return pd.DataFrame(columns=["category", "rank", "name", "id", "value"])

    sub["value"] = pd.to_numeric(sub[stat], errors="coerce")
    sub = sub.dropna(subset=["value"])
    if sub.empty:
        return pd.DataFrame(columns=["category", "rank", "name", "id", "value"])

    sub = sub.sort_values("value", ascending=False).head(10).reset_index(drop=True)
    sub["rank"] = sub.index + 1
    sub["category"] = stat

    # Satisfy SQLite NOT NULL integer constraints
    sub["id"] = sub["id"].astype(int)
    sub["value"] = sub["value"].round(0).astype(int)

    return sub[["category", "rank", "name", "id", "value"]]


def available_stat_categories(df: pd.DataFrame) -> List[str]:
    """Return the list of stat categories we can safely compute (non-null present)."""
    stats = ["hp", "attack", "defense", "speed"]
    if "sp_attack" in df.columns and df["sp_attack"].notna().any():
        stats.append("sp_attack")
    if "sp_defense" in df.columns and df["sp_defense"].notna().any():
        stats.append("sp_defense")
    return stats


def compute_gen_averages(df: pd.DataFrame) -> pd.DataFrame:
    """
    Compute per-generation averages:
    - Prefer grouping by the `generation` column if present and non-null.
    - Fall back to ID ranges if `generation` is missing.
    Includes sp_attack/sp_defense if present (else None).
    """
    rows = []

    def mean_or_none(sub: pd.DataFrame, col: str):
        if col in sub.columns and sub[col].notna().any():
            return float(sub[col].mean())
        return None

    if "generation" in df.columns and df["generation"].notna().any():
        grouped = df.dropna(subset=["generation"]).groupby("generation", dropna=True)
        for gen, sub in grouped:
            rows.append(
                {
                    "generation": int(gen),
                    "hp": float(sub["hp"].mean()),
                    "attack": float(sub["attack"].mean()),
                    "speed": float(sub["speed"].mean()),
                    "defense": float(sub["defense"].mean()),
                    "sp_attack": mean_or_none(sub, "sp_attack"),
                    "sp_defense": mean_or_none(sub, "sp_defense"),
                }
            )
    else:
        # Fallback ranges (expand as needed)
        ranges = {
            1: (1, 151),
            2: (152, 251),
            3: (252, 386),
            4: (387, 493),
            5: (494, 649),
            6: (650, 721),
            7: (722, 809),
            8: (810, 905),
            9: (906, 9999),
        }
        for gen, (lo, hi) in ranges.items():
            sub = df[(df["id"] >= lo) & (df["id"] <= hi)]
            if sub.empty:
                continue
            rows.append(
                {
                    "generation": int(gen),
                    "hp": float(sub["hp"].mean()),
                    "attack": float(sub["attack"].mean()),
                    "speed": float(sub["speed"].mean()),
                    "defense": float(sub["defense"].mean()),
                    "sp_attack": mean_or_none(sub, "sp_attack"),
                    "sp_defense": mean_or_none(sub, "sp_defense"),
                }
            )

    return pd.DataFrame(rows).sort_values("generation").reset_index(drop=True)


def main(db_path: str):
    conn = sqlite3.connect(db_path)

    # Load full pokemon table
    df = pd.read_sql_query("SELECT * FROM pokemon", conn)

    # --- type_frequency ---
    tf = compute_type_frequency(df)
    with conn:
        conn.execute("DELETE FROM type_frequency")
    if not tf.empty:
        tf.to_sql("type_frequency", conn, if_exists="append", index=False)

    # --- top10 ---
    stats = available_stat_categories(df)
    frames = []
    for s in stats:
        t = compute_top10(df, s)
        if not t.empty:
            frames.append(t)

    top10 = (
        pd.concat(frames, ignore_index=True)
        if frames
        else pd.DataFrame(columns=["category", "rank", "name", "id", "value"])
    )

    with conn:
        conn.execute("DELETE FROM top10")
    if not top10.empty:
        top10.to_sql("top10", conn, if_exists="append", index=False)

    # --- gen_averages ---
    gens = compute_gen_averages(df)
    with conn:
        conn.execute("DELETE FROM gen_averages")
        for _, row in gens.iterrows():
            conn.execute(
                """
                INSERT INTO gen_averages (generation, hp, attack, speed, defense, sp_attack, sp_defense)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(generation) DO UPDATE SET
                  hp=excluded.hp,
                  attack=excluded.attack,
                  speed=excluded.speed,
                  defense=excluded.defense,
                  sp_attack=excluded.sp_attack,
                  sp_defense=excluded.sp_defense
                """,
                (
                    int(row["generation"]),
                    float(row["hp"]),
                    float(row["attack"]),
                    float(row["speed"]),
                    float(row["defense"]),
                    None if pd.isna(row.get("sp_attack")) else float(row["sp_attack"]),
                    None if pd.isna(row.get("sp_defense")) else float(row["sp_defense"]),
                ),
            )

    conn.commit()
    conn.close()
    print("Metrics recomputed and stored.")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", required=True, help="Path to pokestats.sqlite")
    args = ap.parse_args()
    main(args.db)
