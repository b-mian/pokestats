// Type-effectiveness math. All functions take `chart`: the /stats/typechart
// payload, shaped {attacker: {defender: multiplier}} with multipliers in
// {0, 0.5, 1, 2}. Pure functions — no fetching here.

export const ALL_TYPES = [
  "normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison",
  "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark",
  "steel", "fairy",
];

/**
 * Defensive multipliers for a pokemon with the given types.
 * Returns {attackingType: combinedMultiplier} over all 18 attacking types,
 * e.g. for ["fire","flying"]: {rock: 4, water: 2, ..., ground: 0}.
 */
export function defensiveMultipliers(chart, types) {
  const defending = (types || []).filter(Boolean);
  const out = {};
  for (const atk of ALL_TYPES) {
    let m = 1;
    for (const def of defending) {
      const row = chart[atk];
      const mult = row && row[def];
      m *= (mult === undefined || mult === null) ? 1 : mult;
    }
    out[atk] = m;
  }
  return out;
}

/**
 * Group a defensiveMultipliers() result into display buckets.
 * Returns {x4, x2, x05, x025, x0} — arrays of type names (x05 = ½, x025 = ¼).
 */
export function groupMatchups(mults) {
  const buckets = { x4: [], x2: [], x05: [], x025: [], x0: [] };
  for (const [type, m] of Object.entries(mults)) {
    if (m === 0) buckets.x0.push(type);
    else if (m >= 4) buckets.x4.push(type);
    else if (m >= 2) buckets.x2.push(type);
    else if (m <= 0.25) buckets.x025.push(type);
    else if (m <= 0.5) buckets.x05.push(type);
  }
  return buckets;
}

/**
 * Defensive coverage of a whole team.
 * teamTypes: array of type-arrays, one per member, e.g. [["fire","flying"], ["water"]].
 * Returns per attacking type: {weak, resist, immune} member counts, plus a
 * `holes` list — attacking types that threaten (≥2× on) at least one member
 * and are resisted by none.
 */
export function teamDefense(chart, teamTypes) {
  const perType = {};
  for (const atk of ALL_TYPES) perType[atk] = { weak: 0, resist: 0, immune: 0 };
  for (const types of teamTypes) {
    const mults = defensiveMultipliers(chart, types);
    for (const atk of ALL_TYPES) {
      if (mults[atk] === 0) perType[atk].immune += 1;
      else if (mults[atk] >= 2) perType[atk].weak += 1;
      else if (mults[atk] <= 0.5) perType[atk].resist += 1;
    }
  }
  const holes = ALL_TYPES.filter(
    t => perType[t].weak >= 1 && perType[t].resist === 0 && perType[t].immune === 0
  );
  return { perType, holes };
}

/**
 * Offensive coverage using each member's own types as attack types (STAB proxy).
 * Returns per defending type the best multiplier anyone on the team can hit it
 * with, plus `uncovered`: defending types nobody hits super-effectively.
 */
export function teamOffense(chart, teamTypes) {
  const attackTypes = new Set();
  for (const types of teamTypes) for (const t of types || []) if (t) attackTypes.add(t);
  const best = {};
  for (const def of ALL_TYPES) {
    let m = 0;
    for (const atk of attackTypes) {
      const row = chart[atk];
      const mult = row && row[def];
      if (mult !== undefined && mult > m) m = mult;
    }
    best[def] = m;
  }
  const uncovered = ALL_TYPES.filter(t => best[t] < 2);
  return { best, uncovered };
}

/**
 * Head-to-head: best STAB multiplier attacker's types achieve vs defender's typing.
 */
export function headToHead(chart, attackerTypes, defenderTypes) {
  let best = 0;
  for (const atk of (attackerTypes || []).filter(Boolean)) {
    let m = 1;
    for (const def of (defenderTypes || []).filter(Boolean)) {
      const row = chart[atk];
      const mult = row && row[def];
      m *= (mult === undefined || mult === null) ? 1 : mult;
    }
    if (m > best) best = m;
  }
  return best;
}
