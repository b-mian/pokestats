import React from "react";
import { NavLink } from "react-router-dom";
import "./styles/nav.css";

const LINKS = [
  { to: "/", label: "Pokédex", exact: true },
  { to: "/explorer", label: "Stat Explorer" },
  { to: "/compare", label: "Compare" },
  { to: "/team", label: "Team Builder" },
  { to: "/quiz", label: "Quiz" },
  { to: "/games/higher-lower", label: "Higher or Lower" },
];

export default function PageNav() {
  return (
    <nav className="pagenav">
      {LINKS.map(l => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.exact}
          className={({ isActive }) => "pagenav__link" + (isActive ? " pagenav__link--active" : "")}
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
