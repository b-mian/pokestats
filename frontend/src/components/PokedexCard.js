import React from "react";
import { spriteUrl } from "../utils/sprites";

const pill = {
  display: "inline-block",
  padding: "2px 8px",
  borderRadius: 8,
  background: "#0f8b8d",
  color: "#fff",
  fontWeight: 700,
  fontSize: 12,
  marginRight: 6
};

export default function PokedexCard({ p }) {
  return (
    <div className="dex-card">
      <div className="dex-card__inner">
        <img
          src={spriteUrl(p.id)}
          alt={String(p.name.charAt(0).toUpperCase()) + String(p.name).slice(1)}
          className="dex-card__sprite"
          loading="lazy"
          width={72}
          height={72}
        />
        <div className="dex-card__title">{String(p.name.charAt(0).toUpperCase()) + String(p.name).slice(1)} <span className="dex-card__id">#{p.id}</span></div>
        <div style={{ margin: "6px 0 10px" }}>
          <span style={pill}>{p.type1}</span>
          {p.type2 ? <span style={pill}>{p.type2}</span> : null}
        </div>
        <div className="dex-card__stats">
          <div>HP: {p.hp}</div>
          <div>Attack: {p.attack}</div>
          <div>Speed: {p.speed}</div>
          <div>Defense: {p.defense}</div>
          <div>Sp. Attack: {p.sp_attack}</div>
          <div>Sp.Defense: {p.sp_defense}</div>
        </div>
      </div>
    </div>
  );
}